const express = require('express');
const router = express.Router();
const {testProduct} = require('../controllers/productController');
const Product = require('../models/Product');
const cloudinary = require('cloudinary').v2;
const { isAuthenticated , isAdmin} = require('../middleware/user');
const Whereclause = require('../utils/whereClause');

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Razorpay = require('razorpay');


router.get('/testProduct' , testProduct)


router.post('/admin/add/product' , isAuthenticated , isAdmin, async (req,res) => {
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
})

router.get('/admin/product/all' , isAuthenticated,isAdmin , async (req,res) => {
    const products = await Product.find({});
    res.status(200).json({
        success: true ,
        products
    })

})


router.get('/product/all', isAuthenticated,async (req,res) => {
    const resultPerPage = 6 ;
    let products = new Whereclause(Product.find() , req.query).search().filter();
    
    products.pagination(resultPerPage);
    products = await products.base;
    
    res.status(200).json({
        success: true ,
        products ,
        productCount: products.length
    })
})

router.get('/product/:id' , isAuthenticated , async (req,res) => {
    const {id} = req.params;
    const product = await Product.findById(id);
    if(!product) {
        res.status(401).json({
            message: 'No product found with the given Id',
            id: id
        })
    }
    res.status(200).json({
        success: true ,
        product
    })
})


router.put('/product/update/:id' , isAuthenticated , isAdmin , async (req,res) => {
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
})

router.delete('/product/delete/:id' , isAuthenticated , isAdmin , async (req,res) => {
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
})

router.put('/product/:productId/review' , isAuthenticated ,async (req,res) => {
    const {productId} = req.params;
    const {rating , comment} = req.body ;
    const review = {
        user: req.user._id ,
        name: req.user.name ,
        rating:  Number(rating) ,
        comment
    }
    try {
        const product = await Product.findById(productId);
        const isReviewed = product.reviews.find(review => review.user.toString() === req.user._id.toString()); 
        if(isReviewed) {
            product.reviews.forEach(review => {
                if(review.user.toString() === req.user._id.toString()) {
                    review.rating = rating;
                    review.comment = comment;
                }
            })
            product.numberOfReviews = product.reviews.length;
            product.ratings = product.reviews.reduce((acc, item) => item.rating + acc , 0) / product.numberOfReviews;
            // console.log(totalratings);
            // console.log(product);
            product.save({validateBeforeSave: false});
            return res.status(200).json({
                success: true ,
                message: 'review has been updated'
            })
        }
        product.reviews.push(review);
        product.numberOfReviews = product.reviews.length;
        product.ratings = product.reviews.reduce((acc, item) => item.rating + acc , 0) / product.numberOfReviews;
            // console.log(totalratings);
            // console.log(product);
        product.save({validateBeforeSave: false});
        res.status(200).json({
            success: true ,
            message: 'review is added'
        })
    } catch (err) {
        console.log(err);
    }
})


router.delete('/product/:id/review/' , isAuthenticated, async (req,res) => {
    const  { id } = req.params;
    try {

        const product = await Product.findById(id);
        const reviews = product.reviews.filter(
            (review) => review.user.toString() !== req.user._id.toString()
        ) ;
        // console.log(reviews);
        const numberOfReviews = reviews.length;

        const ratings = reviews.reduce((acc, item) => item.rating + acc , 0) / product.reviews.length;

        await Product.findByIdAndUpdate(id , {
                reviews,
                ratings,
                numberOfReviews
            } , {
                new: true ,
                runValidators: true
            }
        )
        res.status(200).json({
            success: true ,
            message: 'Deleted Successfully'
        })


    } catch (err) {
         console.log(err);
    }
    
})


router.get('/product/:id/reviews/' , isAuthenticated ,async (req,res) => {
    const {id} = req.params;
    try {
       const product = await Product.findById(id);
       if(!product) {
         res.status(401).send('Product not found');
       }
       res.status(200).json({
         success: true ,
         reviews: product.reviews
       })
    } catch (err) {
        console.log(err);
    }
})


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