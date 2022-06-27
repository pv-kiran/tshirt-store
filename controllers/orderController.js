const Order = require('../models/Order');
const Product = require('../models/Product');

const createOrder = async (req,res) => {
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
}

const getOrder = async (req,res) => {
    const { id }  = req.params;
    const order = await Order.findById(id).populate('user',['name' ,'email']);
    if(!order) {
        res.status(401).send('No order found');
    } 
    res.status(200).json({
        success: true ,
        order
    })
}

const getAllUserOrder = async (req,res) => {
  const orders = await Order.find({user: req.user._id});
  if(!orders) {
    res.status(401).send('No orders by this user');
  } 
  res.status(200).json({
     success: true,
     orders
  })
}


module.exports = {
    createOrder,
    getOrder,
    getAllUserOrder 
};