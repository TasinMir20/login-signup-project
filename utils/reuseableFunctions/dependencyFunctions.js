/* Schema of Database powered by Mongoose module */
const User = require('../../models/User'); // "User" Schema is must require to processing "loginAuthentication" function
const Usercookie = require('../../models/Usercookie'); // "Usercookie" Schema is must require to processing "loginAuthentication" function
const VerifyCode = require('../../models/Verifycode'); // "VerifyCode" Schema is must require to processing "verifyCodeSaveDB" function



function worstPasswordCheck(item) {

    var arrayOfWeakPasswords = ["picture1", "password", "password1", "password12", "password123", "password1234", "senha", "qwerty", "qwerty1", "abc123", "abcd1234", "123abc", "Million2", "OOOOOO", "loveme", "love123", "iloveyou", "iloveyou1", "iloveu", "lovely", "fuckyou", "fuckyou1", "aaron431", "qqww1122", "omgpop", "qwertuiop", "qwerty123", "qwer1234", "1q2w3e4r", "1q2w3e4r5t", "1q2w3e", "admin", "qwertyuiop", "welcome", "princess", "123qwe", "qwe123", "dragon", "sunshine", "football", "football1", "baseball", "monkey", "!@#$%^&*", "charlie", "a123456", "a12345", "b123456", "aa123456", "123456a", "1234qwer", "asdfghjkl", "asdfgh", "donald", "ashley", "unknown", "zxcvbnm", "chatbooks", "jacket025", "evite", "pokemon", "Bangbang123", "jobandtalent", "1qaz2wsx", "q1w2e3r4", "default", "aaaaaa", "soccer", "ohmnamah23", "zing", "shadow", "qazwsx", "michael", "michael1", "party", "daniel", "asdasd", "myspace1", "asd123", "a123456789", "123456789a", "12345a", "superman", "tigger", "purple", "samantha", "charlie", "babygirl", "jordan", "jordan23", "anhyeuem", "killer", "basketball", "michelle", "lol123", "nicole", "naruto", "master", "chocolate", "maggie", "computer", "hannah", "jessica", "hunter", "justin", "cookie", "hello", "hello1", "hello12", "hello123", "help1", "help12", "help123", "help1234", "help12345", "blink182", "andrew", "love", "bailey", "princess1", "a801016", "anthony", "yugioh", "amanda", "asdf1234", "trustno", "trustno1", "butterfly", "x4ivygA51F", "batman", "starwars", "summer", "jakcgt333", "buster", "jennifer", "babygirl", "babygirls", "babygirl1", "family", "azerty", "andrea", "matthew", "pepper", "letmein", "joshua", "123456b", "madison", "Sample123", "jesus1", "taylor", "whatever", "ginger", "flower", "flowers", "robert", "samsung", "gabriel", "alexander", "cheese", "passw0rd", "peanut", "thomas", "angel", "angel1"];

    for (var i = 0; i < arrayOfWeakPasswords.length; i++) {
        if ((arrayOfWeakPasswords[i].toLowerCase()) == (item.toLowerCase())) {
            return true;
        }
    }
    return false;
}


function generate_cookie_token(length){

    var a = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890".split("");
    var b = [];  
    for (var i=0; i<length; i++) {
        var j = (Math.random() * (a.length-1)).toFixed(0);
        b[i] = a[j];
    }
    return b.join("");
}


// "cookieParse" function is must require to processing "loginAuthentication" function
function cookieParse(rc) {
    var cookiesObj = {};
    rc && rc.split(';').forEach(function( cookie ) {
        var parts = cookie.split('=');
        cookiesObj[parts.shift().trim()] = decodeURI(parts.join('='));
    });

    return cookiesObj;
}


async function loginAuthentication(request, response, next)  {
    // Start to check user Login or not
    var cookie = request.headers.cookie;
    var cookiesObj = cookieParse(cookie);
    
    var Login_Cookie = cookiesObj.Login_Cookie;

    try {

        var userLoginCookie = await Usercookie.findOne({ cookieValue: Login_Cookie });

        if (userLoginCookie) {

            var {userObject_idAsCookieIdentity, cookieName, cookieValue, login} = userLoginCookie;

            var findUser = await User.findOne({ _id: userObject_idAsCookieIdentity });

            
            if (findUser) {

                var feedback = {access: true, findUser};
                return feedback;
                

            } else {

                // if currently doesn't exist this user on the Database, then this user Login cookies will be deleted from the Database, and the browser
                var cookieDeleteFromDB = await Usercookie.deleteMany({userObject_idAsCookieIdentity});
                if (cookieDeleteFromDB.deletedCount > 0) {
                    response.clearCookie('Login_Cookie');
                }
                
                
                var feedback = {access: false, findUser: {}};
                return feedback;

            }

        } else {

            // if doesn't exist the Login_Cookie on the Database, but the cookie still exists in Browser then the cookie will be deleted from the Browser
            if (Login_Cookie) {
                response.clearCookie('Login_Cookie');
            }


            var feedback = {access: false, findUser: {}};
            return feedback;
            
        }
        // End to check user Login or not


   } catch (e) {
       console.log(e);
       next(e);
   }
}


async function mailSending(sentTo, subject, htmlMsg) {

    const nodemailer = require("nodemailer");

    let transporter = nodemailer.createTransport({
            // host: 'smtp.gmail.com',
            // port: 587,
            service: 'hotmail',
            auth: {
                user: process.env.mail_sending_account,
                pass: process.env.mail_password
            }
    })


    
    const mailOptions = {
        from: `Support <${process.env.mail_send_from}>`,
        to: sentTo,
        subject,
        html: htmlMsg
    };

    let mailSend = await transporter.sendMail(mailOptions);

    return mailSend;
}

async function verifyCodeSaveDB(findUser) {

    var theVerifyCode = Math.floor(100000 + Math.random() * 900000);

    var currentTime = Math.floor(new Date().getTime()/1000);
    const codeExpireTime = currentTime + 900;

    let code = new VerifyCode({
        identityOfCodes: findUser._id,
        theCodes: theVerifyCode,
        codeSendTime: currentTime,
        expireTime: codeExpireTime,
        wrongTryTime: 0
    })

    let verifyCodeSave = await code.save();

    return {verifyCodeSave, theVerifyCode};

}



/////////////////////////

function recoveryCodeResendTimeInSeconds(user, findCode) {
    var currentTime = Math.floor(new Date().getTime()/1000);

    // Recovery code resend করতে পারবে কত সময় পরে সেই seconds গুলো front ejs এ পাঠানো
    if (user.recoveryCodeResendTimes == 1) {
        var seconds = (findCode.codeSendTime + 60) - currentTime;
    }
    if (user.recoveryCodeResendTimes == 2) {
        var seconds = (findCode.codeSendTime + 120) - currentTime;
    }
    if (user.recoveryCodeResendTimes == 3) {
        var seconds = (findCode.codeSendTime + 180) - currentTime;
    }
    if (user.recoveryCodeResendTimes == 4) {
        var seconds = (findCode.codeSendTime + 43200) - currentTime;
    }

    return seconds;
}

/////////////////////////

module.exports = { worstPasswordCheck, generate_cookie_token, cookieParse, loginAuthentication, mailSending, verifyCodeSaveDB, recoveryCodeResendTimeInSeconds };