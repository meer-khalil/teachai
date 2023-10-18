const Usage = require("../models/usageModel");
const asyncErrorHandler = require("./asyncErrorHandler");

exports.requestLimit = asyncErrorHandler(async (req, res, next) => {

    let id = req.user.id

    try {
        const usage = await Usage.findOne({ user: id });

        if (usage) {
            console.log('Usage: ', usage);
            if (usage.startDate > usage.expiryDate) {
                console.log('going to call 429');
                return res.status(401).json({ error: 'Your plan is Expired' });
            } else {
                const now = new Date();
                const lastUpdated = usage.lastUpdated;

                if (now - lastUpdated > 24 * 60 * 60 * 1000) {
                    usage.usageCount = 0;
                    usage.lastUpdated = now;
                    await usage.save();
                    next();
                } else if (usage.usageCount <= usage.usageLimit) {
                    console.log('Requested Updated: by 1');
                    console.log('usageCount <= usageLimit', usage.usageCount <= usage.usageLimit);
                    usage.usageCount++;
                    await usage.save();
                    next();
                } else {
                    console.log('going to call 429');
                    return res.status(429).json({ error: 'Today Request Limit Reached' });
                }

            }

        }
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});


exports.resetLimit = asyncErrorHandler(async (req, res, next) => {

    let id = req.user.id

    try {
        const usage = await Usage.findOne({ user: id });

        if (usage) {

            const now = new Date();
            const lastUpdated = usage.lastUpdated;

            if (now - lastUpdated > 24 * 60 * 60 * 1000) {
                console.log("Limit is reseted");
                usage.usageCount = 1;
                usage.lastUpdated = now;
                await usage.save();
            }

            next();
        }
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

exports.isPlanExpired = asyncErrorHandler(async (req, res, next) => {

    let id = req.user.id

    try {
        const usage = await Usage.findOne({ user: id });

        if (usage) {
            if (usage.startDate <= usage.expiryDate) {
                console.log('Plan is not Expired');
                next();
            } else {
                console.log('going to call 429');
                return res.status(401).json({ error: 'Your plan is Expired' });
            }

        }
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});