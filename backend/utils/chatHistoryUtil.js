const Chatbot = require('../models/chatbotModel');
const ChatHistory = require('../models/chatHistoryModel')

exports.createChatHistory = async (chatbot_name, user_id, answer, res) => {
    const temp = await Chatbot.findOne({ name: chatbot_name });

    const data = await ChatHistory.create({
        user: user_id,
        chatbot: temp._id,
        content: [{ answer }]
    })
    console.log('Created: ', data);

    res.status(200).json({
        answer,
        chat_id: data._id
    })
}

exports.updateChatHistory = async (chat_id, answer, res) => {
    try {

        const filter = { _id: chat_id }
        const update = { $push: { content: answer } };
        const options = { new: true };

        const updatedDocument = await ChatHistory.findOneAndUpdate(filter, update, options);

        if (updatedDocument) {

            console.log('\n\n\nUpdated document:', updatedDocument);

        } else {

            console.log('\n\nDocument not found.');
        }

        res.status(200).json({
            answer: answer.answer,
        })
    }
    catch (error) {
        res.status(200).json({
            message: "Error While Updating the history. (catch)",
            error: error
        })
        console.log('\n\n\nError: \n', error);
    }
}