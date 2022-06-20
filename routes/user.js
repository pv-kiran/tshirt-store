const express = require('express');
const router = express.Router();
const { signup, login, logout } = require('../controllers/userController');
// const uploadfile = require('express-fileupload');

router.post('/signup' , signup)

router.post('/login' , login)

router.post('/logout' , logout)
module.exports = router ;