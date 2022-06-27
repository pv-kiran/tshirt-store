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

const resetPassword = async (req, res) => {
    // console.log('Hello');
    // const {password , confirmPassword} = req.body;
    const token = req.params.token;
    // console.log(typeof token);
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
}

const userdetails = async (req,res) => {
    const user = await User.findById(req.user.id);
    if(!user) {
        res.status(404).send('User no found')
    } 
    res.status(200).json({
        success: true,
        user: user
    })
}

const updatePassword =  async (req,res) => {
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
}

const userUpdate = async (req,res) => {
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
        console.log(err);
        res.status(500).send('Internal server error');
    }
}


module.exports = {
    signup ,
    login ,
    logout,
    forgotpassword, 
    resetPassword,
    userdetails,
    updatePassword,
    userUpdate 
}