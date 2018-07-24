

module.exports = {
  dboptions: {
    // useMongoClient: true,
    auth: { authdb: 'admin' },
    user: 'user',
    pass: 'password',
  },
  db: 'mongodb://dev_server/database',
  wwwfolder: '/fileserver1/webdata',
  removefolder: '/fileserver1/removed/',
};
