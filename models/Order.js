const mongoose = require('mongoose');
const Schema = mongoose.Schema ;
const orderSchema = new Schema({
   shippingInfo : {
      address: {
         type: String ,
         required: true
      },
      city: {
         type: String ,
         required: true
      } ,
      phoneNumber: {
         type: String ,
         required: true
      } ,
      postalCode: {
         type: String ,
         required: true
      } ,
      state: {
         type: String ,
         required: true
      } ,
      country: {
         type: String ,
         required: true
      }
   } ,
   user: {
     type: mongoose.Schema.ObjectId,
     ref: 'user',
     required: true
   },
   orderItems: [
      {
        name: {
            type: String ,
            required: true
        } ,
        quantity: {
            type: Number ,
            required: true
        } ,
        image: {
            type: String ,
            required: true
        } ,
        price: {
            type: Number ,
            required: true
        } ,
        product: {
            type: mongoose.Schema.ObjectId ,
            ref: 'product',
            required: true
        }
      }
   ] ,
   paymentInfo: {
        id: {
            type: String
        }
   } ,
   taxAmount: {
     type: Number ,
     required: true
   } ,
   shippingAmount: {
     type: Number ,
     required: true
   } ,
   totalAmount: {
     type: Number ,
     required: true
   }  ,
   orderStatus: {
      type: String,
      required: true ,
      default: 'Processing'
   } , 
   deliveredAt: {
      type: Date
   } ,
   createdAt: {
      type: Date ,
      default: Date.now()
   }
})



const Order = mongoose.model('order', orderSchema);

module.exports = Order;

// shippingInfo: { phnNo , Address, city,PO,country} ,
// User,
// paymentInfo: {},
// taxAmount,
// shippingAmount,
// totalAmount,
// orderStatus,
// deliveredAt,
// createdAt
// orderItems: [{}]
// -name
// quantity
// image[]
// price
// product