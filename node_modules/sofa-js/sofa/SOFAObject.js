const Ajv = require('ajv');

class SOFAObject {
  constructor(name, schema, content) {
    this.preprocess(content);
    this.name = name;
    this.schema = schema;
    this.content = content;
    for (let [k,v] of Object.entries(content)) {
      if (!this.hasOwnProperty(k)) { this[k] = v; }
    }

    let ajv = new Ajv();
    this.validate = ajv.compile(schema);
    var valid = this.validate(content);
    if (!valid) console.log(ajv.errorsText());
  }

  preprocess(content) {
    //noop
  }

  get type() {
    return this.name;
  }

  get json() {
    return JSON.stringify(this.content);
  }

  get prefix() {
    return 'SOFA::'+this.name+':'
  }

  get string() {
    return this.prefix + this.json;
  }

  get display() {
    return this.string;
  }
}

module.exports = SOFAObject;
