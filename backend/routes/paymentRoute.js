const express = require('express');
const { 
    
    processPayment, createSubscription

} = require('../controllers/paymentController');

const { isAuthenticatedUser } = require('../middlewares/auth');

const router = express.Router();

router.route('/payment/process').post(isAuthenticatedUser ,processPayment);
router.route('/payment/create-subscription').post(isAuthenticatedUser , createSubscription);

module.exports = router;