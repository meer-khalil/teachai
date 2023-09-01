const Usage = require("../models/usageModel");
const asyncErrorHandler = require("./asyncErrorHandler");

exports.requestLimit = asyncErrorHandler(async (req, res, next) => {

    let id = req.user.id

    const requestLimits = {
        Free: 10,
        Starter: 60,
        Professional: Infinity
    };

    try {
        const usage = await Usage.findOne({ user: id });

        if (usage) {

            if (usage.usageCount <= requestLimits[usage.plan]) {
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

                return res.status(429).json({ error: 'Request limit exceeded' });
            }

        }
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});