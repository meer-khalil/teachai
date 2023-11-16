require('dotenv').config()
const asyncErrorHandler = require('../middlewares/asyncErrorHandler');

const site = 'https://www.teachassistai.com'

const stripe = require('../config/stripe');

const plans = new Map([
    ['Starter', { priceInCent: 999, requestlimit: 60, noOfFilesUploadedLimit: 10, name: 'Starter' }],
    ['Professional', { priceInCent: 1499, requestlimit: 120, noOfFilesUploadedLimit: 20, name: 'Professional' }
    ],
]);


const priceIDs = {
    "Starter": 'price_1OCktILFLZPxO7T9nAnMZLuy',
    "Professional": "price_1OCl5YLFLZPxO7T9kYM5ILkK"
}

exports.processPayment = asyncErrorHandler(async (req, res, next) => {

    // console.log(plans);
    let plan = plans.get(req.body.plan);
    // console.log(plan);

    const customer = await stripe.customers.create({
        metadata: {
            userId: req.user.id,
            plan: JSON.stringify(plan)
        }
    });

    try {

        const session = await stripe.checkout.sessions.create({
            customer: customer.id,
            // line_items: [{
            //     price_data: {
            //         currency: 'usd',
            //         unit_amount: plan.priceInCent,
            //         product_data: {
            //             name: plan.name
            //         },
            //     },
            //     quantity: 1,
            // }],
            payment_method_types: ['card'],
            line_items: [{
                price: priceIDs[req.body.plan],
                quantity: 1,
            }],
            mode: 'subscription',
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


exports.createSubscription = asyncErrorHandler(async (req, res, next) => {

    // const user_Id = req.user.id

    let plan = plans.get(req.body.plan);
    // create a stripe customer
    const customer = await this.stripe.customers.create({
        name: req.name,
        email: req.email,
        metadata: {
            userId: req.user.id,
            plan: JSON.stringify(plan)
        },
        payment_method: req.paymentMethod,
        invoice_settings: {
            default_payment_method: req.paymentMethod,
        },
    });


    // get the price id from the front-end
    const priceId = req.priceId;

    // create a stripe subscription
    const subscription = await this.stripe.subscriptions.create({
        customer: customer.id,
        items: [{ price: priceId }],
        payment_settings: {
            payment_method_options: {
                card: {
                    request_three_d_secure: 'any',
                },
            },
            payment_method_types: ['card'],
            save_default_payment_method: 'on_subscription',
        },
        expand: ['latest_invoice.payment_intent'],
    });

    // return the client secret and subscription id
    return {
        clientSecret: subscription.latest_invoice.payment_intent.client_secret,
        subscriptionId: subscription.id,
    };

})