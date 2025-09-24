import { createPlugin } from '../manager';
import { createCrudEndpoint } from '../../endpoints/crud-endpoint';
import type { AdminPluginOptions } from './types';
import { z } from 'zod';

/**
 * Admin Plugin
 * 
 * Provides admin interface functionality with auto-CRUD generation
 * and pre-built components inspired by shadcn-admin-kit
 */
export function adminPlugin(options: AdminPluginOptions = {}): any {
  const {
    enabled = true,
    basePath = '/admin',
    autoCrud = true,
    resources = [],
    auth = { enabled: true, requiredRole: 'admin' },
    dashboard = { title: 'Admin Dashboard' },
    components = {}
  } = options;

  if (!enabled) {
    return createPlugin({
      id: 'admin',
      endpoints: {}
    });
  }

  return createPlugin({
    id: 'admin',
    
    // Admin API endpoints
    endpoints: {
      // Admin dashboard stats
      getDashboardStats: createCrudEndpoint(`${basePath}/stats`, {
        method: 'GET',
        query: z.object({
          resources: z.array(z.string()).optional()
        }).optional()
      }, async (ctx: any) => {
        if (auth.enabled && !await authenticateAdmin(ctx, auth)) {
          return ctx.json({ error: 'Unauthorized' }, 401);
        }

        const stats = await generateDashboardStats(ctx, resources);
        return ctx.json({ stats, dashboard });
      }),

      // Admin resource metadata
      getResourceMetadata: createCrudEndpoint(`${basePath}/resources`, {
        method: 'GET'
      }, async (ctx: any) => {
        if (auth.enabled && !await authenticateAdmin(ctx, auth)) {
          return ctx.json({ error: 'Unauthorized' }, 401);
        }

        const metadata = await generateResourceMetadata(ctx, resources);
        return ctx.json({ resources: metadata });
      }),

      // Admin resource schema
      getResourceSchema: createCrudEndpoint(`${basePath}/resources/schema`, {
        method: 'GET',
        query: z.object({
          resource: z.string()
        }).optional()
      }, async (ctx: any) => {
        if (auth.enabled && !await authenticateAdmin(ctx, auth)) {
          return ctx.json({ error: 'Unauthorized' }, 401);
        }

        const resource = ctx.query?.resource || ctx.params?.resource;
        const schema = await getResourceSchema(ctx, resource);
        return ctx.json({ schema });
      }),

      // Admin bulk operations
      bulkOperation: createCrudEndpoint(`${basePath}/bulk`, {
        method: 'POST',
        body: z.object({
          resource: z.string(),
          operation: z.enum(['delete', 'update']),
          ids: z.array(z.string()),
          data: z.record(z.any()).optional()
        })
      }, async (ctx: any) => {
        if (auth.enabled && !await authenticateAdmin(ctx, auth)) {
          return ctx.json({ error: 'Unauthorized' }, 401);
        }

        const result = await performBulkOperation(ctx);
        return ctx.json(result);
      }),

      // Admin component config
      getComponentConfig: createCrudEndpoint(`${basePath}/components/config`, {
        method: 'GET',
        query: z.object({
          resource: z.string()
        }).optional()
      }, async (ctx: any) => {
        if (auth.enabled && !await authenticateAdmin(ctx, auth)) {
          return ctx.json({ error: 'Unauthorized' }, 401);
        }

        const resource = ctx.query?.resource || ctx.params?.resource;
        const config = generateComponentConfig(resource, components);
        return ctx.json({ config });
      })
    },

    // Initialize admin plugin
    init: async (context) => {
      console.log(`[Admin Plugin] Initialized with ${resources.length || 'all'} resources`);
      
      if (autoCrud) {
        // Auto-generate CRUD components configuration for all resources
        for (const [resourceName] of context.resources) {
          if (resources.length === 0 || resources.includes(resourceName)) {
            console.log(`[Admin Plugin] Auto-CRUD enabled for resource: ${resourceName}`);
          }
        }
      }
    }
  });
}

/**
 * Authenticate admin user
 */
