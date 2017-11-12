const WebSocket = require('ws');
const Agent = require('https').Agent;

class WebSocketConnection {

  constructor(httpUri, fingerprint, signingKey, userAgent) {
    this.signingKey = signingKey;
    this.fingerprint = fingerprint;
    this.userAgent = userAgent;
    this.attempts = 0;
    this.connected = false;
    this.wsUri = httpUri
      .replace("https://", "wss://")
      .replace("http://", "ws://") +
      "/v1/ws";

    this.outgoingRequests = {};
    this.incomingRequests = [];
    this.reconnectCallbacks = [];
    this.callbacks = [];
    this.jsonrpcId = 1;
    this.wasConnected = false;
  }

  connect() {
    let timestamp = parseInt(Date.now() / 1000);
    let data = "GET" + "\n" +
        "/v1/ws" + "\n" +
        timestamp + "\n";
    let signature = this.signingKey.sign(data);
    let options = {
      headers: {
        'Toshi-ID-Address': this.signingKey.address,
        'Toshi-Timestamp': timestamp,
        'Toshi-Signature': signature,
        'User-Agent': this.userAgent
      }
    };
    if (this.fingerprint) {
      Object.assign({
        agent: new Agent({
          maxCachedSessions: 0
        }),
        rejectUnauthorized: true
      }, options);
    }
    this.ws = new WebSocket(this.wsUri,
                            options);
    if (this.fingerprint) {
      let self = this;
      self.has_connected_once = false;
      let req = this.ws._req;
      req.on('socket', (socket) => {
        socket.on('secureConnect', (x) => {
          let fingerprint = socket.getPeerCertificate().fingerprint;
          if (!fingerprint) {
            req.emit('error', new Error('Missing expected certificate fingerprint'));
            // there is a weird issue where the certificate stuff
            // sometimes goes missing. this case is so that if there
            // has been a secure connection previously, it will retry
            // until the certificate stuff comes back, but if it's
            // missing the first time, then fail straight away.
            if (!self.has_connected_once) {
              return req.abort();
            }
          }

          // Check if certificate is valid
          if (socket.authorized === false) {
            req.emit('error', new Error(socket.authorizationError));
            return req.abort();
          }

          // Match the fingerprint with our saved fingerprints
          if (self.fingerprint.indexOf(fingerprint) === -1) {
            // Abort request, optionally emit an error event
            req.emit('error', new Error('Fingerprint does not match: ' + self.fingerprint + " != " + fingerprint));
          }

          self.has_connected_once = true;
        });
      });
    }

    this.ws.on('open', () => this.onOpen());
    this.ws.on('close', (code, reason) => this.onClose(code, reason));
    this.ws.on('error', (error) => this.onError(error));
    this.ws.on('message', (data) => this.onMessage(data));
  }

  disconnect() {
    if (this.ws) {
      let ws = this.ws;
      this.connected = false;
      this.ws = null;
      this.wasConnected = false;
      ws.close(1000, "OK");
    }
  }

  onOpen() {
    this.connected = true;
    this.attempts = 0;
    if (this.wasConnected) {
      this.reconnectCallbacks.forEach((cb) => cb());
    } else {
      this.wasConnected = true;
    }
  }

  onClose(code, reason) {
    this.connected = false;

    for (var k in this.outgoingRequests) {
      var promise = this.outgoingRequests[k];
      if (promise) {
        // TODO: check status and reject if it's bad
        promise.reject(new Error("Closed: " + code + ", " + reason));
        delete this.outgoingRequests[k];
      }
    }

    if (this.ws) {
      // try reconnect if the connection wasn't closed on purpose
      this.ws = null;
      this.attempts += 1;
      setTimeout(() => {
        this.connect();
      }, Math.min(this.attempts * 200, 15000));
    }
  }

  onError(error) {
    if (this.ws) {
      this.onClose(1000, "OK");
    }
  }

  onMessage(data) {
    let message = JSON.parse(data);
    if ('method' in message) {
      if (this.callbacks) {
        this.callbacks.forEach((callback) => {
          callback([message.method, message.params]);
        });
      } else if (this.readPromise) {
        this.readPromise.fulfil([message.method, message.params]);
      } else {
        this.incomingRequests.push([message.method, message.params]);
      }
    } else if ('id' in message) {
      let promise = this.outgoingRequests[message.id];
      if (promise) {
        if (message.error) promise.reject(message.error);
        else promise.fulfil(message.result);
        delete this.outgoingRequests[message.id];
      }
    }
  }

  readRequest(timeout) {
    if (this.callbacks) {
      throw new Error("Don't call this when using listen: it doesn't make sense!");
    }
    if (this.incomingRequests.length > 0) {
      let request = this.incomingRequests.shift();
      return Promise.resolve(request);
    }
    if (this.readPromise) {
      // TODO: maybe there's a usecase for this
      throw new Error("Websocket is already being read...");
    }
    return new Promise((fulfil, reject) => {
      let timer = timeout ? setTimeout(() => {
        this.readPromise = null;
        reject(new Error("Timeout exceeded"));
      }, timeout) : null;
      this.readPromise = {fulfil: (value) => {
        this.readPromise = null;
        clearTimeout(timer);
        fulfil(value);
      }, reject: (err) => {
        this.readPromise = null;
        clearTimeout(timer);
        reject(err);
      }};
    });
  }

  sendRequest(method, params, retry) {
    let request = {
      jsonrpc: "2.0",
      id: this.jsonrpcId++,
      method: method,
      params: params
    };
    return new Promise((fulfil, reject) => {
      this.outgoingRequests[request.id] = {fulfil: fulfil, reject: reject};
      this._sendRequest(request, 0);
    });
  }

  _sendRequest(request, retry) {
    // wait until websocket is connected before sending the request
    if (this.ws == null || !this.connected) {
      setTimeout(() => this._sendRequest(request, retry ? retry + 1 : 1),
                 20 * (retry || 0));
    } else {
      this.ws.send(JSON.stringify(request));
    }
  }

  sendResponse(id, result, error) {
    if (this.ws == null || !this.connected) {
      throw new Error("No connection!");
    }
    let response = {
      jsonrpc: "2.0",
      id: id,
    };
    if (result) {
      response.result = result;
    }
    if (error) {
      result.error = error;
    }
    return new Promise((fulfil, reject) => {
      this.ws.send(JSON.stringify(response), (err) => {
        if (err) {
          reject(err);
        } else {
          fulfil();
        }
      });
    });
  }

  listen(callback) {
    this.callbacks.push(callback);
    // empty out any lingering incomming requests
    if (this.incomingRequests.length > 0) {
      let request = this.incomingRequests.shift();
      callback(request);
    }
  }

  onReconnect(callback) {
    this.reconnectCallbacks.push(callback);
  }
}

module.exports = WebSocketConnection;
