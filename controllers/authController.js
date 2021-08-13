/*****###### Dependencies Start ######*****/


/* Dependencies Modules*/
const mongoose = require('mongoose'); // in this file mongoose required only for this method-> mongoose.Types.ObjectId.isValid
const bcrypt = require('bcrypt'); // bcrypt Module to encrypt Passwords


/* Schema of Database powered by Mongoose module */
const User = require('../models/User'); // "User" Schema is must require to processing "signupPostController" and "loginPostController" function
const Usercookie = require('../models/Usercookie'); // "Usercookie" Schema is must require to processing "loginPostController" and "logoutController" function
const VerifyCode = require('../models/Verifycode');
const ForgetCode = require('../models/Forgetcode');


/* Dependency Functions imported*/

// "worstPasswordCheck" function is must require to processing "signupPostController" function
// "generate_cookie_token" function is must require to processing "loginPostController" function
// "cookieParse" function is must require to processing "logoutController",  "emailVerifyGetController" function
// "loginAuthentication" function is must require to processing "signupGetController", "loginGetController", "dashboardGetController" functions
const { worstPasswordCheck, generate_cookie_token, cookieParse, loginAuthentication, mailSending, verifyCodeSaveDB, recoveryCodeResendTimeInSeconds } = require("../utils/reuseableFunctions/dependencyFunctions");
 
/*****###### Dependencies End ######*****/



exports.signupGetController = async (request, response, next) => {

    let req = request;
    let res = response;
    let nx = next;

    var feedback = await loginAuthentication(req, res, nx);

    let {access, findUser} = feedback;
    if (access) {

        if (findUser.emailStatus === "active") {
            return response.redirect('/dashboard');
        } else {
            return response.redirect('/auth/email-verify');
        }

    } else {
        response.render("pages/auth/signup", {title: "Create a new account", passDataToEjs: {}, previousInputValue: {}});
    }
    
}


exports.signupPostController = async (request, response, next) => {

    // Logged in user can not request this route -- start
    let req = request;
    let res = response;
    let nx = next;

    var feedback = await loginAuthentication(req, res, nx);
    var {access} = feedback;

    if (access) {
        return response.send("You have to logout before request");
    }
    // Logged in user can not request this route --- end







    var {username, email, password, confirmPassword} = request.body;
    username = String(username);
    email = String(email);
    password = String(password);
    confirmPassword = String(confirmPassword);

    try {
        
        username = username.toLowerCase();
        email = email.toLowerCase();
        
        /* username validation */
        var isUsrNmNotNumr = (String(Number(username)) === "NaN");

        var validChar = (/^[0-9a-zA-Z_.]+$/.test(username)) && isUsrNmNotNumr ? true : false;

        var usernameLengthValid = (username.length >= 3 && username.length <= 15);
        
        var usernameExist = await User.findOne({ username });

        var usernameOk = validChar && usernameLengthValid && !usernameExist ? true : false;
        
        /* Email validation */
        const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        
        var validEmail = re.test(String(email).toLowerCase());
        var emailExist = await User.findOne({ email });
        var emailOk = validEmail && !emailExist ? true : false;

        /* Password validation */
        var passwordLength = password.length >= 6 && password.length <= 32;

        /* Weak password check */
        if (String(Number(password)) === "NaN") {
            var passwordEnoughStrong = !(worstPasswordCheck(password));

        } else {
            var isPasswordOnlyNumber = true;

        }

        /* new pass and confirm pass match validation */
        var newAndConfirmPassMatched = (password === confirmPassword);

        var passwordOk = passwordLength && newAndConfirmPassMatched && passwordEnoughStrong ? true : false;

        if (usernameOk && emailOk && passwordOk) {
            var currentEpochTime = Math.floor(new Date().getTime()/1000);
            var hashedPassword = await bcrypt.hash(password, 11);

            let user = new User({
                username: username.toLowerCase(),
                email: email.toLowerCase(),
                password : hashedPassword,
                emailStatus: "inactive",
                userCreateEpochTime: currentEpochTime,
                verifyCodeResendTimes: 0,
                recoveryCodeResendTimes: 0
            });
    
            let createUser = await user.save();




            if (createUser) {

                // saving the verification code to Database
                let codeSaveDB = await verifyCodeSaveDB(createUser);

                if (codeSaveDB.verifyCodeSave) {

                    // verification code sending
                    const sentTo = email;
                    const subject = "Email verification code";
                    const themMailMsg = `<div style="width: 100%; font-size: 15px; line-height: 21px; color: rgb(20, 24, 35); font-family: arial, sans-serif;">
                                            <div style="margin-top: 16px; margin-bottom: 20px;">Hi ${username},</div>
                                            <p style="color: rgb(109, 109, 108);">Thank you for creating account! Please confirm your email address. Enter the verification code:</p>
                                            <span style="color: rgb(20, 24, 35); background: rgb(231, 243, 255); display: inline-block; padding: 14px 32px; border: 1px solid rgb(24, 119, 242); border-radius: 7px; font-size: 17px; font-family: Roboto; font-weight: 700;">${codeSaveDB.theVerifyCode}</span>
                                        </div>`;

                    var mail = await mailSending(sentTo, subject, themMailMsg);

                    // verification code sending
                    
                    if (mail.accepted) {

                        response.cookie("email_verify", String(codeSaveDB.verifyCodeSave._id));
                        response.redirect("/auth/email-verify");
                    }


                    
                } else {
                    console.log("Failed to save verifying code");
                }

            }



        } else {
            if (username.length > 0) {

                if (usernameLengthValid) {
                    if (validChar) {
                        if (usernameExist) {
                            var usrnmMsg = '<p class="invalid-msg">Username is already exist!</p>';
                        }
                        
                    } else {
                        var usrnmMsg = '<p class="invalid-msg">Invalid username</p>';
                    }
                } else {
                    var usrnmMsg = '<p class="invalid-msg">Username length should be between 3 - 15!</p>';
                }

            } else {
                var usrnmMsg = '<p class="invalid-msg">Must have an username!</p>';
            }
            
    
            if (email.length > 0) {
                
                if (validEmail) {

                    if (emailExist) {
                    
                        var emlMsg = '<p class="invalid-msg">Email address is already exist!</p>';
                    }
    
                } else {
                    var emlMsg = '<p class="invalid-msg">Invalid email address!</p>';
                }
    
            } else {
                var emlMsg = '<p class="invalid-msg">Must have an Email!</p>';
            }
    
    
            if (password.length > 0) {
                
                if (passwordLength) {
                    

                    if (confirmPassword.length < 1 && password.length > 0) {
                        var entrcnfmpass = '<p class="invalid-msg">You have to entered confirm password!</p>';

                    } else if (!passwordEnoughStrong) {

                        if (isPasswordOnlyNumber) {
                            var passMsg = '<p class="invalid-msg">Include minimum 1 letter in your password!</p>';
                        } else {
                            var passMsg = '<p class="invalid-msg">Password should be more strong!</p>';
                        }

                    } else if (!newAndConfirmPassMatched) {
        
                        var passMsg = '<p class="invalid-msg">Confirm password doesn\'t match!</p>';
                        var entrcnfmpass = '<p class="invalid-msg">Confirm password doesn\'t match!</p>';
                    }

                } else {
                    var passMsg = '<p class="invalid-msg">Password length should be between 6 - 32!</p>';
                }

                
    
            } else {
                var passMsg = '<p class="invalid-msg">Must have a password!</p>';
                
            }

            var passDataToEjs = {usrnmMsg, emlMsg, passMsg, entrcnfmpass};
            response.render("pages/auth/signup", {title: "Create a new account", passDataToEjs, previousInputValue: {username, email, password}});
        }

    } catch (e) {
        console.log("Eroor hoice");
        console.log(e);
        next(e);
    }

}


