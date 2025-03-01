import express from 'express';
import { IsLoggedIn } from '../../ middleware/isLoggedIn/IsLoggedIn.js';
import { AddTransactionController, DeleteTransactionController, EditTransActionController, GetSettlementAdjustmentController, GetSingleTransactionDetailController, GetTotalExpenseController, GetTransactionDetailsController, GetTransactionsController,  VerifyTransaction } from '../../controller/Transaction/AddTransActionController.js';
import {  GenerateReport, GetAIReportStatus, GetReport } from '../../controller/Analysis/TransactionAnalysis.js';
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
// to get total of transaction and contribution of  each person  route
TransAction.get('/expense/:groupId' ,IsLoggedIn , GetTotalExpenseController )
// to settle the account give suggestion
TransAction.get('/settlement/:groupId' , GetSettlementAdjustmentController)
// to analyize tranasaction
TransAction.post('/analize' ,IsLoggedIn, GenerateReport )
// to select which button or text must be shown in front end  according AIreportSTATUS this route is responsible for that
TransAction.get('/eligibility/:groupId',IsLoggedIn, GetAIReportStatus)
// to get report detail if available 
TransAction.get('/explanation/:groupId', IsLoggedIn, GetReport)
