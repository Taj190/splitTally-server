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
      from: process.env.EMAIL,
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

export default SendVerificationEmail;
