const url = require('url');
const pg = require('pg');
const sqlite3 = require('sqlite3');
const Logger = require('./Logger');

// Storage Interface
class StorageInterface {
  constructor(config) {
  }

  // all functions should return a promise

  // load's the bot session for the given address
  // session should be passed as the first argument
  // to the callback function provided
  loadBotSession(address) {}

  // create a new, or update an existing bot seesion
  // for the given address.
  updateBotSession(address, data) {}

  // discard the bot session for the given address
  removeBotSession(address) {}

  // generic key/value store
  setKey(key, value) {}
  getKey(key) {}

}

function parse_psql_url(u) {
  let params = url.parse(u);
  let auth = params.auth.split(':');
  return {
    user: auth[0],
    password: auth[1],
    host: params.hostname,
    port: params.port,
    database: params.pathname.split('/')[1],
    max: 5,
    idleTimeoutMillis: 30000
  };
}

function get_type(value) {
  if (typeof value == 'object') {
    return 'json'
  }
  if (typeof value == 'number') {
    if (value % 1 === 0) {
      return 'int'
    } else {
      return 'float'
    }
  }
  return 'string'
}

class PSQLStore {

  constructor(config, sslmode, schema) {
    if (typeof config === 'object') {
      if (config.url) {
        config = parse_psql_url(config.url);
      }
    } else if (typeof config === 'string') {
      config = parse_psql_url(config);
    }
    this.config = config;
    if (sslmode == 'require') {
      this.config.ssl = sslmode;
    }
    this.schema = schema || "development";
    this.pgPool = new pg.Pool(this.config);
    this.pgPool.on('error', function (err, client) {
      console.error('idle client error', err.message, err.stack)
    });
  }

  _execute(query, args, cb) {
    this.pgPool.connect((err, client, done) => {
      if (err) { return cb(err) }
      client.query(query, args, (err, result) => {
        done(err);
        if (err) { return cb(err) }
        cb(null, result);
      })
    })
  }


  loadBotSession(address) {
    return new Promise((fulfill, reject) => {
      this._execute("SELECT * from " + this.schema + ".bot_sessions WHERE eth_address = $1", [address], (err, result) => {
        if (err) { Logger.error(err) }
        if (!err && result.rows.length > 0) {
          fulfill(result.rows[0].data);
        } else {
          fulfill({
            address: address
          });
        }
      });
    });
  }

  updateBotSession(address, data) {
    let query = `INSERT INTO ${this.schema}.bot_sessions (eth_address, data)
                 VALUES ($1, $2)
                 ON CONFLICT (eth_address) DO UPDATE
                 SET data = $2`;
    return new Promise((fulfill, reject) => {
      this._execute(query, [address, data], (err, result) => {
        if (err) { Logger.error(err); reject(err); }
        else { fulfill(); }
      });
    });
  }

  removeBotSession(address) {
    return new Promise((fulfill, reject) => {
      this._execute("DELETE from " + this.schema + ".bot_sessions WHERE eth_address = $1", [address], (err, result) => {
        if (err) { Logger.error(err); reject(err); }
        else { fulfill(); }
      });
    });
  }

  setKey(key, value) {
    let type = get_type(value);
    if (type == 'json') {
      value = JSON.stringify(value);
    } else {
      value = value.toString();
    }

    let query = `INSERT INTO ${this.schema}.key_value_store (key, value, type)
                 VALUES ($1, $2, $3)
                 ON CONFLICT (key) DO UPDATE
                 SET value = $2, type = $3`;
    return new Promise((fulfill, reject) => {
      this._execute(query, [key, value, type], (err, result) => {
        if (err) { Logger.error(err); reject(err); }
        else { fulfill(); }
      });
    });
  }

  getKey(key) {
    return new Promise((fulfill, reject) => {
      this._execute("SELECT * FROM " + this.schema + ".key_value_store WHERE key = $1", [key], (err, result) => {
        if (err) { Logger.error(err); }
        if (result && result.rows.length > 0) {
          result = result.rows[0];
          if (result.type == 'json') {
            fulfill(JSON.parse(result.value));
          }
          else if (result.type == 'float') {
            fulfill(parseFloat(result.value));
          } else if (result.type == 'int') {
            fulfill(parseInt(result.value));
          } else {
            fulfill(result.value);
          }
        } else {
          fulfill(null);
        }
      });
    });
  }

}

