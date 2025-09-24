# Admin Plugin for Better Query

The Admin Plugin provides a complete admin interface solution inspired by shadcn-admin-kit and React Admin patterns. It includes ready-to-use components, automatic CRUD generation, and powerful customization options.

## ✨ Features

- **🎨 Pre-built Components**: Complete set of admin UI components
- **🚀 Auto-CRUD Generation**: Automatic admin interfaces from your schemas
- **🔒 Authentication Integration**: Built-in admin authentication and permissions
- **📊 Dashboard & Analytics**: Statistics and activity tracking
- **🎯 Type Safety**: Full TypeScript support with auto-completion
- **🎨 Customizable**: Easy theming and component overrides

## 🚀 Quick Start

### 1. Install and Configure

```typescript
import { betterQuery, adminPlugin } from 'better-query';

const query = betterQuery({
  resources: [
    // Your resources
  ],
  database: {
    provider: 'sqlite',
    url: 'database.db'
  },
  plugins: [
    adminPlugin({
      enabled: true,
      basePath: '/admin',
      autoCrud: true,
      auth: {
        enabled: true,
        requiredRole: 'admin'
      },
      dashboard: {
        title: 'My Admin Panel'
      }
    })
  ]
});
```

### 2. Use Admin Components

```tsx
import {
  AdminLayout,
  AdminDashboard,
  AdminResourceManager,
  useAdminStats,
  useAdminResource
} from 'better-query/plugins';

export function MyAdminPanel() {
  const stats = useAdminStats({ client: adminClient });
  
  return (
    <AdminLayout navigation={navigation} user={user}>
      <AdminDashboard
        title="Dashboard"
        stats={stats.stats}
        activities={activities}
      />
    </AdminLayout>
  );
}
```

## 📦 Components

### AdminLayout
Complete layout structure with sidebar, header, and content areas.

```tsx
<AdminLayout
  navigation={[
    { label: 'Dashboard', icon: '📊', href: '/admin' },
    { label: 'Users', icon: '👤', href: '/admin/users' }
  ]}
  user={{ name: 'Admin', role: 'admin' }}
  sidebarCollapsed={false}
  onToggleSidebar={() => {}}
  onLogout={() => {}}
>
  {children}
</AdminLayout>
```

### AdminDashboard
Dashboard with statistics, quick actions, and activity feed.

```tsx
<AdminDashboard
  title="Admin Dashboard"
  stats={[
    { resource: 'users', count: 1250, label: 'Users', icon: '👤' }
  ]}
  quickActions={[
    { label: 'Add User', resource: 'users', action: 'create', onClick: () => {} }
  ]}
  activities={[
    { id: '1', action: 'Created', resource: 'user', timestamp: new Date() }
  ]}
/>
```

### AdminResourceManager
Complete CRUD interface for managing resources.

```tsx
<AdminResourceManager
  resource="users"
  data={users}
  loading={loading}
  tableConfig={{
    columns: [
      { key: 'name', label: 'Name', sortable: true },
      { key: 'email', label: 'Email', sortable: true }
    ],
    bulkActions: true
  }}
  formConfig={{
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'email', label: 'Email', type: 'email', required: true }
    ]
  }}
  operations={{
    create: async (data) => await createUser(data),
    update: async (id, data) => await updateUser(id, data),
    delete: async (id) => await deleteUser(id),
    bulkDelete: async (ids) => await bulkDeleteUsers(ids)
  }}
/>
```

### AdminDataTable
Flexible data table with sorting, filtering, and bulk actions.

```tsx
<AdminDataTable
  resource="users"
  data={users}
  config={{
    columns: [
      { key: 'name', label: 'Name', sortable: true },
      { key: 'email', label: 'Email', sortable: true },
      { 
        key: 'status', 
        label: 'Status',
        render: (value) => <Badge variant={value}>{value}</Badge>
      }
    ],
    pagination: true,
    search: true,
    bulkActions: true
  }}
  onEdit={(record) => setEditingUser(record)}
  onDelete={(record) => handleDelete(record)}
  onBulkAction={(action, ids) => handleBulkAction(action, ids)}
/>
```

