

module.exports = {
  port: 5672,
  server: 'rabbitmq',
  protocol: 'amqp',
  timeout: 30000,
  user: 'user',
  pwd: 'password',
  queues: {
    statQueryQueue: 'statQueryQueue',
    statProductPurchase: 'statProductPurchase',
    statProductLike: 'statProductLike',
  },
  findSimilarQueue: 'find_similar_speed_prods',
  getTheLookQueue: 'find_similar_speed_posts',
};
