import express from "express";
import { 
    userSignup, 
    checkAuth, 
    logoutUser, 
    userLogin, 
    sendOtpToVerifyEmail, 
    resendEmailVerificationOtp, 
    forgotPassword, 
    resetPassword, 
    verifyResetOtp,
    getOrganizersForAdmin,
    toggleOrganizerVerification,
    deleteOrganizer,
    getAdminsForContact
} from "../controllers/user.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const userRouter = express.Router();

userRouter.post("/signup", userSignup);
userRouter.post("/verify-otp", sendOtpToVerifyEmail);
userRouter.post("/resend-verification-otp", resendEmailVerificationOtp);
userRouter.post("/forgot-password", forgotPassword);
userRouter.post("/verify-reset-otp", verifyResetOtp);
userRouter.post("/reset-password", resetPassword);
userRouter.post("/login", userLogin);
userRouter.get("/check-auth", authMiddleware, checkAuth);
userRouter.post("/logout", authMiddleware, logoutUser);
userRouter.get("/admins", getAdminsForContact);

// Admin organizer management
userRouter.get("/admin/organizers", authMiddleware, getOrganizersForAdmin);
userRouter.patch("/admin/organizers/:organizerId/toggle-verify", authMiddleware, toggleOrganizerVerification);
userRouter.delete("/admin/organizers/:organizerId", authMiddleware, deleteOrganizer);

export default userRouter;