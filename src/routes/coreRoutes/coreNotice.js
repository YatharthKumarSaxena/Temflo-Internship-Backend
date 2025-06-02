const express = require('express');

const router = express.Router();
const upload = require('../../services/file-upload')

const { catchErrors } = require('@/handlers/errorHandlers');
const NoticeController = require('@/controllers/noticeControllers')

router.route('/add-notice').post(upload.single('notice'),catchErrors(NoticeController.UpdateController.updateNotice)) 
router.route('/get-notices').get(catchErrors(NoticeController.read))  
router.route('/delete-notice/:noticeId').delete(catchErrors(NoticeController.remove)) 
router.route('/download-notice/:directory/:filename').get(catchErrors(NoticeController.downloadFile))


module.exports = router