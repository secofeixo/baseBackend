

module.exports = {
  port: 5672,
  server: 'rabbitmq',
  protocol: 'amqp',
  timeout: 30000,
  user: 'user',
  pwd: 'password',
  findSimilarQueue: 'test_fs_prods',
  getTheLookQueue: 'test_fs_posts',
  queues: {
    statQueryQueue: 'statQueryQueueLocal',
    statProductPurchase: 'statProductPurchaseLocal',
    statProductLike: 'statProductLikeLocal',
  },
};
