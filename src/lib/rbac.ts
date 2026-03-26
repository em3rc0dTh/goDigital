/**
 * Available roles in the system.
 */
export type UserRole = "superadmin" | "admin" | "treasurer" | "standard";

/**
 * Granular permissions mapping.
 * Each role has a set of permissions it is allowed to perform.
 * '*' means all actions for a resource.
 */
export const PERMISSION_MAP: Record<UserRole, string[]> = {
  superadmin: ["*"],
  admin: [
    "members:*",
    "roles:*",
    "tenant:*",
    "accounts:*",
    "banks:*",
    "projects:*",
    "budgets:*",
    "payment_req:*",
    "cash_req:*",
    "proof:*",
    "entities:*",
    "reco:manage",
    "audit:view",
  ],
  treasurer: [
    "accounts:*",
    "banks:ingest",
    "banks:view_raw",
    "banks:view",
    "payment_req:view",
    "payment_req:pay",
    "cash_req:view",
    "cash_req:pay",
    "reco:manage",
  ],
  standard: [
    "payment_req:view",
    "payment_req:create",
    "cash_req:view",
    "cash_req:create",
    "cash_req:submit_expense",
    "proof:upload",
    "proof:view",
  ],
};

/**
 * Checks if a user with a given role has a specific permission.
 * 
 * @param userRole - The role of the user (from cookie/session)
 * @param permission - The permission to check (e.g., "banks:ingest")
 * @returns boolean
 */
export function hasPermission(userRole: string | undefined, permission: string): boolean {
  if (!userRole) return false;
  
  const role = userRole.toLowerCase() as UserRole;
  const permissions = PERMISSION_MAP[role];

  if (!permissions) return false;

  // Superadmin bypass
  if (permissions.includes("*")) return true;

  // Exact match
  if (permissions.includes(permission)) return true;

  // Wildcard match (e.g., "banks:*" matches "banks:ingest")
  const [resource] = permission.split(":");
  if (permissions.includes(`${resource}:*`)) return true;

  return false;
}
