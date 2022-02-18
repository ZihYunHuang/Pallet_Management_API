const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');


// 使用者登入取得金鑰
router.post('/', userController.login);

module.exports = router;