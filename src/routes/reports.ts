export {}

const express = require("express");
const app = express.Router();

const { verifyToken } = require("../tokenManager/tokenVerify.js");
const User = require("../model/user.js");

app.post("/fortnite/api/game/v2/toxicity/account/:unsafeReporter/report/:reportedPlayer", verifyToken, async (req, res) => {

    const reporter = req.user.accountId;
    const reportedPlayer = req.params.reportedPlayer;
    
/*  let reporterData = await User.findOne({ accountId: reporter }).lean();
    let reportedPlayerData = await User.findOne({ accountId: reportedPlayer }).lean();
    
    const reason = req.body.reason || 'No reason provided';
    const details = req.body.details || 'No details provided';
    const markedasknown = req.body.bUserMarkedAsKnown ? 'Yes' : 'No'; */

    try {
        await User.findOneAndUpdate({ accountId: reportedPlayer } , { $inc: { reports: 1 } }, { new: true });
    } catch (err) {
    }

    res.status(200).send({ "success": true });

});

module.exports = app;
