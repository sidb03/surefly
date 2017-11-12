const fetch = require('./ServiceClient');
const Logger = require('./Logger');
const WebSocketConnection = require('./WebSocketConnection');

let cached_users = {
};
let cached_users_pa = {
};

function cache_is_valid(timestamp, timeout) {
  timeout = timeout || 3600;
  return timestamp - (new Date().getTime() / 1000) > timeout;
}

class IdServiceClient {
  constructor() {}

  initialize(base_url, signing_key) {
    this.signing_key = signing_key;
    this.base_url = base_url;
    this.ws = new WebSocketConnection(this.base_url,
                                      null,
                                      this.signing_key,
                                      "toshi-app-js");
    this.ws.connect();
  }

  _getUrl(path) {
    return this.base_url + path;
  }

  getUser(token_id) {
    if (cached_users[token_id] && cache_is_valid(cached_users[token_id].timestamp)) {
      return Promise.resolve(cached_users[token_id].user);
    }
    return fetch({
      url: this._getUrl('/v1/user/' + token_id),
      json: true
    }).then((user) => {
      cached_users[token_id] = {timestamp: new Date().getTime() / 1000, user: user};
      if (user.payment_address) {
        cached_users_pa[user.payment_address] = cached_users_pa[token_id];
      }
      return user;
    }).catch((err) => {
      Logger.error(err);
      return null;
    });
  }

  paymentAddressReverseLookup(address) {
    if (cached_users_pa[address] && cache_is_valid(cached_users_pa[address].timestamp)) {
      return Promise.resolve(cached_users_pa[address].user);
    }
    return fetch({
      url: this._getUrl('/v1/search/user?payment_address=' + address),
      json: true
    }).then((body) => {
      cached_users_pa[address] = {timestamp: new Date().getTime() / 1000, user: null};
      let user = null;
      if (body.results.length > 0) {
        user = body.results[0];
        cached_users_pa[address].user = user;
        cached_users[user.token_id] = cached_users_pa[address];
      }
      return user;
    }).catch((err) => {
      Logger.error(err);
      return null;
    });
  }
}

module.exports = new IdServiceClient();
