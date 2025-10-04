# Better Admin CLI - Complete Usage Guide

This guide provides comprehensive examples of how to use the Better Admin CLI and integrate components with Better Query.

## Table of Contents

1. [Installation](#installation)
2. [CLI Commands](#cli-commands)
3. [Component Categories](#component-categories)
4. [Better Query Integration Patterns](#better-query-integration-patterns)
5. [Real-World Examples](#real-world-examples)
6. [Best Practices](#best-practices)

## Installation

### 1. Initialize Better Admin

```bash
# Interactive setup
npx better-admin init

# Or with defaults
npx better-admin init --yes
```

This creates a `better-admin.json` configuration file:

```json
{
  "$schema": "https://better-admin.dev/schema.json",
  "style": "default",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.js",
    "css": "src/app/globals.css",
    "baseColor": "slate",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui"
  },
  "registry": "https://raw.githubusercontent.com/armelgeek/better-kit/master/packages/better-admin/registry"
}
```

## CLI Commands

### List Components

```bash
# List all components
npx better-admin list

# Filter by category
npx better-admin list --category data-display
npx better-admin list --category forms
npx better-admin list --category buttons

# Show only Better Query integrated components
npx better-admin list --with-query
```

### Add Components

```bash
# Add a single component
npx better-admin add data-table

# Add with options
npx better-admin add form --yes --overwrite

# Add to custom path
npx better-admin add layout --path src/components/admin
```

## Component Categories

### 1. Data Display (11 components)

Components for displaying data from Better Query.

**Available Components:**
- `data-table` - Advanced table with sorting, filtering, pagination
- `list` - List view with filtering and export
- `list-guesser` - Auto-generated list views
- `text-field` - Formatted text display
- `number-field` - Number formatting
- `date-field` - Date/time formatting
- `email-field` - Email with mailto links
- `url-field` - Clickable URLs
- `badge-field` - Status badges
- `file-field` - File information
- `record-field` - Nested record data

**Example: Data Table**
```tsx
import { DataTable } from "@/components/admin/data-table";
import { useQuery } from "better-query/react";

export function UsersPage() {
  const { list } = useQuery("user");
  const { data, isLoading } = list.useQuery();
  
  const columns = [
    { accessorKey: "id", header: "ID" },
    { accessorKey: "name", header: "Name" },
    { accessorKey: "email", header: "Email" },
  ];
  
  if (isLoading) return <div>Loading...</div>;
  
  return (
    <DataTable 
      columns={columns} 
      data={data || []}
      searchKey="name"
    />
  );
}
```

### 2. Forms (17 components)

Form components with validation and Better Query mutations.

**Available Components:**
- `form` - Base form with validation
- `simple-form` - Simplified form layout
- `text-input` - Text input field
- `number-input` - Number input
- `boolean-input` - Checkbox/toggle
- `select-input` - Dropdown select
- `radio-button-group-input` - Radio buttons
- `file-input` - File upload
- `array-input` - Array/list input
- `autocomplete-input` - Autocomplete search
- `autocomplete-array-input` - Multiple autocomplete
- `reference-input` - Related record selection
- `reference-array-input` - Multiple related records
- `simple-form-iterator` - Repeatable fields
- `filter-form` - List filtering
- `search-input` - Search with debounce
- `field-toggle` - Toggle visibility

**Example: Simple Form**
```tsx
import { SimpleForm, TextInput, NumberInput } from "@/components/admin";
import { useQuery } from "better-query/react";
import { useNavigate } from "react-router-dom";

export function CreateUser() {
  const { create } = useQuery("user");
  const navigate = useNavigate();
  
  const handleSubmit = async (data) => {
    await create.mutateAsync(data);
    navigate("/users");
  };
  
  return (
    <SimpleForm onSubmit={handleSubmit}>
      <TextInput source="name" label="Name" required />
      <TextInput source="email" label="Email" type="email" required />
      <NumberInput source="age" label="Age" />
    </SimpleForm>
  );
}
```

### 3. Layout (9 components)

Structural components for admin interfaces.

**Available Components:**
- `admin` - Main app wrapper
- `layout` - Base layout
- `app-sidebar` - Collapsible sidebar
- `breadcrumb` - Navigation trail
- `list-pagination` - Pagination controls
- `show` - Detail view
- `simple-show-layout` - Show layout
- `create` - Create view
- `edit` - Edit view

**Example: Admin Layout**
```tsx
import { Admin, Layout, AppSidebar } from "@/components/admin";
import { Resource } from "@/components/admin";

export function App() {
  return (
    <Admin
      dataProvider={dataProvider}
      authProvider={authProvider}
    >
      <Layout sidebar={<AppSidebar />}>
        <Resource name="users" list={UserList} edit={UserEdit} create={UserCreate} />
        <Resource name="posts" list={PostList} edit={PostEdit} create={PostCreate} />
      </Layout>
    </Admin>
  );
}
```

### 4. Feedback (5 components)

Loading states, errors, and notifications.

**Available Components:**
- `loading` - Loading spinner
- `error` - Error display
- `notification` - Toast notifications
- `spinner` - Spinner component
- `confirm` - Confirmation dialog

**Example: Loading & Error States**
```tsx
import { Loading, Error } from "@/components/admin";
import { useQuery } from "better-query/react";

export function UserDetail({ id }: { id: string }) {
  const { read } = useQuery("user");
  const { data, isLoading, error } = read.useQuery(id);
  
  if (isLoading) return <Loading />;
  if (error) return <Error error={error} />;
  
  return (
    <div>
      <h1>{data.name}</h1>
      <p>{data.email}</p>
    </div>
  );
}
```

### 5. Buttons (14 components)

Action buttons for common operations.

**Available Components:**
- `create-button` - Navigate to create
- `edit-button` - Navigate to edit
- `show-button` - Navigate to show
- `delete-button` - Delete with confirmation
- `export-button` - Export data
- `refresh-button` - Refresh data
- `cancel-button` - Cancel form
- `bulk-delete-button` - Bulk delete
- `bulk-export-button` - Bulk export
- `sort-button` - Sort columns
- `toggle-filter-button` - Toggle filters
- `columns-button` - Toggle columns
- `icon-button-with-tooltip` - Icon with tooltip
- `locales-menu-button` - Language menu

**Example: Action Buttons**
```tsx
import { 
  EditButton, 
  DeleteButton, 
  ShowButton 
} from "@/components/admin";

export function UserActions({ id }: { id: string }) {
  return (
    <div className="flex gap-2">
      <ShowButton resource="users" id={id} />
      <EditButton resource="users" id={id} />
      <DeleteButton resource="users" id={id} />
    </div>
  );
}
```

### 6. Fields (9 components)

Field components for displaying and editing data.

**Available Components:**
- `reference-field` - Related record data
- `reference-array-field` - Multiple related records
- `reference-many-field` - Many-to-many relations
- `reference-many-count` - Count related records
- `array-field` - Array data
- `select-field` - Select/enum values
- `single-field-list` - Single field list
- `count` - Record count
- `input-helper-text` - Helper text

**Example: Reference Fields**
```tsx
import { ReferenceField, TextField } from "@/components/admin";

export function OrderItem({ order }: { order: any }) {
  return (
    <div>
      <ReferenceField 
        source="userId" 
        reference="users" 
        record={order}
      >
        <TextField source="name" />
      </ReferenceField>
    </div>
  );
}
```

### 7. Views (3 components)

Auto-generated view components.

**Available Components:**
- `edit-guesser` - Auto-generate edit
- `list-guesser` - Auto-generate list
- `show-guesser` - Auto-generate show

**Example: List Guesser**
```tsx
import { ListGuesser } from "@/components/admin";

// Automatically generates a list view based on data structure
export function ProductList() {
  return <ListGuesser resource="products" />;
}
```

### 8. Authentication (2 components)

Authentication and login components.

**Available Components:**
- `authentication` - Auth provider
- `login-page` - Login page

**Example: Login Page**
```tsx
import { LoginPage } from "@/components/admin";

export function Login() {
  return (
    <LoginPage
      title="Admin Portal"
      backgroundImage="/admin-bg.jpg"
    />
  );
}
```

### 9. UI Components (4 components)

Common UI components and utilities.

**Available Components:**
- `theme-provider` - Theme context
- `theme-mode-toggle` - Dark/light toggle
- `user-menu` - User profile menu
- `saved-queries` - Saved filters

**Example: Theme Provider**
```tsx
import { ThemeProvider, ThemeModeToggle } from "@/components/admin";

export function App() {
  return (
    <ThemeProvider defaultTheme="system">
      <div className="app">
        <header>
          <ThemeModeToggle />
        </header>
        {/* Your app */}
      </div>
    </ThemeProvider>
  );
}
```

### 10. Toolbars (2 components)

Toolbar and action bar components.

**Available Components:**
- `bulk-actions-toolbar` - Bulk actions
- `ready` - Ready state indicator

**Example: Bulk Actions**
```tsx
import { BulkActionsToolbar, BulkDeleteButton } from "@/components/admin";

export function UserList() {
  return (
    <>
      <DataTable {...props}>
        {/* columns */}
      </DataTable>
      
      <BulkActionsToolbar>
        <BulkDeleteButton />
        <BulkExportButton />
      </BulkActionsToolbar>
    </>
  );
}
```

## Better Query Integration Patterns

### List Pattern

```tsx
import { DataTable } from "@/components/admin";
import { useQuery } from "better-query/react";

export function ResourceList() {
  const { list } = useQuery("resource");
  const { data, isLoading, error } = list.useQuery({
    page: 1,
    limit: 10,
    sortBy: "createdAt",
    sortOrder: "desc"
  });
  
  if (isLoading) return <Loading />;
  if (error) return <Error error={error} />;
  
  return <DataTable data={data || []} columns={columns} />;
}
```

### Create Pattern

```tsx
import { SimpleForm } from "@/components/admin";
import { useQuery } from "better-query/react";

export function CreateResource() {
  const { create } = useQuery("resource");
  
  const handleSubmit = async (data) => {
    const result = await create.mutateAsync(data);
    // Handle success
  };
  
  return (
    <SimpleForm onSubmit={handleSubmit}>
      {/* form fields */}
    </SimpleForm>
  );
}
```

### Edit Pattern

```tsx
import { Edit, SimpleForm } from "@/components/admin";
import { useQuery } from "better-query/react";

export function EditResource({ id }: { id: string }) {
  const { read, update } = useQuery("resource");
  const { data, isLoading } = read.useQuery(id);
  
  const handleSubmit = async (data) => {
    await update.mutateAsync({ id, data });
  };
  
  if (isLoading) return <Loading />;
  
  return (
    <Edit>
      <SimpleForm record={data} onSubmit={handleSubmit}>
        {/* form fields */}
      </SimpleForm>
    </Edit>
  );
}
```

### Delete Pattern

```tsx
import { DeleteButton } from "@/components/admin";
import { useQuery } from "better-query/react";

export function ResourceActions({ id }: { id: string }) {
  const { delete: deleteResource } = useQuery("resource");
  
  return (
    <DeleteButton
      resource="resource"
      id={id}
      onSuccess={() => {
        // Handle success
      }}
    />
  );
}
```

## Real-World Examples

### Complete CRUD Resource

```tsx
// app/admin/users/page.tsx
import { 
  List, 
  DataTable, 
  CreateButton,
  EditButton,
  DeleteButton 
} from "@/components/admin";
import { useQuery } from "better-query/react";

export function UserList() {
  const { list } = useQuery("user");
  const { data, isLoading } = list.useQuery();
  
  const columns = [
    { accessorKey: "id", header: "ID" },
    { accessorKey: "name", header: "Name" },
    { accessorKey: "email", header: "Email" },
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <EditButton resource="users" id={row.original.id} />
          <DeleteButton resource="users" id={row.original.id} />
        </div>
      )
    }
  ];
  
  return (
    <List
      title="Users"
      actions={<CreateButton />}
    >
      <DataTable data={data || []} columns={columns} />
    </List>
  );
}

// app/admin/users/create/page.tsx
export function UserCreate() {
  const { create } = useQuery("user");
  const navigate = useNavigate();
  
  return (
    <Create title="Create User">
      <SimpleForm 
        onSubmit={async (data) => {
          await create.mutateAsync(data);
          navigate("/admin/users");
        }}
      >
        <TextInput source="name" required />
        <TextInput source="email" type="email" required />
        <NumberInput source="age" />
      </SimpleForm>
    </Create>
  );
}

// app/admin/users/[id]/edit/page.tsx
export function UserEdit({ params }: { params: { id: string } }) {
  const { read, update } = useQuery("user");
  const { data, isLoading } = read.useQuery(params.id);
  const navigate = useNavigate();
  
  if (isLoading) return <Loading />;
  
  return (
    <Edit title="Edit User">
      <SimpleForm 
        record={data}
        onSubmit={async (data) => {
          await update.mutateAsync({ id: params.id, data });
          navigate("/admin/users");
        }}
      >
        <TextInput source="name" required />
        <TextInput source="email" type="email" required />
        <NumberInput source="age" />
      </SimpleForm>
    </Edit>
  );
}
```

## Best Practices

### 1. Component Organization

```
src/
├── app/
│   └── admin/
│       ├── layout.tsx        # Admin layout
│       ├── users/
│       │   ├── page.tsx      # List
│       │   ├── create/
│       │   │   └── page.tsx  # Create
│       │   └── [id]/
│       │       ├── page.tsx  # Show
│       │       └── edit/
│       │           └── page.tsx # Edit
│       └── posts/
│           └── ...
└── components/
    ├── admin/                # Better Admin components
    └── ui/                   # shadcn/ui components
```

### 2. Type Safety

```tsx
import { useQuery } from "better-query/react";

interface User {
  id: string;
  name: string;
  email: string;
  age?: number;
}

export function UserList() {
  const { list } = useQuery<User>("user");
  const { data } = list.useQuery();
  
  // data is typed as User[]
  return <DataTable<User> data={data || []} columns={columns} />;
}
```

### 3. Error Handling

```tsx
import { Error, notification } from "@/components/admin";

export function UserCreate() {
  const { create } = useQuery("user");
  
  const handleSubmit = async (data) => {
    try {
      await create.mutateAsync(data);
      notification.success("User created successfully");
    } catch (error) {
      notification.error("Failed to create user");
    }
  };
  
  return <SimpleForm onSubmit={handleSubmit}>{/* ... */}</SimpleForm>;
}
```

### 4. Loading States

```tsx
import { Loading } from "@/components/admin";

export function UserDetail({ id }: { id: string }) {
  const { read } = useQuery("user");
  const { data, isLoading } = read.useQuery(id);
  
  if (isLoading) return <Loading message="Loading user..." />;
  
  return <div>{/* content */}</div>;
}
```

### 5. Optimistic Updates

```tsx
export function UserList() {
  const queryClient = useQueryClient();
  const { delete: deleteUser } = useQuery("user");
  
  const handleDelete = async (id: string) => {
    // Optimistically update UI
    queryClient.setQueryData(["users"], (old: User[]) => 
      old.filter(user => user.id !== id)
    );
    
    try {
      await deleteUser.mutateAsync(id);
    } catch {
      // Rollback on error
      queryClient.invalidateQueries(["users"]);
    }
  };
  
  return <DataTable {...props} />;
}
```

## Next Steps

1. **Explore Components**: Use `npx better-admin list` to see all available components
2. **Add Components**: Start with `data-table`, `form`, and `layout` components
3. **Customize**: Override styles and behavior in your components
4. **Extend**: Create your own components following the same patterns
5. **Contribute**: Share your components with the community

For more information, visit the [Better Admin Documentation](https://github.com/armelgeek/better-kit/tree/master/packages/better-admin).
