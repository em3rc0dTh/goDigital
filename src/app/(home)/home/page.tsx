"use client"
import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { usePermissions } from "@/hooks/usePermissions";
import { FinancialDashboard } from "@/components/dashboard/FinancialDashboard";
import { StandardDashboard } from "@/components/dashboard/StandardDashboard";

export default function Home() {
  const { role } = usePermissions();
  const [workspaceName, setWorkspaceName] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    setWorkspaceName(Cookies.get("workspaceName") || null);
    setUserRole(Cookies.get("userRole") || null);
  }, []);

  const normalizedRole = role?.toLowerCase() || "standard";

  return (
    <div className="min-h-screen bg-white">
      {/* 
          Si el rol es 'standard' mostramos el dashboard operativo.
          Para 'admin', 'treasurer' o 'superadmin', mostramos el financiero.
      */}
      {normalizedRole === "standard" ? (
        <StandardDashboard 
          workspaceName={workspaceName} 
          userRole={userRole} 
        />
      ) : (
        <FinancialDashboard 
          workspaceName={workspaceName} 
          userRole={userRole} 
        />
      )}
    </div>
  );
}