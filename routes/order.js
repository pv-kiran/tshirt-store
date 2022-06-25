const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const {isAuthenticated, isAdmin} = require('../middleware/user')


router.post('/create/order' , isAuthenticated , async (req,res) => {
    const {shippingInfo , orderItems , paymentInfo , taxAmount , shippingAmount , totalAmount } = req.body ;
    const order = await Order.create({
        shippingInfo , 
        orderItems , 
        paymentInfo , 
        taxAmount , 
        shippingAmount , 
        totalAmount ,
        user: req.user._id
    });
    res.status(200).json({
        success: true ,
        order
    })
})

router.get('/order/:id' , isAuthenticated , async (req,res) => {
    const { id }  = req.params;
    const order = await Order.findById(id).populate('user',['name' ,'email']);
    if(!order) {
        res.status(401).send('No order found');
    } 
    res.status(200).json({
        success: true ,
        order
    })
})

router.get('/user/orders' , isAuthenticated , async (req,res) => {
  const orders = await Order.find({user: req.user._id});
  if(!orders) {
    res.status(401).send('No orders by this user');
  } 
  res.status(200).json({
     success: true,
     orders
  })
})


router.get('/admin/orders' , isAuthenticated , isAdmin , async (req,res) => {
    const orders = await Order.find();
    if(!orders) {
       res.status(401).send('No Orders are avilable');
    }
    res.status(200).json({
        success: true ,
        orders
    })
})

router.put('/admin/order/:id', isAuthenticated , isAdmin, async (req,res) => {
   const {id} = req.params;
   const order = await Order.findById(id);
   if(!order) {
      res.status(401).send('No order found with this Id')
   }
   if(order.orderStatus === 'Delivered') {
      res.status(404).send('Order is all ready marked as delivered');
   }
   order.orderStatus = req.body.orderStatus;
   const updateStock = async (productId , quantity) => {
        const product = await Product.findById(productId);
        if(!product) {
            return res.status(401).send('No product found in stock with this id');
        }
        product.stock = product.stock - quantity;
        product.save({validateBeforeSave: false});
   }
   order.orderItems.forEach(
     async (order) => {
        await updateStock(order.product , order.quantity)
     }
   )
   
   await order.save({validateBeforeSave: false});
   res.status(200).json({
     success: true ,
     order
   });
})


router.delete('/admin/order/:id' , isAuthenticated , isAdmin , async (req,res) =>  {
    const { id } = req.params ;
    const order = await Order.findById(id);
    if(!order) {
        res.status(401).send(`Order doesn't exist with this id`);
    }
    await order.remove();
    res.status(200).json({
        success: true ,
        message: 'Deleted the order'
    })
})

router.get('/get' , (req,res) => {
    console.log(req.query);
})





module.exports = router;