### AdminForm
Auto-generated forms with validation.

```tsx
<AdminForm
  resource="users"
  mode="create"
  config={{
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'email', label: 'Email', type: 'email', required: true },
      { key: 'role', label: 'Role', type: 'select', options: [
        { value: 'user', label: 'User' },
        { value: 'admin', label: 'Admin' }
      ]}
    ],
    layout: 'vertical'
  }}
  onSubmit={handleSubmit}
  onCancel={handleCancel}
/>
```

### AdminStats
Statistics cards with trends and icons.

```tsx
<AdminStats
  stats={[
    {
      resource: 'users',
      count: 1250,
      label: 'Total Users',
      icon: '👤',
      color: '#3b82f6',
      trend: { value: 12, direction: 'up', period: 'vs last month' }
    }
  ]}
  columns={4}
  onStatClick={(resource) => navigateTo(resource)}
/>
```

## 🎣 Hooks

### useAdminStats
Fetch and manage admin statistics.

```tsx
const {
  stats,
  loading,
  error,
  refresh
} = useAdminStats({
  client: adminClient,
  resources: ['users', 'products'],
  autoRefresh: true,
  refreshInterval: 30000
});
```

### useAdminResource
Complete resource management with CRUD operations.

```tsx
const {
  data,
  loading,
  error,
  pagination,
  operations,
  search,
  refresh,
  tableConfig,
  formConfig
} = useAdminResource({
  resource: 'users',
  client: queryClient,
  pageSize: 10,
  autoFetch: true
});

// Use operations
await operations.create({ name: 'John', email: 'john@example.com' });
await operations.update('user-id', { name: 'Jane' });
await operations.delete('user-id');
search('john');
```

### useAdminAuth
Admin authentication and permissions.

```tsx
const {
  user,
  loading,
  isAuthenticated,
  isAdmin,
  login,
  logout,
  checkPermission
} = useAdminAuth({
  authClient: betterAuthClient,
  requiredRole: 'admin'
});

if (checkPermission('users:delete')) {
  // User can delete users
}
```

## 🛠️ Utilities

### createAdminClient
Create admin API client.

```tsx
import { createAdminClient } from 'better-query/plugins';

const adminClient = createAdminClient({
  baseURL: 'http://localhost:3000',
  basePath: '/api/query/admin',
  auth: {
    token: 'your-jwt-token'
  }
});

// Use client
const stats = await adminClient.getDashboardStats();
const metadata = await adminClient.getResourceMetadata();
```

### generateAdminConfig
Auto-generate admin configuration from resources.

```tsx
import { generateAdminConfig } from 'better-query/plugins';

const adminConfig = generateAdminConfig(resources, {
  resources: ['users', 'products'], // Only include these
  dashboard: { title: 'My Admin' }
});
```

## 🎨 Styling

The admin components use CSS classes for styling. Include these base styles:

```css
/* Base Admin Styles */
.admin-layout { display: flex; height: 100vh; background: #f3f4f6; }
.admin-sidebar { width: 16rem; background: white; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
.admin-main { flex: 1; display: flex; flex-direction: column; }

/* Component Styles */
.admin-stat-card { background: white; border-radius: 0.5rem; padding: 1.5rem; border: 1px solid #e5e7eb; }
.admin-table { width: 100%; border-collapse: collapse; }
.admin-button { padding: 0.5rem 1rem; border-radius: 0.375rem; font-weight: 500; }
```

Or use with Tailwind CSS for full styling support.

## 🔒 Authentication & Permissions

### Basic Setup

```typescript
const adminPlugin = adminPlugin({
  auth: {
    enabled: true,
    requiredRole: 'admin',
    authenticate: async (context) => {
      // Custom auth logic
      return context.user?.role === 'admin';
    }
  }
});
```

