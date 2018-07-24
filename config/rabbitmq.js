const _ = require('lodash');

module.exports = _.extend(
    require('./rabbitmq/all'),
    require(`./rabbitmq/${process.env.NODE_ENV}` || 'development') || {}
);
