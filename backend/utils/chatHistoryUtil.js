const Chatbot = require('../models/chatbotModel');
const ChatHistory = require('../models/chatHistoryModel');
const api = require('./api');

const Usage = require('../models/usageModel');
const UploadInfo = require('../models/uploadFileModel');

const fs = require('fs');
const path = require('path')
const pdf = require('pdf-parse');
const fsPromises = require("fs").promises;

const mammoth = require('mammoth')

exports.createChatHistoryAndGiveData = async (req, chatbot_name) => {

    console.log('req.body: ', req.body);

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
        console.log('ChatHistory(Created): ', chat_history);
        chat_id = chat_history._id
    } else {
        console.log('ChatHisotry Not Created: chat_id: ', chat_id);
    }

    let data = {
        prompt: body,
        user_id: user_id,
        conversation_id: chat_id
    }

    return {
        chat_id,
        body,
        data
    }
}

const updateChatHistory = async (chat_id, answer, res, title) => {
    try {


        const filter = { _id: chat_id }
        const update = { $push: { content: answer }, $set: { title: title } };
        const options = { new: true };

        const updatedDocument = await ChatHistory.findOneAndUpdate(filter, update, options);

        if (updatedDocument) {
            console.log('\n\n\nUpdated document:', updatedDocument);
        } else {
            console.log('\n\nDocument not found.');
        }

        res.status(200).json({
            answer: answer.answer,
            chat_id
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

    console.log('Inner: ', 'chatId: ', chat_id);

    try {
        const response = await api.post(url, data, {
            responseType: 'stream', // Specify the response type as 'stream'
        })

        if (response.statusText === 'OK') {

            let _data = response.data
            console.log(`Data From ${url}: `, _data);

            let question = body.prompt ? body.prompt : null
            // let answer = _data[result]

            console.log('q: ', question);
            console.log('ans: ', answer);

            let chatHistory = await ChatHistory.findOne({ _id: chat_id });

            let title = ''
            if (!(chatHistory.title)) {
                console.log('Fetching the title');
                url = '/chattitles'
                _data = { user_id: data.user_id, conversation_id: chat_id }
                let titles = await api.post(url, _data)
                title = titles.data.title
            } else {
                console.log('Title Already Exist');
                title = chatHistory.title
            }

            console.log('title: ', title);

            // Set up an array to store response data chunks
            const responseDataChunks = [];

            // Listen for data chunks and collect them
            response.data.on('data', (chunk) => {
                console.log('chunk: ', chunk);
                responseDataChunks.push(chunk);
            });

            // Listen for the end of the response
            response.data.on('end', async () => {
                // Concatenate all the data chunks into a single buffer
                const responseBodyBuffer = Buffer.concat(responseDataChunks);

                // Convert the buffer to a string (assuming it's a JSON response)
                const responseBody = responseBodyBuffer.toString('utf8');

                // Parse the response body
                const responseBodyObject = JSON.parse(responseBody);

                // Now you have the complete response data
                console.log(`Data From ${url}: `, responseBodyObject);

                const answer = responseBodyObject[result];

                console.log('q: ', question);
                console.log('ans: ', answer);

                // Update the chat history with the response data
                updateChatHistory(chat_id, { question, answer }, res, title);
            });
            // updateChatHistory(chat_id, { question, answer }, res, title)

        } else {
            res.status(500).json({
                message: `Error from else, after calling to ${url}`
            })
        }
    } catch (error) {
        console.log(`Error From Flask: ${url}: `, error);
        res.status(500).json({
            message: `Error From ${url}`
        })
    }
}


exports.uploadInfoUpdateUsageReadPDF = async (req, data) => {
    // Get File Info Start
    let fileSize = 0;
    // Check if the file exists and get its stats
    let filePath = path.join(__dirname, '..', 'public', 'pdfFiles', req.savedPdfFile);
    console.log('file Full Path: ', filePath);

    try {
        await fsPromises.access(filePath);
        const stats = await fsPromises.stat(filePath);
        console.log(`File '${filePath}' exists.`);
        // console.log('stats: ', stats);
        fileSize = (stats.size / (1024 * 1024)).toFixed(3)
        console.log(`File size: ${fileSize} MB`);
    } catch (error) {
        console.log('erro: ', error);
    }

    try {
        const uploadInfo = new UploadInfo({
            user_id: req.user.id,
            chat_id: data.conversation_id,
            file_name: req.savedPdfFile,
            file_size: fileSize,
        });
        if (uploadInfo) {
            console.log('File Info Stored: ', uploadInfo);
        } else {
            console.log('Error while storing the file');
        }
    } catch (error) {

        console.log('Error while storing the file');
        console.log('Error: ', error);

    }

    // Get File Info End
    let usage = await Usage.findOne({ user: req.user.id })
    console.log('Usage: ', usage);


    if (usage) {

        try {
            const updatedUsage = await Usage.findByIdAndUpdate(usage.id, {
                noOfFilesUploaded: usage.noOfFilesUploaded + 1,
                storageUsed: usage.storageUsed + +fileSize
            });

            if (updatedUsage) {
                console.log('Usage plan updated:', updatedUsage);
            } else {
                console.log('Usage not found or no updates were made.');
            }
        } catch (err) {
            console.error('Error updating user plan:', err);
        }
    }

    let pdfText = ''
    try {
        if (req.savedPdfFile.endsWith('.pdf')) {
            // Handle PDF file
            let dataBuffer = fs.readFileSync(filePath);
            const result = await pdf(dataBuffer);
            pdfText = result.text;
            console.log(pdfText ? 'Text is here' : 'Text didn\'t read');
        }
        else if (req.savedPdfFile.endsWith('.doc') || req.savedPdfFile.endsWith('.docx')) {
            // Handle DOC file
            const result = await mammoth.extractRawText({ path: filePath });
            pdfText = result.value;
            console.log(pdfText ? 'Text is here' : 'Text didn\'t read');
        } else {
            console.log('Unsupported file format');
        }

    } catch (error) {
        console.log('Error: ', error);
    }

    return pdfText
}

exports.updateChatHistory = updateChatHistory