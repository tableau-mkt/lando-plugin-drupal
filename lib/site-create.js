'use strict';

// Modules
const _ = require('lodash');

const task = {
  name: 'site-create',
  service: 'appserver',
  command: 'site-create',
  description: 'Create a new site alias.',
  cmd: '/helpers/tableau/site-alias/site-alias.sh create',
  level: 'app',
  options: {
    alias: {
      passthrough: true,
      alias: ['a'],
      describe: 'The alias of the site you want to create. A database with that name will be initialized.',
      interactive: {
        type: 'input',
        message: 'What is the name of the site alias?',
        weight: 600,
      },
    },
  },
};

/*
 * Helper to build a site-create command
 */
exports.getTableauSiteCreate = () => {
  return _.merge({}, task);
};
