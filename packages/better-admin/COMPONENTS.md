# Better Admin UI Components

This package now includes a comprehensive set of shadcn/ui-inspired components with react-hook-form integration for building admin interfaces quickly and easily.

## Overview

The UI components are split into two categories:

1. **UI Primitives** - Basic styled components (Button, Input, Label, Card, Badge, Table, etc.)
2. **Composed Components** - Higher-level components that combine primitives with logic (AdminForm, DataTable)

## Installation

```bash
npm install better-admin react-hook-form
# or
pnpm add better-admin react-hook-form
# or
yarn add better-admin react-hook-form
```

## Import

```typescript
import {
  // UI Primitives
  Button,
  Input,
  Label,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  Badge,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Select,
  Textarea,
  
  // Composed Components
  AdminForm,
  DataTable,
} from "better-admin/components";
```

## UI Primitives

### Button

A versatile button component with multiple variants and sizes.

```tsx
<Button variant="default" size="default">Click me</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline" size="sm">Cancel</Button>
<Button variant="ghost">Ghost Button</Button>
```

**Props:**
- `variant`: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
- `size`: "default" | "sm" | "lg" | "icon"

### Input

Styled text input component.

```tsx
<Input type="text" placeholder="Enter name..." />
<Input type="email" placeholder="Email..." />
<Input type="number" placeholder="Price..." />
```

### Label

Form label component.

```tsx
<Label htmlFor="email">Email Address</Label>
```

### Card

Container component for grouping content.

```tsx
<Card>
  <CardHeader>
    <CardTitle>Product Details</CardTitle>
    <CardDescription>View and edit product information</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Content here */}
  </CardContent>
  <CardFooter>
    <Button>Save</Button>
  </CardFooter>
</Card>
```

### Badge

Status indicator component.

```tsx
<Badge variant="default">New</Badge>
<Badge variant="success">Active</Badge>
<Badge variant="destructive">Inactive</Badge>
<Badge variant="warning">Pending</Badge>
```

**Props:**
- `variant`: "default" | "secondary" | "destructive" | "outline" | "success" | "warning"

### Table

Table components for displaying tabular data.

```tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead>Price</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>Product 1</TableCell>
      <TableCell>$99.99</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

### Select & Textarea

Form input components.

```tsx
<Select>
  <option value="">Select an option</option>
  <option value="1">Option 1</option>
</Select>

<Textarea placeholder="Enter description..." rows={5} />
```

## Composed Components

### AdminForm

A powerful form component with react-hook-form integration, automatic validation, and error handling.

```tsx
import { AdminForm } from "better-admin/components";

function CreateProduct() {
  const handleSubmit = async (data) => {
    console.log("Form data:", data);
    // Handle form submission
  };

  return (
    <AdminForm
      title="Create Product"
      fields={[
        {
          name: "name",
          label: "Product Name",
          type: "text",
          placeholder: "Enter product name",
          required: true,
        },
        {
          name: "description",
          label: "Description",
          type: "textarea",
          placeholder: "Enter description",
        },
        {
          name: "category",
          label: "Category",
          type: "select",
          options: [
            { label: "Electronics", value: "electronics" },
            { label: "Clothing", value: "clothing" },
          ],
        },
        {
          name: "price",
          label: "Price",
          type: "number",
          required: true,
          validation: {
            min: { value: 0, message: "Price must be positive" },
          },
        },
        {
          name: "status",
          label: "Status",
          type: "select",
          defaultValue: "draft",
          options: [
            { label: "Draft", value: "draft" },
            { label: "Active", value: "active" },
          ],
        },
      ]}
      onSubmit={handleSubmit}
      onCancel={() => router.push("/products")}
      submitLabel="Create"
      cancelLabel="Cancel"
      loading={false}
    />
  );
}
```

**Props:**
- `fields`: Array of field configurations
- `onSubmit`: Form submission handler
- `onCancel`: Cancel button handler (optional)
- `defaultValues`: Initial form values (optional)
- `title`: Form title (optional)
- `submitLabel`: Submit button text (default: "Submit")
- `cancelLabel`: Cancel button text (default: "Cancel")
- `loading`: Loading state for submit button

**Field Configuration:**
```typescript
{
  name: string;
  label: string;
  type: "text" | "email" | "password" | "number" | "textarea" | "select" | "date" | "datetime-local";
  placeholder?: string;
  required?: boolean;
  defaultValue?: any;
  options?: Array<{ label: string; value: string | number }>;  // For select fields
  validation?: {
    required?: string;
    pattern?: { value: RegExp; message: string };
    min?: { value: number; message: string };
    max?: { value: number; message: string };
    minLength?: { value: number; message: string };
    maxLength?: { value: number; message: string };
  };
}
```

### DataTable

A feature-rich table component with sorting, pagination, search, and actions.

```tsx
import { DataTable, Badge } from "better-admin/components";

