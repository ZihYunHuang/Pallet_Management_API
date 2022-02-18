const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');


// 使用者離職
router.patch('/resign', userController.editUserActive);

// 新增使用者權限
router.post('/data-change/permission', userController.newUserPermission);

// 刪除使用者權限
router.put('/data-change/permission', userController.deleteUserPermission);

// 新增使用者
router.post('/data-change', userController.newUser);

// 刪除使用者
router.put('/data-change', userController.deleteUser);

// 檢視所有使用者資訊
router.post('/all', userController.getAllUser);


module.exports = router;
