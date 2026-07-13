import userModel from "../models/user.model.js";
import eventModel from "../models/event.model.js";
import otpModel from "../models/otp.model.js";
import pendingUserModel from "../models/pendingUser.model.js";
import { signupSchema, loginSchema, verifyOtpSchema, forgotPasswordSchema, resetPasswordSchema } from "../validations/user.validation.js";
import { sendEmail } from "../services/email.service.js";
import generateOtp from "../utils/generateOtp.js";
import getEmailVerificationTemplate from "../templates/emailVerification.template.js";
import getForgotPasswordTemplate from "../templates/forgotPassword.template.js";
import { hashPassword } from "../utils/hashPassword.js";
import { generateJwtToken } from "../utils/generateJwtToken.js";
import jwt from "jsonwebtoken"


//Controller for creating new user and sending OTP
export const userSignup = async (req, res) => {
    try{
        const validatedData = signupSchema.parse(req.body);
        const {fullName, email, password, confirmPassword} = validatedData;

        const existingUser = await userModel.findOne({email});
        if(existingUser){
            return res.status(400).json({
                success: false,
                message: "User already exists"
            })
        }

        if(password !== confirmPassword){
            return res.status(400).json({
                success: false,
                message: "Passwords do not match"
            })
        }

        await pendingUserModel.findOneAndDelete({email});

        await otpModel.deleteMany({email, otpType: "email-verify"});

        const hashedPassword = await hashPassword(password);

        await pendingUserModel.create({
            fullName,
            email,
            password: hashedPassword,
        })

        const otp = generateOtp();
        const otpExpiryTime = new Date(Date.now() + 10 * 60 * 1000);

        await otpModel.create({
            email,
            otp,
            otpType: "email-verify",
            expiresAt: otpExpiryTime
        });

        const emailVerificationTemplate = getEmailVerificationTemplate(otp);

        await sendEmail({
            to: email,
            subject: "Verify your email - Tickify",
            text: `Your email verification OTP is ${otp}. It will expire in 10 minutes.`,
            html: emailVerificationTemplate
        });

        return res.status(201).json({
            success: true,
            message: "Verification OTP sent to your email"
        });

    }
    catch(err){
        return res.status(500).json({
            success: false,
            message: "Failed to create account",
            error: err.message
        })
    }
}


//Controller to verify email via OTP and create account
export const sendOtpToVerifyEmail = async(req, res) => {
    try{
        const validatedData = verifyOtpSchema.parse(req.body);
        const {email, otp} = validatedData;

        const validOtp = await otpModel.findOne({
            email,
            otp,
            otpType: "email-verify"
        });

        if(!validOtp){
            return res.status(400).json({
                success: false,
                message: "Invalid OTP"
            })
        }

        if(validOtp.expiresAt < new Date()){
            return res.status(400).json({
                success: false,
                message: "OTP expired"
            })
        }

        const pendingUser = await pendingUserModel.findOne({email});

        if(!pendingUser){
            return res.status(404).json({
                success: false,
                message: "Signup session expired. Please register again."
            })
        }

        const user = await userModel.create({
            fullName: pendingUser.fullName,
            email: pendingUser.email,
            password: pendingUser.password,
            isEmailVerified: true,
        });

        const safeUser = await userModel.findById(user._id);

        await pendingUserModel.deleteOne({_id: pendingUser._id});

        await otpModel.deleteMany({email, otpType: "email-verify"});

        const token = generateJwtToken(user._id);

        res.cookie("token", token, {
            httpOnly: true,
            secure: true,
            sameSite: "strict",
            maxAge: 3 * 24 * 60 * 60 * 1000
        });

        return res.status(201).json({
            success: true,
            message: "Email verified successfully",
            user: safeUser
        })

    }
    catch(err){
        return res.status(500).json({
            success: false,
            message: "Failed to verify email",
            error: err.message
        })
    }
}


