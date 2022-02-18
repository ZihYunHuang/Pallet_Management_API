const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');


// 編輯個人資料
router.patch('/', userController.editUser);

// 檢視個人資訊
router.post('/', userController.getUser);

// 取得個人權限
router.post('/permission', userController.getUserPermission);

module.exports = router;
