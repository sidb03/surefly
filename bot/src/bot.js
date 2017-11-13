const Bot = require('./lib/Bot')
const SOFA = require('sofa-js')
const Fiat = require('./lib/Fiat')

let bot = new Bot()

// ROUTING

bot.onEvent = function (session, message) {
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
  waitingForContract: 'WAITING_FOR_CONTRACT',
  waitingForConfirmation: 'WAITING_FOR_CONFIRMATION',
  pool: 'POOL',
  invest: 'INVEST',
  invested: 'INVESTED',
  waitingForInvestmentAmount: 'WAITING_FOR_INVESTMENT_AMOUNT'
}

function onMessage(session, message) {
  switch (session.get('app_state')) {
    case (STATES.waitingForBooking):
      session.set('booking_no', message.body)
      console.log("BOOKING_NO: ", session.get('booking_no')); 
      handleInsurance(session);
      break;
      case(STATES.waitingforaadharnumber):
      session.set('aadhar_no', message.body)
      handleInsurance(session);
      break;
    case (STATES.waitingForInsuranceAmount):
      
      session.set('insurance_amount', message.body)
      console.log("INSURANCE_AMOUNT: ", session.get('insurance_amount'));
      
      if (session.get('insurance_amount') > 50) {
        session.reply('Your insurance amount cannot exceed ticket price. Please Re-enter')
        session.set('app_state', STATES.waitingForBooking)
        handleInsurance(session)
        break;
      }
      handleInsurance(session)
      break;
    case (STATES.waitingForLocation):
      session.set('current_location', message.body)
      console.log("CURRENT_LOCATION: ", session.get('current_location'));
      if(message.body == "1,2")
      {
        session.reply('You are 25 Km away from the airport. Your ETA to airport is 20 min.')
        session.reply('The boarding gates for your flight close, 30 min from now')
        session.reply('According to our calculation, there is a 50% probability that you will reach in time')
        let y = 0.5 * session.get('insurance_amount') * 1.1;
        session.reply('To insure, you will have to pay a maximum premium of ' + y + '$')
        session.reply(SOFA.Message({
          body: "Do you want to take the insurance?",
          controls: [
            { type: "button", label: "Yes", value: "Yes" },
            { type: "button", label: "No", value: "No" }
          ]
        }));
        session.set('app_state', STATES.waitingForConfirmation)
      }
      if (message.body == "4,5") {
        session.reply('You are 30 Km away from the airport. Your ETA to airport is 25 min.')
        session.reply('The boarding gates for your flight close, 30 min from now')
        session.reply('According to our calculation, there is a 75% probability that you will reach in time')
        let x = 0.75 * session.get('insurance_amount') * 1.1;
        session.reply('To insure, you will have to pay a maximum premium of ' + x + '$')
        session.reply(SOFA.Message({
          body: "Do you want to take the insurance?",
          controls: [
            { type: "button", label: "Yes", value: "Yes" },
            { type: "button", label: "No", value: "No" }
          ]
        }));
        session.set('app_state', STATES.waitingForConfirmation)
      }
      handleInsurance(session)
      break;
      case STATES.waitingforinvestmentamount:
        session.set('investment_amount', message.body)
      
      session.set('app_state', STATES.INVESTED)
      
        handleInvest(session);
      
        break;
    default:
      return true
  }
  
}

function onCommand(session, command) {
  switch (command.content.value) {
    case 'insure':
      handleInsurance(session)
      break
    case 'pay':
      pay(session)
      break;
      case 'Yes':
      session.set('app_state', STATES.confirmed)
      handleInsurance(session);
      break;
      case 'No':
      session.set('app_state', STATES.WELCOME)
      handleInsurance(session);
      break;
      case 'pool':
      session.set('app_state', STATES.POOL)
      break;
      case 'invest':
      session.set('app_state', STATES.INVEST)
      handleInvest(session);
      break;
      case '1':
      session.reply('How much do you want to invest?')
      session.set('app_state', STATES.waitingforinvestmentamount);
      processPayment(session)
      session.set('app_state', STATES.INVESTED)
      break;
      case '2':
      session.reply('How much do you want to invest?')
      session.set('app_state', STATES.waitingforinvestmentamount);
      processPayment(session)
      session.set('app_state', STATES.INVESTED)
      break;
    // case 'count':
    //   count(session)
    //   break
    // case 'donate':
    //   donate(session)
    //   break
    // }
  }}

  function processPayment(session) {
    let controls = [
      { type: 'button', label: 'Pay', value: 'pay' }
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
// function pay1(session, x) {
//   const amount = session.get('investment_amount')
//   if (amount < session.eth.getBalance(session.user.address)) {
//     Fiat.fetch().then((toEth) => {
//       session.requestEth(toEth.USD(amount))
//     })
//     session.set('app_state', STATES.INVESTED)
//   }
  
// }
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
      case (STATES.welcome):
        session.reply('Please enter your booking number:');
        session.set('app_state', STATES.waitingForBooking);
        break;
      case (STATES.waitingForBooking):
        session.reply('Please enter your Aadhar Number:');
        session.set('app_state', STATES.waitingforaadharnumber);
        break;
      case (STATES.waitingforaadharnumber):
      session.reply('Your identity is verified.');
        session.reply('Your ticket amount is: $50. Enter the amount maximum amount that you want to insure:');
        session.set('app_state', STATES.waitingForInsuranceAmount)
        break;
      case (STATES.waitingForInsuranceAmount):
        session.reply('Enter your location:');
        session.set('app_state', STATES.waitingForLocation)
        break;
     
      case (STATES.confirmed):
        session.reply('Hold on, your insurance contract is being created..')
        session.set('app_state', STATES.waitingForContract)
        processPayment(session)

        case (STATES.pool):
        //WEB3 Call to queryPoolStatus() using addres of user
        let x = 40;
        session.reply('Your pool is ' + x + '% filled');
        session.set('app_state', STATES.welcome);
        break;
    }
  }
  function handleInvest(session) {
    switch (session.get('app_state')) {
      case (STATES.INVEST):
      session.reply('List of Available Policies:');
        session.reply('1 | Probability: 75% | Max Payout: $50 | Premium: $' + 0.75 * session.get('insurance_amount') * 1.1 + "." + "Location Data, Time of Claim, Boarding Time, ETA");  
        session.reply('2 | Probability: 50% | Max Payout: $50 | Premium: $' + 0.5 * session.get('insurance_amount') * 1.1 + "." + "Location Data, Time of Claim, Boarding Time, ETA");  
      
        session.reply(SOFA.Message({
          body: "Which one do you want to invest in?",
          controls: [
            { type: "button", label: "1", value: "1" },
            { type: "button", label: "2", value: "2" }
          ]
        }));
        break;
        case(STATES.INVESTED):
        session.reply('Thanks for investing! You can check the pool status now!');
        session.set('app_state', STATES.welcome);
        break;  
  }}

  function handleStatus(session) {

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
    session.reply(SOFA.Message({
      body: message,
      controls: [
        {
          type: "group",
          label: "Get Insured",
          controls: [
            { type: 'button', label: 'Get Insurance', value: 'insure' },
            { type: 'button', label: 'Know Pool Status', value: 'pool' }
          ]
        },
        { type: 'button', label: 'Invest', value: 'invest' },
        { type: 'button', label: 'Know Account Status', value: 'status' }
      ],
      showKeyboard: false
    }))
  }

  