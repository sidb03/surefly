const numberToBN = require('number-to-bn');
const SOFAObject = require("../SOFAObject.js");
const unit = require('ethjs-unit');

class Payment extends SOFAObject {
  preprocess(content) {
    this.value = numberToBN(content.value);
    content.value = '0x' + this.value.toString(16);
  }
  get ethValue() {
    return unit.fromWei(this.value, 'ether')
  }
}

module.exports = Payment;
