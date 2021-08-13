const User = require('../../../models/User');
const VerifyCode = require('../../../models/Verifycode');
const ForgetCode = require('../../../models/Forgetcode');


async function deleteUnnecessary() {
    var currentTime = Math.floor(new Date().getTime()/1000);
    currentTime = currentTime - 120;


    var currentTime = Math.floor(new Date().getTime()/1000);
    var after6Hours = currentTime - 21600;
    var after24Hours = currentTime - 86400;

    // Delete Unnecessary Email Verify Codes
    await VerifyCode.deleteMany({codeSendTime: {$lt: after6Hours} });

    // Delete Unnecessary Recovery Codes
    await ForgetCode.deleteMany({codeSendTime: {$lt: after6Hours} });

    // Delete Users who did not verify they're account after 24 hour
    await User.deleteMany({ $and: [ { emailStatus: "inactive"}, { userCreateEpochTime: {$lt: after24Hours} } ] });

}

module.exports = deleteUnnecessary;