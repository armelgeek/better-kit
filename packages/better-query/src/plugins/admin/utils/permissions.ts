/**
 * Admin Permissions Validation Utilities
 */

export interface PermissionContext {
  user: {
    id: string;
    role: string;
    permissions?: string[];
  };
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'list' | 'export';
  record?: any;
}

/**
 * Validate admin permissions
 */
export function validateAdminPermissions(context: PermissionContext): boolean {
  const { user, resource, action } = context;

  // Super admin has all permissions
  if (user.role === 'super-admin' || user.permissions?.includes('*')) {
    return true;
  }

  // Admin role check
  if (user.role !== 'admin') {
    return false;
  }

  // Check specific permission
  const permission = `${resource}:${action}`;
  
  if (user.permissions) {
    return user.permissions.includes(permission) || user.permissions.includes(`${resource}:*`);
  }

  // Default: admins can do everything
  return true;
}

/**
 * Check if user can access admin panel
 */
export function canAccessAdminPanel(user: { role: string; permissions?: string[] }): boolean {
  return user.role === 'admin' || 
         user.role === 'super-admin' || 
         (user.permissions?.includes('admin:access') ?? false) ||
         (user.permissions?.includes('*') ?? false);
}

/**
 * Get allowed resources for user
 */
export function getAllowedResources(
  user: { role: string; permissions?: string[] },
  allResources: string[]
): string[] {
  // Super admin gets all resources
  if (user.role === 'super-admin' || user.permissions?.includes('*')) {
    return allResources;
  }

  if (!user.permissions) {
    return user.role === 'admin' ? allResources : [];
  }

  // Filter resources based on permissions
  return allResources.filter(resource => {
    return user.permissions!.some(permission => 
      permission === `${resource}:*` || 
      permission.startsWith(`${resource}:`)
    );
  });
}

/**
 * Get allowed actions for resource
 */
export function getAllowedActions(
  user: { role: string; permissions?: string[] },
  resource: string
): string[] {
  const allActions = ['create', 'read', 'update', 'delete', 'list', 'export'];

  // Super admin gets all actions
  if (user.role === 'super-admin' || user.permissions?.includes('*')) {
    return allActions;
  }

  if (!user.permissions) {
    return user.role === 'admin' ? allActions : [];
  }

  // Check for resource wildcard permission
  if (user.permissions.includes(`${resource}:*`)) {
    return allActions;
  }

  // Filter actions based on specific permissions
  return allActions.filter(action => 
    user.permissions!.includes(`${resource}:${action}`)
  );
}

/**
 * Permission middleware for admin endpoints
 */
export function createPermissionMiddleware(requiredPermission: string | ((context: PermissionContext) => boolean)) {
  return (context: any, next: () => any) => {
    const user = context.user;
    
    if (!user) {
      throw new Error('Authentication required');
    }

    if (!canAccessAdminPanel(user)) {
      throw new Error('Admin access required');
    }

    if (typeof requiredPermission === 'string') {
      const parts = requiredPermission.split(':');
      const resource = parts[0] || '';
      const action = parts[1] || '';
      const hasPermission = validateAdminPermissions({
        user,
        resource,
        action: action as any
      });

      if (!hasPermission) {
        throw new Error(`Permission denied: ${requiredPermission}`);
      }
    } else if (typeof requiredPermission === 'function') {
      const hasPermission = requiredPermission({
        user,
        resource: context.resource,
        action: context.action,
        record: context.record
      });

      if (!hasPermission) {
        throw new Error('Permission denied');
      }
    }

    return next();
  };
}

/**
 * Default permission rules
 */
export const DEFAULT_ADMIN_PERMISSIONS = {
  'super-admin': ['*'],
  'admin': [
    'user:*',
    'product:*',
    'order:*',
    'category:*',
    'review:*',
    'admin:access'
  ],
  'moderator': [
    'user:read',
    'user:update',
    'product:read',
    'product:update',
    'review:*',
    'admin:access'
  ],
  'editor': [
    'product:*',
    'category:*',
    'admin:access'
  ]
};