//Controller to resend OTP for email verification
export const resendEmailVerificationOtp = async (req, res) => {
    try{
        const {email} = req.body;

        const pendingUser = await pendingUserModel.findOne({email});

        if(!pendingUser){
            return res.status(404).json({
                success: false,
                message: "Signup session expired. Please register again."
            })
        }

        await otpModel.deleteMany({email, otpType: "email-verify"});

        const otp = generateOtp();

        const otpExpiryTime = new Date(Date.now() + 10 * 60 * 1000);

        await otpModel.create({
            email,
            otp,
            otpType: "email-verify",
            expiresAt: otpExpiryTime
        });

        const emailVerificationTemplate = getEmailVerificationTemplate(otp);

        await sendEmail({
            to: email,
            subject: "Verify your email - Tickify",
            text: `Your email verification OTP is ${otp}. It will expire in 10 minutes.`,
            html: emailVerificationTemplate
        });

        return res.status(200).json({
            success: true,
            message: "Verification OTP sent to your email"
        })
    }
    catch(err){
        return res.status(500).json({
            success: false,
            message: "Failed to resend OTP",
            error: err.message
        })
    }
}


//Controller to login user
export const userLogin = async (req, res) => {
    try{
        const validatedData = loginSchema.parse(req.body);
        const {email, password} = validatedData;

        const user = await userModel.findOne({email}).select("+password");

        if(!user){
            return res.status(404).json({
                success: false,
                message: "User not found"
            })
        }

        if(!user.isEmailVerified){
            return res.status(400).json({
                success: false,
                message: "Email not verified"
            })
        }

        const isPasswordValid = await user.comparePassword(password);

        if(!isPasswordValid){
            return res.status(400).json({
                success: false,
                message: "Invalid password"
            })
        }

        const token = generateJwtToken(user._id);

        const safeUser = await userModel.findById(user._id);

        res.cookie("token", token, {
            httpOnly: true,
            secure: true,
            sameSite: "strict",
            maxAge: 3 * 24 * 60 * 60 * 1000
        });

        return res.status(200).json({
            success: true,
            message: "Login successful",
            user: safeUser
        })
    }
    catch(err){
        return res.status(500).json({
            success: false,
            message: "Failed to login",
            error: err.message
        })
    }
}

//Controller for forgot password
export const forgotPassword = async (req, res) => {
    try{
        const validatedData = forgotPasswordSchema.parse(req.body);
        const {email} = validatedData;

        const user = await userModel.findOne({email});

        if(!user){
            return res.status(404).json({
                success: false,
                message: "User not found"
            })
        }

        await otpModel.deleteMany({email, otpType: "forgot-password"});

        const otp = generateOtp();

        const otpExpiryTime = new Date(Date.now() + 10 * 60 * 1000);

        await otpModel.create({
            email,
            otp,
            otpType: "forgot-password",
            expiresAt: otpExpiryTime
        });

        const forgotPasswordTemplate = getForgotPasswordTemplate(otp);

        await sendEmail({
            to: email,
            subject: "Forgot password - Tickify",
            text: `Your forgot password OTP is ${otp}. It will expire in 10 minutes.`,
            html: forgotPasswordTemplate
        });

        return res.status(200).json({
            success: true,
            message: "OTP sent to your email"
        })
    }
    catch(err){
        return res.status(500).json({
            success: false,
            message: "Failed to send OTP",
            error: err.message
        })
    }
}


//Controller to verify reset password OTP
export const verifyResetOtp = async (req, res) => {
    try{
        const {email, otp} = req.body;

        const validOtp = await otpModel.findOne({
            email,
            otp,
            otpType: "forgot-password"
        });

        if(!validOtp){
            return res.status(400).json({
                success: false,
                message: "Invalid OTP"
            })
        }

        if(validOtp.expiresAt < new Date()){
            return res.status(400).json({
                success: false,
                message: "OTP expired"
            })
        }

        const resetToken = jwt.sign({email, purpose: "forgot-password"}, process.env.JWT_SECRET, {
            expiresIn: "10m"
        });

        res.cookie("resetToken", resetToken, {
            httpOnly: true,
            secure: true,
            sameSite: "strict",
            maxAge: 10 * 60 * 1000
        });

        await otpModel.deleteMany({
            email,
            otpType: "forgot-password"
        });

        return res.status(200).json({
            success: true,
            message: "OTP verified successfully"
        })
    }
    catch(err){
        return res.status(500).json({
            success: false,
            message: "Failed to verify OTP",
            error: err.message
        })
    }
}

