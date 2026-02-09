import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import authService from "@/services/auth.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Wallet, Loader2, ArrowRight, CheckCircle2, XCircle, Eye, EyeOff, Lock, Check, X } from "lucide-react";

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isValidToken, setIsValidToken] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [email, setEmail] = useState<string>("");

  // Password strength indicators
  const passwordStrength = {
    minLength: password.length >= 8,
    hasNumber: /\d/.test(password),
    hasLetter: /[a-zA-Z]/.test(password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  const strengthScore = Object.values(passwordStrength).filter(Boolean).length;

  const getStrengthColor = () => {
    if (strengthScore <= 1) return "bg-rose-500";
    if (strengthScore <= 2) return "bg-amber-500";
    if (strengthScore === 3) return "bg-blue-500";
    return "bg-emerald-500";
  };

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setIsValidating(false);
        return;
      }

      try {
        const result = await authService.validateResetToken(token);
        setIsValidToken(true);
        setEmail(result.email);
      } catch {
        setIsValidToken(false);
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
  }, [token]);

  const validateForm = (): boolean => {
    if (!password) {
      setFormError("Please enter a password");
      return false;
    }
    if (password.length < 8) {
      setFormError("Password must be at least 8 characters");
      return false;
    }
    if (password !== confirmPassword) {
      setFormError("Passwords do not match");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!validateForm() || !token) return;

    setIsLoading(true);

    try {
      await authService.resetPassword({ token, password });
      setIsSuccess(true);
      toast.success("Password updated", {
        description: "Your password has been reset successfully",
      });
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (error) {
      const message = error instanceof Error ? error.message : "An error occurred. Please try again.";
      setFormError(message);
      toast.error("Could not reset password", {
        description: message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isValidating) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center gradient-bg">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
          <p className="text-muted-foreground">Verifying link...</p>
        </motion.div>
      </div>
    );
  }

  if (!token || !isValidToken) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden gradient-bg p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 w-full max-w-md"
        >
          <Card className="shadow-2xl border-border/70">
            <CardContent className="pt-8 pb-8 text-center space-y-4">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-rose-100">
                <XCircle className="h-8 w-8 text-rose-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold mb-2">Invalid or Expired Link</h2>
                <p className="text-muted-foreground text-sm">
                  This password reset link is invalid or has expired. Please request a new one.
                </p>
              </div>
              <Link
                to="/forgot-password"
                className="inline-flex items-center justify-center w-full h-11 rounded-xl btn-gradient text-white border-0 font-medium text-sm"
              >
                Request New Link
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden gradient-bg p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 w-full max-w-md"
        >
          <Card className="shadow-2xl border-border/70">
            <CardContent className="pt-8 pb-8 text-center space-y-4">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100">
                <CheckCircle2 className="h-8 w-8 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold mb-2">Password Reset Successful!</h2>
                <p className="text-muted-foreground text-sm">
                  Your password has been changed successfully. Taking you to the sign in page...
                </p>
              </div>
              <Link
                to="/login"
                className="inline-flex items-center justify-center w-full h-11 rounded-xl btn-gradient text-white border-0 font-medium text-sm"
              >
                Sign In
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden gradient-bg p-4">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-linear-to-br from-amber-400/30 to-orange-500/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-linear-to-br from-orange-400/20 to-red-400/10 rounded-full blur-3xl"
        />
      </div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-center gap-4 mb-8"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-linear-to-br from-amber-400 to-orange-500 rounded-2xl blur-xl opacity-50" />
            <div className="relative bg-linear-to-br from-amber-400 via-orange-500 to-red-500 p-3 rounded-2xl shadow-2xl shadow-orange-500/30">
              <Wallet className="h-8 w-8 text-white" />
            </div>
          </div>
          <div className="text-left">
            <h1 className="text-3xl font-bold gradient-text tracking-tight">
              MoneyMate
            </h1>
          </div>
        </motion.div>

        <Card className="shadow-2xl border-border/70">
          <CardHeader className="space-y-2 pb-6">
            <CardTitle className="text-2xl font-bold text-center pt-2">
              Set New Password
            </CardTitle>
            <CardDescription className="text-center text-base">
              For account {email}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            {/* Error Messages */}
            {formError && (
              <Alert variant="destructive" className="border-rose-200 bg-rose-50/80">
                <AlertDescription className="text-sm font-medium">
                  {formError}
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Password Field */}
              <div className="space-y-2.5">
                <Label htmlFor="password" className="text-sm font-medium flex items-center gap-2">
                  <Lock className="h-3.5 w-3.5" />
                  New Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter new password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    className="h-12 pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg hover:bg-muted"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {/* Password Strength */}
                {password && (
                  <div className="space-y-3 p-4 rounded-xl bg-muted/50">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                            i <= strengthScore ? getStrengthColor() : "bg-gray-200"
                          }`}
                        />
                      ))}
                    </div>
                    <ul className="space-y-1.5 text-xs">
                      <li className={`flex items-center gap-2 transition-colors ${passwordStrength.minLength ? "text-emerald-600" : "text-muted-foreground"}`}>
                        {passwordStrength.minLength ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                        At least 8 characters
                      </li>
                      <li className={`flex items-center gap-2 transition-colors ${passwordStrength.hasLetter ? "text-emerald-600" : "text-muted-foreground"}`}>
                        {passwordStrength.hasLetter ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                        Contains letters a-z
                      </li>
                      <li className={`flex items-center gap-2 transition-colors ${passwordStrength.hasNumber ? "text-emerald-600" : "text-muted-foreground"}`}>
                        {passwordStrength.hasNumber ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                        Contains numbers 0-9
                      </li>
                      <li className={`flex items-center gap-2 transition-colors ${passwordStrength.hasSpecial ? "text-emerald-600" : "text-muted-foreground"}`}>
                        {passwordStrength.hasSpecial ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                        Contains special characters
                      </li>
                    </ul>
                  </div>
                )}
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-2.5">
                <Label htmlFor="confirmPassword" className="text-sm font-medium">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isLoading}
                    className="h-12 pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg hover:bg-muted"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-xs text-rose-500 flex items-center gap-1">
                    <X className="h-3 w-3" />
                    Passwords do not match
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-12 text-base font-semibold rounded-xl btn-gradient text-white border-0"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    Set New Password
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground/70 mt-8">
          © 2026 MoneyMate. Smart Income & Expense Tracker
        </p>
      </motion.div>
    </div>
  );
};

export default ResetPasswordPage;
