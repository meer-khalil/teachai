require('dotenv').config()
const asyncErrorHandler = require('../middlewares/asyncErrorHandler');
// const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
// const paytm = require('paytmchecksum');
const https = require('https');
const Payment = require('../models/paymentModel');
const ErrorHandler = require('../utils/errorHandler');
const { v4: uuidv4 } = require('uuid');

// const braintree = require("braintree")

const site = 'http://localhost:3000'
//payment gateway
// var gateway = new braintree.BraintreeGateway({
//     environment: braintree.Environment.Sandbox,
//     merchantId: 'jvzyhf98f9dnc8zw',
//     publicKey: 'j9pnrzrrhxppn8t9',
//     privateKey: '13731e9327434e48be8961f6d1b7eb66',
// });


const stripe = require('../config/stripe');

const plans = new Map([
    ['Starter', { priceInCent: 9900, name: 'Standard Plan' }],
    ['Professional', { priceInCent: 14900, name: 'Professional Plan' }
    ],
])

exports.processPayment = asyncErrorHandler(async (req, res, next) => {


    console.log(plans);
    let plan = plans.get(req.body.plan);
    console.log(plan);
    const customer = await stripe.customers.create({
        metadata: {
            userId: req.user._id,
            plan: JSON.stringify(plan)
        }
    })
    try {

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'payment',
            customer: customer.id,
            line_items: [{
                price_data: {
                    currency: 'usd',
                    unit_amount: plan.priceInCent,
                    product_data: {
                        name: plan.name
                    },
                },
                quantity: 1,
            }],
            success_url: `${site}/success`,
            cancel_url: `${site}/cancel`
        })

        res.status(200).json({
            success: true,
            url: session.url
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while creating the payment intent.' });
    }
});

exports.stripeWebhook = asyncErrorHandler(async (req, res) => {

    // This is your Stripe CLI webhook secret for testing your endpoint locally.
    const endpointSecret = "whsec_f12b383d9fb79b803eb705dc657de6028b5e2287f8d3a9c61762b971c3ccc4a6";

    const sig = req.headers['stripe-signature'];

    let event;
    // console.log('Webhook: ', req.body);
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
        console.log('Stripe Error: ', err.message);
        res.status(400).send(`Webhook Error: ${err.message}`);
        return;
    }

    // Handle the event
    switch (event.type) {
        case 'payment_intent.succeeded':
            const paymentIntentSucceeded = event.data.object;
            alert('Intent Revieved!')
            console.log('Payment Intent: ', paymentIntentSucceeded)
            // Then define and call a function to handle the event payment_intent.succeeded
            break;
        // ... handle other event types
        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    // Return a 200 response to acknowledge receipt of the event
    response.send();
});



exports.getAllTransactions = asyncErrorHandler(async (req, res) => {
    try {
        const paymentIntents = await stripe.paymentIntents.list();
        const transactions = paymentIntents.data.map((paymentIntent) => {
            // Extract the necessary transaction data
            const transactionData = {
                paymentIntentId: paymentIntent.id,
                amount: paymentIntent.amount,
                currency: paymentIntent.currency,
                // Add more data as needed
            };
            return transactionData;
        });
        res.json({
            transactions
        })
    } catch (error) {
        console.error('Error retrieving transactions:', error);
        throw error;
    }
}
)

// // Usage example
// getAllTransactions()
//     .then((transactions) => {
//         console.log('All transactions:', transactions);
//     })
//     .catch((error) => {
//         console.error('Error retrieving transactions:', error);
//     });

// exports.sendStripeApiKey = asyncErrorHandler(async (req, res, next) => {
//     res.status(200).json({ stripeApiKey: process.env.STRIPE_API_KEY });
// });

// Process Payment
// exports.processPayment = asyncErrorHandler(async (req, res, next) => {

//     const { amount, email, phoneNo } = req.body;

//     var params = {};

//     /* initialize an array */
//     params["MID"] = process.env.PAYTM_MID;
//     params["WEBSITE"] = process.env.PAYTM_WEBSITE;
//     params["CHANNEL_ID"] = process.env.PAYTM_CHANNEL_ID;
//     params["INDUSTRY_TYPE_ID"] = process.env.PAYTM_INDUSTRY_TYPE;
//     params["ORDER_ID"] = "oid" + uuidv4();
//     params["CUST_ID"] = process.env.PAYTM_CUST_ID;
//     params["TXN_AMOUNT"] = JSON.stringify(amount);
//     // params["CALLBACK_URL"] = `${req.protocol}://${req.get("host")}/api/v1/callback`;
//     params["CALLBACK_URL"] = `https://${req.get("host")}/api/v1/callback`;
//     params["EMAIL"] = email;
//     params["MOBILE_NO"] = phoneNo;

