import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LogOut, Wallet, TrendingUp, TrendingDown, Plus, Upload, Receipt, PieChart, Bell, User } from "lucide-react";
import { motion } from "framer-motion";

export const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();

  const statsCards = [
    {
      title: "ยอดเงินคงเหลือ",
      amount: "฿0.00",
      description: "เริ่มต้นบันทึกรายการเลย",
      icon: Wallet,
      gradient: "from-blue-500 to-blue-600",
      bgGradient: "from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20",
      textColor: "text-blue-600 dark:text-blue-400",
      shadowColor: "shadow-blue-500/20",
    },
    {
      title: "รายรับเดือนนี้",
      amount: "฿0.00",
      description: "0 รายการ",
      icon: TrendingUp,
      gradient: "from-emerald-500 to-green-600",
      bgGradient: "from-emerald-50 to-green-100/50 dark:from-emerald-950/30 dark:to-green-900/20",
      textColor: "text-emerald-600 dark:text-emerald-400",
      shadowColor: "shadow-emerald-500/20",
    },
    {
      title: "รายจ่ายเดือนนี้",
      amount: "฿0.00",
      description: "0 รายการ",
      icon: TrendingDown,
      gradient: "from-rose-500 to-red-600",
      bgGradient: "from-rose-50 to-red-100/50 dark:from-rose-950/30 dark:to-red-900/20",
      textColor: "text-rose-600 dark:text-rose-400",
      shadowColor: "shadow-rose-500/20",
    },
  ];

  const quickActions = [
    { 
      icon: Plus, 
      label: "บันทึกรายรับ", 
      gradient: "from-emerald-500 to-green-600",
      shadow: "shadow-emerald-500/30",
    },
    { 
      icon: Receipt, 
      label: "บันทึกรายจ่าย", 
      gradient: "from-rose-500 to-red-600",
      shadow: "shadow-rose-500/30",
    },
    { 
      icon: Upload, 
      label: "อัปโหลดสลิป", 
      gradient: "from-blue-500 to-indigo-600",
      shadow: "shadow-blue-500/30",
    },
    { 
      icon: PieChart, 
      label: "ดูรายงาน", 
      gradient: "from-violet-500 to-purple-600",
      shadow: "shadow-violet-500/30",
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen gradient-bg">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-border/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl blur-lg opacity-60" />
                <div className="relative bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 p-2.5 rounded-xl shadow-lg">
                  <Wallet className="h-5 w-5 text-white" />
                </div>
              </div>
              <span className="text-xl font-bold gradient-text hidden sm:block">MoneyMate</span>
            </div>

            {/* Right Side */}
            <div className="flex items-center gap-3">
              <button className="relative p-2.5 rounded-xl hover:bg-muted transition-colors">
                <Bell className="h-5 w-5 text-muted-foreground" />
                <span className="absolute top-2 right-2 h-2 w-2 bg-rose-500 rounded-full ring-2 ring-background" />
              </button>
              
              <div className="h-6 w-px bg-border hidden sm:block" />
              
              <div className="flex items-center gap-3 pl-2">
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-sm font-medium">{user?.email?.split('@')[0]}</span>
                  <span className="text-xs text-muted-foreground">{user?.email}</span>
                </div>
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-semibold shadow-lg">
                  {user?.email?.[0].toUpperCase()}
                </div>
              </div>

              <Button 
                variant="ghost" 
                size="icon" 
                onClick={logout}
                className="rounded-xl hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold mb-2">
            สวัสดี, <span className="gradient-text">{user?.email?.split('@')[0] || 'ผู้ใช้'}</span> 👋
          </h1>
          <p className="text-muted-foreground">
            วันนี้เป็นวันดีที่จะเริ่มบันทึกการเงินของคุณ
          </p>
        </motion.div>

        {/* Stats Cards */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8"
        >
          {statsCards.map((card) => (
            <motion.div key={card.title} variants={itemVariants}>
              <Card className={`group relative overflow-hidden border-0 shadow-lg ${card.shadowColor} hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br ${card.bgGradient}`}>
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${card.gradient} opacity-10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-500`} />
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {card.title}
                  </CardTitle>
                  <div className={`p-2 rounded-xl bg-gradient-to-br ${card.gradient} shadow-lg`}>
                    <card.icon className="h-4 w-4 text-white" />
                  </div>
                </CardHeader>
                <CardContent className="relative">
                  <div className={`text-3xl font-bold ${card.textColor}`}>
                    {card.amount}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {card.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Quick Actions */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500">
              <Plus className="h-4 w-4 text-white" />
            </div>
            การทำงานลัด
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {quickActions.map((action, index) => (
              <motion.button
                key={action.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + index * 0.05 }}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className={`group flex flex-col items-center gap-3 p-5 rounded-2xl bg-gradient-to-br ${action.gradient} ${action.shadow} shadow-lg text-white transition-all duration-300`}
              >
                <action.icon className="h-6 w-6 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium">{action.label}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent Transactions */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="border-0 shadow-lg shadow-black/5 h-full">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500">
                    <Receipt className="h-4 w-4 text-white" />
                  </div>
                  รายการล่าสุด
                </CardTitle>
                <CardDescription>
                  รายการรายรับรายจ่ายล่าสุดของคุณ
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center mb-4">
                    <Receipt className="h-10 w-10 text-muted-foreground/40" />
                  </div>
                  <h4 className="text-lg font-medium text-muted-foreground">ยังไม่มีรายการ</h4>
                  <p className="text-sm text-muted-foreground/70 mt-1">
                    เริ่มต้นบันทึกรายรับรายจ่าย หรืออัปโหลดสลิปโอนเงิน
                  </p>
                  <Button className="mt-4 rounded-xl btn-gradient text-white border-0">
                    <Plus className="h-4 w-4 mr-2" />
                    เพิ่มรายการแรก
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Monthly Overview */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="border-0 shadow-lg shadow-black/5 h-full">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500">
                    <PieChart className="h-4 w-4 text-white" />
                  </div>
                  ภาพรวมเดือนนี้
                </CardTitle>
                <CardDescription>
                  สรุปรายรับรายจ่ายประจำเดือน
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center mb-4">
                    <PieChart className="h-10 w-10 text-muted-foreground/40" />
                  </div>
                  <h4 className="text-lg font-medium text-muted-foreground">ยังไม่มีข้อมูล</h4>
                  <p className="text-sm text-muted-foreground/70 mt-1">
                    เริ่มบันทึกรายการเพื่อดูกราฟสรุป
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
