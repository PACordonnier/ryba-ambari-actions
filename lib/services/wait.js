// Generated by CoffeeScript 2.1.1
// # Ambari Wait Service Created

// Add a host to an ambari cluster [REST API v2](https://github.com/apache/ambari/blob/trunk/ambari-server/docs/api/v1)
// The node should already exist in ambari.

// * `password` (string)
//   Ambari Administrator password.
// * `url` (string)
//   Ambari External URL.
// * `username` (string)
//   Ambari Administrator username.
// * `cluster_name` (string)
//   Name of the cluster, optional
// * `name` (string)
//   name of the service, required.
// * `timeout` (string)
//   timeout in millisecond to wait, default to 10 mins.

// ## Exemple

// ```js
// nikita
// .services.add({
//   "username": 'ambari_admin',
//   "password": 'ambari_secret',
//   "url": "http://ambari.server.com",
//   "cluster_name": 'my_cluster'
//   "name": 'HDFS'
//   }
// }, function(err, status){
//   console.log( err ? err.message : "Node Added To Cluster: " + status)
// })
// ```

// ## Source Code
var utils;

module.exports = function(options, callback) {
  var do_end, do_request, err, error, hostname, interval, opts, path, port, status, waited;
  if (typeof options.options === 'object') {
    options = options.options;
  }
  error = null;
  status = false;
  if (options.debug == null) {
    options.debug = false;
  }
  interval = null;
  if (options.timeout == null) {
    options.timeout = 10 * 60 * 60 * 1000;
  }
  do_end = function() {
    clearInterval(interval);
    if (callback != null) {
      return callback(error, status);
    }
    return new Promise(function(fullfil, reject) {
      if (error != null) {
        reject(error);
      }
      return fullfil(status);
    });
  };
  try {
    if (!options.username) {
      throw Error('Required Options: username');
    }
    if (!options.password) {
      throw Error('Required Options: password');
    }
    if (!options.url) {
      throw Error('Required Options: url');
    }
    if (!options.name) {
      throw Error('Required Options: name');
    }
    if (!options.cluster_name) {
      throw Error('Required Options: cluster_name');
    }
    [hostname, port] = options.url.split("://")[1].split(':');
    if (options.sslEnabled == null) {
      options.sslEnabled = options.url.split('://')[0] === 'https';
    }
    path = `/api/v1/clusters/${options.cluster_name}/services`;
    opts = {
      hostname: hostname,
      port: port,
      rejectUnauthorized: false,
      headers: utils.headers(options),
      sslEnabled: options.sslEnabled
    };
    opts['method'] = 'GET';
    opts.path = `${path}/${options.name}`;
    waited = 0;
    do_request = function() {
      return utils.doRequestWithOptions(opts, function(err, statusCode, response) {
        var ref;
        try {
          if (err) {
            throw err;
          }
          waited = waited + 2000;
          response = JSON.parse(response);
          if (parseInt(statusCode) === 200) {
            return do_end();
          }
          if (waited > options.timeout) {
            return do_end();
          }
          if ((ref = parseInt(statusCode)) !== 200 && ref !== 404) {
            throw Error(response.message);
          }
        } catch (error1) {
          err = error1;
          return error = err;
        }
      });
    };
    return interval = setInterval(do_request, 2000);
  } catch (error1) {
    err = error1;
    error = err;
    return do_end();
  }
};

// ## Depencendies
utils = require('../utils');
