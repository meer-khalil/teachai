const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, "Please enter Email name"]
    },
    subject: {
        type: String,
        required: [true, "Please Enter Subject"]
    },
    message: {
        type: String,
        required: [true, "Please Enter Subject"]
    }
});

module.exports = mongoose.model('Contact', contactSchema);