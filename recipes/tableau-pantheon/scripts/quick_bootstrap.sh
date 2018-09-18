#!/usr/bin/env bash

set -e

toggle=${1:-"on"}

# Navigate to the webroot.
cd $LANDO_WEBROOT;
echo "Running Quick bootstrap $toggle"

if [ $toggle = "on" ] && [ -f 'index.php' ]; then
  # Swap out index.php with quick bootstrap.
  mv -n index.php index.php.txt
  echo "<?php echo("READY");exit();?>" > index.php
elif [ $toggle = "off" ] && [ -f 'index.php.txt' ]; then
  # Restore original index.php
  rm index.php;
  mv index.php.txt index.php;
fi;
