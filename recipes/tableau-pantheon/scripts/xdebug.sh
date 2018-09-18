#!/usr/bin/env bash

# Reference helper functions.
source /helpers/tableau/_util.sh

cd /usr/local/etc/php/conf.d ;

toggle=${1:-"on"}

if [ $toggle = "on" ]; then
  sed -i "s/^;*//g" docker-php-ext-xdebug.ini;
  info "Enabled xdebug"
elif [ $toggle = "off" ]; then
  sed -i "s/^/;/g" docker-php-ext-xdebug.ini;
  info "Disabled xdebug"
else
  warn "Use 'lando xdebug on|off' to turn X-debug on|off."
  exit 0;
fi ;

pkill -USR2 php-fpm
