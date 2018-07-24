const utilsCtrl = require('../controllers/utils.controller.js');
const fileUpload = require('../controllers/file-upload/express-fileupload');
const ctrlUploadGeneral = require('../controllers/file-upload/upload.controller');

module.exports = app => {
  app.route('/status').get(utilsCtrl.status);
  app.route('/upload').post(fileUpload(ctrlUploadGeneral.limitImage), ctrlUploadGeneral.uploadPicture);
};
