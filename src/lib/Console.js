const readline = require('readline');
const redis = require('redis');
const SOFA = require('sofa-js');
const Config = require('./Config');
const Writable = require('stream').Writable;

const JSONRPC_VERSION = '2.0';
const JSONRPC_REQUEST_CHANNEL = '_rpc_request';
const JSONRPC_RESPONSE_CHANNEL = '_rpc_response';

let mutableStdout = new Writable({
  write: function(chunk, encoding, callback) {
    if (!this.muted)
      process.stdout.write(chunk, encoding);
    callback();
  }
});
mutableStdout.muted = true;

class Console {
  constructor(address) {
    this.config = new Config(process.argv[2]);
    this.address = address

    this.rl = readline.createInterface({
      input: process.stdin,
      output: mutableStdout,
      terminal: true
    });

    this.rl.setPrompt(this.address+'> ');

    this.channelName = this.config.tokenIdAddress
    let redisConfig = {
      host: this.config.redis.host,
      port: this.config.redis.port,
      password: this.config.redis.password
    }

    this.subscriber = redis.createClient(redisConfig);
    this.rpcSubscriber = redis.createClient(redisConfig);
    this.publisher = redis.createClient(redisConfig);

    this.subscriber.on("message", (channel, message) => {
      try {
        let wrapped = JSON.parse(message);
        if (wrapped.recipient == this.address) {
          let sofa = SOFA.parse(wrapped.sofa);
          process.stdout.clearLine();
          process.stdout.cursorTo(0);
          console.log('bot> '+sofa.string)
          prompt()
        }
      } catch(e) {
        console.log("On Message Error: " + e);
      }
    });
    this.subscriber.subscribe(this.channelName);
  }

  send(message) {
    if (typeof message === "string") {
      message = SOFA.Message({body: message})
    }
    this.publisher.publish(this.config.tokenIdAddress, JSON.stringify({
      sofa: message.string,
      sender: this.config.tokenIdAddress,
      recipient: session.address
    }));
  }

  run() {
    prompt();
    this.rl.on('line', (line) => {
        if (line === "/quit") {
          this.rl.close();
        } else {
          var message = JSON.stringify({
            sofa: SOFA.Message({body: line}).string,
            sender: this.address,
            recipient: this.config.tokenIdAddress
          });
          this.publisher.publish(this.channelName, message);
        }
        prompt();
    }).on('close',function(){
        process.exit(0);
    });
  }
}


let c = new Console("user")

function prompt() {
  mutableStdout.muted = false;
  c.rl.prompt();
  mutableStdout.muted = true;
}

c.run()
