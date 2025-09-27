const express = require('express');
const router = express.Router();
const { catchErrors } = require('@/handlers/errorHandlers');
const AssetApi = require('@/controllers/assetControllers/index');
const uploadExcel = require('../../services/uploadExcel');
const AdminOwner = require('../../middlewares/access/AdminOwner');
const checkPermission = require('@/middlewares/access/checkMiddleware')
const requireReadAccess = require('@/middlewares/access/requireReadAccess')
const requireWriteAccess = require('@/middlewares/access/requireWriteAccess')

// Asset Type routes (Admin only)
router
  .route('/asset-type')
  .post(checkPermission(''),requireWriteAccess, catchErrors(AssetApi.adminAssetController.createAssetType));
router
  .route('/asset-type')
  .get(AdminOwner, catchErrors(AssetApi.adminAssetController.getAssetType));
router
  .route('/asset-type/:id')
  .patch(AdminOwner, catchErrors(AssetApi.adminAssetController.updateAssetType));
// router
//   .route('/asset-type/:id')
//   .delete(AdminOwner, catchErrors(AssetApi.adminAssetController.deleteAssetType));

// Asset CRUD routes (Admin only)
router.route('/add-asset').post(AdminOwner, catchErrors(AssetApi.adminAssetController.addAsset));
router
  .route('/all-asset/:plantId')
  .get(AdminOwner, catchErrors(AssetApi.adminAssetController.getAssets));
router
  .route('/delete-asset/:id')
  .delete(AdminOwner, catchErrors(AssetApi.adminAssetController.deleteAsset));
router
  .route('/update-asset/:id')
  .put(AdminOwner, catchErrors(AssetApi.adminAssetController.updateAsset));
router
  .route('/add-asset-bulk/:plantId')
  .post(
    AdminOwner,
    uploadExcel.single('excelsheet'),
    catchErrors(AssetApi.adminAssetController.createBulkAssets)
  );

// Asset Transfer Management routes (Admin only)
router
  .route('/transfer-requests/:plantId')
  .get(AdminOwner, catchErrors(AssetApi.adminAssetController.getTransferRequests));
router
  .route('/transfer/:transferId/approve')
  .put(AdminOwner, catchErrors(AssetApi.adminAssetController.approveAssetTransfer));
router
  .route('/transfer/:transferId/reject')
  .put(AdminOwner, catchErrors(AssetApi.adminAssetController.rejectAssetTransfer));
router
  .route('/asset/:assetId/transfer-history')
  .get(AdminOwner, catchErrors(AssetApi.adminAssetController.getAssetTransferHistory));

// Employee Asset routes
router.route('/employee/my-assets').get(catchErrors(AssetApi.employeeAssetController.getMyAssets));
router
  .route('/employee/transfer-request')
  .post(catchErrors(AssetApi.employeeAssetController.requestAssetTransfer));
router
  .route('/employee/transfer-requests')
  .get(catchErrors(AssetApi.employeeAssetController.getTransferRequests));
router
  .route('/employee/employees-for-transfer')
  .get(catchErrors(AssetApi.employeeAssetController.getEmployeesForTransfer));

module.exports = router;
