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
    usageCount: { type: Number, default: 0 },
    usageLimit: Number,
    storageUsed: { type: Number, default: 0 },
    storageLimit: {
        type: Number,
        default: 10
    },
    noOfFilesUploaded: { type: Number, default: 0 },
    noOfFilesUploadedLimit: { type: Number, default: 0 },
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