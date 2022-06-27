const Product = require('../models/Product');
const cloudinary = require('cloudinary').v2;
const Whereclause = require('../utils/whereClause');


const testProduct = (req,res) => {
    res.status(200).send('Welcome to product route');
};

const getAllProducts = async (req,res) => {
    const resultPerPage = 6 ;
    let products = new Whereclause(Product.find() , req.query).search().filter();
    
    products.pagination(resultPerPage);
    products = await products.base;
    
    res.status(200).json({
        success: true ,
        products ,
        productCount: products.length
    })
}

const getProductById = async (req,res) => {
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
}

const addProductReview = async (req,res) => {
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
}

const getProductReviewsById = async (req,res) => {
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
}

const deleteProductReview = async (req,res) => {
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
    
}

module.exports = {
    testProduct , 
    getAllProducts,
    getProductById ,
    addProductReview ,
    getProductReviewsById ,
    deleteProductReview
};