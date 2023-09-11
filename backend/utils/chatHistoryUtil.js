const Chatbot = require('../models/chatbotModel');
const ChatHistory = require('../models/chatHistoryModel');
const api = require('./api');

exports.createChatHistoryAndGiveData = async (req, chatbot_name) => {

    console.log('req.boyd: ', req.body);

    let { chat_id, body } = req.body
    const user_id = req.user.id

    // Creating the Chat History if already is not created
    if (!chat_id) {
        const chatbot = await Chatbot.findOne({ name: chatbot_name });
        console.log('chatbot: ', chatbot);
        const chat_history = await ChatHistory.create({
            user: user_id,
            chatbot: chatbot._id,
            content: []
        })
        console.log('ChatHistory: ', chat_history);
        chat_id = chat_history._id
    }

    let data = {
        prompt: body.prompt ? body.prompt : body,
        user_id: user_id,
        conversation_id: chat_id
    }

    return {
        chat_id,
        body,
        data
    }
}

const updateChatHistory = async (chat_id, answer, res) => {
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
        res.status(500).json({
            message: "Error While Updating the history. (catch)",
            error: error
        })
        console.log('\n\n\nError: \n', error);
    }
}

exports.fetchDataFromFlaskAPI = async (res, url, data, result, body) => {

    let chat_id = data.conversation_id;

    try {
        const response = await api.post(url, data, result, body, chat_id)
        if (response.statusText === 'OK') {

            const data = response.data
            console.log(`Data From ${url}: `, data);
            
            let question = body.prompt ? body.prompt : null
            let answer = data[result]

            console.log('q: ', question);
            console.log('ans: ', answer);

            updateChatHistory(chat_id, { question, answer }, res)

        } else {
            res.status(500).json({
                message: 'Error from else, after calling to api/lessonplanner'
            })
        }
    } catch (error) {
        console.log('Error While Getting LessonPlanner: ', error);
        res.status(500).json({
            message: 'Lesson Planner API give bad Response!'
        })
    }
}


exports.updateChatHistory = updateChatHistory