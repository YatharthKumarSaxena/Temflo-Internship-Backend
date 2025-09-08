const express = require('express');

const router = express.Router();

const { catchErrors } = require('@/handlers/errorHandlers');
const perApi = require('@/controllers/perController/index');

// router.route('/get-employee').get(catchErrors(perApi.list));
router.route('/get-employee-permission/:id').get(catchErrors(perApi.read));
router.route('/create-employee-permission').post(catchErrors(perApi.create));
router.route('/update-employee-permission').patch(catchErrors(perApi.update));
router.route('/delete-employee-permission/:id').delete(catchErrors(perApi.delete));
router.route('/add-feature/:id').patch(catchErrors(perApi.feature));
router.route('/sync-all-permissions').post(catchErrors(perApi.syncAllPermissions));

module.exports = router;
