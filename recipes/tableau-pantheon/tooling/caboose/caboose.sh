#!/bin/bash

# Reference helper functions.
source /helpers/tableau/_util.sh

# Set option defaults.
ENV=$(cd $LANDO_MOUNT && git branch | sed -n -e 's/^\* \(.*\)/\1/p')

# Map the master branch to dev
if [ "$ENV" == "master" ]; then
  ENV="dev"
fi
FILES="none"
FORCE=false

# Database configuration.
HOST=database
USER=root
DATABASE=pantheon
PORT=3306

# Declare variables.
SSH_KEY="/lando/keys/pantheon.lando.id_rsa"
FILE_DUMP="/tmp/files.tar.gz"

# Parse our options.
while (( "$#" )); do
  case "$1" in
    -e|--env|--env=*)
      if [ "${1##--env=}" != "$1" ]; then
        ENV="${1##--env=}"
        shift
      else
        ENV=$2
        shift 2
      fi
      ;;
    -f|--files|--files=*)
      if [ "${1##--files=}" != "$1" ]; then
        FILES="${1##--files=}"
        shift
      else
        FILES=$2
        shift 2
      fi
      ;;
    -h|--host|--host=*)
      if [ "${1##--host=}" != "$1" ]; then
        HOST="${1##--host=}"
        shift
      else
        HOST=$2
        shift 2
      fi
      ;;
    -d|--database|--database=*)
      if [ "${1##--database=}" != "$1" ]; then
        DATABASE="${1##--database=}"
        shift
      else
        DATABASE=$2
        shift 2
      fi
      ;;
    -u|--user|--user=*)
      if [ "${1##--user=}" != "$1" ]; then
        USER="${1##--user=}"
        shift
      else
        USER=$2
        shift 2
      fi
      ;;
    -p|--password|--password=*)
      if [ "${1##--password=}" != "$1" ]; then
        PASS="${1##--password=}"
        shift
      else
        PASS=$2
        shift 2
      fi
      ;;
    -P|--port|--port=*)
      if [ "${1##--port=}" != "$1" ]; then
        PORT="${1##--port=}"
        shift
      else
        PORT=$2
        shift 2
      fi
      ;;
    --force|--force=*)
      FORCE=true
      shift
      ;;
    --)
      shift
      break
      ;;
    -*|--*=)
      critical "Unsupported flag $1" >&2
      exit 1
      ;;
    *)
      shift
      ;;
  esac
done

# Do some basic validation to make sure we are logged in.
info "Verifying that you are logged in and authenticated."
/helpers/tableau/pantheon.sh
if [ $(terminus auth:whoami | grep "You are not logged in.") ] ; then
  critical "You are not authenticated with Terminus. Try running the following command first:
  ${YLW}'lando ssh -c \"terminus auth:login --machine-token=\${PANTHEON_MACHINE_TOKEN}\"${RESET}"
  exit 1;
fi

# Ensuring a viable ssh key.
info "Checking for $SSH_KEY"
if [ ! -f "$SSH_KEY" ]; then
  ssh-keygen -t rsa -N "" -C "lando" -f "$SSH_KEY"
  terminus ssh-key:add "$SSH_KEY.pub"
  /scripts/load-keys.sh
fi

# Get the database
if [ "$ENV" != "none" ]; then
  # Generate a filename for the backup.
  FILE_NAME=$PANTHEON_SITE_NAME-$ENV-`today`.sql.gz
  FILE=/app/database/backups/$FILE_NAME

  # Only download a copy of the database if we don't have one already available OR if forced.
  if [ ! -f $FILE ] || [ $FORCE = true ] ; then
    # Remove lingering DB dumps.
    info "Removing existing backup - if any."
    rm -f $FILE

    info "Downloading backup from Pantheon..."
    terminus backup:get $PANTHEON_SITE_NAME.$ENV --element=db --to=$FILE &
    pid=$! # Grab the process ID of the previous running command (i.e. terminus backup).

    # A little animation to make the waiting more bearable.
    while kill -0 $pid 2>/dev/null
    do
      ascii_anim /helpers/tableau/caboose/animations/train
    done
    ascii_anim /helpers/tableau/caboose/animations/train true
    info "I grabbed the backup! Saving it in $FILE."
  else
    info "Using existing backup $FILE. If you want to download a newer version
    from Pantheon, use the --force flag."
  fi

  # Inform the user of things.
  info "Preparing to import $FILE into $DATABASE on $HOST:$PORT as $USER..."
  CMD="$FILE"
  SQLSTART="mysql -h $HOST -P $PORT -u $USER $DATABASE"

  # Wipe the database.
  # Gather and destroy tables.
  TABLES=$($SQLSTART -e 'SHOW TABLES' | awk '{ print $1}' | grep -v '^Tables' )
  warn "Destroying all current tables in $DATABASE... "

  # PURGE IT ALL! BURN IT TO THE GROUND!!!
  for t in $TABLES; do
    echo "Dropping $t table from $DATABASE database..."
    $SQLSTART -e "DROP TABLE $t"
  done

  # Check to see if we have any unzipping options or GUI needs.
  if command -v gunzip >/dev/null 2>&1 && gunzip -t $FILE >/dev/null 2>&1; then
    echo "Gunzipped file detected!"
    if command -v pv >/dev/null 2>&1; then
      CMD="pv $CMD"
    else
      CMD="cat $CMD"
    fi
    CMD="$CMD | gunzip"
  elif command -v unzip >/dev/null 2>&1 && unzip -t $FILE >/dev/null 2>&1; then
    echo "Zipped file detected!"
    CMD="unzip -p $CMD"
    if command -v pv >/dev/null 2>&1; then
      CMD="$CMD | pv"
    fi
  else
    if command -v pv >/dev/null 2>&1; then
      CMD="pv $CMD"
    else
      CMD="cat $CMD"
    fi
  fi

  # Put the pieces together.
  CMD="$CMD | $SQLSTART"
  echo $CMD;

  # Import into our database.
  info "Importing $FILE..."
  if command eval "$CMD"; then
    STATUS=$?
  else
    STATUS=1
  fi

  # Finish up!
  if [ $STATUS -eq 0 ]; then
    echo ""
    printf "${GREEN}Import complete!${RESET}"
    echo ""
  else
    echo ""
    printf "${RED}Import failed.${RESET}"
    echo ""
  fi
fi

# Get the files
if [ "$FILES" != "none" ]; then

  # Build the rsync command
  RSYNC_CMD="rsync -rlvz \
    --size-only \
    --ipv4 \
    --progress \
    --exclude js \
    --exclude css \
    --exclude ctools \
    --exclude imagecache \
    --exclude xmlsitemap \
    --exclude backup_migrate \
    --exclude php/twig/* \
    --exclude styles \
    --exclude less \
    -e 'ssh -p 2222' \
    $FILES.$PANTHEON_SITE@appserver.$FILES.$PANTHEON_SITE.drush.in:files/ \
    $LANDO_WEBROOT/$FILEMOUNT"

  # Importing files
  info "Pulling files from Pantheon..."
  eval "$RSYNC_CMD"
fi
