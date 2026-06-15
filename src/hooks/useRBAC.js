/**
 * useRBAC — React hook for role-based access control checks.
 * Uses the current authenticated user from AuthContext.
 */

import { useAuth } from '@/lib/AuthContext';
import { hasPermission, hasRole } from '@/lib/rbac';

export function useRBAC() {
  const { user } = useAuth();

  return {
    can: (permission) => hasPermission(user, permission),
    isAdmin: hasRole(user, 'admin'),
    isUser: hasRole(user, 'user'),
    user,
  };
}