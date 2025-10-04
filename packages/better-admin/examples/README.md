# Better Admin - Examples

This directory contains complete, working examples showing how to use Better Admin components with Better Query.

## Examples Overview

### 1. Users List (`users-list.tsx`)

**Component:** DataTable  
**Better Query Operations:** `list`, `remove`  
**Features:**
- List all users in a sortable, filterable table
- Search by name
- Inline edit and delete actions
- Proper loading and error states

**Installation:**
```bash
npx better-admin add data-table
```

**Usage:**
```tsx
import { UsersListPage } from "./examples/users-list";

export default function Page() {
  return <UsersListPage />;
}
```

### 2. Create User (`user-create.tsx`)

**Component:** CrudForm  
**Better Query Operations:** `create`  
**Features:**
- Dynamic form with validation
- Field-level error handling
- Loading state during submission
- Success/error feedback

**Installation:**
```bash
npx better-admin add crud-form
```

**Usage:**
```tsx
import { CreateUserPage } from "./examples/user-create";

export default function Page() {
  return <CreateUserPage />;
}
```

### 3. Edit User (`user-edit.tsx`)

**Component:** CrudForm  
**Better Query Operations:** `get`, `update`  
**Features:**
- Fetch existing user data
- Pre-populate form with current values
- Update with validation
- Handle loading, error, and not-found states

**Installation:**
```bash
npx better-admin add crud-form
```

**Usage:**
```tsx
import { EditUserPage } from "./examples/user-edit";

export default function Page({ params }: { params: { id: string } }) {
  return <EditUserPage params={params} />;
}
```

### 4. Projects List (`projects-list.tsx`)

**Component:** ResourceList  
**Better Query Operations:** `list`, `remove`  
**Features:**
- Card-based grid layout
- Custom rendering for title, description, badges
- Multiple actions per item (view, edit, delete)
- Confirmation dialog for destructive actions
- Empty state handling

**Installation:**
```bash
npx better-admin add resource-list
```

**Usage:**
```tsx
import { ProjectsListPage } from "./examples/projects-list";

export default function Page() {
  return <ProjectsListPage />;
}
```

## Common Patterns

### Pattern 1: List View

```tsx
const { list } = useQuery("resource");
const { data, isLoading, error } = list.useQuery();

// Handle states
if (isLoading) return <div>Loading...</div>;
if (error) return <div>Error: {error.message}</div>;

// Render component
return <DataTable data={data || []} columns={columns} />;
```

### Pattern 2: Create Operation

```tsx
const { create } = useQuery("resource");

const handleSubmit = async (data) => {
  await create.mutateAsync(data);
  router.push("/resources");
};

return <CrudForm fields={fields} onSubmit={handleSubmit} />;
```

### Pattern 3: Edit Operation

```tsx
const { get, update } = useQuery("resource");
const { data } = get.useQuery({ where: { id } });

const handleSubmit = async (formData) => {
  await update.mutateAsync({ where: { id }, data: formData });
};

return <CrudForm defaultValues={data} onSubmit={handleSubmit} />;
```

### Pattern 4: Delete Operation

```tsx
const { remove } = useQuery("resource");

const handleDelete = async (id) => {
  if (confirm("Are you sure?")) {
    await remove.mutateAsync({ where: { id } });
  }
};
```

## Full CRUD Example

Here's a complete CRUD setup for a resource:

### Directory Structure

```
app/
├── resources/
│   ├── page.tsx              # List view (DataTable)
│   ├── create/
│   │   └── page.tsx         # Create view (CrudForm)
│   └── [id]/
│       ├── page.tsx         # Detail view
│       └── edit/
│           └── page.tsx     # Edit view (CrudForm)
```

### List Page (`app/resources/page.tsx`)

```tsx
import { DataTable } from "@/components/ui/data-table";
import { useQuery } from "better-query/react";
import { columns } from "./columns";

export default function ResourcesPage() {
  const { list } = useQuery("resource");
  const { data, isLoading } = list.useQuery();

  if (isLoading) return <div>Loading...</div>;

  return <DataTable columns={columns} data={data || []} />;
}
```

### Create Page (`app/resources/create/page.tsx`)

