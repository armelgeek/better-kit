# Better Admin CLI - Quick Start

Get up and running with Better Admin in 5 minutes!

## Prerequisites

- Node.js 16+ or Bun
- A Next.js/React project
- Better Query installed (recommended)

## Step 1: Initialize Better Admin

```bash
npx better-admin init
```

This creates a `better-admin.json` configuration file with sensible defaults.

## Step 2: Browse Available Components

```bash
# See all 76 components
npx better-admin list

# See components by category
npx better-admin list --category data-display
npx better-admin list --category forms
npx better-admin list --category buttons

# See only Better Query integrated components
npx better-admin list --with-query
```

## Step 3: Install Your First Component

```bash
# Install a data table
npx better-admin add data-table

# Install a form
npx better-admin add simple-form

# Install layout components
npx better-admin add layout
npx better-admin add app-sidebar
```

The CLI will automatically:
- ✅ Detect required shadcn/ui components
- ✅ Install missing dependencies
- ✅ Copy component files to your project

## Step 4: Use Components with Better Query

### Example 1: Data Table List

```tsx
// app/users/page.tsx
import { DataTable } from "@/components/admin/data-table";
import { useQuery } from "better-query/react";

export default function UsersPage() {
  const { list } = useQuery("user");
  const { data, isLoading } = list.useQuery();
  
  const columns = [
    { accessorKey: "id", header: "ID" },
    { accessorKey: "name", header: "Name" },
    { accessorKey: "email", header: "Email" },
  ];
  
  if (isLoading) return <div>Loading...</div>;
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Users</h1>
      <DataTable 
        data={data || []} 
        columns={columns}
        searchKey="name"
      />
    </div>
  );
}
```

### Example 2: Create Form

```tsx
// app/users/create/page.tsx
import { SimpleForm, TextInput, NumberInput } from "@/components/admin";
import { useQuery } from "better-query/react";
import { useRouter } from "next/navigation";

export default function CreateUserPage() {
  const { create } = useQuery("user");
  const router = useRouter();
  
  const handleSubmit = async (data: any) => {
    await create.mutateAsync(data);
    router.push("/users");
  };
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Create User</h1>
      <SimpleForm onSubmit={handleSubmit}>
        <TextInput source="name" label="Name" required />
        <TextInput source="email" label="Email" type="email" required />
        <NumberInput source="age" label="Age" />
      </SimpleForm>
    </div>
  );
}
```

### Example 3: Edit Form

```tsx
// app/users/[id]/edit/page.tsx
import { SimpleForm, TextInput, Loading } from "@/components/admin";
import { useQuery } from "better-query/react";
import { useRouter } from "next/navigation";

export default function EditUserPage({ params }: { params: { id: string } }) {
  const { read, update } = useQuery("user");
  const { data, isLoading } = read.useQuery(params.id);
  const router = useRouter();
  
  if (isLoading) return <Loading />;
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Edit User</h1>
      <SimpleForm 
        record={data}
        onSubmit={async (formData) => {
          await update.mutateAsync({ id: params.id, data: formData });
          router.push("/users");
        }}
      >
        <TextInput source="name" label="Name" required />
        <TextInput source="email" label="Email" type="email" required />
        <NumberInput source="age" label="Age" />
      </SimpleForm>
    </div>
  );
}
```

## Common Workflows

### Building a Complete CRUD Interface

```bash
# 1. Install required components
npx better-admin add list
npx better-admin add data-table
npx better-admin add simple-form
npx better-admin add create-button
npx better-admin add edit-button
npx better-admin add delete-button

# 2. Create your pages following the examples above
```

### Building an Admin Dashboard

```bash
# 1. Install layout components
npx better-admin add admin
npx better-admin add layout
npx better-admin add app-sidebar
npx better-admin add breadcrumb

# 2. Install utility components
npx better-admin add theme-provider
npx better-admin add theme-mode-toggle
npx better-admin add user-menu

# 3. Build your dashboard layout
```

### Adding Search and Filters

```bash
# Install search components
npx better-admin add search-input
npx better-admin add filter-form
npx better-admin add toggle-filter-button
```

## Next Steps

1. **Explore Components**: Run `npx better-admin list` to see all 76 available components

2. **Read the Guides**:
   - [USAGE_GUIDE.md](./USAGE_GUIDE.md) - Comprehensive guide with all examples
   - [ARCHITECTURE.md](./ARCHITECTURE.md) - Learn about the architecture
   - [ADDING_COMPONENTS.md](./ADDING_COMPONENTS.md) - Add your own components

3. **Better Query Integration**: 
   - Check out components with Better Query integration using:
     ```bash
     npx better-admin list --with-query
     ```

4. **Customize Components**: 
   - All components are installed in your project
   - Modify them to fit your needs
   - They're yours to customize!

## Tips & Best Practices

### 1. Start Simple
Begin with basic components (data-table, simple-form, layout) and add more as needed.

### 2. Use Categories
Filter components by category to find what you need faster:
```bash
npx better-admin list --category forms
```

### 3. Better Query First
Prioritize components with Better Query integration for seamless data flow:
```bash
npx better-admin list --with-query
```

### 4. Customize Freely
Components are installed in your project, so you can modify them freely:
```
src/components/admin/
├── data-table.tsx      # Modify as needed
├── simple-form.tsx     # Customize styles
└── ...
```

### 5. Check Dependencies
Before adding a component, check what shadcn/ui components it needs:
```bash
npx better-admin list --category data-display
```

## Troubleshooting

### shadcn/ui Not Found
```bash
# Initialize shadcn/ui first
npx shadcn@latest init

# Then initialize Better Admin
npx better-admin init
```

### Component Already Exists
```bash
# Use --overwrite to replace existing component
npx better-admin add data-table --overwrite
```

### Need Help?
Check the comprehensive [USAGE_GUIDE.md](./USAGE_GUIDE.md) for detailed examples and patterns.

## Component Categories Quick Reference

| Category | Count | Use For |
|----------|-------|---------|
| Data Display | 11 | Tables, lists, displaying data |
| Forms | 17 | Inputs, validation, form building |
| Layout | 9 | Admin structure, navigation |
| Feedback | 5 | Loading states, errors, notifications |
| Buttons | 14 | Actions, CRUD operations |
| Fields | 9 | Related data, references |
| Views | 3 | Auto-generated views |
| Authentication | 2 | Login, auth flow |
| UI Components | 4 | Theme, utilities |
| Toolbars | 2 | Bulk operations |

## Ready to Build! 🚀

You now have everything you need to build a complete admin interface with Better Admin CLI.

Start with a simple list page and expand from there. Happy coding!
