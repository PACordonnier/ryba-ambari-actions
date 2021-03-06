// Generated by CoffeeScript 2.1.1
// # Ambari Configs update

// Updates ambari named config using the [REST API v2](https://github.com/apache/ambari/blob/trunk/ambari-server/docs/api/v1)

// * `password` (string)
//   Ambari Administrator password.
// * `url` (string)   
//   Ambari External URL.
// * `username` (string)
//   Ambari Administrator username.
// * `cluster_name` (string)   
//   Name of the cluster, required
// * `config_type` (string)   
//   config of the name to modify example core-site, hdfs-site... required.
// * `properties` (object)   
//   properties to add to the configuration, required.
// * `tag` (string)   
//   tag of the updated config, will be computed if no provided to: 'version' + version
// * `current_tag` (string)   
//   the current tag of the config_type, will read from ambari's server if not provided.
// * `description` (string)   
//   a note describing what modifications user provides
// * `merge` (boolean)
// Read properties for the current version (if exists) and merge properties. true by default.

// ## Exemple

// ```js
// configs.update({
//   "username": 'ambari_admin',
//   "password": 'ambari_secret',
//   "url": "http://ambari.server.com",
//   "config_type": 'hdfs-site',
//   "properties": { "dfs.nameservices": "mycluster"}
//   }
// }, function(err, status){
//   console.log( err ? err.message : "Properties UPDATED: " + status)
// })
// ```

// ## Source Code
var crypto, merge, path, utils;

