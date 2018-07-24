

module.exports = {
  db: 'mongodb://mongo_db/gs_saas',
  dboptions: {
    // useMongoClient: true,
    auth: { authdb: 'admin' },
    user: 'user',
    pass: 'password',
  },
  wwwfolder: '/fileserver1/webdata',
  removefolder: '/fileserver1/removed/',
};
