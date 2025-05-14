const express = require('express');

const router = express.Router();

const { catchErrors } = require('@/handlers/errorHandlers');

// router.post('/add-policy',upload.single('policy'),asyncMiddleware(PolicyController.createPolicy)) //Add Policy
// router.put('/edit-policy',asyncMiddleware(PolicyController.updatePolicy)) //Edit Policy
// router.get('/get-policies',asyncMiddleware(PolicyController.getPolicy))  //Get Policies
// router.delete('/delete-policy/:policyId',asyncMiddleware(PolicyController.deletePolicy)) //Delete Policy


// router.route('/add-polic')\

module.exports = router