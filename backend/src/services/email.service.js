import dotenv from "dotenv";
dotenv.config();
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    requireTLS: true,
    auth: {
    type: 'OAuth2',
    user: process.env.GOOGLE_USER,
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
    }
});


// Verify the connection configuration
transporter.verify((error, success) => {
    if (error) {
    console.error('Error connecting to email server:', error);
    } else {
    console.log('Email server is ready to send messages');
    }
});

// Function to send email
export const sendEmail = async ({to, subject, text, html, attachments}) => {
    try {
    const info = await transporter.sendMail({
        from: `"Tickify" <${process.env.GOOGLE_USER}>`,
        to,
        subject,
        text,
        html,
        attachments,
    });

    console.log('Message sent: %s', info.messageId);
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    } catch (error) {
    console.error('Error sending email:', error);
    throw error;
    }
};