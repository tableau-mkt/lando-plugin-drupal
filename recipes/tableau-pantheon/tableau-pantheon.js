'use strict';

module.exports = function(lando) {

  // Modules
  const _ = lando.node._;
  const merger = lando.utils.config.merge;
  const path = require('path');

  // Lando references
  const utils = lando.utils;

  // Constants
  const configDir = path.join(lando.config.servicesConfigDir, 'tableau-pantheon');
  const servicesHelpersDir = path.join(lando.config.servicesHelpersDir, 'tableau');
  const helpersDir = '/helpers/tableau';

  /*
   * Helper to mix in the correct tooling in our recipe.
   *
   * @see https://docs.devwithlando.io/tutorials/setup-additional-tooling.html
   *
   * - `xdebug`: Toggles X-debug on|off entirely.
   * - `caboose`: Replacement for `pull` command. Downloads the latest db dump
   *  from Pantheon and imports the backup into the correct database.
   * - `import`: Imports a backup file directly into a target databse.
   * - `deploy`: Replacement for `push` command. Deploys the codebase to
   *  a target environment on Pantheon.
   * - `sites`: Lists all available site aliases. A site alias is a dedicated
   *  sub-domain, drush alias and target database.
   * - `site-create`: Creates a new site alias.
   * - `site-delete`: Deletes a given site alias.
   */
  const addTooling = function(build, config) {
    const volumePath = 'services.appserver.overrides.services.volumes';
    let volumes = _.get(build, volumePath, {});
    let mounts = [
      {local: path.join(configDir, 'scripts/drush.sh'), remote: [helpersDir, 'drush.sh'].join('/')},
      {local: path.join(configDir, 'scripts/pantheon.sh'), remote: [helpersDir, 'pantheon.sh'].join('/')},
      {local: path.join(configDir, 'tooling/caboose/animations/train/train1.txt'), remote: [helpersDir, 'caboose/animations/train/train1.txt'].join('/')},
      {local: path.join(configDir, 'tooling/caboose/animations/train/train2.txt'), remote: [helpersDir, 'caboose/animations/train/train2.txt'].join('/')},
      {local: path.join(configDir, 'tooling/caboose/animations/train/train3.txt'), remote: [helpersDir, 'caboose/animations/train/train3.txt'].join('/')},
      {local: path.join(configDir, 'tooling/caboose/animations/train/train4.txt'), remote: [helpersDir, 'caboose/animations/train/train4.txt'].join('/')},
      {local: path.join(configDir, 'tooling/caboose/caboose.sh'), remote: [helpersDir, 'caboose/caboose.sh'].join('/')},
      {local: path.join(configDir, 'tooling/db-import/db-import.sh'), remote: [helpersDir, 'db-import/db-import.sh'].join('/')},
      {local: path.join(configDir, 'tooling/deploy/deploy.sh'), remote: [helpersDir, 'deploy/deploy.sh'].join('/')},
      {local: path.join(configDir, 'tooling/site-alias/site-alias.sh'), remote: [helpersDir, 'site-alias/site-alias.sh'].join('/')},
      {local: path.join(servicesHelpersDir, '_util.sh'), remote: [helpersDir, '_util.sh'].join('/')}
    ];
    const tools = _.get(build, 'tooling', {});
    const runKey = 'services.appserver.run_as_me';
    const runRootKey = 'services.appserver.run_as_root';
    // Initialize our queue so we can push scripts to run on lando start.
    build.services.appserver.run_as_me = _.get(build, runKey, []);
    build.services.appserver.run_as_root = _.get(build, runRootKey, []);

    // Ensure Drush always points to the correct executable.
    build.services.appserver.run_as_me.push('/helpers/tableau/drush.sh');

    // Authenticate with terminus and set up a Pantheon git remote.
    build.services.appserver.run_as_me.push('/helpers/tableau/pantheon.sh');

    // Add in the xdebug command to toggle x-debug on|off entirely.
    build.services.appserver.config = merger(build.services.appserver.config, {conf: path.join(configDir, 'config/xdebug.ini')});

    mounts.push({local: path.join(configDir, 'scripts/xdebug.sh'),
      remote: [helpersDir, 'xdebug.sh'].join('/')});

    // Support Drush with x-debug
    build.services.appserver.overrides.services.environment = merger(build.services.appserver.overrides.services.environment, {
      PHP_IDE_CONFIG: 'serverName=appserver'
    });

    tools.xdebug = {
      service: 'appserver',
      description: 'Turns X-debug on|off',
      user: "root",
      cmd: '/helpers/tableau/xdebug.sh'
    };

    // Replace pull with caboose command.
    tools.caboose = {
      service: 'appserver',
      description: 'Pulls the latest backup from Pantheon. This process is faster than pull.',
      cmd: '/helpers/tableau/caboose/caboose.sh',
      options: {
        env: {
          passthrough: true,
          alias: ['e'],
          describe: 'The environment on Pantheon to pull the db backup from.',
          interactive: {
            type: 'input',
            default: 'dev',
            message: 'Which environment do you want to pull the database from?',
            weight: 600
          }
        },
        files: {
          passthrough: true,
          alias: ['f'],
          describe: 'The environment on Pantheon to rsync the files with.',
          interactive: {
            type: 'input',
            default: 'none',
            message: 'Which environment do you want to rsync the files with?',
            weight: 600
          }
        },
        database: {
          passthrough: false,
          alias: ['d'],
          describe: 'The name of the database to import into (defaults to pantheon).',
          default: 'pantheon'
        },
        force: {
          passthrough: false,
          describe: 'Skips checking for existing backups and forces a download from Pantheon.',
          boolean: true,
          default: false
        }
      }
    };

    // Replace push with deploy command.
    tools.deploy = {
      service: 'appserver',
      description: 'Push to Pantheon. This process will create a multidev if none is found.',
      cmd: '/helpers/tableau/deploy/deploy.sh',
      options: {
        env: {
          passthrough: true,
          alias: ['e'],
          describe: 'The target branch on the Pantheon.',
          interactive: {
            type: 'input',
            default: 'dev',
            message: 'What is the target branch?',
            weight: 600
          }
        },
        'post-cmd': {
          passthrough: true,
          alias: ['pc'],
          describe: 'The commands to run post deployment.',
          interactive: {
            type: 'input',
            default: 'none',
            message: 'Which post deployment commands would you like to run? (i.e. all, cr, updb, cim or none)',
            weight: 600
          }
        },
        force: {
          passthrough: false,
          describe: 'Forces the deployment. Required when pushing to a reserved branch (e.g. master).',
          boolean: true,
          default: false
        }
      }
    };

    // Import a database file directly.
    tools.import = {
      service: 'appserver',
      description: 'Import a file into a target database.',
      cmd: '/helpers/tableau/db-import/db-import.sh',
      options: {
        database: {
          passthrough: false,
          alias: ['d'],
          describe: 'The name of the database to import into (defaults to pantheon).',
          default: 'pantheon'
        },
        file: {
          passthrough: false,
          alias: ['f'],
          describe: 'The path to the database file (relative to /app).',
          default: ''
        }
      }
    };

    // List available site aliases.
    tools.sites = {
      service: 'appserver',
      description: 'Lists all available site aliases.',
      cmd: [
        '/helpers/tableau/site-alias/site-alias.sh',
        'list'
      ]
    };

    // Create a new site alias.
    tools['site-create'] = {
      service: 'appserver',
      description: 'Create a new site alias.',
      cmd: [
        '/helpers/tableau/site-alias/site-alias.sh',
        'create'
      ],
      options: {
        alias: {
          passthrough: true,
          alias: ['a'],
          describe: 'The alias of the site you want to create. A database with that name will be initialized.',
          interactive: {
            type: 'input',
            message: 'What is the name of the site alias?',
            weight: 600
          }
        }
      }
    };

    // Delete a given site alias.
    tools['site-delete'] = {
      service: 'appserver',
      description: 'Delete an existing site alias.',
      cmd: [
        '/helpers/tableau/site-alias/site-alias.sh',
        'delete'
      ],
      options: {
        alias: {
          passthrough: true,
          alias: ['a'],
          describe: 'The alias of the site you want to delete.',
          interactive: {
            type: 'input',
            message: 'What is the name of the site alias?',
            weight: 600
          }
        }
      }
    };

    // Convert our mounts to volumes
    _.forEach(mounts, function(mount) {
      volumes = utils.services.addConfig(utils.services.buildVolume(mount.local, mount.remote), volumes);
    });

    // Add everything back to the build object.
    _.set(build, volumePath, volumes);
    _.set(build, 'tooling', tools);
  };

  /**
   * Declares additional nfs mount.
   *
   * @param build
   * @param config
   */
  const addNfsMount = function(build, config) {
    const volumePath = 'services.appserver.overrides.services.volumes';
    let volumes = _.get(build, volumePath, {});

    // Add these folders as volumes to our appserver.
    volumes = utils.services.addConfig('${LANDO_NFS_MOUNT}:/app', volumes);

    // Add everything to the build object.
    _.set(build, volumePath, volumes);
  };

  /**
   * Declares additional vendor mounts.
   *
   * @param build
   * @param config
   */
  const addVendorMounts = function(build, config) {
    const volumePath = 'services.appserver.overrides.services.volumes';
    let volumes = _.get(build, volumePath, []);

    // Add these folders as volumes to our appserver.
    volumes = utils.services.addConfig('vendor:/app/vendor', volumes);
    volumes = utils.services.addConfig('drupal_core:/app/web/core', volumes);
    volumes = utils.services.addConfig('drupal_modules:/app/web/modules/contrib', volumes);
    volumes = utils.services.addConfig('drupal_themes:/app/web/themes', volumes);

    // Add everything to the build object.
    _.set(build, volumePath, volumes);
  };

  /*
   * Build out our Tableau Pantheon Drupal recipe
   */
  const build = function(name, config) {
    // Store config settings
    const originalConfig = _.clone(config);
    // Load in the core pantheon recipe.
    let build = lando.recipes.build(name, 'pantheon', config);

    // Support docker mounts to improve performance.
    if (process.platform === 'darwin' && _.has(config, 'nfsmount') && config.nfsmount) {
      addNfsMount(build, config);
    }
    if (_.has(config, 'vendormount') && config.vendormount) {
      addVendorMounts(build, config);
    }

    // Delete some unnecessary tooling tasks.
    delete build.tooling.pull;
    delete build.tooling.push;
    delete build.tooling["switch <env>"];
    delete build.tooling["db-import [file]"];

    // Mix in our custom tooling.
    addTooling(build, config);

    // Set the database info to the pantheon defaults:
    // db_name: pantheon
    // db_user: pantheon
    // db_pass: pantheon
    build.services.database.creds.database = 'pantheon';
    build.services.database.creds.password = 'pantheon';
    build.services.database.creds.user = 'pantheon';

    // Reset drush/drupal config per lando.yml
    if (! originalConfig.drush) {
      _.remove(build.services.appserver.install_dependencies_as_me, function(e) {
        return e.indexOf('drush.phar') !== -1;
      });
    }
    if (! originalConfig.drupal) {
      _.remove(build.services.appserver.install_dependencies_as_me, function(e) {
        return e.indexOf('drupal.phar') !== -1;
      });
    }

    // Return the modified build.
    return build;
  };

  return {
    build: build,
    configDir: __dirname,
    webroot: false,
    name: false
  };
};
