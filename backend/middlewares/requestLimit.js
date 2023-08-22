const Usage = require("../models/usageModel");
const asyncErrorHandler = require("./asyncErrorHandler");

exports.requestLimit = asyncErrorHandler(async (req, res, next) => {

    let id = req.user._id

    const requestLimits = {
        free: 10,
        starter: 60,
        professional: Infinity
    };

    try {
        const usage = await Usage.findOne({ _id: id });

        if (usage) {
            const now = new Date();
            const lastUpdated = usage.lastUpdated;
            
            if (now - lastUpdated > 24 * 60 * 60 * 1000) {
                // Reset usage count for a new day
                usage.usageCount = 1;
            } else {
                usage.usageCount++;
            }

            usage.lastUpdated = now;
            await usage.save();

            if (usage.usageCount <= requestLimits[usage.plan]) {
                next();
            } else {
                return res.status(429).json({ error: 'Request limit exceeded' });
            }
        }
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
    next();
});