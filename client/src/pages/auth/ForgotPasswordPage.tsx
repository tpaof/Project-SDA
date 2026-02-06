import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Wallet, Loader2, ArrowRight, ArrowLeft, Mail, CheckCircle2 } from "lucide-react";

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const validateForm = (): boolean => {
    if (!email.trim()) {
      setFormError("กรุณากรอกอีเมล");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFormError("รูปแบบอีเมลไม่ถูกต้อง");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!validateForm()) return;

    setIsLoading(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setIsLoading(false);
    setIsSubmitted(true);
    toast.success("ส่งลิงก์รีเซ็ตรหัสผ่านแล้ว", {
      description: `กรุณาตรวจสอบอีเมล ${email}`,
    });
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden gradient-bg">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
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

        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(to right, hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--foreground)) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
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
          </div>
        </motion.div>

        <Card className="glass shadow-2xl shadow-black/5 border-white/60 dark:border-white/10">
          <CardHeader className="space-y-2 pb-6">
            {!isSubmitted ? (
              <>
                <CardTitle className="text-2xl font-bold text-center pt-2">
                  ลืมรหัสผ่าน?
                </CardTitle>
                <CardDescription className="text-center text-base">
                  กรอกอีเมลของคุณ เราจะส่งลิงก์สำหรับรีเซ็ตรหัสผ่าน
                </CardDescription>
              </>
            ) : (
              <>
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-emerald-100 to-green-100 dark:from-emerald-900/30 dark:to-green-900/20 mx-auto mb-4 shadow-inner">
                  <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                </div>
                <CardTitle className="text-2xl font-bold text-center">
                  ตรวจสอบอีเมลของคุณ
                </CardTitle>
                <CardDescription className="text-center text-base">
                  เราได้ส่งลิงก์รีเซ็ตรหัสผ่านไปที่ {email}
                </CardDescription>
              </>
            )}
          </CardHeader>

          <CardContent className="space-y-5">
            {/* Error Messages */}
            {formError && (
              <Alert
                variant="destructive"
                className="border-red-200 bg-red-50/80 dark:bg-red-950/30 rounded-xl"
              >
                <AlertDescription className="text-sm font-medium">
                  {formError}
                </AlertDescription>
              </Alert>
            )}

            {!isSubmitted ? (
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email Field */}
                <div className="space-y-2.5">
                  <Label htmlFor="email" className="text-sm font-medium">
                    อีเมล
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isLoading}
                      className="h-12 pl-12 rounded-xl border-2 bg-white/70  backdrop-blur-sm transition-all duration-300 focus:border-orange-400 focus:ring-4 focus:ring-orange-400/10"
                    />
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
                      กำลังส่ง...
                    </>
                  ) : (
                    <>
                      ส่งลิงก์รีเซ็ตรหัสผ่าน
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
              </form>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground text-center">
                  หากคุณไม่ได้รับอีเมล กรุณาตรวจสอบโฟลเดอร์สแปม หรือลองอีกครั้งในอีกสักครู่
                </p>
                <Button
                  onClick={() => {
                    setIsSubmitted(false);
                    setEmail("");
                  }}
                  variant="outline"
                  className="w-full h-12 rounded-xl"
                >
                  ส่งอีกครั้ง
                </Button>
              </div>
            )}

            {/* Back to Login */}
            <div className="pt-4 border-t border-border/60">
              <Link
                to="/login"
                className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                กลับไปหน้าเข้าสู่ระบบ
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

export default ForgotPasswordPage;