exports.emailVerifyGetController = async (request, response, next) => {


    let req = request;
    let res = response;
    let nx = next;
    

    try {

        var strCookie = request.headers.cookie;
        var cookieObj = cookieParse(strCookie);
        var email_verifyC = cookieObj.email_verify;

        var isValid_email_verifyC = mongoose.Types.ObjectId.isValid(email_verifyC);

        // user identification by verify code cookie
        if (isValid_email_verifyC) {

            var findCodeDB = await VerifyCode.findOne({ _id: email_verifyC });

            if (findCodeDB) {
                var findUser = await User.findOne({ _id: findCodeDB.identityOfCodes });
                
                if (findUser) {
                    var letsDo = true;
                } else {
                    await VerifyCode.deleteOne({ _id: email_verifyC });
                    response.clearCookie('email_verify');
                }

            } else {
                response.clearCookie('email_verify');
            }

        } else {
            response.clearCookie('email_verify');
        }

        // if does not got user verify code cookie then identification by Login cookie
        if (!findCodeDB) {
            var {access, findUser} = await loginAuthentication(req, res, nx);

            var findCodeDB = await VerifyCode.findOne({ identityOfCodes: findUser._id });


            if (access && findUser.emailStatus == "inactive") {

                // user got but no code found on database of the user so redirect to this path for "/auth/resend-verify-code" re send code
                if (!findCodeDB) {
                    return response.redirect('/auth/resend-verify-code');
                }
            }

        }

        // if user identified Lest do
        if (access || letsDo) {

            if (findUser.emailStatus == "inactive") {

                var currentTime = Math.floor(new Date().getTime()/1000);

                // Verification code resend করতে পারবে কত সময় পরে সেই seconds গুলো front ejs এ পাঠানো
                if (findUser.verifyCodeResendTimes == 1) {
                    var seconds = (findCodeDB.codeSendTime + 60) - currentTime
                }
                if (findUser.verifyCodeResendTimes == 2) {
                    var seconds = (findCodeDB.codeSendTime + 120) - currentTime
                }
                if (findUser.verifyCodeResendTimes == 3) {
                    var seconds = (findCodeDB.codeSendTime + 180) - currentTime
                }
                if (findUser.verifyCodeResendTimes == 4) {

                    var seconds = (findCodeDB.codeSendTime + 43200) - currentTime;

                }


                return response.render("pages/auth/email-verify.ejs", {title: "Verify email", passDataToEjs: {userEmail: findUser.email, codeResentNextTime: seconds, access
                }});
        
            } else if (access && findUser.emailStatus == "active") {
                return response.redirect('/dashboard');
        
            } else {
                response.clearCookie('email_verify');
                return response.redirect('/auth/login');
            }

        } else {

            return response.redirect('/auth/signup');
        }


    }  catch (e) {
        console.log("Eroor hoice");
        console.log(e);
        next(e);
    }

}


