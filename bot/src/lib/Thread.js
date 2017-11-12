class Thread {
  constructor(bot) {
    this.bot = bot;
    this.hearings = [];
    this.onOpen = null;
    this.onClose = null;
    this.states = {};
  }

  open(session) {
    if (this.onOpen) { this.onOpen(session) }
  }

  close(session) {
    if (this.onClose) { this.onClose(session) }
  }

  hear(pattern, stateName, cb) {
    this.hearings.push({pattern: pattern, state: stateName, callback: cb});
  }

  state(name) {
    if (!this.states.hasOwnProperty(name)) {
      this.states[name] = {
        hear: (pattern, cb) => {
          this.hear(pattern, name, cb);
        }
      }
    }
    return this.states[name];
  }

  onClientMessage(session, message) {
    let match;
    for (let hearing of this.hearings) {
      let rx = new RegExp(hearing.pattern);
      match = rx.exec(message.string);
      let stateMatch = hearing.state ? session.state == hearing.state : true
      if (match && stateMatch) {
        hearing.callback(session, message);
        return true;
      }
    }
    return false;
  }
}

module.exports = Thread;
