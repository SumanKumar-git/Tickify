import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useVerifyResetOtpMutation, useResetPasswordMutation } from "../api/authApi";

const step1Schema = z.object({
  email: z.string().email("Invalid email address"),
  otp: z.string().length(6, "OTP must be exactly 6 digits"),
});

const step2Schema = z.object({
  newPassword: z.string().min(5, "Password must be at least 5 characters long"),
  confirmNewPassword: z.string().min(5, "Confirm password must match"),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: "Passwords do not match",
  path: ["confirmNewPassword"],
});

export const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const emailParam = searchParams.get("email") || "";

  const [step, setStep] = useState(1); // 1: Verify OTP, 2: Reset Password

  const [verifyResetOtp, { isLoading: isVerifying }] = useVerifyResetOtpMutation();
  const [resetPassword, { isLoading: isResetting }] = useResetPasswordMutation();

  // Step 1 Form
  const {
    register: registerStep1,
    handleSubmit: handleSubmitStep1,
    setValue: setValueStep1,
    formState: { errors: errorsStep1 },
  } = useForm({
    resolver: zodResolver(step1Schema),
    defaultValues: { email: emailParam, otp: "" },
  });

  // Step 2 Form
  const {
    register: registerStep2,
    handleSubmit: handleSubmitStep2,
    formState: { errors: errorsStep2 },
  } = useForm({
    resolver: zodResolver(step2Schema),
  });

  useEffect(() => {
    if (emailParam) {
      setValueStep1("email", emailParam);
    }
  }, [emailParam, setValueStep1]);

  const onVerifyOtp = async (data) => {
    try {
      const res = await verifyResetOtp(data).unwrap();
      toast.success(res.message || "OTP verified. Set your new password.");
      setStep(2);
    } catch (err) {
      toast.error(err.data?.message || "Invalid OTP code");
    }
  };

  const onResetPassword = async (data) => {
    try {
      const res = await resetPassword(data).unwrap();
      toast.success(res.message || "Password reset successful");
      navigate("/auth");
    } catch (err) {
      toast.error(err.data?.message || "Failed to reset password");
    }
  };

  return (
    <section className="min-h-[calc(100vh-64px)] w-full flex items-center justify-center p-6 bg-surface-container-low">
      <div className="w-full max-w-md bg-surface-container p-8 rounded-xl border border-outline-variant/30 shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary mx-auto mb-4">
            <span className="material-symbols-outlined text-[28px]">
              {step === 1 ? "password_key" : "lock_open"}
            </span>
          </div>
          <h2 className="text-xl font-bold text-on-surface mb-2">
            {step === 1 ? "Enter Verification Code" : "Set New Password"}
          </h2>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            {step === 1
              ? "Verify the 6-digit OTP code sent for password recovery."
              : "Set a secure new password for your Tickify account."}
          </p>
        </div>

        {step === 1 ? (
          /* Step 1: Verify OTP */
          <form onSubmit={handleSubmitStep1(onVerifyOtp)} className="space-y-4">
            {!emailParam && (
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-on-surface-variant">Email Address</label>
                <input
                  type="email"
                  {...registerStep1("email")}
                  className="w-full px-4 py-2.5 rounded-lg border border-outline-variant/40 bg-surface-container-highest text-on-surface text-xs focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  placeholder="name@company.com"
                />
                {errorsStep1.email && (
                  <p className="text-[10px] text-error font-medium">{errorsStep1.email.message}</p>
                )}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-on-surface-variant">6-Digit Code</label>
              <input
                type="text"
                maxLength={6}
                {...registerStep1("otp")}
                placeholder="000000"
                className="w-full text-center tracking-[1.5em] py-3 rounded-lg border border-outline-variant/40 bg-surface-container-highest text-on-surface text-sm font-mono font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              />
              {errorsStep1.otp && (
                <p className="text-[10px] text-error font-medium">{errorsStep1.otp.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isVerifying}
              className="w-full py-3 bg-primary text-on-primary rounded-lg text-xs font-bold shadow-lg hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center mt-6"
            >
              {isVerifying ? "Verifying..." : "Verify Code"}
            </button>
          </form>
        ) : (
          /* Step 2: New Password */
          <form onSubmit={handleSubmitStep2(onResetPassword)} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-on-surface-variant">New Password</label>
              <input
                type="password"
                {...registerStep2("newPassword")}
                className="w-full px-4 py-2.5 rounded-lg border border-outline-variant/40 bg-surface-container-highest text-on-surface text-xs focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                placeholder="••••••••"
              />
              {errorsStep2.newPassword && (
                <p className="text-[10px] text-error font-medium">{errorsStep2.newPassword.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-on-surface-variant">Confirm New Password</label>
              <input
                type="password"
                {...registerStep2("confirmNewPassword")}
                className="w-full px-4 py-2.5 rounded-lg border border-outline-variant/40 bg-surface-container-highest text-on-surface text-xs focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                placeholder="••••••••"
              />
              {errorsStep2.confirmNewPassword && (
                <p className="text-[10px] text-error font-medium">{errorsStep2.confirmNewPassword.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isResetting}
              className="w-full py-3 bg-primary text-on-primary rounded-lg text-xs font-bold shadow-lg hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center mt-6"
            >
              {isResetting ? "Resetting Password..." : "Reset Password"}
            </button>
          </form>
        )}

        <div className="mt-8 text-center border-t border-outline-variant/15 pt-6">
          <Link to="/auth" className="text-xs text-primary font-semibold hover:underline">
            Back to Sign In
          </Link>
        </div>
      </div>
    </section>
  );
};

export default ResetPasswordPage;
