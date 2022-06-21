const { StatusCodes } = require('http-status-codes');
const User = require('../models/User');
const cloudinary = require('cloudinary').v2;
const {mailHelper} = require('../utils/emailHelper');


const signup = async (req,res) => {

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
}

const login = async (req,res) => {
   const {email,password} = req.body;
   // validating the request
   if(!email || !password) {
      return res.status(StatusCodes.BAD_REQUEST).send('Please provide email and password');
   }
   // finding the user in the user if exist fetch the password
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
//    console.log(user)
   user.password = undefined;
   res.status(StatusCodes.CREATED).cookie('token',token,options).json({
            success: true,
            user: user ,
            token: token
   });
}

const logout = (req,res) => {
    res.status(200).cookie('token',null, {
        expires: new Date(Date.now()),
        httpOnly: true
    }).json({
        success: true ,
        message:'Logout success'
    })
}

const forgotpassword = async (req,res) => {
    // console.log(req.protocol);
    // console.log(req.hostname);
    // console.log(mailHelper);
    // res.json(req);
    const {email} = req.body;
    try {
        const user = await User.findOne({email});
        if(!user) {
            return res.status(400).send('Email not found as registered');
        }
        // console.log(user);
        const forgotToken = user.genForgotPasswordToken();
        await user.save({validateBeforeSave: false});
        // console.log(user);
        const protocol = req.protocol;
        const host = req.get('host')
        const myUrl = `${protocol}://${host}/api/v1/password/reset/${forgotToken}`;
        const message = `Copy paste this link in your url and hit enter \n\n ${myUrl}`;
        try {
            await mailHelper({
                email: user.email,
                subject:'Password reset',
                message
            })
            res.status(200).json({
                success: true
            })
        } catch(err) {
            user.forgotPassword = undefined;
            user.forgotPasswordExpiry = undefined;
            await user.save({validateBeforeSave: false});
            return res.status(500).json(err);
        }
    } catch(err) {
        res.status(500).send('Internal sever error.. Please try after some minutes');
    }
}


const resetpassword = 



module.exports = {
    signup ,
    login ,
    logout,
    forgotpassword
}