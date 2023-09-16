const Usage = require("../models/usageModel");
const asyncErrorHandler = require("./asyncErrorHandler");

exports.requestLimit = asyncErrorHandler(async (req, res, next) => {

    let id = req.user.id

    const requestLimits = {
        Free: 10,
        Starter: 60,
        Professional: 120
    };

    try {
        const usage = await Usage.findOne({ user: id });

        if (usage) {
            console.log('Usage: ', usage);
            if (usage.usageCount <= requestLimits[usage.plan]) {
                console.log('Requested Updated: by 1');
                usage.usageCount++;
                await usage.save();
                next();
            } else {
                const now = new Date();
                const lastUpdated = usage.lastUpdated;

                if (now - lastUpdated > 24 * 60 * 60 * 1000) {
                    usage.usageCount = 1;
                    usage.lastUpdated = now;
                    await usage.save();
                    next();
                }

                console.log('going to call 429');
                return res.status(429).json({ error: 'Today Request Limit Reached' });
            }

        }
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});


exports.resetLimit = asyncErrorHandler(async (req, res, next) => {

    let id = req.user.id

    const requestLimits = {
        Free: 10,
        Starter: 60,
        Professional: 120
    };

    try {
        const usage = await Usage.findOne({ user: id });

        if (usage) {
            console.log('Usage: ', usage);
            if (usage.usageCount <= requestLimits[usage.plan]) {
                console.log("Limit is not Yet Reached");
                next();
            } else {
                const now = new Date();
                const lastUpdated = usage.lastUpdated;

                if (now - lastUpdated > 24 * 60 * 60 * 1000) {
                    console.log("Limit is reseted");
                    usage.usageCount = 1;
                    usage.lastUpdated = now;
                    await usage.save();
                    next();
                } else {
                    console.log("Limit is not reseted!");
                    next();
                }
            }

        }
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});