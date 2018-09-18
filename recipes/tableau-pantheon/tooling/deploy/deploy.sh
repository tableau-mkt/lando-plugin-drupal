#!/bin/bash

set -eo pipefail

# Reference helper functions.
source /helpers/tableau/_util.sh

# Declare variables.
GIT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
GIT_SHA=$(git log --pretty=format:'%h' -n 1)
PANTHEON_ENV=
POST_COMMAND=
FORCE=

# Parse our options.
while (( "$#" )); do
  case "$1" in
    -e|--env|--env=*)
      if [ "${1##--env=}" != "$1" ]; then
        PANTHEON_ENV="${1##--env=}"
        shift
      else
        PANTHEON_ENV=$2
        shift 2
      fi
      ;;
    -pc|--post-command|--post-command=*)
      if [ "${1##--post-command=}" != "$1" ]; then
        POST_COMMAND="${1##--post-command=}"
        shift
      else
        POST_COMMAND=$2
        shift 2
      fi
      ;;
    --force)
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

if [ "$PANTHEON_ENV" == "master" ] && [ -z "$FORCE" ] ; then
  critical "You are trying to push to a reserved branch, use --force to continue";
else
  # Create multidev if needed.
  if [ "$PANTHEON_ENV" != "master" ] && ! terminus multidev:list $PANTHEON_SITE_NAME --field id | grep "$PANTHEON_ENV"; then
    terminus multidev:create $PANTHEON_SITE_NAME.dev $PANTHEON_ENV
  fi

  # Prepare our repository for Pantheon.
  composer prepare-for-pantheon

  # Git commit all changes.
  git add -A

  # Git push the entire repo up to our multidev.
  git commit -m "Pushing build assets."
  git push pantheon $GIT_BRANCH:$PANTHEON_ENV --force || true

  # Run update hooks
  if [ "$CMD" == "all" ] || [ "$CMD" ==  "updb" ] ; then
    terminus remote:drush $PANTHEON_SITE_NAME.$PANTHEON_ENV -- updb;
  fi

  # Run config import
  if [ "$CMD" == "all" ] || [ "$CMD" ==  "cim" ] ; then
    terminus remote:drush $PANTHEON_SITE_NAME.$PANTHEON_ENV -- cim --yes;
  fi

  # Run cache clear
  if [ "$CMD" == "all" ] || [ "$CMD" ==  "cr" ] ; then
    terminus remote:drush $PANTHEON_SITE_NAME.$PANTHEON_ENV -- cr;
  fi

  # Reset back to our latest commit.
  git reset $GIT_SHA
  git checkout -- .gitignore
fi
