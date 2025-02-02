
import User from "../schema/GooglesignUp.js";

export const ExistingUserVerification = async(req, res , next)=>{
  const {email} = req.body ;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success:false,
        message: 'Email is already registered or code has been sent already.' });
    }
    next()
  } catch (error) {
    console.error('Error during signup:', error);
    res.status(500).json({ message: 'An error occurred during signup.' });
  }
}