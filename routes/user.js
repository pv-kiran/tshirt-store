const express = require('express');
const router = express.Router();

const { signup, login, logout,forgotpassword, resetPassword,  userdetails, updatePassword, userUpdate } = require('../controllers/userController');

const {adminAllUsers, adminGetUserById, adminUpdateUserById, adminDeleteUserById} = require('../controllers/adminController')


// const User = require('../models/User');
// // const uploadfile = require('express-fileupload');
// const { StatusCodes } = require('http-status-codes');
// const cloudinary = require('cloudinary').v2;


const {isAuthenticated , isAdmin  } = require('../middleware/user');


router.post('/signup' , signup);

router.post('/login' , login);

router.post('/logout' , logout);

router.post('/forgotpassword' , forgotpassword )

router.post('/password/reset/:token' , resetPassword);

router.get('/userdetails', isAuthenticated , userdetails );


router.post('/password/update', isAuthenticated ,updatePassword)

router.put('/user/update' , isAuthenticated , userUpdate )

router.get('/admin/users' , isAuthenticated, isAdmin ,adminAllUsers )

router.get('/admin/user/:id' , isAuthenticated , isAdmin, adminGetUserById)

router.put('/admin/user/:id' , isAuthenticated, isAdmin , adminUpdateUserById)

router.delete('/admin/user/:id' , isAuthenticated, isAdmin , adminDeleteUserById)


module.exports = router ;



// router.get('/manager/users' ,isAuthenticated, isManager , async (req,res) => {
//      const user = await User.find({role: 'user'});
//      if(!user) {
//         res.status(404).send('No user found');
//      } 
//      res.status(200).json(user);
// } )