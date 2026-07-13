import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, "Email is required"],
        lowercase: true,
        trim: true
    },
    otp: {
        type: String,
        required: [true, "OTP is required"]
    },
    otpType: {
        type: String,
        enum: ["email-verify", "forgot-password"],
        required: [true, "OTP type is required"]
    },
    expiresAt: {
        type: Date,
        required: [true, "Expiry time is required"]
    }
},{
    timestamps: true
})

otpSchema.index({expiresAt: 1}, {expireAfterSeconds: 0})

const otpModel = mongoose.model("otp", otpSchema)

export default otpModel