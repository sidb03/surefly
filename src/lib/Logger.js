const wrap = require('word-wrap');
const chalk = require('chalk');
const BN = require('bn.js');

process.on('unhandledRejection', err => Logger.error(err));

// NOTE: If these things also depend on Logger they get caught in a dependency loop,
// this is a hacky way to break that loop
let Fiat;
let IdService;
let unit;
setTimeout(() => {
  Fiat = require('./Fiat');
  IdService = require('./IdService');
  unit = require('./unit');
});


chalk.enabled = true;

function mapLines(s, f) {
  if (s == null) { s = "null" }
  return s.split('\n').map(f)
}

const _log_levels = {
  'DEBUG': 10,
  'INFO': 20,
  'WARN': 30,
  'WARNING': 30,
  'ERROR': 40,
  'FATAL': 50,
  'CRITICAL': 50,
  'OFF': 100
};

const LOG_LEVEL = _log_levels[process.env['LOG_LEVEL'] || 'INFO'];
const ENABLE_TIMESTAMPS = process.env['ENABLE_LOG_TIMESTAMPS'] == "1";

function formatName(user) {
  if (!user) {
    return "<Unknown>";
  } else if (user.name) {
    return user.name + " (@" + user.username + ")";
  } else if (user.username) {
    return "@" + user.username;
  } else {
    return "<Unknown>";
  }
}

function getPrefix(k) {
  if (ENABLE_TIMESTAMPS) {
    return '[' + k + ': ' + (new Date().toISOString()) + '] ';
  } else {
    return '[' + k + '] ';
  }
}

class Logger {

  static sentMessage(sofa, user, fiat) {
    if (!sofa) return Logger.error("Tried to send invalid SOFA message");
    // prepare defaults for promise based inputs
    if (typeof user == 'string') { return IdService.getUser(user).then((user) => { Logger.sentMessage(sofa, user, fiat); }); }
    if (sofa.type == 'PaymentRequest' && !fiat) { return Fiat.fetch().then((fiat) => { Logger.sentMessage(sofa, user, fiat); }); }

    // actual logging
    Logger.info(Logger.color('\u21D0  ', "Sent '" + sofa.type + "' to " + formatName(user), chalk.green));
    if (sofa.type == 'Message') {
      Logger.info(Logger.color('\u21D0  ', sofa.display, chalk.green));
    } else if (sofa.type == 'PaymentRequest') {
      Logger.info(Logger.color('\u21D0  ', "To address:  " + sofa.destinationAddress, chalk.green));
      Logger.info(Logger.color('\u21D0  ', "Value (USD): $" + fiat.USD.fromEth(unit.fromWei(sofa.value, 'ether')), chalk.green));
      Logger.info(Logger.color('\u21D0  ', "Value (ETH): " + unit.fromWei(sofa.value, 'ether'), chalk.green));
    } else {
      Logger.info(Logger.colorPrefix('\u21D0  ', wrap(sofa.string, {width: 60, cut: true}), chalk.green, chalk.grey));
    }
    Logger.info('\n');
  }

  static receivedMessage(sofa, user) {
    if (!sofa) return Logger.error("Received invalid SOFA message");
    // prepare defaults for promise based inputs
    if (typeof user == 'string') { return IdService.getUser(user).then((user) => { Logger.receivedMessage(sofa, user); }); }

    // actual logging
    Logger.info(Logger.color('\u21D2  ', "Received '" + sofa.type + "' from " + formatName(user), chalk.yellow));
    if (sofa.type == 'Message') {
      Logger.info(Logger.color('\u21D2  ', sofa.display, chalk.yellow));
    } else {
      Logger.info(Logger.colorPrefix('\u21D2  ', wrap(sofa.string, {width: 60, cut: true}), chalk.yellow, chalk.grey));
    }
    Logger.info('\n');
  }

  static receivedPaymentUpdate(sofa, user, direction) {
    if (typeof user == 'string') { return IdService.getUser(user).then((user) => { Logger.receivedPaymentUpdate(sofa, user, direction); }); }
    let icon;
    let header;
    let colour;
    if (direction == "in") {
      icon = "\u21D2";
      header = "Received From: ";
      colour = chalk.yellow;
    } else {
      icon = "\u21D0";
      header = "Sent To:       ";
      colour = chalk.green;
    }
    let name = formatName(user);

    Fiat.fetch().then((fiat) => {
      Logger.info(Logger.color(icon + '  ', "Payment Update", colour));
      Logger.info(Logger.color(icon + '  ', header + name, colour));
      Logger.info(Logger.color(icon + '  ', "Status:        " + sofa.status, colour));
      Logger.info(Logger.color(icon + '  ', "Value (USD):   $" + fiat.USD.fromEth(unit.fromWei(sofa.value, 'ether')), colour));
      Logger.info(Logger.color(icon + '  ', "Value (ETH):   " + unit.fromWei(sofa.value, 'ether'), colour));
    });
  }

  static color(prefix, message, color) {
    let lines = mapLines(message, (x) => { return color(prefix + x) });
    return lines.join('\n');
  }

  static colorPrefix(prefix, message, color, color2) {
    let lines = mapLines(message, (x) => { return color(prefix) + color2(x) });
    return lines.join('\n');
  }

  static debug(message) {
    if (LOG_LEVEL <= _log_levels['DEBUG']) {
      console.log(Logger.color(getPrefix('D'), message, chalk.green));
    }
  }

  static info(message) {
    if (LOG_LEVEL <= _log_levels['INFO']) {
      console.info(Logger.color(getPrefix('I'), message, chalk.green));
    }
  }

  static warning(message) {
    if (LOG_LEVEL <= _log_levels['WARN']) {
      console.warn(Logger.color(getPrefix('W'), message, chalk.yellow));
    }
  }

  static error(message) {
    if (message && message.stack) { message = message.stack }
    if (LOG_LEVEL <= _log_levels['ERROR']) {
      console.error(Logger.color(getPrefix('E'), message, chalk.red));
    }
  }

}

module.exports = Logger;
