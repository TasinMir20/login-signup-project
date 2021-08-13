const router = require("express").Router();

const {signupGetController, signupPostController, emailVerifyGetController, emailVerifyPostController, resendCodeGetController, loginGetController, loginPostController, forgetPassGetController, forgetPassPostController,  dashboardGetController, logoutController} = require("../controllers/authController")


router.get("/auth/signup", signupGetController);
router.post("/auth/signup", signupPostController);

router.get("/auth/email-verify", emailVerifyGetController);
router.post("/auth/email-verify", emailVerifyPostController);


router.get("/auth/resend-verify-code", resendCodeGetController);


router.get("/auth/login", loginGetController);
router.post("/auth/login", loginPostController);


router.get("/auth/recovery", forgetPassGetController);
router.post("/auth/recovery", forgetPassPostController);



router.get("/dashboard", dashboardGetController);



router.get("/logout", logoutController);


module.exports = router;