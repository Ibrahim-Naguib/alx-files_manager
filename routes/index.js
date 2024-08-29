import express from 'express';
import AppController from '../controllers/AppController';
import UsersController from '../controllers/UsersController';
import AuthController from '../controllers/AuthController';
import FilesController from '../controllers/FilesController';

const router = express.Router();

router.route('/status').get(AppController.getStatus);
router.route('/stats').get(AppController.getStats);
router.route('/users').post(UsersController.postNew);
router.route('/connect').get(AuthController.getConnect);
router.route('/disconnect').get(AuthController.getDisconnect);
router.route('/users/me').get(UsersController.getMe);
router.route('/files').get(FilesController.getIndex).post(FilesController.postUpload);
router.route('/files/:id').get(FilesController.getShow);
router.route('/files/:id/publish').put(FilesController.putPublish);
router.route('/files/:id/unpublish').put(FilesController.putUnpublish);
router.route('/files/:id/data').get(FilesController.getFile);

module.exports = router;