exports.emailVerifyPostController = async (request, response, next) => {
    
    let req = request;
    let res = response;
    let nx = next;
    
    try {

        var { verify_code } = request.body;

        if(verify_code.length == 6) {

            var strCookie = request.headers.cookie;

            var cookieObj = cookieParse(strCookie);
            var email_verifyC = cookieObj.email_verify;
            var isValid_email_verifyC = mongoose.Types.ObjectId.isValid(email_verifyC);

            // user identification by verify code cookie
            if (isValid_email_verifyC) {
    
                var findCodeDB = await VerifyCode.findOne({ _id: email_verifyC });

                if (findCodeDB) {
                    var findUser = await User.findOne({ _id: findCodeDB.identityOfCodes });

                    if (findUser) {
                        var letsDo = true;
                    } else {
                        await VerifyCode.deleteOne({ _id: email_verifyC });
                    }
                } else {
                    response.clearCookie('email_verify');
                }
                
            } else {
                response.clearCookie('email_verify');
            }

            // if does not got user verify code cookie then identification by Login cookie
            if (!findCodeDB) {
                var {access, findUser } = await loginAuthentication(req, res, nx);
        
                var findCodeDB = await VerifyCode.findOne({ identityOfCodes: findUser._id });
            }


            // if user identified Lest do
            if (access || letsDo) {
                

                var currentTime = Math.floor(new Date().getTime()/1000);

                // if doesn't try with wrong code more than 3 times and doesn't expired the code then go
                if (findCodeDB.wrongTryTime <= 2 && findCodeDB.expireTime > currentTime) {

                    // if matched the user input email verification code to database code then go
                    if (verify_code == findCodeDB.theCodes) {
                        
                        // user email status update to inactive to active
                        let userActive = await User.updateOne({ _id: findCodeDB.identityOfCodes }, { emailStatus: 'active' });

                            if (userActive.nModified) {
                                
                                // now the email verification code should have to deleted because the code is used
                                await VerifyCode.deleteOne({ _id: findCodeDB._id });
                                response.clearCookie('email_verify');
            
                                // if not Login access so process for login
                                if (!access) {

                                    let cookieValue = generate_cookie_token(32);
                                    let cookieName = "Login_Cookie";
                    
                                    let userCookie = new Usercookie({
                                        userObject_idAsCookieIdentity: findCodeDB.identityOfCodes,
                                        cookieName,
                                        cookieValue,
                                        login: true
                                    })
                    
                                    let cookieSaved = await userCookie.save();
                    
                                    if (cookieSaved) {
                    
                                        response.cookie(cookieName, cookieValue, { maxAge: 24 * 60 * 60 * 1000, httpOnly: true });
                    
                                        
                                        return response.redirect('/dashboard');
                    
                                    } else {
                                        
                                        console.log("Failed to Save Cookie in Database");
                    
                                        return response.redirect('/auth/login');
                                    }
            
                                } else {
                                    // if Login access so Go to Dashboard
                                    
                                    return response.redirect('/dashboard');
                                }
                
                            } else {
                                console.log("Gone else block");
                            }
            
                    } else {
                        // counting tha How many times try with wrong code
                        await VerifyCode.updateOne({ _id: findCodeDB._id }, { wrongTryTime: findCodeDB.wrongTryTime + 1 });

                        var errorForFront = '<p>Code doesn\'t matched!</p>';

                    }
                } else {

                    if (findCodeDB.expireTime < currentTime) {

                        var errorForFront = '<p>The code is expired.</p>';

                    } else if (!(findCodeDB.wrongTryTime <= 2)) {

                        var errorForFront = '<p>You wrong code entered a lot time</p>';
                    }
                }
        
            } else {

                return response.redirect('/auth/login');
                
            }


        } else {

            var errorForFront = '<p>Please enter the six-digit code that you received most recent</p>';
            
            
        }

        return response.render("pages/auth/email-verify.ejs", {title: "Verify email", passDataToEjs: {errorForFront, access}});

    }  catch (e) {
        console.log("Eroor hoice");
        console.log(e);
        next(e);
    }
        


}


