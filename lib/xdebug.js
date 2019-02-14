'use strict';

// Modules
const _ = module.parent.parent.require('lodash');

const task = {
  name: 'xdebug',
  service: 'appserver',
  user: 'root',
  command: 'xdebug',
  description: 'Turns X-debug on|off',
  cmd: '/helpers/xdebug.sh',
  level: 'app',
};

/*
 * Helper to build a xdebug command
 */
exports.getTableauXdebug = () => {
  return _.merge({}, task);
};
