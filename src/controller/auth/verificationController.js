import ConnectDb from "../../dbConfig/db.js";
import VerificationCode from "../../schema/SignupSchema/verificationcode.js";
import { GenerateCode } from "../../utils/generateCode.js";
import SendVerificationEmail from "../../utils/sendEmail.js";

ConnectDb();

export const VerificationCodeController = async (req, res) => {
    const { email } = req.body;
    try {
        // Generate a 6-digit verification code
        const code = GenerateCode();
        // Set expiration time (10 minutes from now)
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
        // Save the verification code to the database
        await VerificationCode.create({ email, code, expiresAt });
        // Send the verification code via email
        await SendVerificationEmail(email, code);
        res.status(201).json({ 
            success: true, 
            message: "Your code has been sent to your email. Please check it." });
    } catch (error) {
        // Send an error response back to the client
        res.status(500).json({ 
            success:false,
            message: "An error occurred while sending the verification code." });
     
};   
    }