exports.resendCodeGetController = async (request, response, next) => {

    let req = request;
    let res = response;
    let nx = next;

    try {
        var strCookie = request.headers.cookie;
        var cookieObj = cookieParse(strCookie);
        var email_verifyC = cookieObj.email_verify;

        var isValid_email_verifyC = mongoose.Types.ObjectId.isValid(email_verifyC);

        // user identification by verify code cookie
        if (isValid_email_verifyC) {

            var findCodeDB = await VerifyCode.findOne({ _id: email_verifyC });

            if (findCodeDB) {
                var findUser = await User.findOne({ _id: findCodeDB.identityOfCodes });

                if (findUser) {
                    var letsDo = true;
                } else {
                    await VerifyCode.deleteOne({ _id: email_verifyC });
                }
            } else {
                response.clearCookie('email_verify');
            }

        } else {
            response.clearCookie('email_verify');
        }

        // if does not got user verify code cookie then identification by Login cookie
        if (!findCodeDB) {

            var {access, findUser } = await loginAuthentication(req, res, nx);

            var findCodeDB = await VerifyCode.findOne({ identityOfCodes : findUser._id });



            if (access && findUser.emailStatus == "inactive") {

                // user got but no code found on database of the user so code send immediately
                if (!findCodeDB) {

                    let codeSaveDB = await verifyCodeSaveDB(findUser);

                    // new verification code sending to User Email
                    const sentTo = findUser.email;
                    const subject = "Email verification code";
                    const themMailMsg = `<div style="width: 100%; font-size: 15px; line-height: 21px; color: rgb(20, 24, 35); font-family: arial, sans-serif;">
                                            <div style="margin-top: 16px; margin-bottom: 20px;">Hi ${findUser.username},</div>
                                            <p style="color: rgb(109, 109, 108);">Please confirm your email address. Enter the verification code:</p>
                                            <span style="color: rgb(20, 24, 35); background: rgb(231, 243, 255); display: inline-block; padding: 14px 32px; border: 1px solid rgb(24, 119, 242); border-radius: 7px; font-size: 17px; font-family: Roboto; font-weight: 700;">${codeSaveDB.theVerifyCode}</span>
                                        </div>`;
                    var mail = await mailSending(sentTo, subject, themMailMsg);

                    // After send verification code
                    if (mail.accepted) {
            
                        return response.redirect("/auth/email-verify");
                    }

                }
            }

        }


        // if user identified Lest do
        if (access || letsDo) {


            if (findUser.emailStatus == "inactive") {

                // Resend code limitation
                var currentTime = Math.floor(new Date().getTime()/1000);

                var zeroTime = (findUser.verifyCodeResendTimes == 0);
                var oneTime = (findUser.verifyCodeResendTimes == 1 && (findCodeDB.codeSendTime + 60) < currentTime);
                var twoTimes = (findUser.verifyCodeResendTimes == 2 && (findCodeDB.codeSendTime + 120) < currentTime);
                var threeTimes = (findUser.verifyCodeResendTimes == 3 && (findCodeDB.codeSendTime + 180) < currentTime);
                var fourTimes = (findUser.verifyCodeResendTimes == 4 && (findCodeDB.codeSendTime + 43200) < currentTime);

                var codeResendAvailable = zeroTime || oneTime || twoTimes || threeTimes || fourTimes; 

                if (codeResendAvailable) {
                    
                    
                    if (fourTimes) {
                        // after 12 hours again get 3 time chance to resend email verification code so `User.verifyCodeResendTimes` value have to be 0
                        await User.updateOne({ _id: findUser._id }, { verifyCodeResendTimes: 0 });

                    }
                    
                    // before resend verification code delete all previous verification code from DB
                    await VerifyCode.deleteMany({ identityOfCodes: findUser._id });
                    response.clearCookie('email_verify');
            

                    // saving the new verification code to Database
                    let codeSaveDB = await verifyCodeSaveDB(findUser);
            

                    if (codeSaveDB.verifyCodeSave) {
            
                        // new verification code sending to User Email
                        const sentTo = findUser.email;
                        const subject = "Email verification code";
                        const themMailMsg = `<div style="width: 100%; font-size: 15px; line-height: 21px; color: rgb(20, 24, 35); font-family: arial, sans-serif;">
                                                <div style="margin-top: 16px; margin-bottom: 20px;">Hi ${findUser.username},</div>
                                                <p style="color: rgb(109, 109, 108);">Please confirm your email address. Enter the verification code:</p>
                                                <span style="color: rgb(20, 24, 35); background: rgb(231, 243, 255); display: inline-block; padding: 14px 32px; border: 1px solid rgb(24, 119, 242); border-radius: 7px; font-size: 17px; font-family: Roboto; font-weight: 700;">${codeSaveDB.theVerifyCode}</span>
                                            </div>`;
            
                        var mail = await mailSending(sentTo, subject, themMailMsg);
                        

                        // After send verification code
                        if (mail.accepted) {
            
                            if (!access) {
                                response.cookie("email_verify", String(codeSaveDB.verifyCodeSave._id));
                            }


                            if (!fourTimes) {
                                // counting that how many times resend verification code
                                await User.updateOne({ _id: findUser._id }, { verifyCodeResendTimes: findUser.verifyCodeResendTimes + 1 });
                            }

                            
                            return response.redirect("/auth/email-verify");
                        }
            
                        
                    } else {
                        console.log("Failed to save resend verifying code");
                    }

                } else {

                    // Just for console message
                    if (findUser.verifyCodeResendTimes == 1) {
                        console.log("try again after 1 minute")
                    }
                    if (findUser.verifyCodeResendTimes == 2) {
                        console.log("try again after 2 minute")
                    }
                    if (findUser.verifyCodeResendTimes == 3) {
                        console.log("try again after 3 minute")
                    } 
                    if (findUser.verifyCodeResendTimes == 4) {
                        console.log("try again after 12 hours")
                    }

                    return response.redirect("/auth/email-verify");
                }
        
            } else {

                return response.redirect("/dashboard");
            }


        } else {
            return response.redirect('/auth/email-verify');
        }


    }  catch (e) {
        console.log("Eroor hoice");
        console.log(e);
        next(e);
    }

}





