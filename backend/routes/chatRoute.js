const express = require('express')
const { isAuthenticatedUser } = require('../middlewares/auth')
const { lessonPlanner } = require('../controllers/chatController')

const router = express.Router()


router.route('/lessonplanner').post( isAuthenticatedUser, lessonPlanner)


module.exports = router