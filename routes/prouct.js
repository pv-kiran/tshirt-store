const express = require('express');
const router = express.Router();
const {testProduct , getAllProducts, getProductById, addProductReview, getProductReviewsById, deleteProductReview, } = require('../controllers/productController');
const { adminAddProduct ,adminGetAllProducts,adminUpdateProduct, adminDeleteProduct } = require('../controllers/adminController')
// const Product = require('../models/Product');
// const cloudinary = require('cloudinary').v2;
const { isAuthenticated , isAdmin} = require('../middleware/user');
// const Whereclause = require('../utils/whereClause');

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Razorpay = require('razorpay');


router.get('/testProduct' , testProduct)


router.post('/admin/add/product' , isAuthenticated , isAdmin, adminAddProduct )

router.get('/admin/product/all' , isAuthenticated,isAdmin , adminGetAllProducts)

router.get('/product/all', isAuthenticated, getAllProducts)

router.get('/product/:id' , isAuthenticated , getProductById)

router.put('/product/update/:id' , isAuthenticated , isAdmin , adminUpdateProduct)

router.delete('/product/delete/:id' , isAuthenticated , isAdmin , adminDeleteProduct)

router.put('/product/:productId/review' , isAuthenticated , addProductReview)


router.delete('/product/:id/review/' , isAuthenticated, deleteProductReview )


router.get('/product/:id/reviews/' , isAuthenticated , getProductReviewsById)


router.get('/stripe/key' , async (req,res) => {
    res.status(200).json({
        stripeKey: process.env.STRIPE_PUBLIC_KEY
    })
})

router.post('/stripe/payment' , async (req,res) => {
    const paymentIntent = await stripe.paymentIntents.create({
            amount: req.body.amount,
            currency: 'inr',
            automatic_payment_methods: {enabled: true},
    });

    res.status(200).json({
        success: true ,
        client_Secret: paymentIntent.client_secret
    })
})


router.get('/razorpay/key' , async (req,res) => {
    res.status(200).json({
        stripeKey: process.env.RAZOR_PAY_KEY
    })
})

router.post('/razorpay/payment' , async (req,res) => {
    var instance = new Razorpay(
        { 
            key_id: process.env.RAZOR_PAY_KEY, 
            key_secret: process.env.RAZOR_PAY_SECRET
        })

    const myOrder = instance.orders.create({
        amount: req.body.amount,
        currency: "INR",
        receipt: "receipt#1"
    });

    res.status(200).json({
        success: true ,
        amount: req.body.amount,
        order: myOrder
    });

})

module.exports = router;




// router.put('/product/:productId/review' , isAuthenticated , async (req,res) => {
//     const {rating , comment } = req.body;
//     const { productId } = req.params ;
//     const review = {
//         user: req.user._id ,
//         name: req.user.name,
//         rating: Number(rating) ,
//         comment
//     } ;
//     // console.log(review);
//     try {
//         const product = await Product.findById(productId);
//         if(!product) {
//             res.status(401).send('No product found with this id')
//         }
//         // console.log(product.reviews.length);
//         if(product.reviews.length > 0) {
           
//             const isReviewed = product.reviews.find(
//             (review) => {
//                 // console.log(review);
//                 return review.user.toString() === req.user._id.toString()
//             })
//             // console.log(`this is ${isReviewed}`);
//             if(isReviewed) {
//                 product.reviews.forEach((review) => {
//                     if(review.user.toString() === req.user._id.toString()) {
//                         review.rating = rating;
//                         review.comment = comment;
//                     }
//                 })
//                 await product.save({validateBeforeSave: false});
//             } else {
//                 addReview();
//             }
//         } else {
//             addReview();
//         }

//         const addReview = async () => {
//             product.reviews.push(review);
//             product.numberOfReviews = product.reviews.length;
//             product.ratings = product.reviews.reduce((acc, item) => item.rating + acc , 0) / product.reviews.length;
//             console.log(product);
//             await product.save({validateBeforeSave: false});
//         }
        
//         res.status(200).json({
//             success: true ,
//             reviews: product.reviews
//         })

//     } catch(err) {
//         console.log(err);
//     }
// })