const { default: axios } = require("axios");
const asyncErrorHandler = require("../middlewares/asyncErrorHandler");

// const apiLink = 'http://localhost:5000'
const apiLink = 'http://127.0.0.1:5000'


exports.lessonPlanner = asyncErrorHandler(async (req, res, next) => {
    const body = req.body

    let data = {
        prompt: body.prompt ? body.prompt : body,
        id: req.user._id
    }

    console.log('Request Made!');

    if (data) {
        try {
            const response = await axios.post(`${apiLink}/lessonplanner`, data, {
                headers: {
                    'Content-Type': 'application/json'
                }
            })

            // console.log('Here is response: ', res);

            if (response.statusText === 'OK') {
                const data = response.data
                res.status(200).json({
                    ...data
                })
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