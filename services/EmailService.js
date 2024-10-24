const nodemailer = require('nodemailer');
require('dotenv').config();
// Create a transporter for Outlook
const transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.BREVO_ACC, // Your Outlook email
      pass: process.env.BREVO_KEY, // Your Outlook password
    },
  });
const sendEmailService = async (req) => { 
    const { email, subject, text } = req.body;
    // Define the email options
    const mailOptions = {
        from: 'automaticemail.hoangtu@gmail.com',
        to: email,
        subject: subject,
        html: `<h1>Hoang Tu</h1><p>${text}</p>`
    };
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log(error);
      } else {
          console.log('Email sent: ' + info.response);
      }
      });
    };
module.exports = {sendEmailService}; //export default