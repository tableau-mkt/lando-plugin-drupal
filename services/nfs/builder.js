'use strict';

// Modules
const _ = require('lodash');

/**
 * Declares additional NFS mount docker volume.
 * This speeds up file performance by about x3 on MAC OS.
 *
 * @param appRoot
 */
const nfsMount = appRoot => {
  return {
    driver: 'local',
    driver_opts: {
      type: 'nfs',
      o: 'addr=host.docker.internal,rw,nolock,hard,nointr,nfsvers=3,fsc,actimeo=2,tcp',
      device: `:${appRoot}`,
    },
  };
};

/*
 * Tableau specific pantheon recipe
 */
module.exports = {
  name: 'nfs',
  parent: '_compose',
  config: {},
  builder: (parent, config) => class LandoNfs extends parent {
    constructor(id, options = {}, ...sources) {
      options = _.merge({}, config, options);

      const namedVols = {};
      _.set(namedVols, 'nfsmount', nfsMount(options._app.root));
      sources.push({
        services: {appserver: {volumes: [`nfsmount:/app`]}},
        volumes: namedVols,
      });

      // Send it downstream
      super('nfs', {}, ...sources);
    };
  },
};
