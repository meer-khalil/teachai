const express = require('express');
const { 
    processPayment, getAllTransactions, stripeWebhook, 
    // processBrainTreePayment, 
    // getBraintreeToken 
} = require('../controllers/paymentController');

const { isAuthenticatedUser } = require('../middlewares/auth');

const router = express.Router();

router.route('/payment/process').post(isAuthenticatedUser ,processPayment);
router.route('/stripe/webhook').post(express.raw({type: 'application/json'}), stripeWebhook);

router.route('/payment/get-all-transaction').get(getAllTransactions);

module.exports = router;