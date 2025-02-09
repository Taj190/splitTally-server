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
// callback for code
app.get('/auth/callback', async (req, res) => {
    const { code } = req.query; // Authorization code from Google
  
    try {
      // Exchange the authorization code for tokens
      const response = await axios.post('https://oauth2.googleapis.com/token', {
        code,
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
        redirect_uri: 'http://localhost:8080/auth/callback',
        grant_type: 'authorization_code',
      });
  
      const { access_token, refresh_token } = response.data;
  
      // Save the tokens (e.g., in a database or environment variables)
      console.log('Access Token:', access_token);
      console.log('Refresh Token:', refresh_token);
  
      // Respond to the client
      res.send('Authentication successful!');
    } catch (error) {
      console.error('Error exchanging code for tokens:', error);
      res.status(500).send('Authentication failed.');
      
    }
    
  });

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