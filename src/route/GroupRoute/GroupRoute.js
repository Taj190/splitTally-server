import express from 'express';
import {AddMemberController, CreateGroupController, GetGroupNameController, GroupNameController, PrivacyModeDetailController, UpdatePrivacyModeController }from '../../controller/GroupController/GroupController.js';
import { IsLoggedIn } from '../../ middleware/isLoggedIn/IsLoggedIn.js';
import { VerificationCodeController } from '../../controller/auth/verificationController.js'
import { IsUserMemberOfGroup } from '../../ middleware/existingUserVerification.js';
import { VerifyCodeMiddleware } from '../../ middleware/verificationCodeMiddlware.js';
export const groupCreation = express.Router();

groupCreation.post('/creation',IsLoggedIn,CreateGroupController )
// to get list of group 
groupCreation.get('/list', IsLoggedIn , GetGroupNameController)
// to get name of group members
groupCreation.get('/detail', IsLoggedIn, GroupNameController)
//sending email to add group member
groupCreation.post('/addmember', IsLoggedIn, IsUserMemberOfGroup,VerificationCodeController)
// to add new member in group
groupCreation.post('/invitation' ,IsLoggedIn, VerifyCodeMiddleware, AddMemberController) ;
//to update the privacy status of group
groupCreation.put('/toggle' , IsLoggedIn, UpdatePrivacyModeController )
// to get privacy mode is true or false 
groupCreation.get('/status',IsLoggedIn,  PrivacyModeDetailController )
