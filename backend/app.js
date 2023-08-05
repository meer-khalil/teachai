require('dotenv').config();
const express = require('express');
const cors = require('cors')
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const path = require('path')
// const errorMiddleware = require('./middlewares/error');
const asyncErrorHandler = require('./middlewares/asyncErrorHandler');

const stripe = require('./config/stripe');

const app = express();


app.use(cors());
app.post('/api/v1/stripe/webhook', express.raw({ type: 'application/json' }), asyncErrorHandler(async (req, res) => {

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
            console.log('Payment Intent: ', paymentIntentSucceeded)
            // Then define and call a function to handle the event payment_intent.succeeded
            break;
        // ... handle other event types
        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    // Return a 200 response to acknowledge receipt of the event
    res.send();
}))

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



// console.log(path.join(__dirname, '..', 'build', 'index.html'));

// const path = require('path')
let environment = 'dev';
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