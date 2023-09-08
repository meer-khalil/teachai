const express = require('express');
const {
    registerUser,
    loginUser,
    logoutUser,
    getUserDetails,
    getAllUsers,
    getUsage
} = require('../controllers/userController');

const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/auth');

const router = express.Router();

router.route('/register').post(registerUser);
router.route('/login').post(loginUser);
router.route('/logout').get(logoutUser);

router.route('/me').get(isAuthenticatedUser, getUserDetails);

router.route("/admin/users").get(isAuthenticatedUser, authorizeRoles("admin"), getAllUsers);

router.route("/getUsage").get(isAuthenticatedUser, getUsage)
module.exports = router;