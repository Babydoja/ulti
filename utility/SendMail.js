// // const nodemailer = require('nodemailer');

// // const sendMail = async (subject, message, send_to, sent_from, reply_to) => {
// //     // create email transporter
// //     const transporter = nodemailer.createTransport({
// //         host: process.env.EMAIL_HOST,
// //         port: 587,
// //         auth: {
// //             user: process.env.EMAIL_USER,
// //             pass: process.env.EMAIL_PASSWORD
// //         },
// //         tls: {
// //             rejectUnauthorized: false
// //         }
// //     });

// //     // options for sending mail
// //     const options = {
// //         from: sent_from,
// //         to: send_to,
// //         replyTo: reply_to,
// //         subject: subject,
// //         html: message
// //     };

// //     // send mail
// //     try {
// //         const info = await transporter.sendMail(options);
// //         console.log('Email sent: ', info.response);
// //     } catch (err) {
// //         console.error('Error sending email: ', err);
// //     }
// // };

// // module.exports = sendMail;
// // const email = require('emailjs');

// // const server = email.server.connect({
// //     user: process.env.EMAIL_USER,
// //     password: process.env.EMAIL_PASSWORD,
// //     host: process.env.EMAIL_HOST,
// //     ssl: {
// //         rejectUnauthorized: false,
// //     },
// // });

// // const sendMail = async (subject, message, send_to, sent_from, reply_to) => {
// //     const emailMessage = {
// //         text: message,
// //         from: sent_from,
// //         to: send_to,
// //         subject: subject,
// //         'reply-to': reply_to,
// //     };

// //     try {
// //         const response = await new Promise((resolve, reject) => {
// //             server.send(emailMessage, (err, message) => {
// //                 if (err) {
// //                     return reject(err);
// //                 }
// //                 resolve(message);
// //             });
// //         });
// //         console.log('Email sent: ', response);
// //     } catch (err) {
// //         console.error('Error sending email: ', err);
// //     }
// // };

// // module.exports = sendMail;




// // new 

// const nodemailer = require("nodemailer");

// const sendMail = async (subject, message, send_to, sent_from, reply_to) => {
//     // Create a transporter object
//     const transporter = nodemailer.createTransport({
//         service: 'gmail', // or your preferred email service
//         auth: {
//             user: process.env.EMAIL_USER, // Your email address from the environment variable
//             pass: process.env.EMAIL_PASSWORD, // Your email password from the environment variable
//         },
//         tls: {
//             rejectUnauthorized: false,
//         },
//     });

//     // Define the email options
//     const mailOptions = {
//         from: sent_from,
//         to: send_to,
//         subject: subject,
//         text: message,
//         replyTo: reply_to,
//     };

//     try {
//         // Send the email
//         const response = await transporter.sendMail(mailOptions);
//         console.log('Email sent: ', response);
//     } catch (err) {
//         console.error('Error sending email: ', err);
//     }
// };

// module.exports = sendMail;



const nodemailer = require("nodemailer");
const otpVerification = require("../model/otpVerification");
const bcrypt = require('bcrypt');

module.exports.sendEmail = async function (email, otp, id, subject, text) {
  try {
    const saltRounds = 10;
    const hashedOTP = await bcrypt.hash(otp, saltRounds);

    const newOtpVerification = new otpVerification({
      userId: id,
      otp: hashedOTP, // Save the hashed OTP
      createdAt: Date.now(),
      expiresAt: Date.now() + 3600000 // OTP expires in 1 hour
    });

    // Save OTP to the database
    await newOtpVerification.save();

    // Create a transporter object
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER, // Your email address from the environment variable
        pass: process.env.EMAIL_PASSWORD, // Your email password from the environment variable
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    // Define the email options
    const mailOptions = {
      from: 'admin@gmail.com', // You can also use process.env.EMAIL_USER here
      to: email,
      subject: subject,
      text: text,
      html: `<p>Your OTP is <strong>${otp}</strong>. It expires in 1 hour.</p>`, // Use backticks for string interpolation
    };

    // Send email
    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log('Email sent: ' + info.response);
      }
    });
  } catch (error) {
    console.log(error);
  }
};
