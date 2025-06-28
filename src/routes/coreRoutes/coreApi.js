const express = require('express');

const { catchErrors } = require('@/handlers/errorHandlers');

const router = express.Router();
const upload = require('../../services/file-upload')
const settingController = require('@/controllers/coreControllers/settingController');
const userController = require('@/controllers/coreControllers/userController')
const profileController = require('@/controllers/coreControllers/profileController')
const requireReadAccess = require('@/middlewares/access/requireReadAccess')
const requireWriteAccess = require('@/middlewares/access/requireWriteAccess')
const checkPermission = require('@/middlewares/access/checkMiddleware')
const isAdminOrOwner = require('@/middlewares/access/AdminOwner')

router.route('/setting/CompanyInfo').get(isAdminOrOwner, catchErrors(settingController.getCompanyDetails));
router.route('/setting/updateCompanyDetails').patch(isAdminOrOwner,catchErrors(settingController.updateCompanyDetails))
router.route('/setting/updatePassword').patch(catchErrors(settingController.updatePassword))


// ------------------------------API to create User in Company---------------------------
router.route('/employee/create').post(catchErrors(userController.create));
router.route('/employee/list').get(catchErrors(userController.paginatedList));
router.route('/employee/read/:id').get(catchErrors(userController.read));
router.route('/employee/delete/:id').delete(catchErrors(userController.remove));
router.route('/employee/create-in-bulk').post(upload.single('excelsheet'),catchErrors(userController.createBulk))
router.route('/employee/count').get(catchErrors(userController.countUsers))
router.route('/plant/count').get(catchErrors(userController.countPlants))
router.route('/asset/count').get(catchErrors(userController.countAssets))

// ---------------------------API to Update User Information----------------------------
router.route('/employee/update-info/:id').patch(checkPermission("employee"),requireWriteAccess,catchErrors(userController.UpdateController.updateInfo))
router.route('/employee/update-address/:id').patch(checkPermission("employee"),requireWriteAccess,catchErrors(userController.UpdateController.updateAddress))
router.route('/employee/update-emergency-contact/:id').patch(checkPermission("employee"),requireWriteAccess,catchErrors(userController.UpdateController.updateEmergencyContact))
router.route('/employee/update-bank-details/:id').patch(checkPermission("employee"),requireWriteAccess,upload.single('bank'),catchErrors(userController.UpdateController.updateBankDetail))
router.route('/employee/update-degree-info/:id').patch(checkPermission("employee"),requireWriteAccess,upload.single('document'),catchErrors(userController.UpdateController.updateDegreeInfo))
router.route('/employee/update-pan/:id').patch(checkPermission("employee"),requireWriteAccess,upload.single('pan'),catchErrors(userController.UpdateController.updatePan))
router.route('/employee/update-aadhar/:id').patch(checkPermission("employee"),requireWriteAccess,upload.single('aadhar'),catchErrors(userController.UpdateController.updateAadhar))
router.route('/employee/update-experience-info/:id').patch(checkPermission("employee"),requireWriteAccess,upload.single('document'),catchErrors(userController.UpdateController.updateExperienceInfo))
router.route('/employee/:directory/:filename').get(checkPermission("employee"),requireWriteAccess,catchErrors(userController.downloadFile))
router.route('/employee/delete/:infoType/:id/:deleteId').delete(checkPermission("employee"),requireWriteAccess,catchErrors(userController.deleteInfo))
router.route('/employee/update-password/:id').patch(catchErrors(checkPermission("employee"),requireWriteAccess,userController.UpdateController.updatePassword))



// --------------------------- API Profile ----------------------------------------------
router.route('/profile-me').get(catchErrors(profileController.read));
router.route('/profile/update-info').patch(catchErrors(profileController.UpdateController.updateInfo))
router.route('/profile/update-address').patch(catchErrors(profileController.UpdateController.updateAddress))
router.route('/profile/update-emergency-contact').patch(catchErrors(profileController.UpdateController.updateEmergencyContact))
router.route('/profile/update-bank-details').patch(upload.single('bank'),catchErrors(profileController.UpdateController.updateBankDetail))
router.route('/profile/update-degree-info').patch(upload.single('document'),catchErrors(profileController.UpdateController.updateDegreeInfo))
router.route('/profile/update-pan').patch(upload.single('pan'),catchErrors(profileController.UpdateController.updatePan))
router.route('/profile/update-aadhar').patch(upload.single('aadhar'),catchErrors(profileController.UpdateController.updateAadhar))
router.route('/profile/update-experience-info').patch(upload.single('document'),catchErrors(profileController.UpdateController.updateExperienceInfo))
// router.route('/profile/:directory/:filename').get(catchErrors(userController.downloadFile))
router.route('/profile/delete/:infoType/:deleteId').delete(catchErrors(profileController.deleteInfo))


// Dashboard Routes
router.route('/employee/birthdays').get(catchErrors(userController.dashboardInfoController.birthdayInfo))
router.route('/employee/anniversaries').get(catchErrors(userController.dashboardInfoController.aniiversaryInfo))
router.route('/employee/holidays').get(catchErrors(userController.dashboardInfoController.holidayInfo))
router.route('/employee/attendance-today').get(catchErrors(userController.dashboardInfoController.attendanceToday))
router.route('/employee/leaveSummary').get(catchErrors(userController.dashboardInfoController.leaveSummary))
router.route('/employee/supervisor').get(catchErrors(userController.dashboardInfoController.getSupervisor))

module.exports = router;
