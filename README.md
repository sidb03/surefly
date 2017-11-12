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


## Architecture

# Process Flow:

For a 



[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)

Then check out [`src/bot.js`](src/bot.js) to start changing the bot logic.

## Running locally with Docker

You can run the project locally with

```
docker-compose up
```

If any new depencies are added you can rebuild the project with

```
docker-compose build
```

To reset the postgres database in your dev environment you can use

```
docker-compose down -v
```

## Architecture

Deploying a Toshi app requires a few processes to run:

* **toshi-headless-client**<br>
  This is a client we provide (similar to the iOS or Android client) that provides a wrapper around the Toshi backend services. It also handles end-to-end encrypting all messages using the Signal protocol. It is written in Java and runs in the background, proxying all the requests to and from your bot.
* **redis**<br>
  We use redis pub/sub to provide a connection between the toshi-headless-client and your bot.
* **bot.js**<br>
  This is where all your app logic lives.
* **postgres**<br>
  Postgres is used to store session data so you can persist state for each user who talks to your bot (similar to cookies in a web browser).

![diagram](docs/images/app-architecture.png)

## See also

* [https://www.toshi.org]
