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
    mathQuizEvaluate
} = require('../controllers/chatController')

const router = express.Router()


/*
    Lesson Planning Bot
*/ 
router.route('/lessonplanner').post( isAuthenticatedUser, lessonPlanner)

/*
    General Quiz Bot
*/ 
router.route('/quiz').post( isAuthenticatedUser, quiz)


/*
    Automated Essay Scoring and Feedback Bot
*/ 
router.route('/gradeEssay').post( isAuthenticatedUser, gradeEssay)
router.route('/gradeEssay/rubric').post( isAuthenticatedUser, gradeEssayRubric)


/*
    Comprehension Lesson Generator Bot
*/
router.route('/lessonComp/questions').post( isAuthenticatedUser, lessonCompQuestion)
router.route('/lessonComp/chat').post( isAuthenticatedUser, lessonCompChat)
router.route('/lessonComp/answer').post( isAuthenticatedUser, lessonCompAnswer)


/*
Maths Quiz Bot
*/
router.route('/mathquiz/gen').post( isAuthenticatedUser, mathQuizGenerator)
router.route('/mathquiz/evaluate').post( isAuthenticatedUser, mathQuizEvaluate)
router.route('/mathquiz/answer').post( isAuthenticatedUser, mathQuizAnswer)


/*
    Maths Lesson Planner Bot
*/
router.route('/math/lesson').post( isAuthenticatedUser, mathLesson)


/*
    Video to Note Summary Bot
*/ 
router.route('/video/summarize').post( isAuthenticatedUser, videoSummarize)
router.route('/video/quiz').post( isAuthenticatedUser, videoToQuiz)

module.exports = router