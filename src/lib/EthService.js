const BN = require('bn.js');
const WebSocketConnection = require('./WebSocketConnection');
const Logger = require('./Logger');
const SOFA = require('sofa-js');
const numberToBN = require('number-to-bn');

function parseHex(string) {
  if (string.startsWith("0x") || string.startsWith("0X")) {
    string = string.slice(2);
  }
  return new BN(string, 'hex');
}

function getTime() {
  return parseInt(Date.now() / 1000);
}

class EthServiceClient {

  constructor() {}

  initialize(base_url, signing_key, walletSigningKey) {
    this.base_url = base_url;
    this.signing_key = signing_key;
    this.walletSigningKey = walletSigningKey;
    this.ws = new WebSocketConnection(this.base_url,
                                      null,
                                      this.signing_key,
                                      "toshi-app-js");
    this.ws.connect();
    this.ws.listen(([method, params]) => {
      if (method == 'subscription') {
        let address = params.subscription;
        if (address in this.subscriptionCallbacks) {
          this.subscriptionCallbacks[address].last_timestamp = getTime();
          this.subscriptionCallbacks[address].callbacks.forEach((callback) => {
            callback(params.message);
          });
        }
      }
    });
    this.subscriptionCallbacks = {};
    this.ws.onReconnect(() => {
      for (let address in this.subscriptionCallbacks) {
        this._resubscribe(address, this.subscriptionCallbacks[address].last_timestamp);
      }
    });
  }

  _resubscribe(address, lastMessageTimestamp) {
    this.ws.sendRequest("subscribe", [address])
      .then(() => {
        this.ws.sendRequest("list_payment_updates", [address, lastMessageTimestamp, getTime()]);
      })
      .catch((err) => Logger.error("error reconnectingto eth service websocket!\n" + err));
  }

  subscribe(address, callback, lastMessageTimestamp) {
    return new Promise((fulfil, reject) => {
      if (address in this.subscriptionCallbacks) {
        this.subscriptionCallbacks[address].callbacks.push(callback);
        fulfil();
      } else {
        this.subscriptionCallbacks[address] = {
          last_timestamp: lastMessageTimestamp || getTime(),
          callbacks: [callback]
        };
        this.ws.sendRequest("subscribe", [address])
          .then((r) => fulfil())
          .catch((err) => reject(err));

      }
      if (lastMessageTimestamp) {
        this.ws.sendRequest("list_payment_updates", [address, lastMessageTimestamp, getTime()]);
      }
    });
  }

  getBalance(address) {
    address = address || this.walletSigningKey.address;
    return new Promise((fulfil, reject) => {
      this.ws.sendRequest("get_balance", [address]).then((result) => {
        let unconfirmed = parseHex(result.unconfirmed_balance);
        let confirmed = parseHex(result.confirmed_balance);
        fulfil([unconfirmed, confirmed]);
      }).catch((err) => reject(err));
    });
  }

  getTransaction(hash) {
    return new Promise((fulfil, reject) => {
      this.ws.sendRequest("get_transaction", [hash]).then((result) => {
        if (result == null) {
          reject(new Error("Transaction not found"));
        } else {
          result.gasPrice = parseHex(result.gasPrice);
          result.gas = parseHex(result.gas);
          result.nonce = parseHex(result.nonce);
          result.value = parseHex(result.value);
          if (result.blockNumber) { result.blockNumber = parseHex(result.blockNumber); }
          fulfil(result);
        }
      }).catch((err) => reject(err));
    });
  }

  get_last_message_timestamp(address) {
    if (this.subscriptionCallbacks[address]) {
      return this.subscriptionCallbacks[address].last_timestamp;
    }
    return null;
  }
}



module.exports = new EthServiceClient();
