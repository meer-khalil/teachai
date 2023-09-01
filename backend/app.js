require('dotenv').config();
const express = require('express');
const cors = require('cors')
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const path = require('path')
// const errorMiddleware = require('./middlewares/error');
const asyncErrorHandler = require('./middlewares/asyncErrorHandler');
const stripe = require('./config/stripe');
const Payment = require('./models/paymentModel');
const Usage = require('./models/usageModel');
const app = express();


app.use(cors());

// Match the raw body to content type application/json
// If you are using Express v4 - v4.16 you need to use body-parser, not express, to retrieve the request body
app.post('/api/v1/stripe/webhook', express.json({ type: 'application/json' }), (request, response) => {

    // console.log('Here is your WebhooKL: ', request.body);

    console.log('Here is your Webhook Request: ');

    const event = request.body;

    // Handle the event
    switch (event.type) {
        case 'payment_intent.succeeded':
            const paymentIntent = event.data.object;
            // Then define and call a method to handle the successful payment intent.
            // handlePaymentIntentSucceeded(paymentIntent);
            break;
        case 'payment_method.attached':
            const paymentMethod = event.data.object;
            // Then define and call a method to handle the successful attachment of a PaymentMethod.
            // handlePaymentMethodAttached(paymentMethod);
            break;
        case 'checkout.session.completed':
            const checkoutSessionCompleted = event.data.object;
            console.log('Completed: ', checkoutSessionCompleted);

            stripe.customers
                .retrieve(checkoutSessionCompleted.customer)
                .then(async (customer) => {
                    console.log("Customer: ", customer);
                    let userId = customer.metadata.userId;
                    let plan = customer.metadata.plan
                    plan = JSON.parse(plan)
                    let payment = await Payment.create({
                        payment: checkoutSessionCompleted,
                        user: userId
                    });

                    console.log('Entry Added: ', payment);

                    let temp = await Usage.find({ user: userId })
                    console.log('Usage Entry ID: ', temp[0].id);

                    if (temp[0]) {

                        try {
                            const updatedUsage = await Usage.findByIdAndUpdate(temp[0].id, {
                                plan: plan['name'],
                                usageLimit: plan['limit'],
                                payment: true
                            });

                            if (updatedUsage) {
                                console.log('Usage plan updated:', updatedUsage);
                            } else {
                                console.log('Usage not found or no updates were made.');
                            }
                        } catch (err) {
                            console.error('Error updating user plan:', err);
                        }
                    } else {
                        let usage = await Usage.create({
                            user: userId,
                            plan: plan['name'],
                            usageLimit: plan['limit'],
                            payment: true
                        })

                        console.log('Usage Crearted: ', usage);

                    }

                }).catch((err) => {
                    console.log('Error: ', err.message);
                })
            // Then define and call a method to handle the successful attachment of a PaymentMethod.
            // handlePaymentMethodAttached(paymentMethod);
            break;
        // ... handle other event types
        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    // Return a response to acknowledge receipt of the event
    response.json({ received: true });
});

app.use(bodyParser.json({ limit: '10mb' }));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());


const user = require('./routes/userRoute');
const post = require('./routes/postRoute');
// const order = require('./routes/orderRoute');
const payment = require('./routes/paymentRoute');
const chat = require('./routes/chatRoute');
const chatHistory = require('./routes/chatHistoryRoute');




app.use('/api/v1', user);
app.use('/api/v1', post);
// app.use('/api/v1', order);
app.use('/api/v1', payment);
app.use('/api/v1', chat);
app.use('/api/v1', chatHistory);

let environment = 'prod';
if (environment === 'dev') {

    app.get('/', (req, res) => {
        res.json({
            message: 'Server is Running!'
        })
    })
} else {
    let root = path.join(__dirname, '..', 'build/')
    app.use(express.static(root))
    app.use(function (req, res, next) {
        if (req.method === 'GET' && req.accepts('html') && !req.is('json') && !req.path.includes('.')) {
            res.sendFile('index.html', { root })
        } else next()
    })
}


// error middleware
// app.use(errorMiddleware);

module.exports = app;