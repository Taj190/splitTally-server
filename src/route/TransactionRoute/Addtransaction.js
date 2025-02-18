import express from 'express';
import { IsLoggedIn } from '../../ middleware/isLoggedIn/IsLoggedIn.js';
import { AddTransactionController, VerifyTransaction } from '../../controller/Transaction/AddTransActionController.js';
export const TransAction = express.Router();
TransAction.post('/transaction',IsLoggedIn,AddTransactionController )
TransAction.post('/verifytransaction' ,IsLoggedIn, VerifyTransaction)