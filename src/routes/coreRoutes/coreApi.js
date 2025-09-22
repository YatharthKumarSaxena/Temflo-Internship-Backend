const express = require('express');

const { catchErrors } = require('@/handlers/errorHandlers');

const router = express.Router();
const upload = require('../../services/file-upload')
const uploadExcel = require('../../services/uploadExcel')
const settingController = require('@/controllers/coreControllers/settingController');
const userController = require('@/controllers/coreControllers/userController')
const profileController = require('@/controllers/coreControllers/profileController')
const requireReadAccess = require('@/middlewares/access/requireReadAccess')
const requireWriteAccess = require('@/middlewares/access/requireWriteAccess')
const checkPermission = require('@/middlewares/access/checkMiddleware')
const isAdminOrOwner = require('@/middlewares/access/AdminOwner')
const { getAdminActivities } = require("@/controllers/coreControllers/activityTracker/adminActivity.controller");
const { getUserActivities } = require("@/controllers/coreControllers/activityTracker/userActivity.controller");
const { createUserController } = require("@/controllers/middlewaresControllers/createUserController/index");
const userControllerInstance = createUserController('User');

router.route('/setting/CompanyInfo').get(isAdminOrOwner, catchErrors(settingController.getCompanyDetails));
router.route('/setting/updateCompanyDetails').patch(isAdminOrOwner,catchErrors(settingController.updateCompanyDetails))
router.route('/setting/updatePassword').patch(catchErrors(settingController.updatePassword))
router.route('/update-user-password/:id').patch(catchErrors(userControllerInstance.updatePassword))

// ------------------------------API to create User in Company---------------------------
router.route('/employee/create').post(checkPermission("manage_employee"),requireWriteAccess,catchErrors(userController.create));
router.route('/employee/list').get(catchErrors(userController.paginatedList));
router.route('/employee/read/:id').get(catchErrors(userController.read));
router.route('/employee/delete/:id').patch(checkPermission("manage_employee"),requireWriteAccess,catchErrors(userController.remove));
router.route('/employee/create-in-bulk').post(checkPermission("manage_employee"),requireWriteAccess,uploadExcel.single('excelsheet'),catchErrors(userController.createBulk))
router.route('/employee/count').get(catchErrors(userController.countUsers))
router.route('/plant/count').get(catchErrors(userController.countPlants))
router.route('/asset/count').get(catchErrors(userController.countAssets))
router.route('/employee/search-employee-list').get(catchErrors(userController.employeeList))
router.route('/employee/download-excel-list').get(isAdminOrOwner,catchErrors(userController.downloadFile))
router.route('/get-user-activities').get(catchErrors(getAdminActivities));
router.route('/get-my-activities').get(catchErrors(getUserActivities));

// ---------------------------API to Update User Information----------------------------
router.route('/employee/update-info/:id').patch(checkPermission("manage_employee"),requireWriteAccess,catchErrors(userController.UpdateController.updateInfo))
router.route('/employee/update-address/:id').patch(checkPermission("manage_employee"),requireWriteAccess,catchErrors(userController.UpdateController.updateAddress))
router.route('/employee/update-emergency-contact/:id').patch(checkPermission("manage_employee"),requireWriteAccess,catchErrors(userController.UpdateController.updateEmergencyContact))
router.route('/employee/update-bank-details/:id').patch(checkPermission("manage_employee"),requireWriteAccess,upload.single('bank'),catchErrors(userController.UpdateController.updateBankDetail))
router.route('/employee/update-degree-info/:id').patch(checkPermission("manage_employee"),requireWriteAccess,upload.single('document'),catchErrors(userController.UpdateController.updateDegreeInfo))
router.route('/employee/update-pan/:id').patch(checkPermission("manage_employee"),requireWriteAccess,upload.single('pan'),catchErrors(userController.UpdateController.updatePan))
router.route('/employee/update-aadhar/:id').patch(checkPermission("manage_employee"),requireWriteAccess,upload.single('aadhar'),catchErrors(userController.UpdateController.updateAadhar))
router.route('/employee/update-experience-info/:id').patch(checkPermission("manage_employee"),requireWriteAccess,upload.single('document'),catchErrors(userController.UpdateController.updateExperienceInfo))
router.route('/employee/:directory/:filename').get(checkPermission("manage_employee"),requireWriteAccess,catchErrors(userController.downloadFile))
router.route('/employee/delete/:infoType/:id/:deleteId').delete(checkPermission("manage_employee"),requireWriteAccess,catchErrors(userController.deleteInfo))
router.route('/employee/update-password/:id').patch(checkPermission("manage_employee"),requireWriteAccess,catchErrors(userController.UpdateController.updatePassword))



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