exports.loginGetController = async (request, response, next) => {

    // Delete Unnecessary Email Verify Codes, Recovery Codes and Delete Users who did not verify they're account after 24 hour
    const deleteUnnecessary = require('../utils/reuseableFunctions/others/expired-code-cookie-user-deleted');
    await deleteUnnecessary();
    // Delete Unnecessary end
    response.clearCookie('recovery_pass');

    
    let req = request;
    let res = response;
    let nx = next;

    var feedback = await loginAuthentication(req, res, nx);

    let {access, findUser} = feedback;


    if (access) {

        if (findUser.emailStatus === "active") {
            return response.redirect('/dashboard');
        } else {
            return response.redirect('/auth/email-verify');
        }

    } else {
        response.render("pages/auth/login", {title: "Login to your Account", passDataToEjs: {}, previousInputValue: {}});
    }

}



exports.loginPostController = async (request, response, next) => {
    
    // Logged in user can not request this route -- start
    let req = request;
    let res = response;
    let nx = next;

    var feedback = await loginAuthentication(req, res, nx);
    var {access} = feedback;

    if (access) {
        return response.send("You have to logout before request");
    }
    // Logged in user can not request this route --- end







    let {emailOrUsername, password} = request.body;
        emailOrUsername = String(emailOrUsername);
        password = String(password);

    try {


        
        if (emailOrUsername.length > 0 && password.length > 0) {
            

            emailOrUsername = (emailOrUsername.toLowerCase()).trim();

            var userExist = emailOrUsername.length > 0 ? await User.findOne({ $or: [ { email: emailOrUsername }, { username: emailOrUsername } ] }) : '';
            
            var notUserExist = userExist ? false : true;


            if (!userExist) {
                var emlOrUsernameMsg = '<p class="invalid-msg">User not exist!</p>';
            } else {


                let match = await bcrypt.compare(password, userExist.password);
                if (!match) {
                    var passMsg = '<p class="invalid-msg">Password wrong!</p>';
                    
                } else {
                
                    let cookieValue = generate_cookie_token(32);
                    let cookieName = "Login_Cookie";

                    let userCookie = new Usercookie({
                        userObject_idAsCookieIdentity: userExist._id,
                        cookieName,
                        cookieValue,
                        login: true
                    })

                    let cookieSaved = await userCookie.save();

                    if (cookieSaved) {

                        response.cookie(cookieName, cookieValue, { maxAge: 24 * 60 * 60 * 1000, httpOnly: true });

                        return response.redirect('/dashboard');

                    } else {
                        console.log("Failed to Save Cookie in Database");

                    }
  
                }
            } 

            
        } else {

            if (emailOrUsername.length < 1 ) {
                var emlOrUsernameMsg = '<p class="invalid-msg">Please enter your email address or username!</p>'; 
            }

            if (password.length < 1) {
                var passMsg = '<p class="invalid-msg">Please enter your Password!</p>'; 
            }

            
        }
        

        return response.render("pages/auth/login", {title: "Login to your Account", passDataToEjs: {emlOrUsernameMsg, passMsg, userExist, notUserExist}, previousInputValue: {emailOrUsername}});
        
    } catch (e) {
        console.log(e);
    }

}






