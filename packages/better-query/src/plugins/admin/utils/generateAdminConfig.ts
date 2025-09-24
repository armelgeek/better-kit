import type { AdminPluginOptions, AdminTableConfig, AdminFormConfig } from '../types';

export interface AdminConfig {
  resources: Record<string, {
    name: string;
    tableConfig: AdminTableConfig;
    formConfig: AdminFormConfig;
    permissions: string[];
    features: {
      create: boolean;
      read: boolean;
      update: boolean;
      delete: boolean;
      bulkDelete: boolean;
      export: boolean;
    };
  }>;
  navigation: Array<{
    label: string;
    resource?: string;
    icon?: string;
    children?: Array<{
      label: string;
      resource: string;
    }>;
  }>;
  dashboard: {
    title: string;
    stats: Array<{
      resource: string;
      label: string;
      icon: string;
    }>;
  };
}

/**
 * Generate admin configuration from Better Query resources and schemas
 */
export function generateAdminConfig(
  resources: Map<string, any>,
  options: AdminPluginOptions = {}
): AdminConfig {
  const config: AdminConfig = {
    resources: {},
    navigation: [],
    dashboard: {
      title: options.dashboard?.title || 'Admin Dashboard',
      stats: []
    }
  };

  // Generate configuration for each resource
  for (const [resourceName, resourceConfig] of resources) {
    // Skip if resource is not included in admin
    if (options.resources && !options.resources.includes(resourceName)) {
      continue;
    }

    const tableConfig = generateTableConfig(resourceConfig);
    const formConfig = generateFormConfig(resourceConfig);
    const permissions = generatePermissions(resourceName);
    const features = generateFeatures(resourceConfig);

    config.resources[resourceName] = {
      name: resourceName,
      tableConfig,
      formConfig,
      permissions,
      features
    };

    // Add to navigation
    config.navigation.push({
      label: capitalizeFirst(resourceName),
      resource: resourceName,
      icon: getResourceIcon(resourceName)
    });

    // Add to dashboard stats
    config.dashboard.stats.push({
      resource: resourceName,
      label: capitalizeFirst(resourceName),
      icon: getResourceIcon(resourceName)
    });
  }

  // Group navigation by category if needed
  config.navigation = groupNavigation(config.navigation);

  return config;
}

/**
 * Generate table configuration from resource schema
 */
function generateTableConfig(resourceConfig: any): AdminTableConfig {
  const columns = [];
  
  if (resourceConfig.schema?._def?.shape) {
    for (const [key, field] of Object.entries(resourceConfig.schema._def.shape)) {
      // Skip internal fields
      if (key.startsWith('_') || key === 'id') continue;
      
      const fieldDef = field as any;
      columns.push({
        key,
        label: capitalizeFirst(key),
        sortable: true,
        filterable: isFilterableField(fieldDef)
      });
    }
  }

  return {
    columns: columns.slice(0, 6), // Limit visible columns
    pageSize: 10,
    pagination: true,
    search: true,
    bulkActions: true
  };
}

/**
 * Generate form configuration from resource schema
 */
function generateFormConfig(resourceConfig: any): AdminFormConfig {
  const fields = [];
  
  if (resourceConfig.schema?._def?.shape) {
    for (const [key, field] of Object.entries(resourceConfig.schema._def.shape)) {
      // Skip auto-generated fields
      if (key === 'id' || key === 'createdAt' || key === 'updatedAt') continue;
      
      const fieldDef = field as any;
      fields.push({
        key,
        label: capitalizeFirst(key),
        type: mapFieldType(fieldDef),
        required: !fieldDef._def?.optional
      });
    }
  }

  return {
    fields,
    layout: 'vertical',
    validation: true
  };
}

/**
 * Generate permissions for resource
 */
function generatePermissions(resourceName: string): string[] {
  return [
    `${resourceName}:read`,
    `${resourceName}:create`,
    `${resourceName}:update`,
    `${resourceName}:delete`,
    `${resourceName}:export`
  ];
}

/**
 * Generate features configuration
 */
function generateFeatures(resourceConfig: any): AdminConfig['resources'][string]['features'] {
  return {
    create: true,
    read: true,
    update: true,
    delete: true,
    bulkDelete: true,
    export: false // Can be enabled based on resource needs
  };
}

/**
 * Check if field is filterable
 */
function isFilterableField(field: any): boolean {
  const typeName = field._def?.typeName;
  return ['ZodString', 'ZodEnum', 'ZodBoolean'].includes(typeName);
}

/**
 * Map Zod field type to form input type
 */
function mapFieldType(field: any): 'text' | 'email' | 'password' | 'textarea' | 'select' | 'checkbox' | 'date' | 'number' {
  const typeName = field._def?.typeName;
  
  switch (typeName) {
    case 'ZodString':
      if (field._def?.checks?.some((check: any) => check.kind === 'email')) {
        return 'email';
      }
      return 'text';
    case 'ZodNumber':
      return 'number';
    case 'ZodBoolean':
      return 'checkbox';
    case 'ZodDate':
      return 'date';
    case 'ZodEnum':
      return 'select';
    default:
      return 'text';
  }
}

/**
 * Get icon for resource type
 */
function getResourceIcon(resource: string): string {
  const iconMap: Record<string, string> = {
    user: '👤',
    product: '📦',
    order: '🛒',
    category: '📁',
    review: '⭐',
    post: '📝',
    comment: '💬',
    file: '📄',
    image: '🖼️',
    tag: '🏷️',
    setting: '⚙️'
  };

  return iconMap[resource.toLowerCase()] || '📊';
}

/**
 * Capitalize first letter
 */
function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Group navigation items by category
 */
function groupNavigation(navigation: AdminConfig['navigation']): AdminConfig['navigation'] {
  // For now, return as-is. Could implement categorization logic here
  // For example, group by resource type (e.g., "Content", "E-commerce", "Users")
  
  return navigation;
}