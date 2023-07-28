const express = require('express');
const { 
    processPayment, getAllTransactions, stripeWebhook, 
    // processBrainTreePayment, 
    // getBraintreeToken 
} = require('../controllers/paymentController');

const { isAuthenticatedUser } = require('../middlewares/auth');

const router = express.Router();

router.route('/payment/process').post(processPayment);
router.route('/stripe/webhook').post(express.raw({type: 'application/json'}), stripeWebhook);

router.route('/payment/get-all-transaction').get(getAllTransactions);
// router.route('/stripeapikey').get(isAuthenticatedUser, sendStripeApiKey);

// router.route('/callback').post(paytmResponse);

// router.route('/payment/status/:id').get(isAuthenticatedUser, getPaymentStatus);

//payments routes
//token
// router.get("/payment/braintree/token", getBraintreeToken);

//payments
// router.post("/payment/braintree/process", isAuthenticatedUser, processBrainTreePayment);

module.exports = router;