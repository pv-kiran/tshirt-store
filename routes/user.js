const express = require('express');
const router = express.Router();
const { signup, login, logout,forgotpassword } = require('../controllers/userController');
const User = require('../models/User');
// const uploadfile = require('express-fileupload');
const { StatusCodes } = require('http-status-codes');
const cloudinary = require('cloudinary').v2;
const {isAuthenticated , isAdmin , isManager }= require('../middleware/user');


router.post('/signup' , signup);

router.post('/login' , login);

router.post('/logout' , logout);

router.post('/forgotpassword' , forgotpassword )

router.post('/password/reset/:token' , async (req, res) => {
    const {password , confirmPassword} = req.body;
    const token = req.params.token;
    console.log(typeof token);
    if(!password || !confirmPassword) {
        res.status(400).send('Please provide a new password');
    }
    try {
        const user = await User.findOne({
          forgotPassword: req.params.token ,
        })
        console.log(`${user} is here`);
        if(!user) {
           res.status(400).send('Token is invalid or expired');
        }
        if(req.body.password !== req.body.confirmPassword) {
           res.status(400).send('Password and confirm password do not match');
        }
        user.password = req.body.password;
        user.forgotPassword = undefined;
        user.forgotPasswordExpiry = undefined;
        await user.save({validateBeforeSave: false});
        const token = user.getJWTtoken();
        // console.log(token);
        // console.log(1);
        const options = {
            expires: new Date(
                Date.now() + 3*24*60*60*1000
            ) ,
            httpOnly: true
        }
       //    console.log(user)
        user.password = undefined;
        res.status(StatusCodes.CREATED).cookie('token',token,options).json({
                    success: true,
                    user: user ,
                    token: token
        });
    } catch (err) {
        console.log(err);
        res.status(500).send('Internal server error');
    }
    
});

router.get('/userdashboard', isAuthenticated , async (req,res) => {
    const user = await User.findById(req.user.id);
    if(!user) {
        res.status(404).send('User no found')
    } 
    res.status(200).json({
        success: true,
        user: user
    })
})


router.post('/password/update', isAuthenticated , async (req,res) => {
    // const {oldPassword , newPassword } = req.body;
    // console.log(oldPassword);
    // console.log(newPassword);
    const userId = req.user.id;
    console.log(userId);
    try {
            const user = await User.findById(userId).select('password');
            console.log(user);
            if(!user) {
                res.send(404).send('user not found');
            }
            const isPasswordCorrect = await user.isValidatedPassword(req.body.oldPassword);
            console.log(isPasswordCorrect);
            if(!isPasswordCorrect) {
                res.status(400).send('Old password is incorrect')
            }
            user.password = req.body.newPassword;
            const updatedUser = await user.save();
            console.log(updatedUser);

            // dealing the token genaration and setting up the cookies after password updation
            const token = user.getJWTtoken();
            const options = {
                expires: new Date(
                    Date.now() + 3*24*60*60*1000
                ) ,
                httpOnly: true
            }
            //    console.log(user)
            user.password = undefined;
            res.status(StatusCodes.CREATED).cookie('token',token,options).json({
                        success: true,
                        user: user ,
                        token: token
            });

    } catch(err) {
        console.log(err);
        res.status(500).send('Internal server error please try sometimes later');
    }
})

router.put('/user/update' , isAuthenticated ,async (req,res) => {
    const userId = req.user.id;
    if(!req.body.name || !req.body.email) {
        res.status(400).send('Please provide name and email for updation');
    }
    const newData = {
        name: req.body.name,
        email: req.body.email
    }

    if(req.files) {
       
        try {

            const user = await User.findById(req.user.id);
            const imgId = user.photo.id;

            // delete photo on cloudinary
            const resp = await cloudinary.uploader.destroy(imgId);

            // adding new photo to cloudinary
            let result = await cloudinary.uploader.upload(req.files.photo.tempFilePath ,{
                            folder:'users',
                            width: 150,
                            crop:'scale'
                         })

            newData.photo = {
                id: result.public_id ,
                secure_url: result.secure_url
            };

        } catch (err) {
            res.status(500).json(err);
        }


    }

    try {
      const user = await User.findByIdAndUpdate(userId , req.body , {
        new: true,
        runValidators: true
      })
      if(!user) {
            res.status(400).send('User is not registered');
      }
      res.status(200).send('Updated successfully');
    } catch(err) {
        res.status(500).send('Internal server error');
    }

    
})


router.get('/admin/users' , isAuthenticated, isAdmin,async (req,res) => {
   const users = await User.find();
   res.status(200).json({
        success: true ,
        users
   })
})

router.get('/admin/user/:id' , isAuthenticated , isAdmin,async (req,res) => {
    const {id} = req.params;
    try {
         const user = await User.findById(id);
         if(!user) {
            res.status(401).send('User not found');
         }
         res.status(200).json(user);
    } catch(err) {
        res.status(404).send('Something went wrong');
    }
})

router.put('/admin/user/:id' , isAuthenticated, isAdmin ,async (req,res) => {
    const {id} = req.params
    if(!req.body.name || !req.body.email || !req.body.role) {
        res.status(400).send('Please provide name and email for updation');
    }
    const newData = {
        name: req.body.name,
        email: req.body.email,
        role: req.body.role
    }


    try {
      const user = await User.findByIdAndUpdate(id , req.body , {
        new: true,
        runValidators: true
      })
      if(!user) {
            res.status(400).send('User is not registered');
      }
      res.status(200).send('Updated successfully');
    } catch(err) {
        res.status(500).send('Internal server error');
    }

    
})

router.delete('/admin/user/:id' , isAuthenticated, isAdmin ,async (req,res) => {
    const {id} = req.params
    try {
        const user = await User.findById(id);
        if(!user) {
            res.status(401).send('No user found')
        }
        const imgId = user.photo.id;
        await cloudinary.uploader.destroy(imgId);
        await user.remove();
        res.status(200).send('Deleted');
    } catch (err) {
        res.status(404).send('User not found');
    }
})


router.get('/manager/users' ,isAuthenticated, isManager , async (req,res) => {
     const user = await User.find({role: 'user'});
     if(!user) {
        res.status(404).send('No user found');
     } 
     res.status(200).json(user);
} )
module.exports = router ;