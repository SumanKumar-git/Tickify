import mongoose from "mongoose";
import bcrypt from "bcrypt";

const pendingUserSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: [true, "Full name is required"],
        trim: true
    },
    email: {
        type: String,
        required: [true, "Email is required"],
        unique: [true, "Email already exists"],
        trim: true,
        lowercase: true,
        match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email address"]
    },
    password: {
        type: String,
        required: [true, "Password is required"],
        trim: true
    },
    expiresAt: {
        type: Date,
        default: () => new Date(Date.now() + 30 * 60 * 1000)
    }
},{
    timestamps: true
});

pendingUserSchema.index({expiresAt: 1}, {expireAfterSeconds: 0})

const pendingUserModel = mongoose.model("pendingUser", pendingUserSchema);
export default pendingUserModel;