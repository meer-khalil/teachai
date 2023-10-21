const express = require('express')
const { isAuthenticatedUser } = require('../middlewares/auth')
const {
    lessonPlanner,
    quiz,
    gradeEssay,
    gradeEssayRubric,
    lessonCompQuestion,
    lessonCompChat,
    lessonCompAnswer,
    videoToQuiz,
    videoSummarize,
    mathQuizEvaluate,
    mathQuizGenerator,
    mathQuizAnswer,
    mathLessonPlanner,
    detectAI,
    powerPointPresentation,
    downdloadPresentation,
    videoChat,
    checkPlag,
    videoQuizAnswer,
    videoToQuizChat
} = require('../controllers/chatController')
const { requestLimit } = require('../middlewares/requestLimit')
const pdfUpload = require('../utils/lib/pdfUpload')
const fileUpload = require('../utils/lib/pdfUpload')

const router = express.Router()


/*
    Lesson Planning Bot
*/
router.route('/lessonplanner').post(lessonPlanner)

/*
    General Quiz Bot
*/
router.route('/quiz').post(quiz)


/*
    Automated Essay Scoring and Feedback Bot
*/
router.route('/gradeEssay').post( pdfUpload.single('file'), gradeEssay)
router.route('/gradeEssay/rubric').post(gradeEssayRubric)


/*
    Comprehension Lesson Generator Bot
*/
router.route('/lessonComp/questions').post(lessonCompQuestion)
router.route('/lessonComp/chat').post(lessonCompChat)
router.route('/lessonComp/answer').post(lessonCompAnswer)


/*
Maths Quiz Bot
*/
router.route('/mathquiz/gen').post(mathQuizGenerator)
router.route('/mathquiz/evaluate').post(mathQuizEvaluate)
router.route('/mathquiz/answer').post(mathQuizAnswer)


/*
    Maths Lesson Planner Bot
*/
router.route('/math/lesson').post(isAuthenticatedUser, mathLessonPlanner)
    

/*
    Video to Note Summary Bot
*/
router.route('/video/summarize').post(isAuthenticatedUser, videoSummarize)
router.route('/video/chat').post(isAuthenticatedUser, videoChat)
router.route('/video/quiz').post(videoToQuiz)
router.route('/video/quiz/chat').post(videoToQuizChat)
router.route('/video/answer').post(videoQuizAnswer)

// detect AI
router.route('/detectai').post(fileUpload.single('file'), detectAI)
router.route('/plagirism').post(fileUpload.single('file'), checkPlag)
router.route('/presentation').post(powerPointPresentation)
router.route('/presentation/download/:fileName').get(requestLimit, downdloadPresentation)



// for increasing the setTimeout
// function setConnectionTimeout(time) {
//     var delay = typeof time === 'string'
//       ? ms(time)
//       : Number(time || 5000);
  
//     return function (req, res, next) {
//       res.connection.setTimeout(delay);
//       next();
//     }
//   }
module.exports = router