#!/usr/bin/env bash

set -e

# Create symlink so we can use Drush globally.
if [ ! -x "$(command -v drush)" ]; then
  ln -svf "${LANDO_MOUNT}/vendor/bin/drush" "/usr/local/bin/drush" > /dev/null 2>&1 || true
fi
