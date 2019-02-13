'use strict';

// Modules
const _ = require('lodash');

const task = {
  name: 'xdebug',
  service: 'appserver',
  user: 'root',
  command: 'xdebug',
  description: 'Turns X-debug on|off',
  cmd: '/helpers/tableau/xdebug/xdebug.sh',
  level: 'app',
};

/*
 * Helper to build a xdebug command
 */
exports.getTableauXdebug = () => {
  return _.merge({}, task);
};
