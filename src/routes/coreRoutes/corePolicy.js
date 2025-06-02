const express = require('express');

const router = express.Router();
const upload = require('../../services/file-upload')

const { catchErrors } = require('@/handlers/errorHandlers');
const PolicyController = require('@/controllers/policyControllers')

router.route('/add-policy').post(upload.single('policy'),catchErrors(PolicyController.UpdateController.updatePolicy)) //Add Policy
router.route('/get-policies').get(catchErrors(PolicyController.read))  //Get Policies
router.route('/delete-policy/:policyId').delete(catchErrors(PolicyController.remove)) //Delete Policy
router.route('/download-policy/:directory/:filename').get(catchErrors(PolicyController.downloadFile))


module.exports = router