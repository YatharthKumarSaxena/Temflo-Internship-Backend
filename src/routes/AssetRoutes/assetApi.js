const express = require('express');
const router = express.Router();
const { catchErrors } = require('@/handlers/errorHandlers');
const AssetApi = require('@/controllers/assetControllers/index')
const uploadExcel = require('../../services/uploadExcel')

router.route('/asset-type').post(catchErrors(AssetApi.adminAssetController.createAssetType))
router.route('/asset-type').get(catchErrors(AssetApi.adminAssetController.getAssetType))
router.route('/asset-type/:id').patch(catchErrors(AssetApi.adminAssetController.updateAssetType))
router.route('/asset-type/:id').delete(catchErrors(AssetApi.adminAssetController.deleteAssetType))
router.route('/add-asset').post(catchErrors(AssetApi.adminAssetController.addAsset))
router.route('/all-asset/:plantId').get(catchErrors(AssetApi.adminAssetController.getAssets))

router.route('/delete-asset/:id').delete(catchErrors(AssetApi.adminAssetController.deleteAsset))
router.route('/update-asset/:id').put(catchErrors(AssetApi.adminAssetController.updateAsset))
router.route('/add-asset-bulk/:plantId').post(uploadExcel.single('excelsheet'),catchErrors(AssetApi.adminAssetController.createBulkAssets))


module.exports = router