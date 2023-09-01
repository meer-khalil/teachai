const express = require('express');
const { 
    
    processPayment

} = require('../controllers/paymentController');

const { isAuthenticatedUser } = require('../middlewares/auth');

const router = express.Router();

router.route('/payment/process').post(isAuthenticatedUser ,processPayment);

module.exports = router;