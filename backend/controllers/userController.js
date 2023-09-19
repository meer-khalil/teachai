const User = require('../models/userModel');
const asyncErrorHandler = require('../middlewares/asyncErrorHandler');
const sendToken = require('../utils/sendToken');
const ErrorHandler = require('../utils/errorHandler');
const Usage = require('../models/usageModel');
const UserOTPVerification = require('../models/userOTPVerification');
const sendEmail = require('../utils/sendEmail');

const bcrypt = require('bcryptjs')
// const sendEmail = require('../utils/sendEmail');
// const crypto = require('crypto');
// const cloudinary = require('cloudinary');

// Register User
exports.registerUser = asyncErrorHandler(async (req, res, next) => {

    let { firstName, lastName, email, password } = req.body
    firstName = firstName.trim();
    lastName = lastName.trim();
    email = email.trim();
    password = password.trim();

    let user = ''
    try {

        user = await User.create({
            firstName,
            lastName,
            email,
            password
        });


    } catch (error) {
        console.log('Error: ', error);
        res.status(409).json({
            error
        })
    }

    console.log('UserCreated: ', user);
    console.log('UserCreated(id): ', user.id);
    const usage = await Usage.create({
        user: user._id,
        plan: 'Free',
        usageCount: 1,
        usageLimit: 10
    });

    sendOTPVerificationEmail(user, res)
    // sendToken(user, 201, res);
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


const sendOTPVerificationEmail = async (user, res) => {
    try {
        const otp = `${Math.floor(1000 + Math.random() * 9000)}`
        let mailOptions = {
            from: 'info@teachassistai.com',
            to: user.email,
            subject: 'Verify Your OTP',
            html: `
            <p>Enter <b>${otp}</b> in the app to verify your email and complete registeration.</p>
            <p>This code <b>expires in 1 hour</b></p>
            `
        };

        const isSuccess = await sendEmail(mailOptions)

        if (isSuccess) {
            const saltRounds = 10;
            const hashedOTP = await bcrypt.hash(otp, saltRounds);
            try {
                const newOTPVerification = new UserOTPVerification({
                    user: user._id,
                    otp: hashedOTP,
                    createdDate: Date.now(),
                    expiresDate: Date.now() + 3600000
                })

                await newOTPVerification.save();
                console.log('newOTP: ', newOTPVerification);
            } catch (error) {
                console.log('Error OTP: ', error);
            }
        }

        res.json({
            status: 'PENDING',
            message: 'Verification code sent',
            data: {
                userId: user._id,
                email: user.email
            }
        })
    } catch (error) {
        res.json({
            status: 'FAILED',
            error: error?.message,
        })
    }
}


exports.verifyOTP = asyncErrorHandler(async (req, res, next) => {

    try {
        let { userId, otp } = req.body;

        if (!userId || !otp) {
            throw Error('Empty otp details are not allowed')
        } else {
            console.log('UserId: ', userId);
            console.log('OTP: ', otp);

            const UserOTPVerificationRecord = await UserOTPVerification.find({ user: userId })
            console.log("UserOTPVerificationRecord: ", UserOTPVerificationRecord);
            console.log('Length: ', UserOTPVerificationRecord);
            if (!UserOTPVerificationRecord) {
                throw new Error("Account Record Doesn't exist or has been verified Already. Please signup or signin")
            } else {
                let { expiresDate } = UserOTPVerificationRecord[0];
                // expiresDate = new Date(expiresDate).getTime();

                const hashedOTP = UserOTPVerificationRecord[0].otp;

                expiresDate = new Date(expiresDate);
                const currentDate = new Date();
                const currentDateString = currentDate.toISOString();

                console.log('expire: ', expiresDate);
                console.log('Now: ', currentDateString);
                console.log('compare(<): ', expiresDate < currentDateString);

                if (expiresDate < currentDateString) {
                    await UserOTPVerification.deleteMany({ user: userId })
                    throw new Error('Code Has Expired. Please Request Again')
                } else {
                    console.log('Here it is: ');

                    const validOTP = bcrypt.compare(otp, hashedOTP)

                    if (!validOTP) {
                        throw new Error("Invalid OTP Passed. Please Check Your Email")
                    } else {
                        await User.updateOne({ _id: userId }, { verified: true })
                        await UserOTPVerification.deleteMany({ user: userId })
                        res.json({
                            status: "VERIFIED",
                            message: "User Email Verified"
                        })
                    }
                }
            }
        }
    } catch (error) {
        console.log('Error: ', error);
        res.json({
            status: "FAILED",
            error: error?.message
        })
    }
});

exports.resendOTP = asyncErrorHandler(async (req, res, next) => {

    try {
        let { userId, email } = req.body;

        if (!userId || !email) {
            throw Error("Empty User details are not Allowed!")
        } else {
            await UserOTPVerification.deleteMany({ user: userId })
            sendOTPVerificationEmail({ _id: userId, email }, res)
        }
    } catch (error) {
        res.json({
            status: "FAILED",
            error: error.message
        })
    }
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

// Update User Details
exports.updateUserDetails = asyncErrorHandler(async (req, res, next) => {

    try {
        const body = req.body;
        const filter = { _id: req.user.id };
        const update = body;
        const option = { new: true };

        const updatedUser = await User.findByIdAndUpdate(filter, update, option);

        if (!updatedUser) {
            res.status(404).json({ success: false, message: 'User not found' });
        } else {
            console.log('Updated the details of user');
            res.status(200).json({ success: true, user: updatedUser });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }

});

// Get All Users --ADMIN
exports.getAllUsers = asyncErrorHandler(async (req, res, next) => {

    let data = await Usage.find().populate('user');

    res.status(200).json({
        success: true,
        users: data,
    });
});

// Update User Details
exports.changePassword = asyncErrorHandler(async (req, res, next) => {

    try {
        const body = req.body;
        const { currentPassword, newPassword, confirmNewPassword } = body;



        const user = await User.findOne({ _id: req.user.id }).select('+password');

        if (!user) {
            return res.status(404).json({
                message: "User Not Found"
            })
        }

        const isValid = await user.comparePassword(currentPassword)

        if (!isValid) {
            return res.status(404).json({
                message: "Current Password Is Wrong"
            })
        }
        if (newPassword !== confirmNewPassword) {
            return res.status(500).json({
                message: "Password Must Match"
            })
        }

        user.password = newPassword;

        const updatedUser = await user.save();

        if (!updatedUser) {
            res.status(404).json({ success: false, message: 'User not found' });
        } else {
            console.log('Updated the details of user');
            res.status(200).json({ success: true, user: updatedUser, message: "Password Updated" });
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }

});


// Update User Details
exports.changeEmail = asyncErrorHandler(async (req, res, next) => {

    try {
        const { email, password } = req.body;

        const user = await User.findOne({ _id: req.user.id })

        if (!user) {
            return res.status(404).json({
                message: "User Not Found"
            })
        }
        else if (!user.comparePassword(password)) {
            return res.status(404).json({
                message: "Enter Valid Password"
            })
        }

        user.email = email
        const updatedUser = await user.save();
        if (!updatedUser) {
            res.status(404).json({ success: false, message: 'User not found' });
        } else {
            console.log('Email Changed');
            res.status(200).json({ success: true, user: updatedUser });
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }

});


exports.deleteAccount = asyncErrorHandler(async (req, res, next) => {

    try {
        await User.findByIdAndDelete(req.user.id)
        return res.status(200).json({
            message: "Account Deleted"
        })
    } catch (error) {
        console.log('error while deleting');
        res.status(500).json({
            message: "Error While Deleting Account"
        })
    }
});
exports.getUsage = asyncErrorHandler(async (req, res, next) => {

    let data = await Usage.findOne({ user: req.user.id });

    res.status(200).json({
        success: true,
        usage: data,
    });
});
