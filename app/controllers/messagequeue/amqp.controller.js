const amqp = require('amqplib/callback_api'),
  logger = require('../log.controller.js'),
  _ = require('lodash');

const connections = {};
const channels = {};
const connecting = {};


function getConnectionString(configObj) {
  return `${configObj.protocol}://${configObj.user}:${configObj.pwd}@${configObj.server}:${configObj.port}`;
}

function timeoutConnecting(sConnection, attempt, callback) {
  logger.debug(`amqp.controller.js - timeoutConnecting - sConnection: ${sConnection} - attempt: ${attempt}`);
  if (attempt > 5) {
    callback('Previously connecting process not finished');
    return;
  }
  if (_.has(channels, sConnection)) {
    callback(null);
  } else {
    setTimeout(timeoutConnecting, 500, sConnection, attempt + 1, callback);
  }
}

function connect(configObj, callback) {
  const sConnection = getConnectionString(configObj);

  if (_.has(connecting, sConnection)) {
    setTimeout(timeoutConnecting, 500, sConnection, 0, callback);
    return;
  }

  logger.debug(`amqp.controller.js - connect - connections: ${sConnection}`);
  connecting[sConnection] = true;

  amqp.connect(sConnection, (errConnnection, conn) => {
    if (errConnnection) {
      logger.error(`amqp.controller.js - connect - Error connection rabbitmq: ${errConnnection}`);
      callback(errConnnection);
      return;
    }
    connections[sConnection] = conn;
    logger.debug(`amqp.controller.js - connect - connections: ${JSON.stringify(Object.keys(connections))}`);

    conn.on('error', err => {
      if (err) {
        logger.error(`amqp.controller.js - connection error: ${err}`);
      }
      connections[sConnection] = null;
      delete connections[sConnection];
      delete connecting[sConnection];
    });

    conn.on('close', () => {
      logger.error('amqp.controller.js - connection closed');
      connections[sConnection] = null;
      delete connections[sConnection];
      delete connecting[sConnection];
    });

    conn.createChannel((errChannel, ch) => {
      if (errChannel) {
        conn.close();
        logger.error(`amqp.controller.js - connect - Error creating channel rabbitmq: ${errChannel}`);
        callback(errChannel);
        return;
      }
      delete connecting[sConnection];
      channels[sConnection] = ch;

      ch.on('error', err => {
        if (err) {
          logger.error(`amqp.controller.js - channel error: ${err}`);
        }

        if (conn) {
          connections[sConnection].close();
          connections[sConnection] = null;
          delete connections[sConnection];
        }

        if (_.has(connections, sConnection)) {
          connections[sConnection].close();
          delete connections[sConnection];
        }

        channels[sConnection] = null;
        delete channels[sConnection];
      });

      ch.on('close', () => {
        logger.error('amqp.controller.js - channel closed');
        if (_.has(connections, sConnection)) {
          if (connections[sConnection]) {
            connections[sConnection].close();
          }
          connections[sConnection] = null;
          delete connections[sConnection];
        }

        channels[sConnection] = null;
        delete channels[sConnection];
      });

      logger.info('amqp.controller.js - connect - Connected');
      callback(null, ch);
    });
  });
}

function internalSendMessage(sConnection, queue, msg, callback) {
  if (_.has(channels, sConnection)) {
    const channel = channels[sConnection];
    channel.assertQueue(queue, { durable: true,
      arguments: {
        'x-max-priority': 255,
      } }, err => {
        if (err) {
          callback(err);
        } else {
          channel.sendToQueue(queue, new Buffer(msg), { persistent: true });
          logger.info(`amqp.controller.js - sendMessage - Sent [${msg}]`);
          callback(null);
        }
      });
  } else {
    callback(`amqp.controller. internalSendMessage. Channel not found for ${sConnection}`);
  }
}

function generateUuid() {
  return Math.random().toString() +
         Math.random().toString() +
         Math.random().toString();
}

