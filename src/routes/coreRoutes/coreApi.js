const express = require('express');

const { catchErrors } = require('@/handlers/errorHandlers');

const router = express.Router();
const upload = require('../../services/file-upload')
const adminController = require('@/controllers/coreControllers/adminController');
const settingController = require('@/controllers/coreControllers/settingController');
const emailController = require('@/controllers/coreControllers/emailController');
const userController = require('@/controllers/coreControllers/userController')
const { singleStorageUpload } = require('@/middlewares/uploadMiddleware');

// //_______________________________ Admin management_______________________________

router.route('/admin/read/:id').get(catchErrors(adminController.read));

router.route('/admin/password-update/:id').patch(catchErrors(adminController.updatePassword));

//_______________________________ Admin Profile _______________________________

router.route('/admin/profile/password').patch(catchErrors(adminController.updateProfilePassword));
router
  .route('/admin/profile/update')
  .patch(
    singleStorageUpload({ entity: 'admin', fieldName: 'photo', fileType: 'image' }),
    catchErrors(adminController.updateProfile)
  );

// //____________________________________________ API for Global Setting _________________

router.route('/setting/create').post(catchErrors(settingController.create));
router.route('/setting/update/:id').patch(catchErrors(settingController.update));
//router.route('/setting/delete/:id).delete(catchErrors(settingController.delete));
router.route('/setting/search').get(catchErrors(settingController.search));
router.route('/setting/list').get(catchErrors(settingController.list));
router.route('/setting/listAll').get(catchErrors(settingController.listAll));
router.route('/setting/filter').get(catchErrors(settingController.filter));
router
  .route('/setting/readBySettingKey/:settingKey')
  .get(catchErrors(settingController.readBySettingKey));
router.route('/setting/listBySettingKey').get(catchErrors(settingController.listBySettingKey));
router
  .route('/setting/updateBySettingKey/:settingKey?')
  .patch(catchErrors(settingController.updateBySettingKey));
router
  .route('/setting/upload/:settingKey?')
  .patch(
    catchErrors(
      singleStorageUpload({ entity: 'setting', fieldName: 'settingValue', fileType: 'image' })
    ),
    catchErrors(settingController.updateBySettingKey)
  );

router.route('/setting/CompanyInfo').get(catchErrors(settingController.getCompanyDetails));
router.route('/setting/updateCompanyInfo').patch(catchErrors(settingController.updateManySetting));
router.route('/setting/updateCompanyDetails').patch(catchErrors(settingController.updateCompanyDetails))


// //____________________________________________ API for Email Templates _________________
router.route('/email/create').post(catchErrors(emailController.create));
router.route('/email/read/:id').get(catchErrors(emailController.read));
router.route('/email/update/:id').patch(catchErrors(emailController.update));
router.route('/email/search').get(catchErrors(emailController.search));
router.route('/email/list').get(catchErrors(emailController.list));
router.route('/email/listAll').get(catchErrors(emailController.listAll));
router.route('/email/filter').get(catchErrors(emailController.filter));


// ------------------------------API to create User in Company---------------------------
router.route('/employee/create').post(catchErrors(userController.create));
router.route('/employee/list').get(catchErrors(userController.paginatedList));
router.route('/employee/read/:id').get(catchErrors(userController.read));
router.route('/employee/delete/:id').delete(catchErrors(userController.remove));
router.route('/employee/create-in-bulk').post(upload.single('excelsheet'),catchErrors(userController.createBulk))

// ---------------------------API to Update User Information----------------------------
router.route('/employee/update-info/:id').patch(catchErrors(userController.UpdateController.updateInfo))
router.route('/employee/update-address/:id').patch(catchErrors(userController.UpdateController.updateAddress))
router.route('/employee/update-emergency-contact/:id').patch(catchErrors(userController.UpdateController.updateEmergencyContact))
router.route('/employee/update-bank-details/:id').patch(upload.single('bank'),catchErrors(userController.UpdateController.updateBankDetail))
router.route('/employee/update-degree-info/:id').patch(upload.single('document'),catchErrors(userController.UpdateController.updateDegreeInfo))
router.route('/employee/update-pan/:id').patch(upload.single('pan'),catchErrors(userController.UpdateController.updatePan))
router.route('/employee/update-aadhar/:id').patch(upload.single('aadhar'),catchErrors(userController.UpdateController.updateAadhar))
router.route('/employee/update-experience-info/:id').patch(upload.single('document'),catchErrors(userController.UpdateController.updateDegreeInfo))

module.exports = router;
