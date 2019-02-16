'use strict';

// Modules
const _ = module.parent.parent.require('lodash');

const task = {
  name: 'import',
  service: 'appserver',
  command: 'import',
  description: 'Import a file into a target database.',
  cmd: '/helpers/db-import.sh',
  level: 'app',
  options: {
    'database': {
      alias: ['d'],
      describe: 'The name of the database to import into (defaults to pantheon).',
      default: 'pantheon',
    },
    'file': {
      alias: ['f'],
      describe: 'The path to the database file (relative to /app).',
      default: '',
    },
  },
};

/*
 * Helper to build a import command
 */
exports.getTableauImport = () => {
  return _.merge({}, task);
};
