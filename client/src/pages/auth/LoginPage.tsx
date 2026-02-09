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
import { Checkbox } from "@/components/ui/checkbox";
import { Wallet, Eye, EyeOff, Loader2, Sparkles, ArrowRight } from "lucide-react";

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  
  const { login, isLoading, error, clearError } = useAuth();
  const navigate = useNavigate();

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
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setFormError(null);

    if (!validateForm()) return;

    try {
      await login(email, password, rememberMe);
      toast.success("Welcome back!", {
        description: rememberMe ? "We'll remember you for next time" : "Successfully signed in to your account",
      });
      navigate("/dashboard");
    } catch {
      toast.error("Sign in failed", {
        description: "Please check your email and password",
      });
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden gradient-bg">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Warm Gradient Orbs */}
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-linear-to-br from-amber-400/30 to-orange-500/20 rounded-full blur-3xl"
        />
        <motion.div 
          animate={{ 
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-linear-to-br from-orange-400/20 to-red-400/10 rounded-full blur-3xl"
        />
        <motion.div 
          animate={{ 
            y: [0, -20, 0],
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-linear-to-r from-amber-200/10 to-orange-200/5 rounded-full blur-3xl"
        />
        
        {/* Grid Pattern */}
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
        className="relative z-10 w-full max-w-md px-4 sm:px-6"
      >
        {/* Logo */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-center gap-3 sm:gap-4 mb-6 sm:mb-8"
        >
          <div className="relative">
            <motion.div 
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 bg-linear-to-br from-amber-400 to-orange-500 rounded-2xl blur-xl opacity-50"
            />
            <div className="relative bg-linear-to-br from-amber-400 via-orange-500 to-red-500 p-2.5 sm:p-3 rounded-2xl shadow-2xl shadow-orange-500/30">
              <Wallet className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
            </div>
          </div>
          <div className="text-left">
            <h1 className="text-2xl sm:text-3xl font-bold gradient-text tracking-tight">
              MoneyMate
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-amber-500" />
              Smart Income & Expense Tracker
            </p>
          </div>
        </motion.div>

        <Card className="shadow-2xl border-border/70">
          <CardHeader className="space-y-2 pb-4 sm:pb-6 px-4 sm:px-6">
            <CardTitle className="text-xl sm:text-2xl font-bold text-center pt-2">
              Welcome Back
            </CardTitle>
            <CardDescription className="text-center text-sm sm:text-base">
              Sign in to manage your finances
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4 sm:space-y-5 px-4 sm:px-6">
            {/* Error Messages */}
            {(formError || error) && (
              <Alert variant="destructive" className="border-red-200 bg-red-50/80">
                <AlertDescription className="text-sm font-medium">
                  {formError || error}
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              {/* Email Field */}
              <div className="space-y-2.5">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="h-11 sm:h-12"
                />
              </div>

              {/* Password Field */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium">
                    Password
                  </Label>
                  <Link 
                    to="/forgot-password" 
                    className="text-xs text-orange-600 hover:text-orange-700"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    className="h-11 sm:h-12 pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg hover:bg-muted"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center justify-between">
                <Checkbox
                  id="remember"
                  label="Remember me"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-11 sm:h-12 text-sm sm:text-base font-semibold rounded-xl btn-gradient text-white border-0"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
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

            {/* Register Link */}
            <div className="text-center">
              <span className="text-muted-foreground">Don't have an account? </span>
              <Link
                to="/register"
                className="font-semibold text-orange-600 hover:text-orange-700"
              >
                Sign up
                <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground/70 mt-6 sm:mt-8">
          © 2026 MoneyMate. Smart Income & Expense Tracker
        </p>
      </motion.div>
    </div>
  );
};

export default LoginPage;
