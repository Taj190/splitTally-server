import express from 'express';
import dotenv from 'dotenv';
import ConnectDb from './src/dbConfig/db.js';
import cors from 'cors'
import cookieParser from 'cookie-parser';
import { authentication } from './src/route/googleSignUp.js';
import axios from 'axios'
import { groupCreation } from './src/route/GroupRoute/GroupRoute.js';
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

app.listen(port, () => {
    console.log(`Backend server running at http://localhost:${port}`);
});