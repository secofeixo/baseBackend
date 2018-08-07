const config = require('../../../config/config'),
  logger = require('../log.controller.js'),
  path = require('path'),
  fs = require('fs'),
  shell = require('shelljs');

const filetypesPicture = /jpeg|jpg|png/;
const filetypesVideo = /mov|mp4|avi/;

const limitImage = {
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
};

const limitVideo = {
  limits: {
    fileSize: 50 * 1024 * 1024,
  },
};

function validImageFile(file) {
  const mimetype = filetypesPicture.test(file.mimetype);
  const extname = filetypesPicture.test(path.extname(file.name).toLowerCase());

  if (mimetype && extname) {
    return true;
  }

  return false;
}

function validVideoFile(file) {
  const mimetype = filetypesVideo.test(file.mimetype);
  const extname = filetypesVideo.test(path.extname(file.name).toLowerCase());

  if (mimetype && extname) {
    return true;
  }

  return false;
}

function formattedNumber(num) {
  return num < 10 ? `0${num}` : num;
}

function getDestinationFolder(folderDestination) {
  const date = new Date();
  const year = formattedNumber(date.getUTCFullYear());
  const month = formattedNumber(date.getUTCMonth() + 1);
  const day = formattedNumber(date.getUTCDate());

  const dir = `${config.wwwfolder}/${folderDestination}/${year}/${month}/${day}`;
  if (!fs.existsSync(dir)) {
    shell.mkdir('-p', dir);
  }
  logger.info(`detectupload.controller.js. getDestinationFolder ${dir}`);

  return dir;
}

function getNameFile(originalName) {
  const uuidv4 = require('uuid/v4');

  const extension = path.extname(originalName);
  const sNewFileName = uuidv4();
  return `${sNewFileName}${extension}`;
}


function uploadFileGeneral(req, res, sFolderDestination, validFileFunction, callbackFinishUpload) {
  logger.info('detectupload.controller.js. uploadFileGeneral');

  if (!req.files) {
    logger.error('detectupload.controller.js. uploadFileGeneral. File not present.');
    callbackFinishUpload({
      code: 400,
      msg: 'File not present',
    });
    // res.status(400).send({ msg: 'File not present' });
    return;
  }

  const pictureFile = req.files.picture;
  if (!pictureFile) {
    logger.error('detectupload.controller.js. uploadFileGeneral. File not present in field picture.');
    callbackFinishUpload({
      code: 400,
      msg: 'File not present in field picture',
    });
    // res.status(400).send({ msg: 'File not present in field picture' });
    return;
  }

  if (!validFileFunction(pictureFile)) {
    logger.error(`detectupload.controller.js. uploadFileGeneral. File format not allowed: ${filetypesPicture}.`);
    // res.status(400).send({ msg: `File format not allowed. Format allowed: ${filetypesPicture}` });
    callbackFinishUpload({
      code: 400,
      msg: `File format not allowed. Format allowed: ${filetypesPicture}`,
    });
    return;
  }

  const destinationFolder = getDestinationFolder(sFolderDestination);
  const sNameFile = getNameFile(pictureFile.name);
  const destinationFile = path.join(destinationFolder, sNameFile);

  if (pictureFile.truncated !== undefined) {
    if (pictureFile.truncated) {
      logger.error(`detectupload.controller.js. uploadFileGeneral. File size exceeded. Max file size: ${limitImage.limits.fileSize} bytes.`);
      // res.status(400).send({ msg: `File size exceeded. Max file size: ${limitImage.limits.fileSize} bytes` });
      callbackFinishUpload({
        code: 400,
        msg: `File size exceeded. Max file size: ${limitImage.limits.fileSize} bytes`,
      });
      return;
    }
  }

  pictureFile.mv(destinationFile, err => {
    logger.debug(`detectupload.controller.js. uploadFileGeneral. file moved to: ${destinationFile}`);
    if (err) {
      logger.error(`detectupload.controller.js. uploadFileGeneral. Error moving file: ${err}`);
      res.status(500).send({ msg: `Internal Error ${err}` });
      return;
    }
    const pathToSaveInDetection = destinationFile.replace(config.wwwfolder, '');
    const data = {
      path: pathToSaveInDetection,
      destFile: destinationFile,
    };
    callbackFinishUpload(null, data);
  });
}

function uploadPicture(req, res) {
  uploadFileGeneral(req, res, 'detection_images', validImageFile, (err, data) => {
    if (err) {
      res.status(err.code).send({ msg: err.msg });
      return;
    }

    res.status(200).json(data);
  });
}

module.exports = {
  uploadPicture,
  limitImage,
  limitVideo,
};
