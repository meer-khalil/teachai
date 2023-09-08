const mongoose = require('mongoose')

const usageSchema = new mongoose.Schema({

    user: {
        type: mongoose.Schema.ObjectId,
        ref: "User",
        required: true
    },
    plan: {
        type: String,
        default: 'Free'
    },
    usageCount: Number,
    usageLimit: Number,
    payment: {
        type: Boolean,
        default: false
    },
    paymentDate: {
        type: Date
    },
    lastUpdated: { type: Date, default: Date.now }
})

module.exports = mongoose.model('Usage', usageSchema);