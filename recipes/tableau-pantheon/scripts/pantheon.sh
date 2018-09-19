#!/usr/bin/env bash

set -e

# Authenticate with terminus.
cd $LANDO_MOUNT;
 echo "Authenticating with terminus...";
if [ $(terminus auth:whoami | grep "You are not logged in.") ] && [ ! -z "${PANTHEON_MACHINE_TOKEN}" ]; then
 terminus auth:login --machine-token=${PANTHEON_MACHINE_TOKEN}

 # Add a remote git to our respective Pantheon site.
 git remote add pantheon ssh://codeserver.dev.${PANTHEON_SITE}@codeserver.dev.${PANTHEON_SITE}.drush.in:2222/~/repository.git > /dev/null 2>&1 || true
fi
