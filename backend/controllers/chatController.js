const { default: axios } = require("axios");
const asyncErrorHandler = require("../middlewares/asyncErrorHandler");
const { updateChatHistory, createChatHistory } = require("../utils/chatHistoryUtil");
const api = require("../utils/api");

exports.lessonPlanner = asyncErrorHandler(async (req, res, next) => {
    
    console.log('Here is body: ', req.body);

    const { chat_id, body } = req.body
    const chatbot_name = 'Lesson Planner';

    console.log('\n\n\n\nHere is chatID: ', chat_id);
    let data = {
        prompt: body.prompt ? body.prompt : body,
        id: req.user._id
    }

    console.log('Request Made!');

    if (data) {
        try {
            const response = await api.post(`/lessonplanner`, data)

            if (response.statusText === 'OK') {

                const data = response.data

                if (chat_id) {

                    updateChatHistory(chat_id, { question: body.prompt, answer: data.answer }, res)

                } else {

                    createChatHistory(chatbot_name, req.user._id, data.answer, res);
                }

                // res.status(200).json({
                //     ...data
                // })
            } else {
                res.status(500).json({
                    message: 'Error from else, after calling to api/lessonplanner'
                })
            }
        } catch (error) {
            console.log('Error From Catch: ', error);
            res.status(500).json({
                message: 'Error from Catch'
            })
        }

    } else {
        res.status(500).json({
            message: "Error Handling the request!"
        })
    }
})