async function authenticateAdmin(ctx: any, auth: NonNullable<AdminPluginOptions['auth']>): Promise<boolean> {
  if (auth.authenticate) {
    return await auth.authenticate(ctx);
  }

  // Default authentication logic
  const user = ctx.user;
  if (!user) return false;

  return user.role === auth.requiredRole;
}

/**
 * Generate dashboard stats
 */
async function generateDashboardStats(ctx: any, resources: string[]): Promise<any[]> {
  const stats = [];
  const adapter = ctx.context.adapter;

  for (const [resourceName, resource] of ctx.context.resources) {
    if (resources.length === 0 || resources.includes(resourceName)) {
      try {
        const count = await adapter.count({ model: resourceName });
        stats.push({
          resource: resourceName,
          count,
          label: resourceName.charAt(0).toUpperCase() + resourceName.slice(1)
        });
      } catch (error) {
        console.warn(`[Admin Plugin] Failed to get stats for ${resourceName}:`, error);
      }
    }
  }

  return stats;
}

/**
 * Generate resource metadata
 */
async function generateResourceMetadata(ctx: any, resources: string[]): Promise<any[]> {
  const metadata = [];

  for (const [resourceName, resource] of ctx.context.resources) {
    if (resources.length === 0 || resources.includes(resourceName)) {
      metadata.push({
        name: resourceName,
        schema: resource.schema,
        endpoints: Object.keys(resource.endpoints || {})
      });
    }
  }

  return metadata;
}

/**
 * Get resource schema for admin forms
 */
async function getResourceSchema(ctx: any, resourceName: string): Promise<any> {
  const resource = ctx.context.resources.get(resourceName);
  if (!resource) {
    throw new Error(`Resource ${resourceName} not found`);
  }

  return {
    name: resourceName,
    schema: resource.schema,
    fields: extractSchemaFields(resource.schema)
  };
}

/**
 * Extract schema fields for form generation
 */
function extractSchemaFields(schema: any): any[] {
  // Basic schema field extraction
  // This would need to be expanded based on actual schema structure
  const fields = [];
  
  if (schema?._def?.shape) {
    for (const [key, field] of Object.entries(schema._def.shape)) {
      const fieldDef = field as any;
      fields.push({
        key,
        type: getFieldType(fieldDef),
        required: !fieldDef._def?.optional
      });
    }
  }

  return fields;
}

/**
 * Get field type from Zod schema
 */
function getFieldType(field: any): string {
  const typeName = field?._def?.typeName;
  
  switch (typeName) {
    case 'ZodString': return 'text';
    case 'ZodNumber': return 'number';
    case 'ZodBoolean': return 'checkbox';
    case 'ZodDate': return 'date';
    case 'ZodEnum': return 'select';
    default: return 'text';
  }
}

/**
 * Perform bulk operations
 */
async function performBulkOperation(ctx: any): Promise<any> {
  const { resource, operation, ids, data } = ctx.body;
  const adapter = ctx.context.adapter;
  const results = [];

  for (const id of ids) {
    try {
      let result;
      
      switch (operation) {
        case 'delete':
          result = await adapter.delete({
            model: resource,
            where: [{ field: 'id', value: id }]
          });
          break;
        case 'update':
          result = await adapter.update({
            model: resource,
            where: [{ field: 'id', value: id }],
            data
          });
          break;
        default:
          throw new Error(`Unsupported operation: ${operation}`);
      }

      results.push({ id, success: true, result });
    } catch (error) {
      results.push({ id, success: false, error: (error as Error).message });
    }
  }

  return { results };
}

/**
 * Generate component configuration
 */
function generateComponentConfig(resource: string, components: AdminPluginOptions['components']): any {
  return {
    table: {
      pageSize: 10,
      pagination: true,
      search: true,
      bulkActions: true
    },
    form: {
      layout: 'vertical',
      validation: true
    },
    theme: components?.theme || {
      primaryColor: '#3b82f6',
      borderRadius: '0.5rem'
    },
    ...components?.overrides?.[resource]
  };
}