const { default: axios } = require("axios");
const asyncErrorHandler = require("../middlewares/asyncErrorHandler");
const { updateChatHistory, createChatHistoryAndGiveData, fetchDataFromFlaskAPI, uploadInfoUpdateUsageReadPDF } = require("../utils/chatHistoryUtil");
const api = require("../utils/api");
const Usage = require('../models/usageModel');
const UploadInfo = require('../models/uploadFileModel');

const fs = require('fs');
const path = require('path')
const pdf = require('pdf-parse');
const fsPromises = require("fs").promises;

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

    /*
    make sure that Chatbot model contains the bot name
    */
    const { body, data } = await createChatHistoryAndGiveData(req, 'General Quiz')

    console.log('Request Made!');

    if (data) {
        let url = '/quiz'
        await fetchDataFromFlaskAPI(res, url, data, 'quiz', body)
    } else {
        res.status(500).json({
            message: "Error From Quiz!"
        })
    }
})


/* Essay Grading */
exports.gradeEssay = asyncErrorHandler(async (req, res, next) => {

    /*
    make sure that Chatbot model contains the bot name
    */

    // return;
    let { body, data } = await createChatHistoryAndGiveData(req, 'Essay Grading')

    // data = JSON.parse(data);
    if (req.savedPdfFile) {
        // converting the string object to javascript obj so that we can add more info.
        data.prompt = JSON.parse(data.prompt);

        let pdfText = await uploadInfoUpdateUsageReadPDF(req, data);

        data.prompt.essayContent = pdfText
    } else {
        console.log('file is not included');
        console.log(data);
    }

    console.log(data);

    console.log('Request Made!');

    if (data) {
        let url = '/gradeEssay'
        await fetchDataFromFlaskAPI(res, url, data, 'grades', body)
    } else {
        res.status(500).json({
            message: "Error From Quiz!"
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

    /*
        make sure that Chatbot model contains the bot name
    */
    const { body, data } = await createChatHistoryAndGiveData(req, 'Lesson Comprehension')

    console.log('Request Made!');

    if (data) {
        let url = '/lessonComp/questions'
        await fetchDataFromFlaskAPI(res, url, data, 'questions', body)
    } else {
        res.status(500).json({
            message: "Error From Lesson Planner!"
        })
    }
})


exports.lessonCompChat = asyncErrorHandler(async (req, res, next) => {

    /*
        make sure that Chatbot model contains the bot name
    */
    const { body, data } = await createChatHistoryAndGiveData(req, 'Lesson Comprehension')

    console.log('Request Made!');

    if (data) {
        let url = '/lessonComp/chat'
        await fetchDataFromFlaskAPI(res, url, data, 'questions', body)
    } else {
        res.status(500).json({
            message: "Error From Lesson Comprehenstion! chat"
        })
    }

})


exports.lessonCompAnswer = asyncErrorHandler(async (req, res, next) => {

    /*
    make sure that Chatbot model contains the bot name
*/
    const { body, data } = await createChatHistoryAndGiveData(req, 'Lesson Comprehension')

    console.log('Request Made!');

    if (data) {
        let url = '/lessonComp/answer'
        await fetchDataFromFlaskAPI(res, url, data, 'answers', body)
    } else {
        res.status(500).json({
            message: "Error From Math Lesson Planner Answer!"
        })
    }
})
exports.mathQuizGenerator = asyncErrorHandler(async (req, res, next) => {

    /*
    make sure that Chatbot model contains the bot name
*/
    const { body, data } = await createChatHistoryAndGiveData(req, 'Math Quiz Generator')

    console.log('Request Made!');

    if (data) {
        let url = '/mathquiz/gen'
        await fetchDataFromFlaskAPI(res, url, data, 'math_quiz', body)
    } else {
        res.status(500).json({
            message: "Error From Lesson Comprehenstion! chat"
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

    /*
    make sure that Chatbot model contains the bot name
*/
    const { body, data } = await createChatHistoryAndGiveData(req, 'Math Quiz Generator')

    console.log('Request Made!');

    if (data) {
        let url = '/mathquiz/answer'
        await fetchDataFromFlaskAPI(res, url, data, 'answers', body)
    } else {
        res.status(500).json({
            message: "Error From Math Lesson Planner!"
        })
    }
})

exports.mathLessonPlanner = asyncErrorHandler(async (req, res, next) => {


    /*
    make sure that Chatbot model contains the bot name
*/
    const { body, data } = await createChatHistoryAndGiveData(req, 'Math Lesson Planner')

    console.log('Request Made!');

    if (data) {
        let url = '/math/lesson'
        await fetchDataFromFlaskAPI(res, url, data, 'response', body)
    } else {
        res.status(500).json({
            message: "Error From Math Lesson Planner!"
        })
    }
})


exports.videoSummarize = asyncErrorHandler(async (req, res, next) => {
    req.setTimeout(0);
    
    /*
    make sure that Chatbot model contains the bot name
    */
    const { body, data } = await createChatHistoryAndGiveData(req, 'Video To Notes')

    data.prompt.userinput = "Give me the notes for this video"

    console.log('Request Made!');

    if (data) {
        let url = '/video/summarize'
        await fetchDataFromFlaskAPI(res, url, data, 'summary', body)
    } else {
        res.status(500).json({
            message: "Error From Video Summary!"
        })
    }
})

exports.videoChat = asyncErrorHandler(async (req, res, next) => {
    

    /*
    make sure that Chatbot model contains the bot name
*/
    const { body, data } = await createChatHistoryAndGiveData(req, 'Video To Notes')

    // data.prompt.userinput = "Give me the notes for this video"

    console.log('Request Made!');

    if (data) {
        let url = '/video/chat'
        await fetchDataFromFlaskAPI(res, url, data, 'answer', body)
    } else {
        res.status(500).json({
            message: "Error From Video Summary!"
        })
    }
})
exports.videoToQuiz = asyncErrorHandler(async (req, res, next) => {
    

    /*
        make sure that Chatbot model contains the bot name
    */
    const { body, data } = await createChatHistoryAndGiveData(req, 'Video To Quiz')

    console.log('Request Made!');

    if (data) {
        let url = '/video/quiz'
        await fetchDataFromFlaskAPI(res, url, data, 'video_quiz', body)
    } else {
        res.status(500).json({
            message: "Error From Video To Quiz!"
        })
    }
})


exports.videoToQuizChat = asyncErrorHandler(async (req, res, next) => {
    

    /*
        make sure that Chatbot model contains the bot name
    */
    const { body, data } = await createChatHistoryAndGiveData(req, 'Video To Quiz')

    console.log('Request Made!');
    data.prompt.url = ''
    data.prompt.num_question = ''
    data.prompt.quiz_type = ''
    data.prompt.userinput = data.prompt.prompt
    data.prompt.prompt = ''
    console.log('CHeck: ', data);
    // res.json({message: 'wait'})
    // return;
    if (data) {
        let url = '/video/quiz'
        await fetchDataFromFlaskAPI(res, url, data, 'video_quiz', body)
    } else {
        res.status(500).json({
            message: "Error From Video To Quiz!"
        })
    }
})
exports.videoQuizAnswer = asyncErrorHandler(async (req, res, next) => {
    

    /*
    make sure that Chatbot model contains the bot name
*/
    const { body, data } = await createChatHistoryAndGiveData(req, 'Video To Quiz')

    console.log('Request Made!');
    console.log('Data: ', data);

    if (data) {
        let url = '/video/answers'
        await fetchDataFromFlaskAPI(res, url, data, 'answers', body)
    } else {
        res.status(500).json({
            message: "Error From Math Lesson Planner!"
        })
    }
})
/* Essay Grading */
exports.detectAI = asyncErrorHandler(async (req, res, next) => {

    /*
    make sure that Chatbot model contains the bot name
    */

    // return;
    let { body, data } = await createChatHistoryAndGiveData(req, 'Detect AI')

    console.log('Hello Buddy!');
    // data = JSON.parse(data);
    if (req.savedPdfFile) {
        // converting the string object to javascript obj so that we can add more info.
        if (data.prompt) {
            data.prompt = JSON.parse(data.prompt);
            console.log('Here is Prompt');
        } else {
            data.prompt = {}
            console.log('prompt: initialized: ', data);
        }

        let pdfText = await uploadInfoUpdateUsageReadPDF(req, data);
        // console.log('Text: ', pdfText);
        data.prompt.text = pdfText

    } else {
        console.log('file is not included');
        if (data.prompt) {
            data.prompt = JSON.parse(data.prompt);
            console.log('Here is Prompt: ', data);
        }
    }

    console.log("data: ", data);

    console.log('Request Made!');


    if (data) {
        let url = '/detectai'
        await fetchDataFromFlaskAPI(res, url, data, 'result', body)
    } else {
        res.status(500).json({
            message: "Error From Detect AI!"
        })
    }
})


exports.checkPlag = asyncErrorHandler(async (req, res, next) => {
    

    /*
    make sure that Chatbot model contains the bot name
    */

    // return;
    let { body, data } = await createChatHistoryAndGiveData(req, 'Detect AI')

    console.log('Hello Buddy!');
    // data = JSON.parse(data);
    if (req.savedPdfFile) {
        // converting the string object to javascript obj so that we can add more info.
        if (data.prompt) {
            data.prompt = JSON.parse(data.prompt);
            console.log('Here is Prompt');
        } else {
            data.prompt = {}
            console.log('prompt: initialized: ', data);
        }

        let pdfText = await uploadInfoUpdateUsageReadPDF(req, data);
        // console.log('Text: ', pdfText);
        data.prompt.text = pdfText

    } else {
        console.log('file is not included');
        if (data.prompt) {
            data.prompt = JSON.parse(data.prompt);
            console.log('Here is Prompt: ', data);
        }
    }

    console.log("data: ", data);

    console.log('Request Made!');


    if (data) {
        let url = '/checkplag'
        await fetchDataFromFlaskAPI(res, url, data, 'report', body)
    } else {
        res.status(500).json({
            message: "Error From Plagirism!"
        })
    }
})

/* PowerPoint Presentation */
exports.powerPointPresentation = asyncErrorHandler(async (req, res, next) => {
    

    /*
    make sure that Chatbot model contains the bot name
    */

    // return;
    let { body, data } = await createChatHistoryAndGiveData(req, 'Power Point')

    // data = JSON.parse(data);
    if (req.savedPdfFile) {
        // converting the string object to javascript obj so that we can add more info.
        data.prompt = JSON.parse(data.prompt);

        let { pdfText } = uploadInfoUpdateUsageReadPDF(req, data);
        data.prompt.text = pdfText
    } else {
        console.log('file is not included');
        console.log(data);
    }

    console.log(data);

    console.log('Request Made!');

    if (data) {
        let url = '/powerpoint'
        await fetchDataFromFlaskAPI(res, url, data, 'presentation_link', body)
    } else {
        res.status(500).json({
            message: "Error From Power Point!"
        })
    }
})


exports.downdloadPresentation = asyncErrorHandler(async (req, res, next) => {

    /*
    make sure that Chatbot model contains the bot name
    */

    // return;
    // let { body, data } = await createChatHistoryAndGiveData(req, 'Power Point')

    // // data = JSON.parse(data);
    // if (req.savedPdfFile) {
    //     // converting the string object to javascript obj so that we can add more info.
    //     data.prompt = JSON.parse(data.prompt);

    //     let { pdfText } = uploadInfoUpdateUsageReadPDF(req, data);
    //     data.prompt.text = pdfText
    // } else {
    //     console.log('file is not included');
    //     console.log(data);
    // }

    // console.log(data);

    // console.log('Request Made!');

    // if (data) {
    //     let url = '/powerpoint'
    //     await fetchDataFromFlaskAPI(res, url, data, 'presentation_link', body)
    // } else {
    //     res.status(500).json({
    //         message: "Error From Power Point!"
    //     })
    // }


    let { fileName } = req.params

    try {
        // Replace 'fileURL' with the actual file URL you want to download
        const fileURL = `/GeneratedPresentations/${fileName}`;

        // Fetch the file data from the URL
        const response = await api.get(fileURL, { responseType: 'arraybuffer' });

        // Set appropriate response headers
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.presentationml.presentation');
        res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);

        console.log('File Sended');
        // Send the file data to the frontend
        res.send(response.data);
    } catch (error) {
        // Handle any errors
        console.error('Error:', error.message);
        res.status(500).send('Internal Server Error');
    }
})