import { OAuth2Client } from 'google-auth-library';
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const VerifyGoogleToken = async (token) => {
  
    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID, // Must match your frontend client ID
        });
        const payload = ticket.getPayload();
        return payload; // Contains email, name, sub (Google user ID), etc.
    } catch (error) {
        console.error('Token verification failed:', error);
        return null;
    }
};
