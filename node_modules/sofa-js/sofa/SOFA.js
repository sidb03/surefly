const path = require('path');
const fs = require('fs');
const glob = require("glob");
const SOFAObject = require("./SOFAObject.js");
const unit = require('ethjs-unit');

const extendedTypes = {
  "Message": require("./types/Message.js"),
  "Command": require("./types/Command.js"),
  "Payment": require("./types/Payment.js"),
  "PaymentRequest": require("./types/PaymentRequest.js")
};

class SOFA  {
  constructor() {
    this.schemas = {};
    let root = path.resolve(__dirname, '../vendor/sofa-spec/schema');
    let schemaPaths = glob.sync(path.join(root,'*.json'));
    for (let schemaPath of schemaPaths) {
      let name = path.basename(schemaPath, '.json');
      let schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
      this.addSchema(name, schema);
    }
  }

  addSchema(name, schema) {
    this.schemas[name] = schema;
    let cls = extendedTypes[name] || SOFAObject;
    this[name] = function(content) {
      if (content) {
        return new cls(name, schema, content);
      } else {
        return "SOFA::"+name+":";
      }
    }
  }

  parse(s) {
    let sofaRx = new RegExp(/^\s*SOFA::(\w+):({.+})/g);
    let match = sofaRx.exec(s);
    if (!match || !match[1] || !match[2]) { return null }
    let name = match[1];
    let content = JSON.parse(match[2]);
    if (!this[name]) {
      console.log(name + ' is not a valid SOFA type');
      return null;
    }
    return this[name](content);
  }
}

module.exports = new SOFA();
