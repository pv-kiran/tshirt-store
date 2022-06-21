const express = require('express');
const router = express.Router();
const { signup, login, logout } = require('../controllers/userController');
const User = require('../models/User');
// const uploadfile = require('express-fileupload');

const {mailHelper} = require('../utils/emailHelper');

router.post('/signup' , signup);

router.post('/login' , login);

router.post('/logout' , logout);

router.post('/forgotpassword' , async (req,res) => {
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
        const myUrl = `${req.protocol}://${req.hostname}/password/reset/${forgotToken}`;
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
})



module.exports = router ;