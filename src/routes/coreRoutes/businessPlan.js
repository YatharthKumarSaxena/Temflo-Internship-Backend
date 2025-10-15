const express = require('express');

const { catchErrors } = require('@/handlers/errorHandlers');
const planApi = require('@/controllers/businessPlanController')

const router = express.Router();


router.route('/all').get(catchErrors(planApi.subscriptionController.getAllSubscriptions))
router.route('/renew').post(catchErrors())
router.route('/change').post(catchErrors())
router.route('/buy').post(catchErrors())