### Permission System

```typescript
import { validateAdminPermissions } from 'better-query/plugins';

const hasPermission = validateAdminPermissions({
  user: { role: 'admin', permissions: ['users:read', 'users:write'] },
  resource: 'users',
  action: 'delete'
});
```

### Default Permissions

```typescript
const permissions = {
  'super-admin': ['*'],
  'admin': ['user:*', 'product:*', 'order:*'],
  'moderator': ['user:read', 'user:update', 'product:read'],
  'editor': ['product:*', 'category:*']
};
```

## 🚀 Auto-CRUD Generation

The admin plugin automatically generates CRUD interfaces from your Better Query resources:

```typescript
const query = betterQuery({
  resources: [
    createResource({
      name: 'product',
      schema: z.object({
        id: z.string(),
        name: z.string(),
        price: z.number(),
        category: z.string(),
        status: z.enum(['active', 'inactive'])
      })
    })
  ],
  plugins: [
    adminPlugin({ autoCrud: true })
  ]
});

// Automatically generates:
// - Product list table with columns for name, price, category, status
// - Product create/edit form with appropriate input types
// - Search and filtering capabilities
// - Bulk actions for multiple products
```

## 📊 Dashboard Analytics

### Built-in Statistics

```typescript
// Automatic stats generation
const stats = await adminClient.getDashboardStats();
// Returns: [{ resource: 'users', count: 1250, label: 'Users' }, ...]

// Custom dashboard configuration
adminPlugin({
  dashboard: {
    title: 'Analytics Dashboard',
    stats: [
      { resource: 'users', label: 'Total Users', icon: '👤' },
      { resource: 'orders', label: 'Orders Today', icon: '🛒' }
    ]
  }
});
```

### Activity Tracking

The admin plugin can integrate with the audit plugin for activity tracking:

```typescript
const query = betterQuery({
  plugins: [
    auditPlugin({ enabled: true }),
    adminPlugin({ 
      dashboard: { 
        showActivities: true 
      }
    })
  ]
});
```

## 🎯 API Endpoints

The admin plugin adds these API endpoints:

- `GET /admin/stats` - Dashboard statistics
- `GET /admin/resources` - Resource metadata
- `GET /admin/resources/schema?resource=users` - Resource schema
- `POST /admin/bulk` - Bulk operations
- `GET /admin/components/config?resource=users` - Component configuration

## 🔧 Advanced Configuration

### Custom Component Overrides

```typescript
adminPlugin({
  components: {
    theme: {
      primaryColor: '#6366f1',
      borderRadius: '0.75rem'
    },
    overrides: {
      users: {
        table: { pageSize: 25 },
        form: { layout: 'horizontal' }
      }
    }
  }
});
```

### Integration with Better Auth

```typescript
import { betterAuth } from 'better-auth';
import { adminPlugin } from 'better-query/plugins';

const auth = betterAuth({
  // auth config
});

const query = betterQuery({
  plugins: [
    adminPlugin({
      auth: {
        enabled: true,
        authenticate: async (context) => {
          const session = await auth.api.getSession({
            headers: context.request.headers
          });
          return session?.user?.role === 'admin';
        }
      }
    })
  ]
});
```

## 📱 Demo

Try the admin interface demo:

```bash
npm run dev
# Visit http://localhost:3000/admin-demo
```

## 🤝 Contributing

The admin plugin is designed to be extensible. You can:

1. **Custom Components**: Create your own admin components
2. **Theme Overrides**: Customize colors, spacing, and styling  
3. **Permission Systems**: Implement custom authorization logic
4. **Dashboard Widgets**: Add custom dashboard sections
5. **Bulk Actions**: Define custom bulk operations

## 📚 Examples

Check out the `/dev/next-app/src/components/AdminDemo.tsx` for a complete implementation example.

---

The Admin Plugin brings enterprise-grade admin interfaces to Better Query with minimal setup while maintaining full customization capabilities.