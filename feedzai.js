//
// Feedzai JavaScript SDK
// Benedict Chan <bencxr@fragnetics.com>
//
var superagent = require('superagent');

var FeedZai = function(params) {
  params = params || {};
  if (params.environment) {
    if (params.environment !== 'sandbox' && params.environment !== 'production') {
      throw new Error("Invalid environment: " + params.environment);
    }
  }

  this.environment = params.environment || 'sandbox';

  if (this.environment === 'sandbox') {
    this.baseURI = 'https://sandbox.feedzai.com/v1';
  } else if (this.environment === 'production') {
    this.baseURI = 'https://www.feedzai.com/v1';
  } else {
    throw new Error("Invalid environment");
  }

  if (!params.apiKey) { throw new Error("Must supply apiKey"); }
  this._token = new Buffer(params.apiKey + ":").toString('base64') + "==";

  var self = this;

  // This is a patching function which can add the api token to every call
  var createPatch = function(verb) {
    return function() {
      var req = superagent[verb].apply(null, arguments);
      req.set('Authorization', "Basic " + self._token);
      // Set the request timeout to just above 5 minutes by default
      req.timeout(305 * 1000);
      return req;
    };
  };

  ['get', 'post', 'put', 'del'].forEach(function(verb) {
    self[verb] = createPatch(verb);
  });
};

var bodyExtractor = function(caller) {
  return function(err, res) {
    caller(err, res.body);
  }
};

FeedZai.prototype.url = function(endpoint) {
  return this.baseURI + endpoint;
};

FeedZai.prototype.payments = function() {
  var self = this;

  var score = function(params, callback) {
    self.post(self.url('/payments'))
    .send(params)
    .end(bodyExtractor(callback));
  };

  var get = function(params, callback) {
    self.get(self.url('/payments/' + params.id))
    .query(params)
    .send()
    .end(bodyExtractor(callback));
  };

  var search = function(params, callback) {
    self.get(self.url('/payments'))
    .query(params)
    .send()
    .end(bodyExtractor(callback));
  };

  var label = function(params, callback) {
    self.put(self.url('/payments/' + params.id + '/label'))
    .send({
      label: params.label
    })
    .end(bodyExtractor(callback));
  };

  return {
    score: score,
    get: get,
    search: search,
    label: label
  }
};

module.exports = FeedZai;
