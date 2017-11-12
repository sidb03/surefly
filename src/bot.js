const Bot = require('./lib/Bot')
const SOFA = require('sofa-js')
const Fiat = require('./lib/Fiat')

let bot = new Bot()

// ROUTING

bot.onEvent = function(session, message) {
  switch (message.type) {
    case 'Init':
      welcome(session)
      break
    case 'Message':
      onMessage(session, message)
      break
    case 'Command':
      onCommand(session, message)
      break
    case 'Payment':
      onPayment(session, message)
      break
    case 'PaymentRequest':
      welcome(session)
      break
  }
}

const STATES = {
  welcome: 'WELCOME',
  waitingForBooking: 'WAITING_FOR_BOOKING',
  waitingForInsuranceAmount: 'WAITING_FOR_INSURANCE_AMOUNT',
  waitingForLocation: 'WAITING_FOR_LOCATION',
  waitingForContract: 'WAITING_FOR_CONTRACT'
}

function onMessage(session, message) {
  switch (session.get('app_state')) {
    case (STATES.waitingForBooking):
      session.set('booking_no', message.body)
      console.log("BOOKING_NO: ", session.get('booking_no'));
      break;
    case (STATES.waitingForInsuranceAmount):
      if (isNaN(message.body)) {
        session.set('app_state', STATES.waitingForBooking)
        session.reply('Its not a valid number');
        break
      }
      session.set('insurance_amount', message.body)
      console.log("INSURANCE_AMOUNT: ", session.get('insurance_amount'));
      break;
    case (STATES.waitingForLocation):
      session.set('current_location', message.body)
      console.log("CURRENT_LOCATION: ", session.get('current_location'));
      break;
    default:
      return true
  }
  handleInsurance(session)
}

function onCommand(session, command) {
  switch (command.content.value) {
    case 'insure':
      handleInsurance(session)
      break
    case 'pay':
      pay(session)
      break;
    // case 'count':
    //   count(session)
    //   break
    // case 'donate':
    //   donate(session)
    //   break
    // }
}

function processPayment(session) {
  let controls = [
    {type: 'button', label: 'Pay', value: 'pay'}
  ]
  session.reply(SOFA.Message({
    body: 'Pay the premium now',
    controls: controls,
    showKeyboard: false,
  }))
}

function pay(session) {
  const amount = session.get('insurance_amount')
  if (amount < session.eth.getBalance(session.user.address)) {
    Fiat.fetch().then((toEth) => {
      session.requestEth(toEth.USD(amount))
    })
  }
}

function onPayment(session, message) {
  if (message.fromAddress == session.config.paymentAddress) {
    // handle payments sent by the bot
    if (message.status == 'confirmed') {
      // perform special action once the payment has been confirmed
      // on the network
    } else if (message.status == 'error') {
      // oops, something went wrong with a payment we tried to send!
    }
  } else {
    // handle payments sent to the bot
    if (message.status == 'unconfirmed') {
      // payment has been sent to the ethereum network, but is not yet confirmed
      sendMessage(session, `Thanks for the payment! 🙏`);
    } else if (message.status == 'confirmed') {
      // handle when the payment is actually confirmed!
    } else if (message.status == 'error') {
      sendMessage(session, `There was an error with your payment!🚫`);
    }
  }
}

// STATES

function welcome(session) {
  session.set('app_state', STATES.welcome);
  sendMessage(session, `Hello ${session.user.custom.name}!, welcome to SureFly`);
}

function handleInsurance(session) {
  switch (session.get('app_state')) {
    case (STATES.welcome) :
      session.reply('Please enter your booking number:');
      session.set('app_state', STATES.waitingForBooking);
      break;
    case (STATES.waitingForBooking):
      session.reply('Your ticket amount is: $50. Enter the amount you want to insure:');
      session.set('app_state', STATES.waitingForInsuranceAmount)
      break;
    case (STATES.waitingForInsuranceAmount):
      if (insurance_amount >= 50)
      {session.reply('Your insurance amount cannot exceed ticket price. Please Re-enter')
        session.set('app_state', STATES.waitingForInsuranceAmount)}
      session.reply('Enter your current location');
      session.set('app_state', STATES.waitingForLocation)
      break;
    case (STATES.waitingForLocation):
      session.reply('Hold on, your insurance contract is being created....')
      session.set('app_state', STATES.waitingForContract)
      processPayment(session)
  }
}

// example of how to store state on each user
function count(session) {
  let count = (session.get('count') || 0) + 1
  session.set('count', count)
  sendMessage(session, `${count}`)
}

function donate(session) {
  // request $1 USD at current exchange rates
  Fiat.fetch().then((toEth) => {
    session.requestEth(toEth.USD(1))
  })
}

// HELPERS

function sendMessage(session, message) {
  let controls = [
    {type: 'button', label: 'Get Insurance', value: 'insure'}
  ]
  session.reply(SOFA.Message({
    body: message,
    controls: controls,
    showKeyboard: false,
  }))
}
