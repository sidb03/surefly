const SOFAObject = require("../SOFAObject.js");

class Message extends SOFAObject {
  get display() {
    let s = this.content.body;
    if (this.content.controls) {
      s += '\n';
      for (let item of this.content.controls) {
        if (item.type == 'button') {
          s += this.renderButton(item);
        } else {
          s += this.renderGroup(item);
        }
      }
    }
    return s;
  }

  renderButton(button) {
    return ' ['+(button.value || button.action)+'] ';
  }

  renderGroup(group) {
    let s = group.label + ': (';
    for (let item of group.controls) {
      s += this.renderButton(item);
    }
    s += ')';
    return s;
  }

}

module.exports = Message;
