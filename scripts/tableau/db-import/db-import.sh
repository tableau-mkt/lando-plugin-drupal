#!/bin/bash

# Reference helper functions.
source /helpers/tableau/_util.sh

# Database configuration.
FILE=""
HOST=database
USER=root
DATABASE=pantheon
PORT=3306

# Parse our options.
while (( "$#" )); do
  case "$1" in
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
    -f|--file|--file=*)
      if [ "${1##--file=}" != "$1" ]; then
        FILE="${1##--file=}"
        shift
      else
        FILE=$2
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

info "Run 'lando import --help' for more information"

# Validate we have a file.
if [ ! -f "$FILE" ]; then
  critical "File '$FILE' not found!"
  exit 1;
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
