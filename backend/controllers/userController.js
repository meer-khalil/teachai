const User = require('../models/userModel');
const asyncErrorHandler = require('../middlewares/asyncErrorHandler');
const sendToken = require('../utils/sendToken');
const ErrorHandler = require('../utils/errorHandler');
const Usage = require('../models/usageModel');
// const sendEmail = require('../utils/sendEmail');
// const crypto = require('crypto');
// const cloudinary = require('cloudinary');

// Register User
exports.registerUser = asyncErrorHandler(async (req, res, next) => {

    const {
        firstName,
        lastName,
        email,
        password
    } = req.body


    let user = ''
    try {

        user = await User.create({
            firstName,
            lastName,
            email,
            password
        });

    } catch (error) {
        res.status(409).json({
            error
        })
    }

    console.log('UserCreated: ', user);
    console.log('UserCreated(id): ', user.id);
    const usage = await Usage.create({
        user: user.id,
        plan: 'Free',
        usageCount: 1,
        usageLimit: 10
    });

    sendToken(user, 201, res);
});

// Login User
exports.loginUser = asyncErrorHandler(async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return next(new ErrorHandler("Please Enter Email And Password", 400));
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
        return next(new ErrorHandler("Invalid Email or Password", 401));
    }

    const isPasswordMatched = await user.comparePassword(password);

    if (!isPasswordMatched) {
        return next(new ErrorHandler("Invalid Email or Password", 401));
    }

    sendToken(user, 201, res);
});

// Logout User
exports.logoutUser = asyncErrorHandler(async (req, res, next) => {
    res.cookie("token", null, {
        expires: new Date(Date.now()),
        httpOnly: true,
    });

    res.status(200).json({
        success: true,
        message: "Logged Out",
    });
});

// Get User Details
exports.getUserDetails = asyncErrorHandler(async (req, res, next) => {

    const user = await User.findById(req.user.id);

    res.status(200).json({
        success: true,
        user,
    });
});

// Get All Users --ADMIN
exports.getAllUsers = asyncErrorHandler(async (req, res, next) => {

    let data = await Usage.find().populate('user');

    res.status(200).json({
        success: true,
        users: data,
    });
});


exports.getUsage = asyncErrorHandler(async (req, res, next) => {

    let data = await Usage.findOne({ user: req.user.id });

    res.status(200).json({
        success: true,
        usage: data,
    });
});
