import { z } from "zod";

export const signupSchema = z.object({
    fullName: z.string().min(3, "Full name must be at least 3 characters long"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(5, "Password must be at least 5 characters long").max(30, "Password must not be more than 30 characters long"),
    confirmPassword: z.string().min(5, "Password must be at least 5 characters long").max(30, "Password must not be more than 30 characters long"),
})

export const loginSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(5, "Password must be at least 5 characters long").max(30, "Password must not be more than 30 characters long"),
})

export const verifyOtpSchema = z.object({
    email: z.string().email("Invalid email address"),
    otp: z.string().min(6, "Otp must be at least 6 digits").max(6, "Otp must not be more than 6 digits"),
})

export const forgotPasswordSchema = z.object({
    email: z.string().email("Invalid email address"),
})

export const resetPasswordSchema = z.object({
    newPassword: z.string().min(5, "Password must be at least 5 characters long").max(30, "Password must not be more than 30 characters long"),
    confirmNewPassword: z.string().min(5, "Password must be at least 5 characters long").max(30, "Password must not be more than 30 characters long"),
})
