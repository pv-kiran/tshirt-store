const User = require('../models/User');
const jwt = require('jsonwebtoken');


const isAuthenticated = async (req,res,next) => {
    // console.log(req);
    // console.log(req.headers.authorization);
    if(!(req.cookies.token || req.headers.authorization)) {
        res.status(401).send('Please login before accessing this page');
    }

    const token = req.cookies.token || req.headers.authorization.replace('Bearer ' , '');
    const decoded =  jwt.verify(token,process.env.JWT_SECRET);
    // console.log(decoded);
    req.user = await User.findById(decoded.id);
    next();
} 

const isAdmin = (req,res,next) => {
    if(req.user.role === 'admin') {
        next();
    } else {
        res.status(401).send('You are not allowed to use this resource');
    }
}
// const isManager = (req,res,next) => {
//     if(req.user.role === 'manager') {
//         next();
//     } else {
//         res.status(401).send('You are not allowed to use this resource');
//     }
// }


module.exports = {
    isAuthenticated,
    isAdmin ,
    // isManager
};