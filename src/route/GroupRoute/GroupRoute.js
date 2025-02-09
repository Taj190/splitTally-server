import express from 'express';
import {CreateGroupController, GetGroupNameController }from '../../controller/GroupController/GroupController.js';
import { IsLoggedIn } from '../../ middleware/isLoggedIn/IsLoggedIn.js';
export const groupCreation = express.Router();

groupCreation.post('/creation',IsLoggedIn,CreateGroupController )
groupCreation.get('/list', IsLoggedIn , GetGroupNameController)