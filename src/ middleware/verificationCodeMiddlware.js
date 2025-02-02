import VerificationCode from "../schema/verificationcode.js";

export const VerifyCodeMiddleware = async (req, res, next) => {
  const { email, code } = req.body; // Extract email and code from the request body

  // Check if email and code are provided
  if (!email || !code) {
    return res.status(400).json({ message: 'Email and code are required.' });
  }

  try {
     
    
    const verificationEntry = await VerificationCode.findOne({ email, code });

    if (!verificationEntry) {
      return res.status(404).json({ message: 'Invalid or expired code.' });
    }

    // Check if the code has expired
    const currentTime = new Date();
    if (currentTime > verificationEntry.expiresAt) {
      return res.status(400).json({ message: 'The code has expired.' });
    }

    // If the code is valid, proceed to the next middleware or route handler
    next();
  } catch (error) {
    console.error('Error verifying code:', error);
    res.status(500).json({ message: 'An error occurred while verifying the code.' });
  }
};

