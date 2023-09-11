const { default: axios } = require("axios");
const asyncErrorHandler = require("../middlewares/asyncErrorHandler");
const { updateChatHistory, createChatHistoryAndGiveData, fetchDataFromFlaskAPI } = require("../utils/chatHistoryUtil");
const api = require("../utils/api");
const ChatHistory = require('../models/chatHistoryModel')
const Chatbot = require('../models/chatbotModel');

exports.lessonPlanner = asyncErrorHandler(async (req, res, next) => {

    /*
        make sure that Chatbot model contains the bot name
    */
    const { body, data } = await createChatHistoryAndGiveData(req, 'Lesson Planning')

    console.log('Request Made!');

    if (data) {
        let url = '/lessonplanner'
        await fetchDataFromFlaskAPI(res, url, data, 'lesson_plan', body)
    } else {
        res.status(500).json({
            message: "Error From Lesson Planner!"
        })
    }
})


exports.quiz = asyncErrorHandler(async (req, res, next) => {

    console.log('req.body: ', req.body);

    let { chat_id, body } = req.body
    const user_id = req.user.id
    const chatbot_name = 'General Quiz';

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

    console.log('Request Made!');

    if (data) {
        try {
            const response = await api.post(`/quiz`, data)

            if (response.statusText === 'OK') {

                const data = response.data

                if (chat_id) {

                    updateChatHistory(chat_id, { question: body.prompt, answer: data.answer }, res)

                } else {

                    createChatHistory(chatbot_name, req.user._id, data.answer, res);
                }

            } else {
                res.status(500).json({
                    message: 'Error from else, after calling to api/quiz'
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
            message: "Kindly provide the data!"
        })
    }
})


/* Essay Grading */
exports.gradeEssay = asyncErrorHandler(async (req, res, next) => {

    console.log('Here is body: ', req.body);

    const { chat_id, body } = req.body
    const chatbot_name = 'Essay Grading';

    console.log('\n\n\n\nHere is chatID: ', chat_id);
    let data = {
        prompt: body.prompt ? body.prompt : body,
        id: req.user._id
    }

    console.log('Request Made!');

    if (data) {
        try {
            const response = await api.post(`/gradeEssay`, data)

            if (response.statusText === 'OK') {

                const data = response.data

                if (chat_id) {

                    updateChatHistory(chat_id, { question: body.prompt, answer: data.answer }, res)

                } else {

                    createChatHistory(chatbot_name, req.user._id, data.answer, res);
                }

            } else {
                res.status(500).json({
                    message: 'Error from else, after calling to api/gradeEssay'
                })
            }
        } catch (error) {
            console.log('Error From Catch: ', error);
            res.status(500).json({
                message: 'Error from Catch',
                error: error
            })
        }

    } else {
        res.status(500).json({
            message: "Kindly provide the data!"
        })
    }
})


exports.gradeEssayRubric = asyncErrorHandler(async (req, res, next) => {

    console.log('Here is body: ', req.body);

    const { chat_id, body } = req.body
    // const chatbot_name = 'Quiz Generator';

    // console.log('\n\n\n\nHere is chatID: ', chat_id);
    let data = {
        prompt: body.prompt ? body.prompt : body,
        id: req.user._id
    }

    // console.log('Request Made!');

    if (data) {
        try {
            const response = await api.post(`/gradeEssay/rubric`, data)

            if (response.statusText === 'OK') {

                const data = response.data
                res.status(200).json({
                    ...data
                })

            } else {
                res.status(500).json({
                    message: 'Error from else, after calling to api/quiz'
                })
            }
        } catch (error) {
            console.log('Error From Catch: ', error);
            res.status(500).json({
                message: 'Error from api/gradeEssary/rubric'
            })
        }

    } else {
        res.status(500).json({
            message: "Kindly provide the data!"
        })
    }
})


exports.lessonCompQuestion = asyncErrorHandler(async (req, res, next) => {

    console.log('Here is body: ', req.body);

    const { chat_id, body } = req.body
    const chatbot_name = 'Comprehension Lesson Generator';

    console.log('\n\n\n\nHere is chatID: ', chat_id);
    let data = {
        prompt: body.prompt ? body.prompt : body,
        id: req.user._id
    }

    console.log('Request Made!');

    if (data) {
        try {
            const response = await api.post(`/lessonComp/questions`, data)

            if (response.statusText === 'OK') {

                const data = response.data

                if (chat_id) {

                    updateChatHistory(chat_id, { question: body.prompt, answer: data.questions }, res)

                } else {

                    createChatHistory(chatbot_name, req.user._id, data.questions, res);
                }

            } else {
                res.status(500).json({
                    message: 'Error from else, after calling to api/lessonComp/questions'
                })
            }
        } catch (error) {
            console.log('Error From Catch: ', error);
            res.status(500).json({
                message: 'Error from Catch api/lessonComp/questions'
            })
        }

    } else {
        res.status(500).json({
            message: "Kindly provide the data!"
        })
    }
})


exports.lessonCompChat = asyncErrorHandler(async (req, res, next) => {

    console.log('Here is body: ', req.body);

    const { chat_id, body } = req.body
    const chatbot_name = 'Lesson Comprehension';

    console.log('\n\n\n\nHere is chatID: ', chat_id);
    let data = {
        prompt: body.prompt ? body.prompt : body,
        id: req.user._id
    }

    console.log('Request Made!');

    if (data) {
        try {
            const response = await api.post(`/lessonComp/chat`, data)

            if (response.statusText === 'OK') {

                const data = response.data

                if (chat_id) {

                    updateChatHistory(chat_id, { question: body.prompt, answer: data.answer }, res)

                } else {

                    createChatHistory(chatbot_name, req.user._id, data.answer, res);
                }

            } else {
                res.status(500).json({
                    message: 'Error from else, after calling to api/quiz'
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
            message: "Kindly provide the data!"
        })
    }
})


exports.lessonCompAnswer = asyncErrorHandler(async (req, res, next) => {

    console.log('Here is body: ', req.body);

    const { chat_id, body } = req.body
    const chatbot_name = 'Lesson Comprehension';

    console.log('\n\n\n\nHere is chatID: ', chat_id);
    let data = {
        prompt: body.prompt ? body.prompt : body,
        id: req.user._id
    }

    console.log('Request Made!');

    if (data) {
        try {
            const response = await api.post(`/lessonComp/questions`, data)

            if (response.statusText === 'OK') {

                const data = response.data

                if (chat_id) {

                    updateChatHistory(chat_id, { question: body.prompt, answer: data.answer }, res)

                } else {

                    createChatHistory(chatbot_name, req.user._id, data.answer, res);
                }

            } else {
                res.status(500).json({
                    message: 'Error from else, after calling to api/quiz'
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
            message: "Kindly provide the data!"
        })
    }
})

exports.mathQuizGenerator = asyncErrorHandler(async (req, res, next) => {

    console.log('Here is body: ', req.body);

    const { chat_id, body } = req.body
    const chatbot_name = 'Math Quiz Generator';

    console.log('\n\n\n\nHere is chatID: ', chat_id);

    let data = {
        prompt: body.prompt ? body.prompt : body,
        id: req.user._id
    }

    console.log('Request Made!: ', data);

    if (data) {
        try {
            const response = await api.post(`/mathquiz/gen`, data)

            if (response.statusText === 'OK') {

                const data = response.data
                console.log('Quiz Response: ', data);

                if (chat_id) {

                    updateChatHistory(chat_id, { question: body.prompt, answer: data.mathquiz }, res)

                } else {

                    createChatHistory(chatbot_name, req.user._id, data.mathquiz, res);
                }

            } else {
                res.status(500).json({
                    message: 'Error from else, after calling to api/lessonComp/questions'
                })
            }
        } catch (error) {
            console.log('Error From Catch: ', error);
            res.status(500).json({
                message: 'Error from Catch api/lessonComp/questions'
            })
        }

    } else {
        res.status(500).json({
            message: "Kindly provide the data!"
        })
    }
})


exports.mathQuizEvaluate = asyncErrorHandler(async (req, res, next) => {

    console.log('Here is body: ', req.body);

    const { chat_id, body } = req.body
    const chatbot_name = 'Math Quiz Generator';

    console.log('\n\n\n\nHere is chatID: ', chat_id);
    let data = {
        prompt: body.prompt ? body.prompt : body,
        id: req.user._id
    }

    console.log('Request Made!');

    if (data) {
        try {
            const response = await api.post(`/lessonComp/evaluate`, data)

            if (response.statusText === 'OK') {

                const data = response.data

                if (chat_id) {

                    updateChatHistory(chat_id, { question: body.prompt, answer: data.questions }, res)

                } else {

                    createChatHistory(chatbot_name, req.user._id, data.questions, res);
                }

            } else {
                res.status(500).json({
                    message: 'Error from else, after calling to api/lessonComp/questions'
                })
            }
        } catch (error) {
            console.log('Error From Catch: ', error);
            res.status(500).json({
                message: 'Error from Catch api/lessonComp/questions'
            })
        }

    } else {
        res.status(500).json({
            message: "Kindly provide the data!"
        })
    }
})


exports.mathQuizAnswer = asyncErrorHandler(async (req, res, next) => {

    console.log('Here is body: ', req.body);

    const { chat_id, body } = req.body
    const chatbot_name = 'Math Quiz Generator';

    console.log('\n\n\n\nHere is chatID: ', chat_id);
    let data = {
        prompt: body.prompt ? body.prompt : body,
        id: req.user._id
    }

    console.log('Request Made!');

    if (data) {
        try {
            const response = await api.post(`/lessonComp/answer`, data)

            if (response.statusText === 'OK') {

                const data = response.data

                if (chat_id) {

                    updateChatHistory(chat_id, { question: body.prompt, answer: data.questions }, res)

                } else {

                    createChatHistory(chatbot_name, req.user._id, data.questions, res);
                }

            } else {
                res.status(500).json({
                    message: 'Error from else, after calling to api/lessonComp/questions'
                })
            }
        } catch (error) {
            console.log('Error From Catch: ', error);
            res.status(500).json({
                message: 'Error from Catch api/lessonComp/questions'
            })
        }

    } else {
        res.status(500).json({
            message: "Kindly provide the data!"
        })
    }
})


exports.mathLessonPlanner = asyncErrorHandler(async (req, res, next) => {

    console.log('Here is body: ', req.body);

    const { chat_id, body } = req.body
    const chatbot_name = 'Math Lesson Planner';

    console.log('\n\n\n\nHere is chatID: ', chat_id);
    let data = {
        prompt: body.prompt ? body.prompt : body,
        id: req.user._id
    }

    console.log('Request Made!');

    if (data) {
        try {
            const response = await api.post(`/math/lesson`, data)

            if (response.statusText === 'OK') {

                const data = response.data

                if (chat_id) {

                    updateChatHistory(chat_id, { question: body.prompt, answer: data.answer }, res)

                } else {

                    createChatHistory(chatbot_name, req.user._id, data.answer, res);
                }

            } else {
                res.status(500).json({
                    message: 'Error from else, after calling to api/lessonComp/questions'
                })
            }
        } catch (error) {
            console.log('Error From Catch: ', error);
            res.status(500).json({
                message: 'Error from Catch api/lessonComp/questions'
            })
        }

    } else {
        res.status(500).json({
            message: "Kindly provide the data!"
        })
    }
})


exports.videoSummarize = asyncErrorHandler(async (req, res, next) => {

    console.log('Here is body: ', req.body);

    const { chat_id, body } = req.body
    const chatbot_name = 'Video To Notes';

    if (body.prompt) {
        body.prompt.userinput = "Give me the notes for this video"
    } else {
        body.userinput = "Give me the notes for this video"
    }

    console.log('\n\n\n\nHere is chatID: ', chat_id);

    let data = {
        prompt: body.prompt ? body.prompt : body,
        id: req.user._id
    }

    console.log('Request Made!: ', data);

    if (data) {
        try {

            const response = await api.post(`/video/summarize`, data)

            if (response.statusText === 'OK') {

                const data = response.data

                if (chat_id) {

                    updateChatHistory(chat_id, { question: body.prompt, answer: data.answer }, res)

                } else {

                    createChatHistory(chatbot_name, req.user._id, data.answer, res);
                }

            } else {
                res.status(500).json({
                    message: 'Error from else, after calling to api/lessonComp/questions'
                })
            }
        } catch (error) {
            console.log('Error From Catch: ', error);
            res.status(500).json({
                message: 'Error from Catch api/lessonComp/questions'
            })
        }

    } else {
        res.status(500).json({
            message: "Kindly provide the data!"
        })
    }
})


exports.videoToQuiz = asyncErrorHandler(async (req, res, next) => {

    console.log('Here is body: ', req.body);

    const { chat_id, body } = req.body
    const chatbot_name = 'Lesson Comprehension';

    console.log('\n\n\n\nHere is chatID: ', chat_id);
    let data = {
        prompt: body.prompt ? body.prompt : body,
        id: req.user._id
    }

    console.log('Request Made!');

    if (data) {
        try {

            const response = await api.post(`/video/quiz`, data)

            if (response.statusText === 'OK') {

                const data = response.data

                if (chat_id) {

                    updateChatHistory(chat_id, { question: body.prompt, answer: data.questions }, res)

                } else {

                    createChatHistory(chatbot_name, req.user._id, data.questions, res);
                }

            } else {
                res.status(500).json({
                    message: 'Error from else, after calling to api/lessonComp/questions'
                })
            }
        } catch (error) {
            console.log('Error From Catch: ', error);
            res.status(500).json({
                message: 'Error from Catch api/lessonComp/questions'
            })
        }

    } else {
        res.status(500).json({
            message: "Kindly provide the data!"
        })
    }
})