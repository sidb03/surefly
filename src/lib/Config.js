const url = require('url');
const fs = require('fs');
const yaml = require('js-yaml');
const Wallet = require('./Wallet');

const required_keys = ['storage', 'redis']

class Config {
  constructor(path) {
    let config = yaml.safeLoad(fs.readFileSync(path, 'utf8'));
    for(let k in config) this[k]=config[k];

    for(let k of required_keys) {
      if (!this[k]) {
        throw new Error(`Missing 'storage' property in config file: ${path}`);
      }
    }
    if (this.storage.url) { this.storageUrl = this.storage.url; }
    if (this.storage.envKey) { this.storageUrl = process.env[this.storage.envKey]; }
    if (this.redis.uri) { this.redisUrl = this.redis.uri; }
    if (this.redis.envKey) { this.redisUrl = process.env[this.redis.envKey]; }
    if (!this.seedMnemonic) { this.seedMnemonic = process.env.TOSHI_APP_SEED || process.env.TOKEN_APP_SEED; }

    if (!this.seedMnemonic) {
      throw new Error(`Missing 'seedMnemonic' in config file: ${path}, or as environment variable TOSHI_APP_SEED`);
    }

    if ((this.seedMnemonic.startsWith('"') && this.seedMnemonic.endsWith('"')) || (this.seedMnemonic.startsWith("'") && this.seedMnemonic.endsWith("'"))) {
      this.seedMnemonic = this.seedMnemonic.substring(1, this.seedMnemonic.length - 1);
    }
    if (!/^[a-z ]+$/.exec(this.seedMnemonic)) {
      throw new Error(`Invalid seedMnemonic`);
    }

    let wallet = new Wallet(this.seedMnemonic);
    this.identityKey = wallet.derive_path("m/0'/1/0");
    this.paymentKey = wallet.derive_path("m/44'/60'/0'/0/0");
    this.tokenIdAddress = this.identityKey.address;
    this.paymentAddress = this.paymentKey.address;
  }

  set storageUrl(s) {
    if (s.startsWith('postgres://') || s.startsWith('postgresql://')) {
      this.storage.postgres = {url: s};
      // if sslmode is in the postgres URL prefer that
      let sslmode = /^.*sslmode=([^&]+).*$/.exec(s);
      if (sslmode) {
        this.storage.sslmode = sslmode[1];
      }
    } else if (s.startsWith('sqlite://')) {
      this.storage.sqlite = {url: s};
    } else {
      this.storage = {url: s};
    }
  }

  set redisUrl(s) {
    let uri = url.parse(s);
    if (uri.protocol && uri.protocol == 'redis:') {
      this.redis.host = uri.hostname;
      this.redis.port = uri.port;
      if (uri.auth && uri.auth.indexOf(':') > -1) {
        this.redis.password = uri.auth.split(':')[1];
      }
    }
  }
}

module.exports = Config;
