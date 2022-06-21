const express = require('express');
const app = express();
const PORT = process.env.PORT || 4000;
require('dotenv').config();
const  cloudinary = require('cloudinary').v2;
app.set('view engine' , 'ejs');


// configuration for fileupload
const fileUpload = require('express-fileupload');
app.use(fileUpload({
    useTempFiles : true,
    tempFileDir : '/tmp/'
}))

// regular middlewares
app.use(express.json());
app.use(express.urlencoded({extended: false}));

const cookieParser = require('cookie-parser')
app.use(cookieParser())

// db connectivity using mongoose
const connect = require('./config/db');
const User = require('./models/User');
connect()
    .then(() => {
        console.log('Connection successfull');
    })
    .catch(err => console.log(err));



// router middlewares
const home = require('./routes/home');
const user = require('./routes/user');
app.use('/api/v1',home);
app.use('/api/v1',user);


app.get('/signup' , (req,res) => {
    res.render('signup')
})

// cloudinary configuration
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_NAME, 
  api_key: process.env.CLOUDINARY_KEY, 
  api_secret: process.env.CLOUDINARY_SECRET
});



app.listen(PORT , () => {
    console.log(`Server is listening at ${PORT}`)
})