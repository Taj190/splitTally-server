import express from 'express';
import {AddMemberController, CreateGroupController, GetGroupNameController, GroupNameController }from '../../controller/GroupController/GroupController.js';
import { IsLoggedIn } from '../../ middleware/isLoggedIn/IsLoggedIn.js';
import { VerificationCodeController } from '../../controller/auth/verificationController.js';
export const groupCreation = express.Router();

groupCreation.post('/creation',IsLoggedIn,CreateGroupController )
groupCreation.get('/list', IsLoggedIn , GetGroupNameController)
groupCreation.get('/detail', IsLoggedIn, GroupNameController)
//sending email to add group member
groupCreation.post('/addmember', IsLoggedIn, VerificationCodeController)
// to add new member in group
groupCreation.post('/invitation' ,  AddMemberController)