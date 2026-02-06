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
import { Wallet, Eye, EyeOff, Loader2, Sparkles, ArrowRight, Shield } from "lucide-react";

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  
  const { login, isLoading, error, clearError } = useAuth();
  const navigate = useNavigate();

  const validateForm = (): boolean => {
    if (!email.trim()) {
      setFormError("กรุณากรอกอีเมล");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFormError("รูปแบบอีเมลไม่ถูกต้อง");
      return false;
    }
    if (!password) {
      setFormError("กรุณากรอกรหัสผ่าน");
      return false;
    }
    if (password.length < 6) {
      setFormError("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
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
      await login(email, password);
      toast.success("เข้าสู่ระบบสำเร็จ!", {
        description: "ยินดีต้อนรับกลับมา",
      });
      navigate("/dashboard");
    } catch {
      toast.error("เข้าสู่ระบบไม่สำเร็จ", {
        description: "กรุณาตรวจสอบอีเมลและรหัสผ่าน",
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
          className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-gradient-to-br from-amber-400/30 to-orange-500/20 rounded-full blur-3xl"
        />
        <motion.div 
          animate={{ 
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-gradient-to-br from-orange-400/20 to-red-400/10 rounded-full blur-3xl"
        />
        <motion.div 
          animate={{ 
            y: [0, -20, 0],
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-amber-200/10 to-orange-200/5 rounded-full blur-3xl"
        />
        
        {/* Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02]"
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
          className="flex flex-col items-center justify-center mb-8"
        >
          <div className="relative">
            <motion.div 
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl blur-xl opacity-50"
            />
            <div className="relative bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 p-4 rounded-2xl shadow-2xl shadow-orange-500/30">
              <Wallet className="h-10 w-10 text-white" />
            </div>
          </div>
          <div className="mt-4 text-center">
            <h1 className="text-3xl font-bold gradient-text tracking-tight">
              MoneyMate
            </h1>
            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1 justify-center">
              <Sparkles className="h-3 w-3 text-amber-500" />
              บันทึกรายรับรายจ่ายอัจฉริยะ
            </p>
          </div>
        </motion.div>

        <Card className="glass shadow-2xl shadow-black/5 border-white/60 dark:border-white/10">
          <CardHeader className="space-y-2 pb-6">
            <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/20 mb-2 mx-auto shadow-inner">
              <Shield className="h-7 w-7 text-orange-600 dark:text-orange-400" />
            </div>
            <CardTitle className="text-2xl font-bold text-center">
              ยินดีต้อนรับกลับ
            </CardTitle>
            <CardDescription className="text-center text-base">
              เข้าสู่ระบบเพื่อจัดการการเงินของคุณ
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-5">
            {/* Error Messages */}
            {(formError || error) && (
              <Alert variant="destructive" className="border-red-200 bg-red-50/80 dark:bg-red-950/30 rounded-xl">
                <AlertDescription className="text-sm font-medium">
                  {formError || error}
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Field */}
              <div className="space-y-2.5">
                <Label htmlFor="email" className="text-sm font-medium">
                  อีเมล
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="h-12 rounded-xl border-2 bg-white/70 dark:bg-gray-100/50 backdrop-blur-sm transition-all duration-300 focus:border-orange-400 focus:ring-4 focus:ring-orange-400/10"
                />
              </div>

              {/* Password Field */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium">
                    รหัสผ่าน
                  </Label>
                  <Link 
                    to="#" 
                    className="text-xs text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 font-medium transition-colors"
                  >
                    ลืมรหัสผ่าน?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    className="h-12 pr-12 rounded-xl border-2 bg-white/70 dark:bg-gray-100/50 backdrop-blur-sm transition-all duration-300 focus:border-orange-400 focus:ring-4 focus:ring-orange-400/10"
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

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-12 text-base font-semibold rounded-xl btn-gradient text-white border-0"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    กำลังเข้าสู่ระบบ...
                  </>
                ) : (
                  <>
                    เข้าสู่ระบบ
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
                <span className="bg-background/80 backdrop-blur-sm px-4 text-muted-foreground rounded-full">
                  หรือ
                </span>
              </div>
            </div>

            {/* Register Link */}
            <div className="text-center">
              <span className="text-muted-foreground">ยังไม่มีบัญชี? </span>
              <Link
                to="/register"
                className="font-semibold text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 transition-colors inline-flex items-center gap-1 group"
              >
                สมัครสมาชิกฟรี
                <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground/70 mt-8">
          © 2026 MoneyMate. ระบบบันทึกรายรับรายจ่ายอัจฉริยะ
        </p>
      </motion.div>
    </div>
  );
};

export default LoginPage;
