const express = require('express');
const router = express.Router();
// const Order = require('../models/Order');
// const Product = require('../models/Product');
const {isAuthenticated, isAdmin} = require('../middleware/user')
const {createOrder, getOrder, getAllUserOrder} = require('../controllers/orderController');

const {adminGetAllOrders ,adminUpdateOrderById, adminDeleteOrderById} = require('../controllers/adminController');



router.post('/create/order' , isAuthenticated , createOrder);

router.get('/order/:id' , isAuthenticated , getOrder);

router.get('/user/orders' , isAuthenticated , getAllUserOrder);


router.get('/admin/orders' , isAuthenticated , isAdmin , adminGetAllOrders);

router.put('/admin/order/:id', isAuthenticated , isAdmin, adminUpdateOrderById);


router.delete('/admin/order/:id' , isAuthenticated , isAdmin , adminDeleteOrderById);



module.exports = router;




