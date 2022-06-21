const express = require('express');
const router = express.Router();
const { signup, login, logout,forgotpassword } = require('../controllers/userController');
const User = require('../models/User');
// const uploadfile = require('express-fileupload');


router.post('/signup' , signup);

router.post('/login' , login);

router.post('/logout' , logout);

router.post('/forgotpassword' , forgotpassword )



module.exports = router ;