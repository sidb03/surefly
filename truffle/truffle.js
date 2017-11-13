require('babel-register');
require('babel-polyfill');


var HDWalletProvider = require("truffle-hdwallet-provider");

var infura_apikey = "2pXkGiKZbgxu7vxJFIFj";
var mnemonic = "virtual you found best cover risk simple cradle idea dwarf rack measure";

module.exports = {
  networks: {
    development: {
      host: "localhost",
      port: 8545,
      network_id: "*" // Match any network id
    },
    ropsten: {
      provider: new HDWalletProvider(mnemonic, "https://ropsten.infura.io/" + infura_apikey),
      network_id: 3
    }
  }
};
