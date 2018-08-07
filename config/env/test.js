

module.exports = {
  db: 'mongodb://localhost/bigfinite-test',
  email: {
    pool: false,
    secure: false, // use TLS
    host: 'smtp.ethereal.email',
    port: 587,
    account: 'og6olbkhma7kzlzi@ethereal.email',
    pwd: 'hCvEZHSeYKajEsgJ1A',
  },
  debugLevel: {
    console: 'debug',
    file: 'none',
  },
};
