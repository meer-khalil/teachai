const asyncErrorHandler = require('../middlewares/asyncErrorHandler');
const ErrorHandler = require('../utils/errorHandler');
// const sendEmail = require('../utils/sendEmail');
const nodemailer = require('nodemailer')

// Create New Order
exports.createContact = asyncErrorHandler(async (req, res, next) => {


    const { firstName, lastName, email, phone, message } = req.body;

    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'user',
            pass: 'password'
        }
    });

    let mailOptions = {
        from: 'your-email@gmail.com',
        to: 'info@teachai.com',
        subject: 'New Contact Form Submission',
        text: `First Name: ${firstName}\nLast Name: ${lastName}\nEmail: ${email}\nPhone: ${phone}\nMessage: ${message}`
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Result: ', result);

    try {

        const contact = new Contact({
            firstName,
            lastName,
            email,
            phone,
            message
        });

        await contact.save();

        res.status(201).json({
            message: "Contact Has been Saved And Email is Send Successfully!"
        });
    } catch (error) {
        res.status(500).json({
            message: "Contact Form Failed to Submit!"
        });
    }
});