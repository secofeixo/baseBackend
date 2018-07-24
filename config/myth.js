const _ = require('lodash');

module.exports = _.extend(
    require('./myth/all'),
    require(`./myth/${process.env.NODE_ENV}` || 'development') || {}
);
