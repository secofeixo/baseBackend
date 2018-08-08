FROM keymetrics/pm2:8-stretch
#FROM node:8.11.3-stretch

# Bundle APP files
WORKDIR /server
COPY package*.json ./

# Install app dependencies
RUN npm install --production

# copy rest of code
COPY . .
COPY ./docker/wait-for-it.sh .

EXPOSE 8080

RUN pm2 install pm2-logrotate

CMD [ "pm2-runtime", "start", "pm2-docker.json" ]
