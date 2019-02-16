'use strict';

// Modules
const _ = module.parent.parent.require('lodash');

const task = {
  name: 'sites',
  service: 'appserver',
  command: 'sites',
  description: 'Lists all available site aliases.',
  cmd: '/helpers/site-alias.sh list',
  level: 'app',
};

/*

 * Helper to build a sites command
 */
exports.getTableauSites = () => {
  return _.merge({}, task);
};
