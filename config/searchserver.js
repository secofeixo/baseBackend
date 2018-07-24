const _ = require('lodash');

module.exports = _.extend(
    require('./searchserver/all'),
    require(`./searchserver/${process.env.NODE_ENV}` || 'development') || {}
);
