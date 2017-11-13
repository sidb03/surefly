# SureFly

This repo is the codebase for the crowdsourced decentralized insurance platform SureFly developed for proffer hackathon

There are two parts of this project

* A Toshi Bot project: UI for the platform using a Toshi Bot
* A Truffle project for the smart contracts


Using this app you can

* Insure your flight from misses
* Invest in people's insurance policy

Read our [problem statement and solution](https://docs.google.com/document/d/1M0w_6ArvHGOpiro6yM1p4IM7u9SvdDZ-HENzLx1EttY/edit?usp=sharing).

## How to use

* Download the Toshi App
* Search for SureFlyBot
* Click on message: You are good to go! 


## Basic Process Flow:

For a person who wants to insure his/her flight (Will be called Seeker in all future references):
 * Seeker enters personal and flight details 
 * Identity is confirmed using Aadhar and flight ticket data is recieved from the airlines
 * Based on the time of booking the insurance and his location, a probability is generated by the system, of him missing the flight
 * A maximum premium amount is calculated on the basis of this probability
 * The seeker is asked the maximum and minimum amount that he wants to insure and is asked to pay the max amount he enters as the premimum

For a person who wants to invest in other people's investment policies (Will be referred to as Investor):
  * The investor is shown a list of policies open for investment, along with all the details like the calculated probability, ETA to airport, present pool size for each policy.
  * He chooses the one he wants to invest in and is then asked for the amount which he is asked to pay. The ratio of this amount to the maximum payout, decides his share of returns of the premium.
  * Thus, with a number of investors, the pool starts getting filled. In case, the minimum amount is not met, the policy stands cancelled and everyone gets their money back.

## SureFlyBot : The chatbot on Toshi as the front end

Here are a few screenshots from the conversation of a seeker with the bot:
![Alt text](/ss00.png?raw=true =100x20 "Screenshot 1")
![Alt text](/ss01.png?raw=true =250x "Screenshot 1")
## SureFly.sol: The deployed Smart Contract

The smart contract is presently deployed on the testnet Ropsten, [here.](https://ropsten.etherscan.io/address/0x013b753cad4193c19f50c507cefd8aee65ece051)

This smart contract is responsible for doing all the transactions, based on different conditions being met. The claim process is automated using this smart contract. It is deployed on the testnet and we use a Infura address to communicate with it using Web3. 

Major State Variables:
  * A structure to store all the details of a seeker. Mappings of this structure are used to map different structure instances to an id number and a address.
    * This structure has a mapping of investor addresses with their respective amounts and id, as a variable.
  * An Enum that has the different states a policy can be in. An instance of this enum is a variable in the seeker structure.
  * Count variables to keep a count and to iterate through user structure mapping and the investor mapping. 

A few major functions of this contract:
  * **addUser(uint256 _maxPayout, uint _minPayout, uint256 _initialPremium, uint256 _prob)** : Used to add a new policy (seeker). Default policyStatus is OPEN
  * **isMinRaised(uint _id)** : Internally used to check if min amount to be raised is reached for a particular policy
  * **queryPoolSize(address adr)** : Externally called to get the current pool size of a particular seeker.
  * **listAllAvailablePolicies()** : Externally called to get the list of all open policies. Returns an array of addresses.
  * **invest(address _adr, uint256 _amount)** : Called whenever a new investor is added. Certain conditions are checked before the investment request is forwarded, like the flight shouldn't have departed, Max Payout shouldn't have been reached, the user must not have boarded etc. Adds address and amount invested to the storage for the particular policy
  * **payout(uint id)** : Called whenever there is a trigger condition for the payout. These are the four conditions and what happens in each case:
    * Flight Missed: The seeker is paid the amount that has been raised in the pool. The investors are paid the premium which is divided proportionally on the basis of their contribution to the pool.
    * Flight Not Missed: The seeker is paid nothing. The investors get their investment back along with the premium divided in proportionally on the basis of their contribution to the pool.
    * Flight Cancelled/Minimum Insured amount not met: The seeker gets back his premium. The investors get their respective investments back.
    * Ticket Cancelled : The seeker loses his premium and doesn't get a payout. Investors get their invested amount back along with the premium divided proportionally. 

    All this functionality is implemented in this function. For ether transfers, a separate function trasferEther() is called for each of the cases.