function internalSendMessageWait(sConnection, queueName, msgToSend, timeout, callbackOutput) {
  const optionsQueue = {
    durable: true,
    exclusive: true,
    messageTtl: 1000,
    arguments: {
      'x-max-priority': 255,
    },
  };
  if (_.has(channels, sConnection)) {
    const channel = channels[sConnection];
    channel.assertQueue('', optionsQueue, (err, queue) => {
      if (err) {
        callbackOutput(err);
      } else {
        const corr = generateUuid();
        let bReceivedData = false;

        channel.consume(queue.queue, msgReceived => {
          if (msgReceived && _.has(msgReceived, 'properties') && msgReceived.properties.correlationId === corr) {
            bReceivedData = true;

            const sMsgReceived = msgReceived.content.toString();
            if (sMsgReceived.length > 350) {
              logger.info(`amqp.controller.js - internalSendMessageWait - Received response [${sMsgReceived.substring(0, 125)} ... ${sMsgReceived.substring(sMsgReceived.length, 125)}]`);
            } else {
              logger.info(`amqp.controller.js - internalSendMessageWait - Received response [${sMsgReceived}]`);
            }
            let bError = false;
            let objMessage;
            try {
              objMessage = JSON.parse(sMsgReceived);
            } catch (e) {
              logger.info(`amqp.controller.js - internalSendMessageWait - Error parsing json. ${JSON.stringify(e)} `);
              bError = true;
            } finally {
              if (bError) {
                logger.info('amqp.controller.js - internalSendMessageWait - callback JSON - KO');
                callbackOutput(undefined, sMsgReceived, undefined);
              } else {
                logger.info('amqp.controller.js - internalSendMessageWait - callback JSON - OK');
                callbackOutput(undefined, sMsgReceived, objMessage);
              }
            }
            logger.info(`amqp.controller.js - internalSendMessageWait - Deleting Answering Queue: [${queue.queue}]`);
            channel.deleteQueue(queue.queue);
          } else if (!msgReceived) {
            logger.error(`amqp.controller.js - internalSendMessageWait. Received null message from rabbitMQ. Queue: ${queueName}. Message: ${msgToSend}`);
          }
        }, { noAck: true });

        const options = {
          correlationId: corr,
          replyTo: queue.queue,
        };
        channel.sendToQueue(queueName, new Buffer(msgToSend), options);
        logger.info(`amqp.controller.js - internalSendMessageWait - Queue: [${queueName}]. Sent [${msgToSend}]. connection: [${sConnection}]`);

        if (timeout > 0) {
          setTimeout(() => {
            if (!bReceivedData) {
              channel.deleteQueue(queue.queue);
              callbackOutput(`Timeout waiting answer RabbitMQ. Queue: ${queueName}. Message: ${msgToSend}`);
            }
          }, timeout);
        }
      }
    });
  } else {
    callbackOutput(`amqp.controller. internalSendMessageWait. Channel not found for ${sConnection}`);
  }
}

function sendMessage(queue, msg, configServer, callback) {
  const sConnection = getConnectionString(configServer);

  if (!_.has(connections, sConnection)) {
    connect(configServer, err => {
      if (err) {
        callback(`Error connecting to rabbitmq ${err}`);
        return;
      }
      internalSendMessage(sConnection, queue, msg, callback);
    });
    return;
  }

  if (!_.has(channels, sConnection)) {
    connect(configServer, err => {
      if (err) {
        callback(`Error connecting to channel ${err}`);
        return;
      }
      internalSendMessage(sConnection, queue, msg, callback);
    });
    return;
  }

  internalSendMessage(sConnection, queue, msg, callback);
}

function sendMessageWait(queue, msg, configServer, timeout, callback) {
  const sConnection = getConnectionString(configServer);

  if (!_.has(connections, sConnection)) {
    connect(configServer, err => {
      if (err) {
        callback(`Error connecting to rabbitmq ${err}`);
        return;
      }
      internalSendMessageWait(sConnection, queue, msg, timeout, callback);
    });
    return;
  }

  if (!_.has(channels, sConnection)) {
    connect(configServer, err => {
      if (err) {
        callback(`Error connecting to channel ${err}`);
        return;
      }
      internalSendMessageWait(sConnection, queue, msg, timeout, callback);
    });
    return;
  }

  internalSendMessageWait(sConnection, queue, msg, timeout, callback);
}

module.exports = {
  connect,
  sendMessage,
  sendMessageWait,
};
