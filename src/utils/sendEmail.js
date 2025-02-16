import nodemailer from 'nodemailer';
import { google } from 'googleapis';
import dotenv from 'dotenv';

dotenv.config();

// Set up OAuth2 client
const oAuth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  "https://developers.google.com/oauthplayground"
);


oAuth2Client.setCredentials({ refresh_token: process.env.REFRESH_TOKEN });

const SendVerificationEmail = async (email, code) => {
  try {
    // Get a new access token automatically
    const { token } = await oAuth2Client.getAccessToken();

    // Create transporter with the dynamically generated token
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: process.env.EMAIL,
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        refreshToken: process.env.REFRESH_TOKEN,
        accessToken: token, // Always use a fresh access token
      },
    });

    const mailOptions = {
      from: `"No-Reply" <${process.env.EMAIL}>`,
      to: email,
      subject: "Your Verification Code",
      text: `Your verification code is: ${code}`,
    };

    await transporter.sendMail(mailOptions);
    console.log("Verification email sent successfully.");
  } catch (error) {
    console.error("Error sending verification email:", error);
  }
};

 export const SendInvitationEmail = async (email, code, inviterName) => {
  try {
    // Get a new access token automatically
    const { token } = await oAuth2Client.getAccessToken();

    // Create transporter with the dynamically generated token
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: process.env.EMAIL,
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        refreshToken: process.env.REFRESH_TOKEN,
        accessToken: token, // Always use a fresh access token
      },
    });

    const mailOptions = {
      from: `"No-Reply" <${process.env.EMAIL}>`,
      to: email,
      subject: "You're Invited to Join a Group on SplitTally! 🎉",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h1>You're Invited to Join a Group on SplitTally! 🎉</h1>
          <p><strong>${inviterName}</strong> has invited you to join their group on SplitTally!</p>
          
          <h2>Your Verification Code</h2>
          <p style="font-size: 18px; font-weight: bold; color: #d9534f;">${code}</p>
    
          <p>⚠ This verification code will expire in <strong>10 minutes</strong>.</p>
    
          <h2>How to Join</h2>
          <p>Use the above code to sign up with email and password.</p>
          <p>After 10 minutes, you can still join using <strong>Google Sign-In</strong> for the next 1 hour.</p>
          <p>After 1 hour, you'll need to request a new invitation.</p>
    
          <h2>Join Now</h2>
          <p>
            Click the link below to join:
            <br>
            <a href="http://localhost:3000" style="display: inline-block; padding: 10px 15px; background-color: #007bff; color: #fff; text-decoration: none; border-radius: 5px; margin-top: 10px;">
              Join Now
            </a>
          </p>
    
          <p>If you didn't expect this email, you can ignore it.</p>
    
          <p>Best Regards, <br> The SplitTally Team</p>
        </div>
      `,
    };
    

    await transporter.sendMail(mailOptions);
    console.log("Verification email sent successfully.");
  } catch (error) {
    console.error("Error sending verification email:", error);
  }
};


export default SendVerificationEmail;
