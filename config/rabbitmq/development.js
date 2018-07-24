

module.exports = {
  port: 5672,
  server: 'rabbitmq',
  protocol: 'amqp',
  timeout: 30000,
  user: 'user',
  pwd: 'password',
  findSimilarQueue: 'find_similar_speed_prods',
  getTheLookQueue: 'find_similar_speed_posts',
  queues: {
    statQueryQueue: 'statQueryQueueDev',
    statProductPurchase: 'statProductPurchaseDev',
    statProductLike: 'statProductLikeDev',
  },
};
