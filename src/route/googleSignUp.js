import express from 'express';

import { ExistingUserVerification } from '../ middleware/existingUserVerification.js';

import { VerificationCodeController } from '../controller/auth/verificationController.js';
import { ForgotController, LoginController, LogoutController, ResetPasswordController, SignUpGoogleController } from '../controller/auth/signUp.js';
import { E_Conf_Midd_ToResetPass, VerifyCodeMiddleware } from '../ middleware/verificationCodeMiddlware.js';
import { IsLoggedIn } from '../ middleware/isLoggedIn/IsLoggedIn.js';
export const authentication = express.Router();

//for verification code
authentication.post('/signUpcode' , ExistingUserVerification  ,VerificationCodeController)
//user sign up
authentication.post('/sign-up' , SignUpGoogleController);
//user login
authentication.post('/user' , LoginController )
// user logout
authentication.post('/logout', IsLoggedIn , LogoutController)
// forgot password email verification and send code 
authentication.post('/forgot-password' ,E_Conf_Midd_ToResetPass, ForgotController)
//update password after email verification
authentication.post('/reset-password' , VerifyCodeMiddleware, ResetPasswordController )