exports.forgetPassGetController = async (request, response, next) => {

    var strCookie = request.headers.cookie;
    var cookieObj = cookieParse(strCookie);
    var recovery_passC = cookieObj.recovery_pass;
    var isValid_recovery_passC = mongoose.Types.ObjectId.isValid(recovery_passC);

    
    

    let req = request;
    let res = response;
    let nx = next;
    // Login or Not check start
    var feedback = await loginAuthentication(req, res, nx);
    var {access, findUser} = feedback;
    // Login or Not check End



    
    ///////////////////// Recovery code resend if request ----- Start ////////////////////
    if (isValid_recovery_passC && !access) {

        const resendRecoveryCode = require("../utils/reuseableFunctions/resend-recovery-code");

        let iD = request.query.id;
        var findForgetCodeDBbyQueryStr = await ForgetCode.findOne({_id: iD});


        if (findForgetCodeDBbyQueryStr) {

            let QueryStrUserFind = await User.findOne({_id: findForgetCodeDBbyQueryStr.identityOfCodes});

            if (QueryStrUserFind) {

                var resendCode = await resendRecoveryCode(findForgetCodeDBbyQueryStr, QueryStrUserFind, iD, response, mailSending, recoveryCodeResendTimeInSeconds);

                if ((typeof resendCode) === "object") {

                    return response.render("pages/auth/code-page-of-forget.ejs", {title: "Enter recovery code", passDataToEjs: {uniqueId: resendCode.resentCodeUniqueUrlId, codeResentNextTime: resendCode.seconds}, previousInputValue: {}});

                } else if (resendCode === "rdret") {

                    return response.redirect("/auth/recovery");
                }

            }
        }



    }

    ///////////////////// Recovery code resend if request  ----- End ////////////////////



    




    if (access) {

        /////////////////////////////////////////
        // if user Logged in so "recovery_pass" cookie delete recovery code delete from DB
        if (isValid_recovery_passC) {
            await ForgetCode.deleteOne({ _id: recovery_passC });
        }
        if (recovery_passC) {
            response.clearCookie('recovery_pass');
        }
        /////////////////////////////////////////
        
        

        

        if (findUser.emailStatus === "active") {
            return response.redirect('/dashboard');
        } else {
            return response.redirect('/auth/email-verify');
        }

    } else {
        
        if (isValid_recovery_passC) {


            var findForgetCodeDB = await ForgetCode.findOne({_id: recovery_passC});
            if (findForgetCodeDB) {
                
                var findUser = await User.findOne({_id: findForgetCodeDB.identityOfCodes});

                if (findUser) {
                    

                    if (findForgetCodeDB.used) {
                        return response.render("pages/auth/password-page-of-forget.ejs", {title: "Reset password", passDataToEjs: {}, previousInputValue: {}});
                    } else {
                        
                        var resentCodeUniqueUrlId = `?id=${recovery_passC}`;
                        var seconds = recoveryCodeResendTimeInSeconds(findUser, findForgetCodeDB);

                        return response.render("pages/auth/code-page-of-forget.ejs", {title: "Enter recovery code", passDataToEjs: {uniqueId: resentCodeUniqueUrlId, codeResentNextTime: seconds}, previousInputValue: {}});
                    }
                    

                } else {
                    await ForgetCode.deleteOne({ _id: recovery_passC });
                    response.clearCookie('recovery_pass');
                }

            } else {
                
                response.clearCookie('recovery_pass');
            }

        } else {

            response.clearCookie('recovery_pass');
        }

        return response.render("pages/auth/email-page-of-forget.ejs", {title: "Forget your password?", passDataToEjs: {}, previousInputValue: {}});

        
    }

}