```tsx
import { CrudForm } from "@/components/ui/crud-form";
import { useQuery } from "better-query/react";
import { useRouter } from "next/navigation";

export default function CreateResourcePage() {
  const { create } = useQuery("resource");
  const router = useRouter();

  const fields = [
    { name: "name", label: "Name", type: "text", required: true },
    { name: "description", label: "Description", type: "text" },
  ];

  return (
    <CrudForm
      fields={fields}
      onSubmit={async (data) => {
        await create.mutateAsync(data);
        router.push("/resources");
      }}
    />
  );
}
```

### Edit Page (`app/resources/[id]/edit/page.tsx`)

```tsx
import { CrudForm } from "@/components/ui/crud-form";
import { useQuery } from "better-query/react";
import { useRouter } from "next/navigation";

export default function EditResourcePage({ params }: { params: { id: string } }) {
  const { get, update } = useQuery("resource");
  const router = useRouter();
  const { data, isLoading } = get.useQuery({ where: { id: params.id } });

  const fields = [
    { name: "name", label: "Name", type: "text", required: true },
    { name: "description", label: "Description", type: "text" },
  ];

  if (isLoading) return <div>Loading...</div>;

  return (
    <CrudForm
      fields={fields}
      defaultValues={data}
      onSubmit={async (formData) => {
        await update.mutateAsync({ where: { id: params.id }, data: formData });
        router.push("/resources");
      }}
    />
  );
}
```

## Setup Instructions

### 1. Install Better Admin

```bash
npx better-admin init
```

### 2. Install Components

```bash
# Install all components used in examples
npx better-admin add data-table
npx better-admin add crud-form
npx better-admin add resource-list
```

### 3. Setup Better Query

Make sure you have Better Query configured:

```typescript
// lib/query.ts
import { betterQuery } from "better-query";

export const query = betterQuery({
  database: {
    provider: "sqlite",
    url: "file:./dev.db",
  },
  schema: {
    user: {
      fields: {
        name: { type: "string" },
        email: { type: "string" },
        role: { type: "string" },
        status: { type: "string" },
      },
    },
    project: {
      fields: {
        name: { type: "string" },
        description: { type: "string" },
        status: { type: "string" },
      },
    },
  },
});
```

### 4. Use Examples

Copy any example file to your project and adapt it to your needs.

## Customization Tips

### Customize Table Columns

```tsx
const columns: ColumnDef<User>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => <strong>{row.getValue("name")}</strong>,
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => <a href={`mailto:${row.getValue("email")}`}>{row.getValue("email")}</a>,
  },
];
```

### Customize Form Fields

```tsx
const fields = [
  {
    name: "name",
    label: "Full Name",
    type: "text",
    required: true,
    description: "Enter the user's full name",
  },
  {
    name: "email",
    label: "Email",
    type: "email",
    required: true,
  },
  {
    name: "bio",
    label: "Biography",
    type: "text",
    placeholder: "Tell us about yourself...",
  },
];
```

### Customize Resource List

```tsx
<ResourceList
  items={items}
  renderTitle={(item) => (
    <div className="flex items-center gap-2">
      <Avatar src={item.avatar} />
      {item.name}
    </div>
  )}
  renderDescription={(item) => (
    <div>
      <p>{item.description}</p>
      <p className="text-sm text-muted-foreground">
        Created {formatDate(item.createdAt)}
      </p>
    </div>
  )}
/>
```

## Best Practices

1. **Always Handle Loading States**
   ```tsx
   if (isLoading) return <LoadingSpinner />;
   ```

2. **Always Handle Errors**
   ```tsx
   if (error) return <ErrorMessage error={error} />;
   ```

3. **Confirm Destructive Actions**
   ```tsx
   if (confirm("Are you sure?")) {
     await remove.mutateAsync({ where: { id } });
   }
   ```

4. **Provide User Feedback**
   ```tsx
   await create.mutateAsync(data);
   toast.success("Created successfully!");
   ```

5. **Navigate After Success**
   ```tsx
   await update.mutateAsync({ where: { id }, data });
   router.push("/list");
   ```

## Additional Resources

- [Better Admin Documentation](../README.md)
- [Better Query Documentation](../../better-query/README.md)
- [Architecture Guide](../ARCHITECTURE.md)
- [Adding Components Guide](../ADDING_COMPONENTS.md)

## Need Help?

If you have questions or need help with these examples:

1. Check the [ARCHITECTURE.md](../ARCHITECTURE.md) for detailed patterns
2. Review the [component metadata](../registry/components/) for prop documentation
3. Open an issue on GitHub
4. Join our Discord community
