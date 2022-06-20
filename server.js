const express = require('express');
const app = express();
const PORT = process.env.PORT || 4000;
require('dotenv').config();

// regular middlewares
app.use(express.json());
app.use(express.urlencoded({extended: false}));

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


app.use('/api/v1',home)

app.listen(PORT , () => {
    console.log(`Server is listening at ${PORT}`)
})