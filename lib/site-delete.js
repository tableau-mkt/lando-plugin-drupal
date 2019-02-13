'use strict';

// Modules
const _ = require('lodash');

const task = {
  name: 'site-delete',
  service: 'appserver',
  command: 'site-delete',
  description: 'Delete an existing site alias.',
  cmd: '/helpers/tableau/site-alias/site-alias.sh delete',
  level: 'app',
  options: {
    alias: {
      passthrough: true,
      alias: ['a'],
      describe: 'The alias of the site you want to delete.',
      interactive: {
        type: 'input',
        message: 'What is the name of the site alias?',
        weight: 600,
      },
    },
  },
};

/*
 * Helper to build a site-delete command
 */
exports.getTableauSiteDelete = () => {
  return _.merge({}, task);
};
