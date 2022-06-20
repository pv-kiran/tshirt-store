const express = require('express');
const router = express.Router();
const { StatusCodes } = require('http-status-codes')
const User = require('../models/User');
// const uploadfile = require('express-fileupload');
const cloudinary = require('cloudinary').v2;

router.post('/signup' , async (req,res) => {

    const {name , email , password} = req.body;
    // validating the user request
    if(!email || !name || !password) {
        return res.status(StatusCodes.BAD_REQUEST).send('Please provide all the required fields');
    }
    if(!req.files) {
        return res.status(StatusCodes.BAD_REQUEST).send('Please upload the profile photo')
    }
    
    // handling the uploading of files
    let result;
    if(req.files) {
        try {
            let file = req.files.photo;
            result = await cloudinary.uploader.upload(file.tempFilePath ,{
                folder:'users',
                width: 150,
                crop:'scale'
            })
        } catch (err) {
            return res.status(StatusCodes.BAD_REQUEST).json(err);
        }
    } 

    
    try {
        const user = await User.create({
            name,
            email,
            password ,
            photo: {
                id: result.public_id ,
                secure_url: result.secure_url
            }
        }) 
        console.log(user);
        const token = user.getJWTtoken();
        console.log(token);
        console.log(1);
        const options = {
            expires: new Date(
                Date.now() + 3*24*60*60*1000
            ) ,
            httpOnly: true
        }
        user.password = undefined;
        res.status(StatusCodes.CREATED).cookie('token',token,options).json({
            success: true,
            user: user ,
            token: token
        });
    } catch (err) {
       return res.status(StatusCodes.BAD_REQUEST).json(err);
    }
})

router.post('/login' , async (req,res) => {
   const {email,password} = req.body;
   // validating the request
   if(!email || !password) {
      return res.status(StatusCodes.BAD_REQUEST).send('Please provide email and password');
   }
   // finding the user in the user
   const user = await User.findOne({email:email}).select('password');
   if(!user) {
      return res.status(StatusCodes.BAD_REQUEST).send('User is not registered to the system');
   }
   // checking the password
   const isPasswordCorrect = await user.isValidatedPassword(password);
   if(!isPasswordCorrect) {
      return res.status(StatusCodes.BAD_REQUEST).send('Email or Password is incorrect');
   }
   const token = user.getJWTtoken();
        // console.log(token);
        // console.log(1);
        const options = {
            expires: new Date(
                Date.now() + 3*24*60*60*1000
            ) ,
            httpOnly: true
        }
        user.password = undefined;
        res.status(StatusCodes.CREATED).cookie('token',token,options).json({
            success: true,
            user: user ,
            token: token
        });
})

router.post('/logout' , (req,res) => {
    res.status(200).cookie('token',null, {
        expires: new Date(Date.now()),
        httpOnly: true
    }).json({
        success: true ,
        message:'Logout success'
    })
})
module.exports = router ;