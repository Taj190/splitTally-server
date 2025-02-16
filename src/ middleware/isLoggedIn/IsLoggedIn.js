import User from "../../schema/SignupSchema/GooglesignUp.js";
import { VerifyGoogleToken } from "../googleAuthTokenVerifcation/tokenVerfication.js";
import jwt from 'jsonwebtoken';

export const IsLoggedIn = async (req, res, next) => {
    const token = req.cookies.token; 
    let user; 
    if(!token){
        const authHeader = req.headers['authorization'];
        if (!authHeader) return res.status(401).json({
            success: false,
            message: 'Unauthorized' });
            const Bearer_token = authHeader.split(' ')[1];
            if (!Bearer_token) return res.status(401).json({
                success: false,
                message: 'Unauthorized' });

                try {
                    if (Bearer_token && Bearer_token.length > 100) { // Google access tokens start with "ya29."
                        user = await VerifyGoogleToken(Bearer_token); 
                        if (!user) return res.status(403).json({
                            success: false,
                            message: 'Invalid Google token' });
                            req.user = user
                            return next();  
                    }
                } 
                  catch (error) {
                    res.status(404).json({
                        success:false,
                        message:'user not found'
                    })
                }
           }
  

    try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET); // Verify standard JWT
            user = await User.findById(decoded.userId);
            if (!user) return res.status(401).json({
                 success: false,
                 message: 'User not found' });
                req.user = user;
              next();
    } catch (error) {
        return res.status(403).json({ 
            success:false,
            message: 'Invalid token' });
    }
};

