const mongoose = require('mongoose')

const usageSchema = new mongoose.Schema({

    user: {
        type: mongoose.Schema.ObjectId,
        ref: "User",
        required: true
    },
    plan: String,
    usageCount: Number,
    lastUpdated: { type: Date, default: Date.now }
})

module.exports = mongoose.model('Usage', usageSchema);