function ProductsList() {
  const { data, loading, page, totalPages, setPage, setSearch } = 
    useAdminList(adminClient, "product");

  return (
    <DataTable
      title="Products"
      description="Manage your product catalog"
      data={data}
      loading={loading}
      searchable={true}
      searchPlaceholder="Search products..."
      onSearch={setSearch}
      page={page}
      totalPages={totalPages}
      onPageChange={setPage}
      sortBy="name"
      sortOrder="asc"
      onSort={(column) => console.log("Sort by:", column)}
      emptyMessage="No products found."
      columns={[
        {
          key: "name",
          label: "Name",
          sortable: true,
          render: (value, row) => (
            <div>
              <div className="font-medium">{value}</div>
              <div className="text-sm text-gray-500">{row.description}</div>
            </div>
          ),
        },
        {
          key: "price",
          label: "Price",
          render: (value) => `$${value.toFixed(2)}`,
        },
        {
          key: "status",
          label: "Status",
          render: (value) => (
            <Badge variant={value === "active" ? "success" : "warning"}>
              {value}
            </Badge>
          ),
        },
      ]}
      actions={[
        {
          label: "View",
          onClick: (row) => router.push(`/products/${row.id}`),
          variant: "ghost",
        },
        {
          label: "Edit",
          onClick: (row) => router.push(`/products/${row.id}/edit`),
          variant: "ghost",
        },
        {
          label: "Delete",
          onClick: (row) => handleDelete(row),
          variant: "destructive",
        },
      ]}
    />
  );
}
```

**Props:**
- `data`: Array of data to display
- `columns`: Column definitions
- `actions`: Row action buttons (optional)
- `loading`: Loading state (optional)
- `searchable`: Enable search input (optional)
- `searchPlaceholder`: Search input placeholder (optional)
- `title`: Table title (optional)
- `description`: Table description (optional)
- `page`: Current page number
- `totalPages`: Total number of pages
- `onPageChange`: Page change handler
- `sortBy`: Current sort column
- `sortOrder`: Sort order ("asc" | "desc")
- `onSort`: Sort handler
- `onSearch`: Search handler
- `emptyMessage`: Message to show when no data

**Column Configuration:**
```typescript
{
  key: string;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: any) => React.ReactNode;
}
```

**Action Configuration:**
```typescript
{
  label: string;
  onClick: (row: any) => void;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost";
  icon?: React.ReactNode;
}
```

## Complete Example

Here's a complete example using the new components in a Next.js admin panel:

```tsx
"use client";
import { adminClient } from "@/lib/admin-client";
import { useAdminList, useAdminDelete } from "better-admin/react";
import { DataTable, Badge, Button } from "better-admin/components";
import { useRouter } from "next/navigation";

export default function ProductsPage() {
  const router = useRouter();
  const {
    data,
    loading,
    page,
    totalPages,
    setPage,
    setSearch,
    refetch,
  } = useAdminList(adminClient, "product");
  
  const { delete: deleteProduct } = useAdminDelete(adminClient, "product");

  const handleDelete = async (product) => {
    if (confirm(`Delete "${product.name}"?`)) {
      await deleteProduct(product.id);
      refetch();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Products</h1>
        <Button onClick={() => router.push("/admin/products/new")}>
          + Add Product
        </Button>
      </div>

      <DataTable
        data={data}
        loading={loading}
        searchable
        onSearch={setSearch}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        columns={[
          {
            key: "name",
            label: "Name",
            sortable: true,
          },
          {
            key: "price",
            label: "Price",
            render: (value) => `$${value.toFixed(2)}`,
          },
          {
            key: "status",
            label: "Status",
            render: (value) => (
              <Badge variant={value === "active" ? "success" : "warning"}>
                {value}
              </Badge>
            ),
          },
        ]}
        actions={[
          {
            label: "View",
            onClick: (row) => router.push(`/admin/products/${row.id}`),
            variant: "ghost",
          },
          {
            label: "Edit",
            onClick: (row) => router.push(`/admin/products/${row.id}/edit`),
            variant: "ghost",
          },
          {
            label: "Delete",
            onClick: handleDelete,
            variant: "destructive",
          },
        ]}
      />
    </div>
  );
}
```

## Styling

All components use Tailwind CSS classes for styling. Make sure you have Tailwind CSS configured in your project:

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

## Integration with Better Admin

These components are designed to work seamlessly with Better Admin hooks:

```tsx
import { useAdminList, useAdminCreate, useAdminUpdate } from "better-admin/react";
import { AdminForm, DataTable } from "better-admin/components";

// Use together for a complete admin experience
```

## Comparison with shadcn-admin-kit

Unlike shadcn-admin-kit which uses ra-core, Better Admin components:

- ✅ Fully typed with TypeScript
- ✅ Built specifically for Better Query backend
- ✅ Lighter weight and more flexible
- ✅ Direct integration with react-hook-form
- ✅ Simpler API with less boilerplate

## License

MIT © Better Kit Contributors
