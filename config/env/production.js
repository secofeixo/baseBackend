

module.exports = {
  dboptions: {
    // useMongoClient: true,
    auth: { authdb: 'admin' },
    user: 'user',
    pass: 'password',
  },
  db: 'mongodb://mongo1,mongo2,mongo3/database?replicaSet=gs',
  wwwfolder: '/fileserver1/webdata',
  debugLevel: {
    console: 'info',
    file: 'info',
  },
};
