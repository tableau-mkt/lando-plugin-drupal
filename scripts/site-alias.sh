#!/bin/bash

set -eo pipefail

# Reference helper functions.
source /helpers/_util.sh

#
# Creates a new site-alias.
#
function create () {
  # Initialize a new database if necessary.
  info "Creating new database for alias ${YLW}${ALIAS}${RESET}."
  $SQLSTART -e "CREATE DATABASE IF NOT EXISTS ${ALIAS}"
  info "Granting user ${YLW}${USER}${RESET} access to database ${YLW}${ALIAS}${RESET}"
  $SQLSTART -e "GRANT ALL PRIVILEGES ON ${ALIAS}.* TO ${USER}@'%' WITH GRANT OPTION";

  # Create new drush alias.
  cat > /app/drush/sites/${ALIAS}.site.yml << _EOF_
${ALIAS}:
  root: /app/web
  uri: https://${ALIAS}.${LANDO_DOMAIN}
_EOF_

  # Show user its information.
  $SQLSTART -e "SELECT CONCAT('http://', \`schema_name\`, '."${LANDO_SUBDOMAIN}"."${LANDO_DOMAIN}"') as 'site-alias',
  CONCAT('\@', '"${ALIAS}"') as 'drush-alias',
  \`schema_name\` as db from INFORMATION_SCHEMA.SCHEMATA WHERE \`SCHEMA_NAME\` = '"${ALIAS}"'";
}

#
# Deletes a given site-alias and its respective database.
#
function delete () {
  # Build connection string.
  SQLSTART="mysql -h $HOST -P $PORT -u root"

  # Delete the database.
  if [[ ! "${RESERVED_ALIASES[@]}" =~ "${ALIAS}" ]] ; then
    warn "Deleting drush alias ${YLW}@${ALIAS}${RESET}."
    rm -f /app/drush/sites/${ALIAS}.site.yml
    warn "Deleting database for alias ${YLW}${ALIAS}${RESET}."
    $SQLSTART -e "DROP DATABASE IF EXISTS ${ALIAS}"
    info "Site ${ALIAS} removed."
  else
    critical "${ALIAS} is a reserved alias and can not be deleted."
  fi
}

#
# List all available site-aliases.
#
function list () {
  info "Listing all available site-aliases."
  $SQLSTART -e "SELECT if(\`schema_name\`='pantheon','http://"${LANDO_SUBDOMAIN}"."${LANDO_DOMAIN}"',
  CONCAT('http://', \`schema_name\`, '."${LANDO_SUBDOMAIN}"."${LANDO_DOMAIN}"')) as 'site-alias',
  if(\`schema_name\`='pantheon','\@self', CONCAT('\@',\`schema_name\`)) as 'drush-alias',
  \`schema_name\` as db from INFORMATION_SCHEMA.SCHEMATA WHERE \`SCHEMA_NAME\` NOT
  IN ('information_schema', 'mysql', 'performance_schema')";
}

# Assign variable values.
HOST=${DB_HOST:-localhost}
USER=${DB_USER:-${MYSQL_USER:-root}}
PORT=${DB_PORT:-3306}
SQLSTART="mysql -h $HOST -P $PORT -u root"
RESERVED_ALIASES=('pantheon','mysql','information_schema')
ALIAS=
CMDS=('create', 'delete', 'list')

# Parse the options.
while (( "$#" )); do
  case "$1" in
    -a|--alias|--alias=*)
      if [ "${1##--alias=}" != "$1" ]; then
        ALIAS="${1##--alias=}"
        shift
      else
        ALIAS=$2
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
      CMD="$1"
      shift
      ;;
  esac
done

# Parse the command.
if [[ "${CMDS[@]}" =~ "${CMD}" ]] ; then
  eval $CMD
else
  critical "Unsupported command $1"
fi
