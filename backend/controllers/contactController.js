const asyncErrorHandler = require('../middlewares/asyncErrorHandler');
const ErrorHandler = require('../utils/errorHandler');
// const sendEmail = require('../utils/sendEmail');
const nodemailer = require('nodemailer')

const Contact = require('../models/contactModel')

// Create New Order
exports.createContact = asyncErrorHandler(async (req, res, next) => {


    const { firstName, lastName, email, phone, message } = req.body;

    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true, // use SSL
        auth: {
            user: 'info@teachassistai.com',
            pass: 'Robertosydney10#'
        }
    });

    // let transporter = nodemailer.createTransport({
    //     service: 'Gmail',
    //     auth: {
    //         user: 'info@teachassistai.com',
    //         pass: 'Robertosydney10#'
    //     }
    // });

    let mailOptions = {
        from: 'info@teachassistai.com',
        to: 'info@teachassistai.com',
        subject: 'New Contact Form Submission',
        text: `First Name: ${firstName}\nLast Name: ${lastName}\nEmail: ${email}\nMessage: ${message}`
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Result: ', result);


    try {

        const contact = new Contact({
            firstName,
            lastName,
            email,
            message
        });

        await contact.save();

        res.status(201).json({
            message: "Contact Has been Saved And Email is Send Successfully!"
        });
    } catch (error) {
        console.log('Error: ', error);
        res.status(500).json({
            message: "Contact Form Failed to Submit!"
        });
    }
});