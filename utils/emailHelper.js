const nodemailer = require('nodemailer');

const mailHelper = async(options) => {
  
  // console.log('Email');
  let transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD
    }
  });

  let message = {
        from: 'kiranpv903@mail.com', // sender address
        to: options.email, // list of receivers
        subject: options.subject, // Subject line
        text: options.message, // plain text body
   }
  // send mail with defined transport object
   await transporter.sendMail(message);

}


module.exports = {
  mailHelper
};