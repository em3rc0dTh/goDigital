import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import { hasPermission } from "@/lib/rbac";

/**
 * Custom hook to manage RBAC permissions in React components.
 * 
 * @returns { can: (permission: string) => boolean, role: string }
 */
export function usePermissions() {
  const [role, setRole] = useState("standard");

  useEffect(() => {
    const activeRole = Cookies.get("userRole") || "standard";
    // Defer state update to next microtask to avoid "synchronous update in effect" warning
    // and ensure hydration completes before the role-based re-render.
    void Promise.resolve().then(() => {
      setRole(activeRole);
    });
  }, []);

  const can = (permission: string) => {
    return hasPermission(role, permission);
  };

  return {
    can,
    role,
    isSuperadmin: role.toLowerCase() === "superadmin",
  };
}
