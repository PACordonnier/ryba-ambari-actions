
# Ambari Cluster Update Cluster State

Update a cluster State using the [REST API v2](https://github.com/apache/ambari/blob/trunk/ambari-server/docs/api/v1)

* `password` (string)
  Ambari Administrator password.
* `url` (string)   
  Ambari External URL.
* `username` (string)
  Ambari Administrator username.
* `name` (string)   
  Name of the cluster.
* `provisioning_state` (String)   
The desired provisioning state.


## Exemple

```js
nikita
.cluster.provisioning_state({
  "username": 'ambari_admin',
  "password": 'ambari_secret',
  "url": "http://ambari.server.com",
  "name": 'my_cluster',
  "provisioning_state": "INSTALLED"
  }
}, function(err, status){
  console.log( err ? err.message : "Cluster Updated: " + status)
})
```

## Source Code

    module.exports = (options, callback) ->
      options = options.options if typeof options.options is 'object'
      error = null
      status = false
      options.debug ?= false
      do_end = ->
        return callback error, status if callback?
        new Promise (fullfil, reject) ->
          reject error if error?
          fullfil response
      try
        throw Error 'Required Options: username' unless options.username
        throw Error 'Required Options: password' unless options.password
        throw Error 'Required Options: url' unless options.url
        throw Error 'Required Options: name' unless options.name
        throw Error 'Required Options: provisioning_state' unless options.provisioning_state
        [hostname,port] = options.url.split("://")[1].split(':')
        options.sslEnabled ?= options.url.split('://')[0] is 'https'
        path = "/api/v1/clusters"
        opts = {
          hostname: hostname
          port: port
          rejectUnauthorized: false
          headers: utils.headers options
          sslEnabled: options.sslEnabled
        }
        opts['method'] = 'GET'
        opts.path = "#{path}/#{options.name}"
        utils.doRequestWithOptions opts, (err, statusCode, response) ->
          throw err if err
          response = JSON.parse response
          throw Error response.message unless statusCode is 200
          if response?.status is 404
            throw Error "Cluster #{options.name} does not exist in ambari-server"
          else
            return do_end() if response['Clusters']['provisioning_state'] is options.provisioning_state
            opts['method'] = 'PUT'
            opts.content ?=
              RequestInfo:
                context: 'Update Provisoning State Cluster'
              Body: Clusters: provisioning_state: options.provisioning_state
            opts.content = JSON.stringify opts.content
            utils.doRequestWithOptions opts, (err, statusCode, response) ->
              try
                throw err if err
                status = true
                do_end()
              catch err
                error = err
                do_end()
      catch err
        error = err
        do_end()

## Depencendies

    utils = require '../utils'