module.exports = function(options, callback) {
  var differences, do_diff, do_end, do_update, err, error, get_current_version, hostname, opts, path, port, prop, ref, ref1, val, value;
  if (typeof options.options === 'object') {
    options = options.options;
  }
  error = null;
  differences = false;
  if (options.debug == null) {
    options.debug = false;
  }
  if (options.merge == null) {
    options.merge = true;
  }
  do_end = function() {
    if (callback != null) {
      return callback(error, differences);
    }
    return new Promise(function(fullfil, reject) {
      if (error != null) {
        reject(error);
      }
      return fullfil(differences);
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
    if (!options.cluster_name) {
      throw Error('Required Options: cluster_name');
    }
    if (!options.config_type) {
      throw Error('Required Options: config_type');
    }
    if (!(options.source || options.properties)) {
      throw Error('Required Options: source or properties');
    }
    if (options.source && options.properties) {
      throw Error('Source and properties can not be specified simultaneously');
    }
    ref = options.properties;
    //clean properties
    for (prop in ref) {
      val = ref[prop];
      if (val === null) {
        delete options.properties[prop];
      }
    }
    ref1 = options.properties;
    for (prop in ref1) {
      value = ref1[prop];
      if (Array.isArray(value)) {
        options.properties[prop] = value.join(',');
      }
    }
    [hostname, port] = options.url.split("://")[1].split(':');
    if (options.sslEnabled == null) {
      options.sslEnabled = options.url.split('://')[0] === 'https';
    }
    path = `/api/v1/clusters/${options.cluster_name}`;
    opts = {
      hostname: hostname,
      port: port,
      rejectUnauthorized: false,
      headers: utils.headers(options),
      sslEnabled: options.sslEnabled
    };
    opts['method'] = 'GET';
    // get current tag for actual config
    get_current_version = function() {
      opts.path = `${path}?fields=Clusters/desired_configs`;
      if (typeof this.log === "function") {
        this.log({
          message: "Reading information about current configuration",
          level: 'INFO',
          module: 'ryba-ambari-actions/configs/update'
        });
      }
      return utils.doRequestWithOptions(opts, function(err, statusCode, response) {
        var desired_configs;
        try {
          if (err) {
            throw err;
          }
          response = JSON.parse(response);
          if (statusCode !== 200) {
            throw Error(response.message);
          }
          desired_configs = response['Clusters']['desired_configs'];
          if (options.stack_version == null) {
            options.stack_version = response['Clusters']['version'];
          }
          if (options.cluster_name == null) {
            options.cluster_name = response['Clusters']['cluster_name'];
          }
          // note each configuration has two files tag and version
          // the tag is a string while the version the id as an integer
          // this id will be used to get the latest version
          if (desired_configs[options.config_type] != null) {
            options.current_version = desired_configs[options.config_type].version;
            options.current_tag = desired_configs[options.config_type].tag;
            if (typeof this.log === "function") {
              this.log({
                message: `Desired config found type: ${options.config_type} version: ${options.current_version} tag: ${options.current_tag}`,
                level: 'INFO',
                module: 'ryba-ambari-actions/configs/update'
              });
            }
            if (options.config_version == null) {
              options.config_version = parseInt(options.current_version) + 1;
            }
            options.new_version = parseInt(options.current_version) + 1;
            options.new_tag = `version${options.new_version}`;
            return do_diff();
          }
          options.new_tag = 'version1';
          options.new_version = 1;
          return do_update();
        } catch (error1) {
          err = error1;
          error = err;
          return do_end();
        }
      });
    };
    do_diff = function() {
      if (typeof this.log === "function") {
        this.log({
          message: `Computing diff for ${options.config_type}`,
          level: 'INFO',
          module: 'ryba-ambari-actions/configs/update'
        });
      }
      if (options.debug) {
        console.log("");
      }
      // do diff with the current config tag
      opts.path = `${path}/configurations?type=${options.config_type}&tag=${options.current_tag}`;
      if (options.debug) {
        console.log(`options.config_type ${options.config_type}, current_tag: ${options.current_tag}`);
      }
      opts['method'] = 'GET';
      return utils.doRequestWithOptions(opts, function(err, statusCode, response) {
        var base, current_configs, current_properties, ref2;
        try {
          if (err) {
            throw err;
          }
          response = JSON.parse(response);
          if (statusCode !== 200) {
            throw Error(response.message);
          }
          current_configs = response['items'].filter(function(item) {
            return item.version === options.current_version;
          });
          if (current_configs.length !== 1) {
            throw Error(`No config found for version ${options.current_version}`);
          }
          current_properties = (base = current_configs[0]).properties != null ? base.properties : base.properties = {};
          if (options.merge) {
            options.properties = merge({}, current_properties, options.properties);
          }
          ref2 = options.properties;
          //return do_update()
          for (prop in ref2) {
            value = ref2[prop];
            // if crypto.createHash('md5').update("#{current_properties[prop]}").digest('hex') isnt crypto.createHash('md5').update("#{value}").digest('hex')
            if (`${current_properties[prop]}` !== `${value}`) {
              if (typeof this.log === "function") {
                this.log({
                  message: `Property ${prop} was ${current_properties[prop]} and is now ${value}`,
                  level: 'INFO',
                  module: 'ryba-ambari-actions/configs/update'
                });
              }
              differences = differences || true;
              break;
            }
          }
          if (differences) {
            return do_update();
          } else {
            return do_end();
          }
        } catch (error1) {
          err = error1;
          error = err;
          return do_end();
        }
      });
    };
    do_update = function() {
      var err, status;
      try {
        status = true;
        if (options.description == null) {
          options.description = `updated config ${options.config_type}`;
        }
        options.config_version = options.new_version;
        options.tag = options.new_tag;
        differences = true;
        if (typeof this.log === "function") {
          this.log({
            message: `update ${options.config_type} with tag: ${options.tag} version:${options.config_version} through API`,
            level: 'INFO',
            module: 'ryba-ambari-actions/configs/update'
          });
        }
        opts.content = options.content = JSON.stringify([
          {
            Clusters: {
              desired_config: [
                {
                  type: options.config_type,
                  tag: options.tag,
                  properties: options.properties,
                  service_config_version_note: options.description
                }
              ]
            }
          }
        ]);
        // opts.headers['Content-Type'] = 'application/json'
        opts.method = 'PUT';
        opts.path = `${path}`;
        return utils.doRequestWithOptions(opts, (err, statusCode, response) => {
          error = err;
          try {
            if (response !== '') {
              response = JSON.parse(response);
              if (statusCode !== 200) {
                throw Error(response.message);
              }
            }
          } catch (error1) {
            err = error1;
            return error = err;
          } finally {
            do_end();
          }
        });
      } catch (error1) {
        err = error1;
        error = err;
        return do_end();
      }
    };
    return get_current_version();
  } catch (error1) {
    err = error1;
    error = err;
    return do_end();
  }
};

// ## Depencendies
utils = require('../utils');

path = require('path');

({merge} = require('nikita/lib/misc'));

crypto = require('crypto');