exports.forgetPassPostController = async (request, response, next) => {
    
    // Logged in user can not request this route -- start
    let req = request;
    let res = response;
    let nx = next;

    var feedback = await loginAuthentication(req, res, nx);
    var {access} = feedback;

    if (access) {
        return response.send("You have to logout before request");
    }
    // Logged in user can not request this route --- end







    var strCookie = request.headers.cookie;
    var cookieObj = cookieParse(strCookie);
    var recovery_passC = cookieObj.recovery_pass;
    var isValid_recovery_passC = mongoose.Types.ObjectId.isValid(recovery_passC);


    if (isValid_recovery_passC) {
        var findForgetCodeDB = await ForgetCode.findOne({_id: recovery_passC});
        
        if (findForgetCodeDB) {
            
            var findUser = await User.findOne({_id: findForgetCodeDB.identityOfCodes});

            if (findUser) {
                var letsDo = true;
            } else {
                await ForgetCode.deleteOne({ _id: recovery_passC })
                response.clearCookie('recovery_pass');
            }
        } else {
            response.clearCookie('recovery_pass');
        }


    } else {
        response.clearCookie('recovery_pass');
    }


    let { email_page, code_submit_page, new_pass_page, email_or_username, recovery_code, new_pass, confirm_pass} = request.body;


    try {

        if (email_page) {

            if (email_or_username) {

                if (email_or_username.length > 0) {

                    /* username validation */
                    var isUsrNmNotNumr = (String(Number(email_or_username)) === "NaN");
                    var validChar = (/^[0-9a-zA-Z_.]+$/.test(email_or_username)) && isUsrNmNotNumr ? true : false;
                    
                    var validUsername = validChar ? true : false;


                    /* Email validation */
                    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
                    
                    var validEmail = re.test(String(email_or_username).toLowerCase());

        

                    if (validUsername || validEmail) {

                        var findUser = await User.findOne({ $or: [ { email: email_or_username }, { username: email_or_username } ] });


                        if (findUser) {

                            // saving the recovery code to Database
                            var theRecoveryCode = Math.floor(100000 + Math.random() * 900000);

                            var currentTime = Math.floor(new Date().getTime()/1000);
                            const codeExpireTime = currentTime + 900;

                            let code = new ForgetCode({
                                identityOfCodes: findUser._id,
                                theCodes: theRecoveryCode,
                                used: false,
                                codeSendTime: currentTime,
                                expireTime: codeExpireTime,
                                wrongTryTime: 0
                            });

                            let forgetCodeSave = await code.save();


                            if (forgetCodeSave) {

                                // Recovery code sending
                                const sentTo = findUser.email;
                                const subject = "Password recovery code";
                                const themMailMsg = `<div style="width: 100%; font-size: 15px; line-height: 21px; color: rgb(20, 24, 35); font-family: arial, sans-serif;">
                                                        <div style="margin-top: 16px; margin-bottom: 20px;">Hi ${findUser.username},</div>
                                                        <p style="color: rgb(109, 109, 108);">We received a request to reset your account password. Enter the following password reset code:</p>
                                                        <span style="color: rgb(20, 24, 35); background: rgb(231, 243, 255); display: inline-block; padding: 14px 32px; border: 1px solid rgb(24, 119, 242); border-radius: 7px; font-size: 17px; font-family: Roboto; font-weight: 700;">${theRecoveryCode}</span>
                                                    </div>`;

                                var mail = await mailSending(sentTo, subject, themMailMsg);

                                // Recovery code sending end
                                
                                if (mail.accepted) {
                                    var resentCodeUniqueUrlId = `?id=${forgetCodeSave._id}`;

                                    response.cookie("recovery_pass", String(forgetCodeSave._id));

                                    return response.render("pages/auth/code-page-of-forget.ejs", {title: "Enter recovery code", passDataToEjs: {uniqueId: resentCodeUniqueUrlId}, previousInputValue: {}});
                                }


                            } else {
                                console.log("Failed to save forget code");
                            }


                        } else {

                            if (validUsername) {
                                var errorForFront = '<p class="invalid-msg">We did not got any account under the username</p>';
                            }
                            if (validEmail) {

                                var errorForFront = '<p class="invalid-msg">We did not got any account under the Email address</p>';
                            }
                        }



                    } else {

                        var errorForFront = '<p class="invalid-msg">Invalid username or email address</p>';

                    }

                } else {
                    var errorForFront = '<p class="invalid-msg">Find your account by username or email address</p>';
                }

            } else {
                var errorForFront = '<p class="invalid-msg">Please enter your username or email address to find!</p>';
            }

        

        } 
        
        
        
        
        
        
        
        
        else if (code_submit_page) {

            if (letsDo) {

                if (recovery_code) {


                    if (recovery_code.length == 6) {

                        var currentTime = Math.floor(new Date().getTime()/1000);

                        // if doesn't try with wrong code more than 3 times and doesn't expired the code then go
                        if (findForgetCodeDB.wrongTryTime <= 2 && findForgetCodeDB.expireTime > currentTime) {

                            // if matched the user input recovery to database code then go
                            if (recovery_code == findForgetCodeDB.theCodes) {
                            
                                // The recovery code used status update to false to true
                                let forgetCodeUsed = await ForgetCode.updateOne({ _id: recovery_passC }, { used: true });
                                
        
                                if (forgetCodeUsed.nModified) {
                                    
                                    return response.render("pages/auth/password-page-of-forget.ejs", {title: "Reset password", passDataToEjs: {}, previousInputValue: {}});
                                }
        
                            } else {
                                // counting tha How many times try with wrong code
                                await ForgetCode.updateOne({ _id: recovery_passC }, { wrongTryTime: findForgetCodeDB.wrongTryTime + 1 });

                                var errorForFront = '<p class="invalid-msg">Code doesn\'t matched</p>';
                            }

                        } else {

                            if (findForgetCodeDB.expireTime < currentTime) {

                                var errorForFront = '<p class="invalid-msg">The code is expired.</p>';
        
                            } else if (!(findForgetCodeDB.wrongTryTime <= 2)) {
        
                                var errorForFront = '<p class="invalid-msg">You wrong code entered a lot time</p>';
                            }
                        }

                    } else {
                        var errorForFront = '<p class="invalid-msg">Please enter the six-digit code that you received most recent</p>';
                    }


                } else {
                    var errorForFront = '<p class="invalid-msg">Please enter recovery code</p>';
                    
                    
                }
                
                var resentCodeUniqueUrlId = `?id=${recovery_passC}`;

                return response.render("pages/auth/code-page-of-forget.ejs", {title: "Enter recovery code", passDataToEjs: {errorForFront, uniqueId: resentCodeUniqueUrlId}, previousInputValue: {}});

            }



        } 
        
        
        
        
        
        
        
        
        
        
        
        
        else if (new_pass_page) {

            
            if (letsDo) {


                if (new_pass && confirm_pass) {



                    /* Password validation */
                    var passwordLength = new_pass.length >= 6 && new_pass.length <= 32;

                    /* Weak password check */
                    if (String(Number(new_pass)) === "NaN") {
                        var passwordEnoughStrong = !(worstPasswordCheck(new_pass));

                    } else {
                        var isPasswordOnlyNumber = true;

                    }


                    /* new pass and confirm pass match validation */
                    var newAndConfirmPassMatched = (new_pass === confirm_pass);

                    var passwordOk = passwordLength && newAndConfirmPassMatched && passwordEnoughStrong ? true : false;



                    if (passwordOk) {

                        // Old password could not be new password
                        var isThisOldPass = await bcrypt.compare(new_pass, findUser.password);
                        
                        if (!isThisOldPass) {

                            var hashedPassword = await bcrypt.hash(new_pass, 11);
                            
                            const passwordUpdate = await User.updateOne({ _id: findUser._id }, { password: hashedPassword });
                            
                            if (passwordUpdate.nModified) {
                                await ForgetCode.deleteOne({ _id: recovery_passC })
                                
                                // Password changed notification to user
                                const sentTo = findUser.email;
                                const subject = "Account update!";
                                const themMailMsg = `<div style="width: 100%; font-size: 15px; line-height: 21px; color: rgb(20, 24, 35); font-family: arial, sans-serif;">
                                                        <div style="margin-top: 16px; margin-bottom: 20px;">Hi ${findUser.username},</div>
                                                        <p style="color: rgb(109, 109, 108);">Successfully your account's password has been changed!</p>
                                                    </div>`;

                                var mail = await mailSending(sentTo, subject, themMailMsg);
                                // Password changed notification to user ---- end

                                response.clearCookie('recovery_pass');

                                return response.redirect('/auth/login');
                            }

                        } else {
                            var errorForFront = '<p class="invalid-msg">Old password could not be new password!</p>';
                        }

                    } else {

                        if (passwordLength) {

                            if (confirm_pass.length < 1 && new_pass.length > 0) {
                                var entrcnfmpass = '<p class="invalid-msg">You have to entered confirm password!</p>';
        
                            } else if (!passwordEnoughStrong) {
        
                                if (isPasswordOnlyNumber) {
                                    var errorForFront = '<p class="invalid-msg">Include minimum 1 letter in your password!</p>';
                                } else {
                                    var errorForFront = '<p class="invalid-msg">Password should be more strong!</p>';
                                }
        
                            } else if (!newAndConfirmPassMatched) {
                
                                var errorForFront = '<p class="invalid-msg">Confirm password doesn\'t match!</p>';
                            }

                        } else {
                            var errorForFront = '<p class="invalid-msg">Password length should be between 6 - 32!</p>';
                        }
                        
                    }


                } else {

                    if (new_pass.length < 1 && confirm_pass.length < 1 ) {
                        var errorForFront = '<p class="invalid-msg">Please enter new password</p>';

                    } else if (confirm_pass.length < 1) {
                        var errorForFront = '<p class="invalid-msg">You have to entered confirm password!</p>';
                    }

                }

                
                return response.render("pages/auth/password-page-of-forget.ejs", {title: "Reset password", passDataToEjs: {errorForFront}, previousInputValue: {}});

            }
            
            
        }



        return response.render("pages/auth/email-page-of-forget.ejs", {title: "Forget your password?", passDataToEjs: {errorForFront}, previousInputValue: {}});


    } catch (e) {
        console.log("Eroor hoice");
        console.log(e);
        next(e);
    }


}







exports.dashboardGetController = async (request, response, next) => {

    let req = request;
    let res = response;
    let nx = next;

    var feedback = await loginAuthentication(req, res, nx);

    let {access, findUser} = feedback;

    if (access) {

        if (findUser.emailStatus === "active") {
            response.render("pages/dashboard", {title: "Welcome to dashboard", findUser});
        } else {
            return response.redirect('/auth/email-verify');
        }
        
    } else {
        return response.redirect('/auth/login');
    }

}




exports.logoutController = async (request, response, next) => {

    var cookie = request.headers.cookie;
    var cookiesObj = cookieParse(cookie);
    
    var Login_Cookie = cookiesObj.Login_Cookie;

    var cookieDeleteFromDB = await Usercookie.deleteOne({cookieValue: Login_Cookie});

    if (cookieDeleteFromDB.deletedCount === 1) {

        response.clearCookie('Login_Cookie');
        
        return response.redirect('/auth/login');

    } else {
        return response.redirect('/dashboard');
    }

    
}

