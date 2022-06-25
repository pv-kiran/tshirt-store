const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const productSchema = new Schema({
    name : {
        type: String ,
        required: [true , 'Please provide product name'] ,
        trim: true ,
        maxLength: [30 , 'Product name should not be moe than 30 characters']
    } ,
    price : {
        type: Number ,
        required: [true , 'Please provide product price'] ,
        maxLength: [5 , 'Product price should not be more than 5']
    } ,
    description : {
        type: String ,
        required: [true , 'Please provide product description'] 
    } ,
    photos : [
        {
            id: {
                type: String,
                required: [true , 'Image is required']
            } ,
            secure_url: {
                type: String,
                required: [true , 'Image is required']
            }
        } ,
    ] ,
    categories : {
        type: String ,
        required: [true , 'Please select category form - shortsleeves, longsleeves,sweatshirts, hoodies'] ,
        enum: {
            values: [
                'shortsleeves' ,
                'longsleeves',
                'sweatshirts' ,
                'hoodies'
            ] ,
            message: 'Please select category only form - short-sleeves, long-sleeves,sweat-shirts, hoodies'
        }
    } ,
    brand: {
        type: String ,
        required: [true , 'Please add a brand for clothing']
    } ,
    ratings: {
        type: Number ,
        default: 0
    } ,
    stock: {
        type: Number,
        required: [true, 'Please provide number of items in stock']
    } ,
    numberOfReviews: {
        type: Number ,
        default: 0
    },
    reviews: [
        {
            user: {
            type: mongoose.Schema.ObjectId ,
            ref: 'user' ,
            required: true
        } ,
        name: {
            type : String ,
            required: true
        } ,
        rating: {
            type: Number ,
            required: true
        } ,
        comment: {
            type: String ,
            required: true
        }
        }
        
    ] ,
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'user',
        required: true
    } ,
    createdAt: {
        type: Date ,
        default: Date.now()
    }
})



const Product = mongoose.model('product' , productSchema);
module.exports = Product;

// name
// price
// description
// images [{id,url}]
// category : enums
// brand
// stock
// ratings
// numOfreviews
// reviews[user,name,rating,comment]
// user
// createdAt