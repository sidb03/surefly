var bip39 = require('bip39');
const elliptic = require('elliptic');
var hash = require('hash.js')
const keccak256 = require('js-sha3').keccak_256;
const secp256k1 = new (elliptic.ec)('secp256k1');

function bnToBuffer(bn, len) {
  let buf1 = bn.toBuffer();
  if (buf1.length == len) {
    return buf1;
  } else if (buf1.length > len) {
    throw new Error("bn is too large to fit into requested length");
  } else {
    let buf2 = new Buffer(len).fill(0);
    buf1.copy(buf2, 32 - buf1.length);
    return buf2;
  }
}

class Wallet {
  constructor(mnemonic, path) {
    let seed = bip39.mnemonicToSeedHex(mnemonic);
    let hmac = hash.hmac(hash.sha512, "Bitcoin seed");
    hmac.update(seed, 'hex');
    let digest = hmac.digest();
    let keypair = secp256k1.keyFromPrivate(digest.slice(0, 32));
    let chaincode = digest.slice(32);
    this._cache = {};
    this._root = {
      keypair: keypair,
      chaincode: chaincode
    };
  }

  derive_path(path) {
    if (!this._cache[path]) {
      let path_elements = path.split('/');
      let keypair = this._root.keypair;
      let chaincode = this._root.chaincode;
      for (var i = 0; i < path_elements.length; i++) {
        var hardened = false;
        var n;
        if (path_elements[i] == 'm') continue;
        let curpath = path_elements.slice(0, i + 1).join('/');
        if (this._cache[curpath]) {
          keypair = this._cache[curpath].keypair;
          chaincode = this._cache[curpath].chaincode;
          continue;
        }
        if (path_elements[i].endsWith("'") || path_elements[i].endsWith("h")) {
          hardened = true;
          n = parseInt(path_elements[i].split("'")[0]);
        } else {
          n = parseInt(path_elements[i]);
        }
        let hmac = hash.hmac(hash.sha512, chaincode);
        if (hardened) {
          hmac.update([0]);
          hmac.update(bnToBuffer(keypair.getPrivate(), 32));
          hmac.update(hash.utils.split32([n + (1 << 31)], 'big'));
        } else {
          let pubkey = keypair.getPublic().encode('', true);
          hmac.update(pubkey);
          hmac.update(hash.utils.split32([n], 'big'));
        }
        let digest = hmac.digest();
        let priv = secp256k1.keyFromPrivate(digest.slice(0, 32)).getPrivate();
        // add_assign
        priv = priv.add(keypair.getPrivate()).mod(secp256k1.curve.n);
        keypair = secp256k1.keyFromPrivate(bnToBuffer(priv, 32));
        chaincode = digest.slice(32);
        this._cache[curpath] = {
          keypair: keypair,
          chaincode: chaincode
        };
      }
    }
    return new PrivateKey(this._cache[path].keypair);
  }
}

class PrivateKey {
  constructor(keypair) {
    this.keypair = keypair
  }

  get address() {
    if (!this._address) {
      this._address = keccak256.array(this.keypair.getPublic().encode('', false).slice(1)).slice(12, 32);
    }
    return "0x" + hash.utils.toHex(this._address);
  }

  sign(data) {
    let datahash = keccak256(data);
    let sig = this.keypair.sign(datahash, { canonical: true });
    return "0x" +
      hash.utils.toHex(bnToBuffer(sig.r, 32)) +
      hash.utils.toHex(bnToBuffer(sig.s, 32)) +
      hash.utils.toHex([sig.recoveryParam]);
  }
}

module.exports = Wallet;
