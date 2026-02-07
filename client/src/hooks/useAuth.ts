import { useContext } from "react";
import { AuthContext } from "@/contexts/AuthContext";

export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error("useAuth ต้องใช้ภายใน AuthProvider");
  }
  
  return context;
};

export default useAuth;
