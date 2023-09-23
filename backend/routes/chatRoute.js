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
    mathLesson,
    mathQuizEvaluate,
    mathQuizGenerator,
    mathQuizAnswer,
    mathLessonPlanner,
    detectAI,
    powerPointPresentation,
    downdloadPresentation
} = require('../controllers/chatController')
const { requestLimit } = require('../middlewares/requestLimit')
const pdfUpload = require('../utils/lib/pdfUpload')
const fileUpload = require('../utils/lib/pdfUpload')

const router = express.Router()


/*
    Lesson Planning Bot
*/
router.route('/lessonplanner').post(isAuthenticatedUser, requestLimit, lessonPlanner)

/*
    General Quiz Bot
*/
router.route('/quiz').post(isAuthenticatedUser, requestLimit, quiz)


/*
    Automated Essay Scoring and Feedback Bot
*/
router.route('/gradeEssay').post(isAuthenticatedUser, requestLimit, pdfUpload.single('file'), gradeEssay)
router.route('/gradeEssay/rubric').post(isAuthenticatedUser, requestLimit, gradeEssayRubric)


/*
    Comprehension Lesson Generator Bot
*/
router.route('/lessonComp/questions').post(isAuthenticatedUser, requestLimit, lessonCompQuestion)
router.route('/lessonComp/chat').post(isAuthenticatedUser, requestLimit, lessonCompChat)
router.route('/lessonComp/answer').post(isAuthenticatedUser, requestLimit, lessonCompAnswer)


/*
Maths Quiz Bot
*/
router.route('/mathquiz/gen').post(isAuthenticatedUser, requestLimit, mathQuizGenerator)
router.route('/mathquiz/evaluate').post(isAuthenticatedUser, requestLimit, mathQuizEvaluate)
router.route('/mathquiz/answer').post(isAuthenticatedUser, requestLimit, mathQuizAnswer)


/*
    Maths Lesson Planner Bot
*/
router.route('/math/lesson').post(isAuthenticatedUser, mathLessonPlanner)


/*
    Video to Note Summary Bot
*/
router.route('/video/summarize').post(isAuthenticatedUser, videoSummarize)
router.route('/video/quiz').post(isAuthenticatedUser, requestLimit, videoToQuiz)

// detect AI
router.route('/detectai').post(isAuthenticatedUser, requestLimit, fileUpload.single('file'), detectAI)
router.route('/presentation').post(isAuthenticatedUser, requestLimit, powerPointPresentation)
router.route('/presentation/download/:fileName').get(requestLimit, downdloadPresentation)

module.exports = router