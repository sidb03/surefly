const SOFAObject = require("../SOFAObject.js");

class Command extends SOFAObject {
  get display() {
    return this.content.body;
  }
}

module.exports = Command;
