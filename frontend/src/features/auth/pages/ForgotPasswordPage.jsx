import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useForgotPasswordMutation } from "../api/authApi";

const forgotSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(forgotSchema),
  });

  const onSubmit = async (data) => {
    try {
      const res = await forgotPassword(data).unwrap();
      toast.success(res.message || "OTP code sent to your email");
      navigate(`/reset-password?email=${encodeURIComponent(data.email)}`);
    } catch (err) {
      toast.error(err.data?.message || "Failed to request reset OTP");
    }
  };

  return (
    <section className="min-h-[calc(100vh-64px)] w-full flex items-center justify-center p-6 bg-surface-container-low">
      <div className="w-full max-w-md bg-surface-container p-8 rounded-xl border border-outline-variant/30 shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary mx-auto mb-4">
            <span className="material-symbols-outlined text-[28px]">lock_reset</span>
          </div>
          <h2 className="text-xl font-bold text-on-surface mb-2">Forgot Password</h2>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            Enter your email address and we'll send you an OTP to reset your password.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-primary text-on-primary rounded-lg text-xs font-bold shadow-lg hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center mt-6"
          >
            {isLoading ? "Sending OTP..." : "Send Verification OTP"}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-outline-variant/15 pt-6">
          <Link to="/auth" className="text-xs text-primary font-semibold hover:underline">
            Back to Sign In
          </Link>
        </div>
      </div>
    </section>
  );
};

export default ForgotPasswordPage;
