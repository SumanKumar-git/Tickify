import dotenv from "dotenv";
dotenv.config();
import nodemailer from "nodemailer";

// Helper to base64url encode a buffer (RFC 4648)
const base64url = (buf) => {
    return buf.toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
};

// Function to refresh the access token from Google OAuth2
const getAccessToken = async () => {
    const response = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
            refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
            grant_type: "refresh_token"
        })
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(`Failed to refresh Google OAuth2 access token: ${JSON.stringify(data)}`);
    }
    return data.access_token;
};

// Verify the configuration on startup
const verifyConfiguration = async () => {
    try {
        await getAccessToken();
        console.log("Email service (Gmail HTTP API) is ready to send messages");
    } catch (error) {
        console.error("Email service configuration warning (Gmail API may need enabling in Google Developer Console):", error.message || error);
    }
};

verifyConfiguration();

// Use streamTransport to compile mail to MIME without sending over SMTP
const mailCompiler = nodemailer.createTransport({
    streamTransport: true,
    newline: "unix",
    buffer: true
});

// Function to send email
export const sendEmail = async ({to, subject, text, html, attachments}) => {
    try {
        // 1. Compile the mail using streamTransport to get the raw MIME message
        const info = await mailCompiler.sendMail({
            from: `"Tickify" <${process.env.GOOGLE_USER}>`,
            to,
            subject,
            text,
            html,
            attachments
        });

        // 2. Base64URL encode the compiled raw message
        const rawMessage = base64url(info.message);

        // 3. Get fresh access token
        const accessToken = await getAccessToken();

        // 4. Send via Gmail HTTP API
        const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${accessToken}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                raw: rawMessage
            })
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(`Gmail API send request failed: ${JSON.stringify(data)}`);
        }

        console.log("Message sent via Gmail HTTP API. Message ID:", data.id);
    } catch (error) {
        console.error("Error sending email:", error.message || error);
        throw error;
    }
};