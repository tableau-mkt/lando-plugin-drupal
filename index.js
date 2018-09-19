'use strict';

module.exports = function(lando) {

  // Modules
  const _ = lando.node._;
  const path = require('path');

  // List of available Tableau recipes.
  const recipes = [
    'tableau-pantheon',
  ];

  /**
   * Was throwing:
   *  Possible EventEmitter memory leak detected. 21 post-bootstrap listeners added.
   *  Use emitter.setMaxListeners() to increase limit
   */
  lando.events.setMaxListeners(lando.events.getMaxListeners() + 25);

  /**
   * Declares additional NFS mount docker volume.
   * This speeds up file performance by about x3 on MAC OS.
   *
   * @param app
   */
  const addNfsMount = function(app) {
    const nfsMount = {
      nfsmount: {
        driver: 'local',
        driver_opts: {
          type: 'nfs',
          o: 'addr=host.docker.internal,rw,nolock,hard,nointr,nfsvers=3,fsc,actimeo=2,tcp',
          device: ':${LANDO_APP_ROOT_BIND}',
        },
      },
    };

    // Add everything to the app.
    app.volumes = _.merge(app.volumes, nfsMount);
  };

  // Add our custom recipes to lando.
  lando.events.on('post-bootstrap', lando => {
    _.forEach(recipes, recipe => {
      const recipeModule = './recipes/' + [recipe, recipe].join('/');
      lando.recipes.add(recipe, require(recipeModule)(lando));
    });
  });

  // Add services modules to lando
  lando.events.on('post-bootstrap', 2, function(lando) {
    // Move our helper scripts over.
    const helpersFrom = path.join(__dirname, 'helpers');
    const helpersTo = path.join(lando.config.servicesHelpersDir, 'tableau');

    lando.log.verbose('Copying config from %s to %s', helpersFrom, helpersTo);
    lando.utils.engine.moveConfig(helpersFrom, helpersTo);
  });

  // Add any named volumes to lando.
  lando.events.on('post-instantiate-app', app => {
    const config = app.config.config || {};

    // Support NFS file mounts on Mac OS.
    if (process.platform === 'darwin' &&  _.has(config, 'nfsmount') && config.nfsmount) {
      addNfsMount(app);
    }

    // Support vendor file mounts.
    if (_.has(config, 'vendormount') && app.config.config.vendormount) {
      app.volumes = _.merge(app.volumes, {
        'vendor': {},
        'node_modules': {},
        'drupal_core': {},
        'drupal_modules': {},
        'drupal_themes': {},
      });
    }
  });

};
