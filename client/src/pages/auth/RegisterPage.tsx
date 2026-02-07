import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Wallet, Eye, EyeOff, Loader2, Check, X, Sparkles, ArrowRight, Lock } from "lucide-react";

export const RegisterPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const { register, isLoading, error, clearError } = useAuth();
  const navigate = useNavigate();

  // Password strength indicators
  const passwordStrength = {
    minLength: password.length >= 6,
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

  const getStrengthText = () => {
    if (strengthScore <= 1) return "Weak";
    if (strengthScore <= 2) return "Fair";
    if (strengthScore === 3) return "Good";
    return "Strong";
  };

  const getStrengthTextColor = () => {
    if (strengthScore <= 1) return "text-rose-500";
    if (strengthScore <= 2) return "text-amber-600";
    if (strengthScore === 3) return "text-blue-500";
    return "text-emerald-600";
  };

  const validateForm = (): boolean => {
    if (!email.trim()) {
      setFormError("Please enter your email");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFormError("Invalid email format");
      return false;
    }
    if (!password) {
      setFormError("Please enter your password");
      return false;
    }
    if (password.length < 6) {
      setFormError("Password must be at least 6 characters");
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
    clearError();
    setFormError(null);
    setSuccessMessage(null);

    if (!validateForm()) return;

    try {
      await register(email, password);
      toast.success("Welcome to MoneyMate! 🎉", {
        description: "Taking you to the dashboard...",
      });
      setTimeout(() => {
        navigate("/dashboard");
      }, 2000);
    } catch {
      toast.error("Registration failed", {
        description: "Please try again",
      });
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden py-8 gradient-bg">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-linear-to-br from-amber-400/30 to-orange-500/20 rounded-full blur-3xl"
        />
        <motion.div 
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-linear-to-br from-orange-400/20 to-red-400/10 rounded-full blur-3xl"
        />
        <motion.div 
          animate={{ y: [0, -20, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/3 right-1/4 w-64 h-64 bg-linear-to-br from-amber-300/15 to-yellow-200/5 rounded-full blur-3xl"
        />
        
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(to right, hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--foreground)) 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }}
        />
      </div>

      {/* Content */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md px-4"
      >
        {/* Logo */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-center gap-4 mb-6"
        >
          <div className="relative">
            <motion.div 
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 bg-linear-to-br from-amber-400 to-orange-500 rounded-2xl blur-xl opacity-50"
            />
            <div className="relative bg-linear-to-br from-amber-400 via-orange-500 to-red-500 p-3 rounded-2xl shadow-2xl shadow-orange-500/30">
              <Wallet className="h-8 w-8 text-white" />
            </div>
          </div>
          <div className="text-left">
            <h1 className="text-3xl font-bold gradient-text tracking-tight">
              MoneyMate
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-amber-500" />
              Start managing your finances better
            </p>
          </div>
        </motion.div>

        <Card className="shadow-2xl border-border/70">
          <CardHeader className="space-y-2 pb-6">
            <CardTitle className="text-2xl font-bold text-center">
              Create Account
            </CardTitle>
            <CardDescription className="text-center text-base">
              Sign up to use MoneyMate
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-5">
            {/* Success Message */}
            {successMessage && (
              <Alert className="border-emerald-200 bg-emerald-50/80">
                <Check className="h-4 w-4 text-emerald-600" />
                <AlertDescription className="text-emerald-700">
                  {successMessage}
                </AlertDescription>
              </Alert>
            )}

            {/* Error Messages */}
            {(formError || error) && (
              <Alert variant="destructive" className="border-rose-200 bg-rose-50/80">
                <X className="h-4 w-4" />
                <AlertDescription className="text-sm font-medium">
                  {formError || error}
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Field */}
              <div className="space-y-2.5">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="h-12"
                />
              </div>

              {/* Password Field */}
              <div className="space-y-2.5">
                <Label htmlFor="password" className="text-sm font-medium flex items-center gap-2">
                  <Lock className="h-3.5 w-3.5" />
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password"
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
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Security:</span>
                      <span className={`text-xs font-semibold ${getStrengthTextColor()}`}>
                        {getStrengthText()}
                      </span>
                    </div>
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
                        {passwordStrength.minLength ? <Check className="h-3 w-3" /> : <div className="h-3 w-3 rounded-full border border-current" />}
                        At least 6 characters
                      </li>
                      <li className={`flex items-center gap-2 transition-colors ${passwordStrength.hasLetter ? "text-emerald-600" : "text-muted-foreground"}`}>
                        {passwordStrength.hasLetter ? <Check className="h-3 w-3" /> : <div className="h-3 w-3 rounded-full border border-current" />}
                        Contains letters a-z
                      </li>
                      <li className={`flex items-center gap-2 transition-colors ${passwordStrength.hasNumber ? "text-emerald-600" : "text-muted-foreground"}`}>
                        {passwordStrength.hasNumber ? <Check className="h-3 w-3" /> : <div className="h-3 w-3 rounded-full border border-current" />}
                        Contains numbers 0-9
                      </li>
                      <li className={`flex items-center gap-2 transition-colors ${passwordStrength.hasSpecial ? "text-emerald-600" : "text-muted-foreground"}`}>
                        {passwordStrength.hasSpecial ? <Check className="h-3 w-3" /> : <div className="h-3 w-3 rounded-full border border-current" />}
                        Contains special characters (!@#$%)
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
                    placeholder="Confirm your password"
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
                {confirmPassword && password === confirmPassword && password.length > 0 && (
                  <p className="text-xs text-emerald-600 flex items-center gap-1">
                    <Check className="h-3 w-3" />
                    Passwords match
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
                    Creating account...
                  </>
                ) : (
                  <>
                    Sign Up
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border/60" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-background px-4 text-muted-foreground rounded-full border border-border/70 shadow-sm">
                  or
                </span>
              </div>
            </div>

            {/* Login Link */}
            <div className="text-center">
              <span className="text-muted-foreground">Already have an account? </span>
              <Link
                to="/login"
                className="font-semibold text-orange-600 hover:text-orange-700"
              >
                Sign in
                <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
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

export default RegisterPage;
