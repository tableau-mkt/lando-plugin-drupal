'use strict';

// Modules
const _ = module.parent.parent.require('lodash');
const auth = module.parent.parent.require('./../plugins/lando-pantheon/lib/auth');
const utils = module.parent.parent.require('./../plugins/lando-pantheon/lib/utils');

// The non dynamic base of the task
const task = {
  name: 'caboose',
  service: 'appserver',
  description: 'Pulls the latest backup from Pantheon. This process is faster than pull.',
  cmd: '/helpers/caboose.sh',
  level: 'app',
  options: {
    auth: {
      describe: 'Pantheon machine token',
      passthrough: true,
      string: true,
      interactive: {
        type: 'list',
        message: 'Choose a Pantheon account',
        choices: [],
        when: () => false,
        weight: 100,
      },
    },
    env: {
      passthrough: true,
      alias: ['e'],
      describe: 'The environment on Pantheon to pull the db backup from.',
      interactive: {
        type: 'list',
        default: 'dev',
        message: 'Pull db backup from?',
        weight: 600,
      },
    },
    files: {
      passthrough: true,
      alias: ['f'],
      describe: 'The environment on Pantheon to rsync the files with.',
      interactive: {
        type: 'list',
        default: 'none',
        message: 'Pull files from?',
        weight: 600,
      },
    },
    database: {
      passthrough: false,
      alias: ['d'],
      describe: 'The name of the database to import into (defaults to pantheon).',
      default: 'pantheon',
    },
    force: {
      passthrough: false,
      describe: 'Skips checking for existing backups and forces a download from Pantheon.',
      boolean: true,
      default: false,
    },
  },
};

// Helper to populate interactive opts
const getDefaults = (task, app) => {
  _.forEach(['env', 'files'], name => {
    task.options[name].interactive.choices = answers => {
      return utils.getPantheonInquirerEnvs(
        answers.auth,
        app.config.config.id,
        [],
        app.log);
    };
  });
  return task;
};

/*
 * Helper to build a caboose command
 */
exports.getTableauCaboose = (app, tokens = []) => {
  return _.merge({}, getDefaults(task, app), {options: auth.getAuthOptions(app.meta, tokens)});
};
