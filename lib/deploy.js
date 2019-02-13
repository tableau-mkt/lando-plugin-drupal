'use strict';

// Modules
const _ = require('lodash');
const auth = module.parent.parent.require('./../plugins/lando-pantheon/lib/auth');
const utils = module.parent.parent.require('./../plugins/lando-pantheon/lib/utils');

// The non dynamic base of the task
const task = {
  name: 'deploy',
  service: 'appserver',
  description: 'Push to Pantheon. This process will create a multidev if none is found.',
  cmd: '/helpers/tableau/deploy/deploy.sh',
  level: 'app',
  options: {
    'auth': {
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
    'env': {
      passthrough: true,
      alias: ['e'],
      describe: 'The target branch on the Pantheon.',
      interactive: {
        type: 'list',
        default: 'dev',
        message: 'What is the target branch?',
        weight: 600,
      },
    },
    'post-cmd': {
      passthrough: true,
      alias: ['pc'],
      describe: 'The commands to run post deployment.',
      interactive: {
        type: 'input',
        default: 'none',
        message: 'Which post deployment commands would you like to run? (i.e. all, cr, updb, cim or none)',
        weight: 600,
      },
    },
    'force': {
      passthrough: false,
      describe: 'Forces the deployment. Required when pushing to a reserved branch (e.g. master).',
      boolean: true,
      default: false,
    },
  },
};

// Helper to populate interactive opts
const getDefaults = (task, app) => {
  _.forEach(['env'], name => {
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
 * Helper to build a deploy command
 */
exports.getTableauDeploy = (app, tokens = []) => {
  return _.merge({}, getDefaults(task, app), {options: auth.getAuthOptions(app.meta, tokens)});
};
