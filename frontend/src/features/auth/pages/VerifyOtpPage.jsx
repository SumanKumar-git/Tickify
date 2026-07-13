import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useVerifyOtpMutation, useResendVerificationOtpMutation } from "../api/authApi";

const verifySchema = z.object({
  email: z.string().email("Invalid email address"),
  otp: z.string().length(6, "Verification code must be exactly 6 digits"),
});

export const VerifyOtpPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const emailParam = searchParams.get("email") || "";

  const [verifyOtp, { isLoading: isVerifying }] = useVerifyOtpMutation();
  const [resendOtp, { isLoading: isResending }] = useResendVerificationOtpMutation();

  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(verifySchema),
    defaultValues: {
      email: emailParam,
      otp: "",
    },
  });

  useEffect(() => {
    if (emailParam) {
      setValue("email", emailParam);
    }
  }, [emailParam, setValue]);

  // Countdown timer for OTP resend
  useEffect(() => {
    let interval = null;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const onVerifySubmit = async (data) => {
    try {
      const res = await verifyOtp(data).unwrap();
      toast.success(res.message || "Email verified successfully");
      // Redirect based on role
      if (res.user.role === "admin") {
        navigate("/admin/dashboard");
      } else if (res.user.role === "organizer") {
        navigate("/organizer/dashboard");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      toast.error(err.data?.message || "Invalid OTP code");
    }
  };

  const handleResend = async (e) => {
    e.preventDefault();
    if (!canResend) return;

    try {
      const res = await resendOtp({ email: emailParam || register("email") }).unwrap();
      toast.success(res.message || "Verification code resent");
      setTimer(60);
      setCanResend(false);
    } catch (err) {
      toast.error(err.data?.message || "Failed to resend code");
    }
  };

  return (
    <section className="min-h-[calc(100vh-64px)] w-full flex items-center justify-center p-6 bg-surface-container-low">
      <div className="w-full max-w-md bg-surface-container p-8 rounded-xl border border-outline-variant/30 shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary mx-auto mb-4">
            <span className="material-symbols-outlined text-[28px]">mark_email_read</span>
          </div>
          <h2 className="text-xl font-bold text-on-surface mb-2">Verify your email</h2>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            We've sent a 6-digit verification code to <span className="text-primary font-semibold block mt-1 truncate">{emailParam || "your email"}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit(onVerifySubmit)} className="space-y-6">
          {!emailParam && (
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-on-surface-variant">Email Address</label>
              <input
                type="email"
                {...register("email")}
                className="w-full px-4 py-2.5 rounded-lg border border-outline-variant/40 bg-surface-container-highest text-on-surface text-xs focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                placeholder="name@company.com"
              />
              {errors.email && (
                <p className="text-[10px] text-error font-medium">{errors.email.message}</p>
              )}
            </div>
          )}

          <div className="space-y-1.5 text-center">
            <label className="block text-xs font-semibold text-on-surface-variant text-left mb-1">6-Digit Code</label>
            <input
              type="text"
              maxLength={6}
              {...register("otp")}
              placeholder="000000"
              className="w-full tracking-[1.5em] text-center font-mono font-bold text-xl py-3 rounded-lg border border-outline-variant/40 bg-surface-container-highest text-on-surface placeholder:text-outline/40 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
            />
            {errors.otp && (
              <p className="text-[10px] text-error font-medium text-left mt-1">{errors.otp.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isVerifying}
            className="w-full py-3 bg-primary text-on-primary rounded-lg text-xs font-bold shadow-lg hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center"
          >
            {isVerifying ? "Verifying..." : "Verify Code"}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-outline-variant/15 pt-6">
          <p className="text-xs text-on-surface-variant">
            Didn't receive the email?{" "}
            {canResend ? (
              <button
                onClick={handleResend}
                disabled={isResending}
                className="text-primary font-bold hover:underline cursor-pointer disabled:opacity-50"
              >
                {isResending ? "Resending..." : "Resend Code"}
              </button>
            ) : (
              <span className="text-outline font-semibold">Resend in {timer}s</span>
            )}
          </p>
        </div>
      </div>
    </section>
  );
};

export default VerifyOtpPage;
