# latest official node image
FROM node:latest

RUN git config --global user.email 'docker-dummy@example.com'
RUN npm install -g nodemon

# use cached layer for node modules
ADD package.json /tmp/package.json
RUN cd /tmp && npm install --unsafe-perm
RUN mkdir -p /usr/src/bot && cp -a /tmp/node_modules /usr/src/bot/

# add project files
ADD src /usr/src/bot/src
ADD package.json /usr/src/bot/package.json
WORKDIR /usr/src/bot

CMD nodemon -L src/bot.js
