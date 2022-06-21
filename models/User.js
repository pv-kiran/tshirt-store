const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const userSchema = new Schema({
  name: {
     type: String,
     required: [true , 'Please provide a name'] ,
     maxLength : [15, 'Name should be under 15 characters']
  } , 
  email : {
    type: String,
    required: [true , 'Please provide a email'] ,
    validate: [validator.isEmail , 'Please enter a valid email'] ,
    unique: true
  } ,
  password : {
    type: String,
    required: [true , 'Please provide a password'] ,
    minLength: [6 , 'Password should be at least 6 characters'] ,
    select: false
  } ,
  role : {
    type: String,
    default: 'user'
  } ,
  photo : {
      id: {
        type: String,
        required: [true , 'Please upload a image']
      } ,
      secure_url: {
        type: String,
        required: [true , 'Please upload a image']
      }
  } ,
  forgotPassword : String ,
  forgotPasswordExpiry: Date,
  createdAt: {
    type: String,
    default: Date.now()
  }
})

// middlware for encrypting the password
userSchema.pre('save' , async function(req,res,next) {
  if (!this.isModified('password')) {
    return next();
  }
  this.password = await bcrypt.hash(this.password, 10)
})

// middlware for checking the passsword
userSchema.methods.isValidatedPassword = async function(userPassowrd) {
   return await bcrypt.compare(userPassowrd , this.password)
}

// creating the jwt token
userSchema.methods.getJWTtoken =  function () {
   console.log('Invoked');
   console.log(process.env.JWT_SECRET)
   console.log(process.env.JWT_EXPIRY)

   return jwt.sign({id: this._id} , process.env.JWT_SECRET ,{expiresIn: process.env.JWT_EXPIRY})
}

// creating forgot password token
userSchema.methods.genForgotPasswordToken = function() {
  console.log('Hello');
   const forgotToken = crypto.randomBytes(20).toString();
   console.log(forgotToken);
   this.forgotPassword = forgotToken;

   this.forgotPasswordExpiry = Date.now() + 20 *60 *1000

   return forgotToken;
}



const User = mongoose.model('user', userSchema);
module.exports = User;