function parse_sqlite_url(u) {
  if (u === 'sqlite://') {
    return {file: ':memory:'};
  } else {
    let p = u.slice(9);
    if (p[0] == '/') {
      p = p.slice(1);
    }
    return {file: p};
  }
}

class SqliteStore {

  constructor(config) {
    if (typeof config === 'object') {
      if (config.url) {
        config = parse_sqlite_url(config.url);
      }
    } else if (typeof config === 'string') {
      config = parse_sqlite_url(config);
    }
    this.config = config;
    this.db = new sqlite3.Database(this.config.file);
  }

  loadBotSession(address) {
    return new Promise((fulfill, reject) => {
      this.db.get("SELECT * from bot_sessions WHERE eth_address = ?", [address], (err, result) => {
        if (err) { Logger.error(err); }
        if (!err && result && result.data) {
          result = JSON.parse(result.data);
        } else {
          result = {
            address: address
          };
        }
        fulfill(result);
      });
    });
  }

  updateBotSession(address, data) {
    data = JSON.stringify(data);
    return new Promise((fulfill, reject) => {
      this.db.get("SELECT 1 FROM bot_sessions WHERE eth_address = ?", [address], (err, result) => {
        if (err) { Logger.error(err); reject(err); }
        else if (result) {
          // update
          this.db.run("UPDATE bot_sessions SET data = ? WHERE eth_address = ?", [data, address], (err, result) => {
            if (err) { Logger.error(err); reject(err); }
            else { fulfill(); }
          });
        } else {
          // insert
          this.db.run("INSERT INTO bot_sessions (eth_address, data) VALUES (?, ?)", [address, data], (err, result) => {
            if (err) { Logger.error(err); }
            else { fulfill(); }
          });
        }
      });
    });
  }

  removeBotSession(address, callback) {
    return new Promise((fulfill, reject) => {
      this.db.run("DELETE from bot_sessions WHERE eth_address = ?", [address], (err, result) => {
        if (err) { Logger.error(err); reject(err); }
        else { fulfill(); }
      });
    });
  }

  setKey(key, value) {
    let type = get_type(value);
    if (type == 'json') {
      value = JSON.stringify(value);
    } else {
      value = value.toString();
    }

    return new Promise((fulfill, reject) => {
      this.db.get("SELECT 1 FROM key_value_store WHERE key = ?", [key], (err, result) => {
        if (err) { Logger.error(err); reject(err); }
        else if (result) {
          this.db.run("UPDATE key_value_store SET value = ?, type = ? WHERE key = ?", [value, type, key], (err, result) => {
            if (err) { Logger.error(err); reject(err); }
            else { fulfill(); }
          });
        } else {
          this.db.run("INSERT INTO key_value_store (key, value, type) VALUES (?, ?, ?)", [key, value, type], (err, result) => {
            if (err) { Logger.error(err); reject(err); }
            else { fulfill(); }
          });
        }
      });
    });
  }

  getKey(key) {
    return new Promise((fulfill, reject) => {
      this.db.get("SELECT * FROM key_value_store WHERE key = ?", [key], (err, result) => {
        if (err) { Logger.error(err); }
        if (result) {
          if (result.type == 'json') {
            fulfill(JSON.parse(result.value));
          }
          else if (result.type == 'float') {
            fulfill(parseFloat(result.value));
          } else if (result.type == 'int') {
            fulfill(parseInt(result.value));
          } else {
            fulfill(result.value);
          }
        } else {
          fulfill(null);
        }
      });
    });
  }
}


module.exports = {
  PSQLStore: PSQLStore,
  SqliteStore: SqliteStore,
  parse_psql_url: parse_psql_url,
  parse_sqlite_url: parse_sqlite_url
}
