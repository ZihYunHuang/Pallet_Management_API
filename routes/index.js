const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/supplierController');
const palletController = require('../controllers/palletController');
const discardController = require('../controllers/discardController');
const lendController = require('../controllers/lendController');
const returnController = require('../controllers/returnController');


// (搜尋)取得經銷商資料
router.post('/supplier', supplierController.getSupplier);

// (搜尋)取得經銷商編號及名稱
router.post('/supplier/IdName', supplierController.getSupplierIdName);

// 新增經銷商基本資料
router.post('/supplier/data-change', supplierController.newSupplier);

// 編輯經銷商基本資料
router.patch('/supplier/data-change', supplierController.editSupplier);

// 刪除經銷商基本資料
router.put('/supplier/data-change', supplierController.deleteSupplier);

// 取得經銷商類型
router.post('/supplier/type', supplierController.getSupplierType);

// 新增經銷商類型
router.post('/supplier/data-change/type', supplierController.newSupplierType);

// 編輯經銷商類型
router.patch('/supplier/data-change/type', supplierController.editSupplierType);

// 刪除經銷商類型
router.put('/supplier/data-change/type', supplierController.deleteSupplierType);

// 取得棧板在庫狀態
router.post('/warehouse/inventory/status', supplierController.getInventoryStatus);

// 取得在庫棧板
router.post('/warehouse/inventory', supplierController.getInventory);

// (搜尋)取得棧板基本資料
router.post('/pallet', palletController.getPallet);

// 新增棧板基本資料
router.post('/pallet/data-change', palletController.newPallet);

// 刪除棧板基本資料
router.put('/pallet/data-change', palletController.deletePallet);

// 取得棧板類型
router.post('/pallet/type', palletController.getPalletType);

// 新增棧板類型
router.post('/pallet/data-change/type', palletController.newPalletType);

// 編輯棧板類型
router.patch('/pallet/data-change/type', palletController.editPalletType);

// 刪除棧板類型
router.put('/pallet/data-change/type', palletController.deletePalletType);

// (搜尋)取得棧板報廢單
router.post('/pallet/discard', discardController.getDiscardDocument);

// 新增棧板報廢單
router.post('/pallet/data-change/discard', discardController.newDiscardDocument);

// 刪除棧板報廢單
router.put('/pallet/data-change/discard', discardController.deleteDiscardDocument);

// (搜尋)取得棧板借出單
router.post('/pallet/lend', lendController.getLendDocument);

// 新增棧板借出單
router.post('/pallet/data-change/lend', lendController.newLendDocument);

// 刪除棧板借出單
router.put('/pallet/data-change/lend', lendController.deleteLendDocument);

// (搜尋)取得棧板歸還單
router.post('/pallet/return', returnController.getReturnDocument);

// 新增棧板歸還單
router.post('/pallet/data-change/return', returnController.newReturnDocument);

// 刪除棧板歸還單
router.put('/pallet/data-change/return', returnController.deleteReturnDocument);

module.exports = router;
