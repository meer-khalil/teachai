require('dotenv').config()
const asyncErrorHandler = require('../middlewares/asyncErrorHandler');

const site = 'https://www.teachassistai.com'

const stripe = require('../config/stripe');

const plans = new Map([
    ['Starter', { priceInCent: 50, limit: 60, name: 'Starter' }],
    ['Professional', { priceInCent: 1499, limit: null, name: 'Professional' }
    ],
]);


exports.processPayment = asyncErrorHandler(async (req, res, next) => {

    console.log(plans);
    let plan = plans.get(req.body.plan);
    console.log(plan);

    const customer = await stripe.customers.create({
        metadata: {
            userId: req.user.id,
            plan: JSON.stringify(plan)
        }
    });

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
            success_url: `${site}/user/dashboard/chatbots`,
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