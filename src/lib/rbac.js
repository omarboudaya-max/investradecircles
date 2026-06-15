/**
 * Role-Based Access Control (RBAC)
 * Defines permissions per role and exposes hooks/helpers.
 */

const PERMISSIONS = {
  admin: [
    'post:create', 'post:delete', 'post:edit',
    'circle:create', 'circle:delete', 'circle:edit', 'circle:moderate',
    'user:ban', 'user:promote',
    'event:create', 'event:approve', 'event:delete',
    'admin:access',
    'comment:delete',
  ],
  user: [
    'post:create', 'post:edit:own',
    'circle:create',
    'event:create',
    'comment:delete:own',
  ],
};

/**
 * Check if a user has a specific permission.
 * @param {object} user - The current user object (must have `role` field).
 * @param {string} permission - The permission string to check.
 * @returns {boolean}
 */
export function hasPermission(user, permission) {
  if (!user) return false;
  const role = user.role || 'user';
  const allowed = PERMISSIONS[role] || PERMISSIONS['user'];
  return allowed.includes(permission);
}

/**
 * Check if a user has a given role or higher.
 * @param {object} user
 * @param {'admin'|'user'} requiredRole
 * @returns {boolean}
 */
export function hasRole(user, requiredRole) {
  if (!user) return false;
  if (requiredRole === 'user') return true;
  if (requiredRole === 'admin') return user.role === 'admin';
  return false;
}