//Controller to reset password
export const resetPassword = async (req, res) => {
    try{
        const validatedData = resetPasswordSchema.parse(req.body);
        const {newPassword, confirmNewPassword} = validatedData;
        const {resetToken} = req.cookies;

        if(!resetToken){
            return res.status(400).json({
                success: false,
                message: "Reset token not found"
            })
        }

        const decodedToken = jwt.verify(resetToken, process.env.JWT_SECRET);
        const email = decodedToken.email;

        if(decodedToken.purpose !== "forgot-password"){
            return res.status(400).json({
                success: false,
                message: "Invalid reset token"
            })
        }

        if(newPassword !== confirmNewPassword){
            return res.status(400).json({
                success: false,
                message: "Passwords do not match"
            })
        }

        const hashedPassword = await hashPassword(newPassword);

        await userModel.findOneAndUpdate({email}, {password: hashedPassword});

        await otpModel.deleteMany({email, otpType: "forgot-password"});

        res.clearCookie("resetToken");

        return res.status(200).json({
            success: true,
            message: "Password reset successfully"
        })
    }
    catch(err){
        return res.status(500).json({
            success: false,
            message: "Failed to reset password",
            error: err.message
        })
    }
}

//Controller to check logged in user
export const checkAuth = (req, res) => {
    try{
        res.status(200).json({
            success: true,
            message: "User is authenticated",
            user: req.user
        })
    }
    catch(error){
        return res.status(500).json({
            success: false,
            message: "User is not authenticated",
            error: error.message
        });
    }
}


//Controller to logout user
export const logoutUser = (req, res) => {
    try{
        res.clearCookie("token");
        return res.status(200).json({
            success: true,
            message: "Logout successful"
        })
    }
    catch(err){
        return res.status(500).json({
            success: false,
            message: "Failed to logout",
            error: err.message
        })
    }
}


// Controller for admin to fetch all organizers
export const getOrganizersForAdmin = async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Only admins can perform this action"
            });
        }

        const organizers = await userModel.find({ role: "organizer" })
            .select("fullName email profilePhoto isEmailVerified createdAt")
            .sort({ createdAt: -1 })
            .lean();

        const organizersWithStats = await Promise.all(
            organizers.map(async (org) => {
                const eventCount = await eventModel.countDocuments({ organizer: org._id });
                return {
                    ...org,
                    eventCount
                };
            })
        );

        return res.status(200).json({
            success: true,
            message: "Organizers fetched successfully",
            organizers: organizersWithStats
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch organizers",
            error: err.message
        });
    }
};

// Controller for admin to toggle verification status of an organizer
export const toggleOrganizerVerification = async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Only admins can perform this action"
            });
        }

        const { organizerId } = req.params;
        const organizer = await userModel.findOne({ _id: organizerId, role: "organizer" });

        if (!organizer) {
            return res.status(404).json({
                success: false,
                message: "Organizer not found"
            });
        }

        organizer.isEmailVerified = !organizer.isEmailVerified;
        await organizer.save();

        return res.status(200).json({
            success: true,
            message: `Organizer email verification status updated to ${organizer.isEmailVerified}`,
            organizer
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Failed to toggle organizer verification",
            error: err.message
        });
    }
};

// Controller for admin to delete an organizer
export const deleteOrganizer = async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Only admins can perform this action"
            });
        }

        const { organizerId } = req.params;
        const organizer = await userModel.findOne({ _id: organizerId, role: "organizer" });

        if (!organizer) {
            return res.status(404).json({
                success: false,
                message: "Organizer not found"
            });
        }

        // Delete organizer events
        await eventModel.deleteMany({ organizer: organizerId });
        await organizer.deleteOne();

        return res.status(200).json({
            success: true,
            message: "Organizer and their associated events deleted successfully"
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Failed to delete organizer",
            error: err.message
        });
    }
};


// Controller to fetch all admins for public contact page
export const getAdminsForContact = async (req, res) => {
    try {
        const admins = await userModel.find({ role: "admin" })
            .select("fullName email profilePhoto")
            .lean();

        return res.status(200).json({
            success: true,
            message: "Administrators fetched successfully",
            admins
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch admin details",
            error: err.message
        });
    }
};

