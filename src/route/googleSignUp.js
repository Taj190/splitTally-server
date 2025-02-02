import express from 'express';
import { VerificationCodeController } from '../controller/verificationController.js';
import { ExistingUserVerification } from '../ middleware/existingUserVerification.js';
import  {SignUpGoogleController, LoginController } from '../controller/signUp.js'
export const authentication = express.Router();

//for verification code
authentication.post('/signUpcode' , ExistingUserVerification  ,VerificationCodeController)
//user sign up
authentication.post('/sign-up' , SignUpGoogleController);
//user login
authentication.post('/user' , LoginController )

