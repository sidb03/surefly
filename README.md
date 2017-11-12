# Toshi SOFA App

This repo helps you build a [Toshi app](https://www.toshi.org) in Javascript.

The sample bot can:

* send messages
* send and request money
* create simple UI for buttons and menus
* store sessions and state for each user

TODO

* sending image messages
* creating web view UIs

## Launch your own Toshi app in 5 minutes

Read our [guide to creating a Toshi app](http://developers.toshi.org/docs/creating-a-token-app).

When ready, fork this repo and deploy it to Heroku.

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
