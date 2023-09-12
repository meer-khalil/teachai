const mongoose = require('mongoose');

const chatHistorySchema = new mongoose.Schema({

    user: {
        type: mongoose.Schema.ObjectId,
        ref: "User",
        required: true
    },

    chatbot: {
        type: mongoose.Schema.ObjectId,
        ref: 'Chatbot',
        required: true
    },
    title: {
        type: String
    },
    content: [
        {
            question: {
                type: String,
            },
            answer: {
                type: String
            }
        }
    ],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('ChatHistory', chatHistorySchema);