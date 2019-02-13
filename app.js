'use strict';

// Modules
const _ = require('lodash');
const caboose = require('./lib/caboose');
const deploy = require('./lib/deploy');
const dbimport = require('./lib/import');
const sites = require('./lib/sites');
const siteCreate = require('./lib/site-create');
const siteDelete = require('./lib/site-delete');
const xdebug = require('./lib/xdebug');
const PantheonApiClient = module.parent.require('./../plugins/lando-pantheon/lib/client');
const utils = module.parent.require('./../plugins/lando-pantheon/lib/utils');

module.exports = (app, lando) => {
  // Tooling cache key
  const toolingCache = `${app.name}.tooling.cache`;

  // Init this early on but not before our recipes
  app.events.on('pre-init', () => {
    // Support NFS mounts on mac OS.
    if (process.platform === 'darwin' && _.get(app, 'config.config.nfsmount', false)) {
      const Service = lando.factory.get('nfs');
      const data = new Service(Service, {_app: _.cloneDeep(app)});
      app.add(data);
    }

    // Add additional tooling for pantheon recipe.
    if (_.get(app, 'config.recipe') === 'pantheon') {
      const tokens = utils.sortTokens(app.pantheonTokens, app.terminusTokens);
      app.config.tooling.caboose = caboose.getTableauCaboose(app, tokens);
      app.config.tooling.deploy = deploy.getTableauDeploy(app, tokens);
    }

    // Some more additional tooling.
    app.config.tooling.sites = sites.getTableauSites();
    app.config.tooling['site-create'] = siteCreate.getTableauSiteCreate();
    app.config.tooling['site-delte'] = siteDelete.getTableauSiteDelete();
    app.config.tooling.import = dbimport.getTableauImport();
    app.config.tooling.xdebug = xdebug.getTableauXdebug();

    // Cache dump our additional app tooling so we can use it in our entrypoint.
    lando.cache.set(toolingCache, JSON.stringify(app.config.tooling), {persist: true});
  });

  // Only do this on pantheon recipes
  if (_.get(app, 'config.recipe') === 'pantheon') {
    // Set the app caches, validate tokens and update token cache
    _.forEach(['caboose', 'deploy'], command => {
      lando.events.on(`cli-${command}-run`, data => {
        const api = new PantheonApiClient(data.options.auth, app.log);
        return api.auth().then(() => api.getUser().then(results => {
          const cache = {token: data.options.auth, email: results.email, date: _.toInteger(_.now() / 1000)};
          // Reset this apps metacache
          lando.cache.set(app.metaCache, _.merge({}, app.meta, cache), {persist: true});
          // Set lando's store of pantheon machine tokens
          lando.cache.set(app.pantheonTokenCache, utils.sortTokens(app.pantheonTokens, [cache]), {persist: true});
        }))
        // Throw some sort of error
        // NOTE: this provides some error handling when we are completely non-interactive
          .catch(err => {
            throw (_.has(err, 'response.data')) ? new Error(err.response.data) : err;
          });
      });
    });
  }
};
