import express from 'express';
import CreateGroupContyroller from '../../controller/GroupController/GroupController.js';
import { IsLoggedIn } from '../../ middleware/isLoggedIn/IsLoggedIn.js';
export const groupCreation = express.Router();

groupCreation.post('/creation',IsLoggedIn,CreateGroupContyroller )