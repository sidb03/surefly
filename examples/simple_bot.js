const SOFA = require('sofa-js');
const Fiat = require('./lib/Fiat')
const Bot = require('./lib/Bot');

let bot = new Bot();

bot.onEvent = function(session, message) {
  switch (message.type) {
    case "Message":
      onMessage(session, message);
      break;
    case "Command":
      onCommand(session, message);
      break;
    case "PaymentRequest":
      onPaymentRequest(session, message);
      break;
  }
}


function onMessage(session, message) {
  //if message body contains the word beg, request a payment
  if (message.content.body.includes('beg')) {
    session.requestEth(3.5, 'I need about tree fiddy')
    return
  }

  //if it contains the word ethlogo, send an image message
  if (message.content.body.includes('ethlogo')) {
    session.reply(SOFA.Message({
      body: "Here is your logo",
      attachments: [{
        "type": "image",
        "url": "ethereum.jpg"
      }]
    }))
    return
  }

  //if it contains a known fiat currency code, send the ETH conversion
  if (Object.keys(Fiat.rates).indexOf(message.content.body) > -1) {
    Fiat.fetch().then((toEth) => {
      session.reply('1 ETH is worth ' + toEth[message.content.body]() + ' ' + message.content.body)
    })
    return
  }

  //otherwise send a default prompt
  sendColorPrompt(session, "I only want to talk about my favorite color. Guess what it is!");
}


function sendColorPrompt(session, body) {
  session.reply(SOFA.Message({
    body:  body,
    controls: [
      {type: "button", label: "Red", value: "red"},
      {type: "button", label: "Green", value: "green"},
      {type: "button", label: "Blue", value: "blue"}
    ],
    showKeyboard: false
  }));
}


function onCommand(session, command) {
  if (command.content.value === "red") {
    session.reply("Yep! Red is the best");
  } else {
    sendColorPrompt(session, "Nope! Try again.");
  }
}


function onPaymentRequest(session, message) {
  //fetch fiat conversion rates
  Fiat.fetch().then((toEth) => {
    let limit = toEth.USD(100)
    if (message.ethValue < limit) {
      session.sendEth(message.ethValue, (session, error, result) => {
        if (error) { session.reply('I tried but there was an error') }
        if (result) { session.reply('Here you go!') }
      })
    } else {
      session.reply('Sorry, I have a 100 USD limit.')
    }
  })
  .catch((error) => {
    session.reply('Sorry, something went wrong while I was looking up exchange rates')
  })
}
