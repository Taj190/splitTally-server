import express from 'express';
import { IsLoggedIn } from '../../ middleware/isLoggedIn/IsLoggedIn.js';
import { AddTransactionController, DeleteTransactionController, EditTransActionController, GetSingleTransactionDetailController, GetTransactionDetailsController, GetTransactionsController, VerifyTransaction } from '../../controller/Transaction/AddTransActionController.js';
export const TransAction = express.Router();
// to add transaction 
TransAction.post('/transaction',IsLoggedIn,AddTransactionController )
// to get detail of all transactions 
TransAction.get('/detail' , IsLoggedIn,GetTransactionsController)
// to verify transaction
TransAction.post('/verifytransaction' ,IsLoggedIn, VerifyTransaction);
// to edit transaction
TransAction.put('/transaction/:transactionId', IsLoggedIn, EditTransActionController)
// to get single transction detail for updation 
TransAction.get('/transaction/:transactionId' , IsLoggedIn , GetSingleTransactionDetailController )
// to delete tranaction 
TransAction.delete('/transaction/:transactionId', IsLoggedIn, DeleteTransactionController );
// to get the detail of single transaction why the status is in pending phase 
TransAction.get('/status/:transactionId' , IsLoggedIn , GetTransactionDetailsController)