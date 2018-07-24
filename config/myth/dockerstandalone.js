module.exports = {
  zeromq: {
    protocol: 'tcp',
    server: 'worker1',
    port: '8888',
  },
  rabbitmq: {
    port: 5672,
    server: 'rabbitmq',
    protocol: 'amqp',
    timeout: 30000,
    user: 'user',
    pwd: 'password',
    queue: 'myth',
    queueWigi: 'wigi_chat',
  },
};
