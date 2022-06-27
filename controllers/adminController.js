const { StatusCodes } = require('http-status-codes');
const User = require('../models/User');
const cloudinary = require('cloudinary').v2;
// const {mailHelper} = require('../utils/emailHelper');
const Product = require('../models/Product');
// const Whereclause = require('../utils/whereClause');
const Order = require('../models/Order');

// Admin controllers - For user management

const adminAllUsers =  async (req,res) => {
   const users = await User.find();
   res.status(200).json({
        success: true ,
        users
   })
}

const adminGetUserById = async (req,res) => {
    const {id} = req.params;
    try {
         const user = await User.findById(id);
         if(!user) {
            res.status(401).send('User not found');
         }
         res.status(200).json(user);
    } catch(err) {
        res.status(404).send('Something went wrong');
    }
}

const adminUpdateUserById = async (req,res) => {
    const {id} = req.params
    if(!req.body.name || !req.body.email || !req.body.role) {
        res.status(400).send('Please provide name and email for updation');
    }
    const newData = {
        name: req.body.name,
        email: req.body.email,
        role: req.body.role
    }


    try {
      const user = await User.findByIdAndUpdate(id , req.body , {
        new: true,
        runValidators: true
      })
      if(!user) {
            res.status(400).send('User is not registered');
      }
      res.status(200).send('Updated successfully');
    } catch(err) {
        res.status(500).send('Internal server error');
    }

    
}

const adminDeleteUserById = async (req,res) => {
    const {id} = req.params
    try {
        const user = await User.findById(id);
        if(!user) {
            res.status(401).send('No user found')
        }
        const imgId = user.photo.id;
        await cloudinary.uploader.destroy(imgId);
        await user.remove();
        res.status(200).send('Deleted');
    } catch (err) {
        res.status(404).send('User not found');
    }
}

// Admin controllers - For Product management

const adminAddProduct = async (req,res) => {
     console.log(req.files);
     // images
     let imgArr = [];
     if(!req.files) {
        res.status(400).send('Please upload the images');
     }
     try {
        // if(typeof req.files.photos === 'object')
        for (let index = 0; index < req.files.photos.length; index++) {
                // looping through the files and uploading those to cloudinary and storing cloudinary url to mongoDb
                try {
                    let result = await cloudinary.uploader.upload(req.files.photos[index].tempFilePath , {
                        folder: "products"
                    })
                    console.log(result);
                    imgArr.push({
                        id: result.public_id,
                        secure_url: result.secure_url
                    })
                } catch (err) {
                     console.log(err);
                }
        }
     } catch (err) {
         console.log(err);
     }
     req.body.photos = imgArr;
     req.body.user = req.user.id;
     try {
        const product = await Product.create(req.body);
        res.status(201).json({
            success: true ,
            product: product
        })
     } catch(err) {
        console.log(err);
     } 
}

const adminGetAllProducts =  async (req,res) => {
    const products = await Product.find({});
    res.status(200).json({
        success: true ,
        products
    })

}

const adminUpdateProduct = async (req,res) => {
    const {id} = req.params;
    let imgArr = [];
    try {
            let product = await Product.findById(id);
            if(!product) {
                res.status(401).json({
                    message: 'No product found with the given Id',
                    id: id
                })
            }
            if(req.files) {
                // delete the existing images  
                for (let index = 0; index < product.photos.length; index++) {
                    const result = await cloudinary.uploader.destroy(product.photos[index].id);
                }
                // upload and save the new images
                for (let index = 0; index < req.files.photos.length; index++) {
                        // looping through the files and uploading those to cloudinary and storing cloudinary url to mongoDb
                        try {
                            let result = await cloudinary.uploader.upload(req.files.photos[index].tempFilePath , {
                                folder: "products"
                            })
                            console.log(result);
                            imgArr.push({
                                id: result.public_id,
                                secure_url: result.secure_url
                            })
                        } catch (err) {
                            console.log(err);
                        }
                }
            }
            req.body.photos = imgArr;
            product = await Product.findByIdAndUpdate(id, req.body , {
                new: true ,
                runValidators: true
            })
            res.status(200).json({
                success: true,
                product
            })

    } catch (err) {
        console.log(err);
    }
}

const adminDeleteProduct = async (req,res) => {
    const {id} = req.params;
    let product = await Product.findById(id);
    if(!product) {
        res.status(401).json({
            message: 'No product found with the given Id',
            id: id
        })
    }
    for (let index = 0; index < product.photos.length; index++) {
        const result = cloudinary.uploader.destroy(product.photos[index].id);
    }

    product.remove();

    res.status(200).json({
        success: true,
        message: 'Deleted the product'
    })
}


// Admin controllers - For Order mangement
const adminGetAllOrders = async (req,res) => {
    const orders = await Order.find();
    if(!orders) {
       res.status(401).send('No Orders are avilable');
    }
    res.status(200).json({
        success: true ,
        orders
    })
}

const adminUpdateOrderById = async (req,res) => {
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
}

const adminDeleteOrderById = async (req,res) =>  {
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
}

module.exports = {
    adminAllUsers ,
    adminGetUserById ,
    adminUpdateUserById,
    adminDeleteUserById ,
    adminAddProduct ,
    adminGetAllProducts ,
    adminUpdateProduct ,
    adminDeleteProduct ,
    adminGetAllOrders ,
    adminUpdateOrderById ,
    adminDeleteOrderById
}