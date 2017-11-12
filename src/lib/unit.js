// patch for https://github.com/ethjs/ethjs-unit/blob/master/src/index.js
// to cause toWei to drop precision from the input value if it's too small
// to make up a single wei

const BN = require('bn.js');

const { unitMap,
        numberToString,
        getValueOfUnit,
        fromWei } = require('ethjs-unit');

function toWei(etherInput, unit) {
  var ether = numberToString(etherInput); // eslint-disable-line
  const base = getValueOfUnit(unit);
  const baseLength = unitMap[unit].length - 1 || 1;

  // Is it negative?
  var negative = (ether.substring(0, 1) === '-'); // eslint-disable-line
  if (negative) {
    ether = ether.substring(1);
  }

  if (ether === '.') { throw new Error(`[ethjs-unit] while converting number ${etherInput} to wei, invalid value`); }

  // Split it into a whole and fractional part
  var comps = ether.split('.'); // eslint-disable-line
  if (comps.length > 2) { throw new Error(`[ethjs-unit] while converting number ${etherInput} to wei, too many decimal points`); }

  var whole = comps[0], fraction = comps[1]; // eslint-disable-line

  if (!whole) { whole = '0'; }
  if (!fraction) { fraction = '0'; }
  if (fraction.length > baseLength) {
    let point = fraction.slice(baseLength);
    console.log(`[ethjs-unit] Warning: ${etherInput} has too many decimal places to convert exactly into wei, dropping ${fraction.length - baseLength} decimal places`);
    fraction = fraction.slice(0, baseLength);
  }

  while (fraction.length < baseLength) {
    fraction += '0';
  }

  whole = new BN(whole);
  fraction = new BN(fraction);
  var wei = (whole.mul(base)).add(fraction); // eslint-disable-line

  if (negative) {
    wei = wei.mul(negative1);
  }

  return new BN(wei.toString(10), 10);
}

module.exports = {
  toWei: toWei,
  fromWei: fromWei,
  unitMap: unitMap
};
