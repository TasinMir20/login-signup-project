const User = require('../../models/User'); 
const ForgetCode = require('../../models/Forgetcode');



///////////////////// Resend recovery code ////////////////////
async function resendRecoveryCode(findForgetCodeDBbyQueryStr, QueryStrUserFind, iD, response, mailSending, recoveryCodeResendTimeInSeconds) {

    // Resend code limitation
    var currentTime = Math.floor(new Date().getTime()/1000);

    var zeroTime = (QueryStrUserFind.recoveryCodeResendTimes == 0);
    var oneTime = (QueryStrUserFind.recoveryCodeResendTimes == 1 && (findForgetCodeDBbyQueryStr.codeSendTime + 60) < currentTime);
    var twoTimes = (QueryStrUserFind.recoveryCodeResendTimes == 2 && (findForgetCodeDBbyQueryStr.codeSendTime + 120) < currentTime);
    var threeTimes = (QueryStrUserFind.recoveryCodeResendTimes == 3 && (findForgetCodeDBbyQueryStr.codeSendTime + 180) < currentTime);
    var fourTimes = (QueryStrUserFind.recoveryCodeResendTimes == 4 && (findForgetCodeDBbyQueryStr.codeSendTime + 43200) < currentTime);

    var codeResendAvailable = zeroTime || oneTime || twoTimes || threeTimes || fourTimes; 
    
    
    if (codeResendAvailable) {

        if (fourTimes) {
            // after 12 hours again get 3 time chance to resend recovery code so `User.recoveryCodeResendTimes` value have to be 0
            await User.updateOne({ _id: QueryStrUserFind._id }, { recoveryCodeResendTimes: 0 });

        }

        // before resend recovery code delete the previous one recovery code from DB
        await ForgetCode.deleteOne({ _id: iD});
        response.clearCookie('recovery_pass');

        // saving the new recovery code to Database
        var theRecoveryCode = Math.floor(100000 + Math.random() * 900000);

        var currentTime = Math.floor(new Date().getTime()/1000);
        const codeExpireTime = currentTime + 900;

        let code = new ForgetCode({
            identityOfCodes: QueryStrUserFind._id,
            theCodes: theRecoveryCode,
            used: false,
            codeSendTime: currentTime,
            expireTime: codeExpireTime,
            wrongTryTime: 0
        })

        let forgetCodeSave = await code.save();

        // new recovery code sending to User Email
        const sentTo = QueryStrUserFind.email;
        const subject = "Password recovery code";
        const themMailMsg = `<div style="width: 100%; font-size: 15px; line-height: 21px; color: rgb(20, 24, 35); font-family: arial, sans-serif;">
                                <div style="margin-top: 16px; margin-bottom: 20px;">Hi ${QueryStrUserFind.username},</div>
                                <p style="color: rgb(109, 109, 108);">Enter the following password reset code:</p>
                                <span style="color: rgb(20, 24, 35); background: rgb(231, 243, 255); display: inline-block; padding: 14px 32px; border: 1px solid rgb(24, 119, 242); border-radius: 7px; font-size: 17px; font-family: Roboto; font-weight: 700;">${theRecoveryCode}</span>
                            </div>`;

        var mail = await mailSending(sentTo, subject, themMailMsg);
        // new recovery code sending to User Email end

        if (mail.accepted) {

            var resentCodeUniqueUrlId = `?id=${forgetCodeSave._id}`;

            response.cookie("recovery_pass", String(forgetCodeSave._id));
            
            if (!fourTimes) {
                // counting that how many times resend recovery code
                await User.updateOne({ _id: QueryStrUserFind._id }, { recoveryCodeResendTimes: QueryStrUserFind.recoveryCodeResendTimes + 1 });
                
            }

            var theUser = await User.findOne({ _id: QueryStrUserFind._id});

            var seconds = recoveryCodeResendTimeInSeconds(theUser, forgetCodeSave);


            var obj = {resentCodeUniqueUrlId, seconds}
            return obj;

        }

    } else {
        
        var redirect = "rdret";
        return redirect;

    }

}



module.exports = resendRecoveryCode;