//     let paytmChecksum = paytm.generateSignature(params, process.env.PAYTM_MERCHANT_KEY);
//     paytmChecksum.then(function (checksum) {

//         let paytmParams = {
//             ...params,
//             "CHECKSUMHASH": checksum,
//         };

//         res.status(200).json({
//             paytmParams
//         });

//     }).catch(function (error) {
//         console.log(error);
//     });
// });

// Paytm Callback
// exports.paytmResponse = (req, res, next) => {

//     // console.log(req.body);

//     let paytmChecksum = req.body.CHECKSUMHASH;
//     delete req.body.CHECKSUMHASH;

//     let isVerifySignature = paytm.verifySignature(req.body, process.env.PAYTM_MERCHANT_KEY, paytmChecksum);
//     if (isVerifySignature) {
//         // console.log("Checksum Matched");

//         var paytmParams = {};

//         paytmParams.body = {
//             "mid": req.body.MID,
//             "orderId": req.body.ORDERID,
//         };

//         paytm.generateSignature(JSON.stringify(paytmParams.body), process.env.PAYTM_MERCHANT_KEY).then(function (checksum) {

//             paytmParams.head = {
//                 "signature": checksum
//             };

//             /* prepare JSON string for request */
//             var post_data = JSON.stringify(paytmParams);

//             var options = {
//                 /* for Staging */
//                 hostname: 'securegw-stage.paytm.in',
//                 /* for Production */
//                 // hostname: 'securegw.paytm.in',
//                 port: 443,
//                 path: '/v3/order/status',
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json',
//                     'Content-Length': post_data.length
//                 }
//             };

//             // Set up the request
//             var response = "";
//             var post_req = https.request(options, function (post_res) {
//                 post_res.on('data', function (chunk) {
//                     response += chunk;
//                 });

//                 post_res.on('end', function () {
//                     let { body } = JSON.parse(response);
//                     // let status = body.resultInfo.resultStatus;
//                     // res.json(body);
//                     addPayment(body);
//                     // res.redirect(`${req.protocol}://${req.get("host")}/order/${body.orderId}`)
//                     res.redirect(`https://${req.get("host")}/order/${body.orderId}`)
//                 });
//             });

//             // post the data
//             post_req.write(post_data);
//             post_req.end();
//         });

//     } else {
//         console.log("Checksum Mismatched");
//     }
// }

// const addPayment = async (data) => {
//     try {
//         await Payment.create(data);
//     } catch (error) {
//         console.log("Payment Failed!");
//     }
// }

// exports.getPaymentStatus = asyncErrorHandler(async (req, res, next) => {

//     const payment = await Payment.findOne({ orderId: req.params.id });

//     if (!payment) {
//         return next(new ErrorHandler("Payment Details Not Found", 404));
//     }

//     const txn = {
//         id: payment.txnId,
//         status: payment.resultInfo.resultStatus,
//     }

//     res.status(200).json({
//         success: true,
//         txn,
//     });
// });

// exports.getBraintreeToken = asyncErrorHandler(async (req, res, next) => {
//     try {
//         gateway.clientToken.generate({}, function (err, response) {
//             if (err) {
//                 res.status(500).send(err);
//             } else {
//                 res.send(response);
//             }
//         });
//     } catch (error) {
//         console.log(error);
//     }
// })

//payment
// exports.processBrainTreePayment = async (req, res) => {
//     try {
//         const { nonce, cart } = req.body;
//         let total = 0;
//         console.log('\n\nCart: ', cart);
//         cart.map((i) => {
//             total += (i.price * i.quantity);
//         });
//         console.log('\n\nPrice After Calculating: ', total, '\n\n\n');

//         //   let products = cart.map(i => i.product)

//         let newTransaction = gateway.transaction.sale(
//             {
//                 amount: total,
//                 paymentMethodNonce: nonce,
//                 options: {
//                     submitForSettlement: true,
//                 },
//             },
//             function (error, result) {
//                 if (result) {
//                     console.log(cart);
//                     const payment = new Payment({
//                         //   products: products,
//                         payment: result,
//                         //   buyer: req.user._id,
//                     })
//                     payment.save()
//                         .then(savedPayment => {
//                             console.log(savedPayment);
//                             res.json({ ok: true, paymentInfo: savedPayment._id });
//                         })
//                         .catch(error => {
//                             res.status(500).send(error);
//                         });
//                     // payment_id: payment._id
//                 } else {
//                     res.status(500).send(error);
//                 }
//             }
//         );
//     } catch (error) {
//         console.log(error);
//     }
// };
