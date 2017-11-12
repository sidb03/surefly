const Client = require('./Client');
const Thread = require('./Thread');
const SOFA = require('sofa-js');

class Bot {
  constructor() {
    this.client = new Client(this);
    this.rootThread = new Thread(this);
    for (let [name, schema] of Object.entries(SOFA.schemas)) {
      let handlerName = "on" + name;
      this[handlerName] = function(cb) {
        let pattern = "SOFA::"+name+":";
        this.rootThread.hear(pattern, null, cb);
      };
    }
    this.threads = {};
  }

  thread(name) {
    if (!this.threads.hasOwnProperty(name)) {
      this.threads[name] = new Thread(this);
    }
    return this.threads[name];
  }

  hear(pattern, cb) {
    this.rootThread.hear(pattern, null, cb);
  }

  onClientMessage(session, message) {
    if (this.onEvent) {
      this.onEvent(session, message);
    }
    let heard = false;
    if (session.thread) {
      heard = session.thread.onClientMessage(session, message);
    }
    if (!heard) {
      heard = this.rootThread.onClientMessage(session, message);
    }
    return heard;
  }
}

module.exports = Bot;
