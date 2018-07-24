

module.exports = {
  db: 'mongodb://localhost/database',
  dboptions: {
    // useMongoClient: true,
    auth: { authdb: 'admin' },
    user: 'user',
    pass: 'password',
  },
  wwwfolder: '/Users/aseco/Documents/workspace/gs-node/public',
  removefolder: '/Users/aseco/Documents/workspace/gs-node/removed',
};
