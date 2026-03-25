"use client";

import React from "react";
import { usePermissions } from "@/hooks/usePermissions";
import Unauthorized from "@/components/auth/Unauthorized";

interface PermissionGuardProps {
  permission: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showUnauthorized?: boolean;
}

/**
 * Component to conditionally render content based on user permissions.
 * 
 * @param permission - The required permission string (e.g., "banks:ingest")
 * @param children - The content to show if the user has permission
 * @param fallback - Optional content to show if the user does NOT have permission
 * @param showUnauthorized - If true, shows the Unauthorized component instead of the fallback
 * @returns React.ReactNode
 */
export default function PermissionGuard({
  permission,
  children,
  fallback,
  showUnauthorized = false,
}: PermissionGuardProps) {
  const { can } = usePermissions();
  const hasAccess = can(permission);

  if (hasAccess) {
    return <>{children}</>;
  }

  if (showUnauthorized) {
    return <Unauthorized />;
  }

  return <>{fallback || null}</>;
}
