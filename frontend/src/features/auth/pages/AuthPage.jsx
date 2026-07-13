import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useLoginMutation, useSignupMutation } from "../api/authApi";

// Zod schemas matching backend validations
const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(5, "Password must be at least 5 characters long"),
});

const signupSchema = z.object({
  fullName: z.string().min(3, "Full name must be at least 3 characters long").max(30),
  email: z.string().email("Invalid email address"),
  password: z.string().min(5, "Password must be at least 5 characters long"),
  confirmPassword: z.string().min(5, "Confirm password must match"),
  role: z.enum(["user", "organizer"]).default("user"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const AuthPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("login"); // "login" | "signup"

  const [login, { isLoading: isLoggingIn }] = useLoginMutation();
  const [signup, { isLoading: isSigningUp }] = useSignupMutation();

  const from = location.state?.from?.pathname || "/";

  // Login Form
  const {
    register: registerLogin,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  // Signup Form
  const {
    register: registerSignup,
    handleSubmit: handleSignupSubmit,
    formState: { errors: signupErrors },
  } = useForm({
    resolver: zodResolver(signupSchema),
    defaultValues: { role: "user" }
  });

  const onLoginSubmit = async (data) => {
    try {
      const res = await login(data).unwrap();
      toast.success(res.message || "Login successful");
      // Redirect based on role
      if (res.user.role === "admin") {
        navigate("/admin/dashboard");
      } else if (res.user.role === "organizer") {
        navigate("/organizer/dashboard");
      } else {
        navigate(from === "/auth" ? "/dashboard" : from);
      }
    } catch (err) {
      toast.error(err.data?.message || "Login failed");
    }
  };

  const onSignupSubmit = async (data) => {
    try {
      const res = await signup(data).unwrap();
      toast.success(res.message || "Verification OTP sent to email");
      navigate(`/verify-otp?email=${encodeURIComponent(data.email)}`);
    } catch (err) {
      toast.error(err.data?.message || "Signup failed");
    }
  };

  return (
    <section className="min-h-[calc(100vh-64px)] w-full flex flex-col lg:flex-row">
      {/* Left Side: Branding & Imagery */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-surface-container-lowest">
        <div className="absolute inset-0 z-10 bg-linear-to-t from-background via-background/60 to-transparent"></div>
        <img
          className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-luminosity"
          alt="Event Hall Background"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuBnxSme344f1mFhp6ziz3RRi3w0mF0NFXNHHa7vwkhHi0kB2TjJ-cF3H4StA42DZQsEKuDlqvLPqPntWZiJKPOhFCoNZgYjbXPRyx2Ug0cFT-iJhdngNLnEhqkmot-sBVoQ_gdBvZ7yvszVMV8rXXDtp56APdn_85nKZnnmkvUaUkx48BpegJsLbf9JrK_-cFKm7UC6zwBLj5HBoGLrufxpEpJOdultT943qUC2Me9tJ2Kc63kg8OAFqR5Xyx4d4VaBKirx7WCvqRA"
        />
        <div className="relative z-20 p-12 flex flex-col justify-end h-full max-w-xl text-on-surface">
          <h1 className="font-display text-4xl font-extrabold mb-4 tracking-tight leading-none">Coordinate with confidence.</h1>
          <p className="font-sans text-sm text-on-surface-variant leading-relaxed">
            Join over 10,000 professional organizers using Tickify to deliver seamless attendee experiences worldwide.
          </p>
        </div>
      </div>

      {/* Right Side: Auth Card */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 bg-surface-container-low">
        <div className="w-full max-w-md bg-surface-container p-8 rounded-xl border border-outline-variant/30 shadow-2xl">
          {/* Toggle Switch */}
          <div className="relative bg-surface-container-high p-1 rounded-full flex mb-8 overflow-hidden">
            <div
              className="active-pill absolute inset-y-1 left-1 w-[calc(50%-4px)] bg-primary-container rounded-full shadow-sm"
              style={{
                transform: activeTab === "signup" ? "translateX(100%)" : "translateX(0%)",
              }}
            ></div>
            <button
              className={`relative z-10 w-1/2 py-2 text-xs font-bold text-center cursor-pointer transition-colors ${
                activeTab === "login" ? "text-on-primary-container" : "text-on-surface-variant"
              }`}
              onClick={() => setActiveTab("login")}
            >
              Sign In
            </button>
            <button
              className={`relative z-10 w-1/2 py-2 text-xs font-bold text-center cursor-pointer transition-colors ${
                activeTab === "signup" ? "text-on-primary-container" : "text-on-surface-variant"
              }`}
              onClick={() => setActiveTab("signup")}
            >
              Create Account
            </button>
          </div>

          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-bold text-on-surface mb-2">
                {activeTab === "login" ? "Welcome Back" : "Get Started"}
              </h2>
              <p className="text-xs text-on-surface-variant">
                {activeTab === "login"
                  ? "Enter your credentials to manage your events."
                  : "Create an account to browse and book tickets."}
              </p>
            </div>

            {activeTab === "login" ? (
              /* Login Form */
              <form onSubmit={handleLoginSubmit(onLoginSubmit)} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-on-surface-variant">Email Address</label>
                  <input
                    type="email"
                    {...registerLogin("email")}
                    className="w-full px-4 py-2.5 rounded-lg border border-outline-variant/40 bg-surface-container-highest text-on-surface text-xs placeholder:text-outline/65 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    placeholder="name@company.com"
                  />
                  {loginErrors.email && (
                    <p className="text-[10px] text-error font-medium">{loginErrors.email.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="block text-xs font-semibold text-on-surface-variant">Password</label>
                    <Link to="/forgot-password" className="text-[11px] text-primary font-semibold hover:underline">
                      Forgot password?
                    </Link>
                  </div>
                  <input
                    type="password"
                    {...registerLogin("password")}
                    className="w-full px-4 py-2.5 rounded-lg border border-outline-variant/40 bg-surface-container-highest text-on-surface text-xs placeholder:text-outline/65 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    placeholder="••••••••"
                  />
                  {loginErrors.password && (
                    <p className="text-[10px] text-error font-medium">{loginErrors.password.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full py-3 bg-primary text-on-primary rounded-lg text-xs font-bold shadow-lg hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer mt-4 flex items-center justify-center"
                >
                  {isLoggingIn ? "Signing In..." : "Sign In"}
                </button>
              </form>
            ) : (
              /* Signup Form */
              <form onSubmit={handleSignupSubmit(onSignupSubmit)} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-on-surface-variant">Full Name</label>
                  <input
                    type="text"
                    {...registerSignup("fullName")}
                    className="w-full px-4 py-2.5 rounded-lg border border-outline-variant/40 bg-surface-container-highest text-on-surface text-xs placeholder:text-outline/65 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    placeholder="Alex Rivera"
                  />
                  {signupErrors.fullName && (
                    <p className="text-[10px] text-error font-medium">{signupErrors.fullName.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-on-surface-variant">Email Address</label>
                  <input
                    type="email"
                    {...registerSignup("email")}
                    className="w-full px-4 py-2.5 rounded-lg border border-outline-variant/40 bg-surface-container-highest text-on-surface text-xs placeholder:text-outline/65 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    placeholder="name@company.com"
                  />
                  {signupErrors.email && (
                    <p className="text-[10px] text-error font-medium">{signupErrors.email.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-on-surface-variant">Password</label>
                  <input
                    type="password"
                    {...registerSignup("password")}
                    className="w-full px-4 py-2.5 rounded-lg border border-outline-variant/40 bg-surface-container-highest text-on-surface text-xs placeholder:text-outline/65 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    placeholder="••••••••"
                  />
                  {signupErrors.password && (
                    <p className="text-[10px] text-error font-medium">{signupErrors.password.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-on-surface-variant">Confirm Password</label>
                  <input
                    type="password"
                    {...registerSignup("confirmPassword")}
                    className="w-full px-4 py-2.5 rounded-lg border border-outline-variant/40 bg-surface-container-highest text-on-surface text-xs placeholder:text-outline/65 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    placeholder="••••••••"
                  />
                  {signupErrors.confirmPassword && (
                    <p className="text-[10px] text-error font-medium">{signupErrors.confirmPassword.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSigningUp}
                  className="w-full py-3 bg-primary text-on-primary rounded-lg text-xs font-bold shadow-lg hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer mt-4 flex items-center justify-center"
                >
                  {isSigningUp ? "Creating Account..." : "Create Account"}
                </button>
              </form>
            )}

            <p className="text-center text-[10px] text-on-surface-variant">
              By continuing, you agree to our <a className="text-primary hover:underline" href="#">Terms of Service</a> and{" "}
              <a className="text-primary hover:underline" href="#">Privacy Policy</a>.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AuthPage;
