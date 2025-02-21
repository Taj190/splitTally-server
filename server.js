import express from 'express';
import dotenv from 'dotenv';
import ConnectDb from './src/dbConfig/db.js';
import cors from 'cors'
import cookieParser from 'cookie-parser';
import { authentication } from './src/route/googleSignUp.js';
import axios from 'axios'
import { groupCreation } from './src/route/GroupRoute/GroupRoute.js';
import { TransAction } from './src/route/TransactionRoute/Addtransaction.js';
dotenv.config();
const app = express();
const port = process.env.PORT || 5000;



app.use(express.json());
ConnectDb();
// for cookie
app.use(cookieParser());
// Move CORS configuration before any other middleware or routes
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'credentials'], 
    exposedHeaders: ['Set-Cookie'] 
}));


app.options('*', cors());
//for signup
app.use('/user', authentication);
// for login
app.use('/login', authentication)
// to logout 
app.use('/auth', authentication)
//to get code
app.use('/code',authentication)
//forgot password to verify email
app.use('/auth',authentication)
//reset password after email verification
app.use('/auth', authentication)
// to create Group
app.use('/group', groupCreation)
// to get name of groups
app.use('/group' , groupCreation)
//to get single group detail
app.use('/group', groupCreation )
// sending code to add group member
app.use('/code', groupCreation)
// to add new member in group
app.use ('/send' , groupCreation)
// to set privacy mode on or off
app.use('/privacymode' , groupCreation)
// to know privacymode is true or false 
app.use('/mode', groupCreation)
// to add transaction 
app.use('/add', TransAction)
// to get detail of all transactions
app.use('/transactions', TransAction)
// to edit transaction
app.use('/edit', TransAction)
// to get single transaction 
app.use('/single', TransAction)
// to delete transaction
app.use('/delete', TransAction)
// to verify transaction

app.use('/verify', TransAction)

app.listen(port, () => {
    console.log(`Backend server running at http://localhost:${port}`);
});