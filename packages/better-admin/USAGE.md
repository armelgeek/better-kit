# Better Admin - Usage Guide

## Overview

Better Admin is a CLI tool that provides a shadcn/ui-like experience for installing admin components with automatic dependency resolution. It's designed to work seamlessly with Better Query for building admin interfaces quickly.

## Installation

No installation required! Use npx to run commands directly:

```bash
npx better-admin init
```

## Quick Start

### 1. Initialize Better Admin

```bash
npx better-admin init
```

**What it does:**
- Creates a `better-admin.json` configuration file
- Detects if shadcn/ui is installed
- Sets up default paths and aliases

**Output:**
```
🚀 Initializing Better Admin...

✔ Configuration written to better-admin.json

✅ Better Admin initialized successfully!

📦 Next steps:
  1. Add your first component:
     npx better-admin add data-table
  2. List available components:
     npx better-admin list
```

### 2. Browse Available Components

```bash
npx better-admin list
```

**Output:**
```
📋 Available Better Admin components:

  • data-table
    A powerful data table component with sorting, filtering, and pagination
    Dependencies: table, button, input, dropdown-menu, select

  • crud-form
    A flexible CRUD form builder with validation
    Dependencies: form, input, button, label, select, textarea

  • resource-list
    A reusable list component for displaying resources
    Dependencies: card, button, badge

💡 Usage:
   npx better-admin add <component-name>
```

### 3. Install a Component

```bash
npx better-admin add data-table
```

**What happens:**
1. ✓ Fetches component metadata from registry
2. ✓ Detects required shadcn/ui components (table, button, input, etc.)
3. ✓ Automatically installs missing shadcn/ui components
4. ✓ Installs npm dependencies (@tanstack/react-table)
5. ✓ Copies component file to `components/ui/data-table.tsx`

**Output:**
```
📦 Adding data-table...

✔ Component metadata fetched

📥 Installing shadcn/ui dependencies...
✔ shadcn/ui components installed

📥 Installing npm dependencies...
✔ npm dependencies installed

📝 Copying component files...
✓ components/ui/data-table.tsx

✅ Successfully added data-table!
```

## Available Components

### 1. data-table

A powerful data table with sorting, filtering, and pagination.

**Dependencies:**
- shadcn/ui: `table`, `button`, `input`, `dropdown-menu`, `select`
- npm: `@tanstack/react-table`

**Usage:**
```tsx
import { DataTable } from "@/components/ui/data-table";

const columns = [
  { accessorKey: "name", header: "Name" },
  { accessorKey: "email", header: "Email" },
];

export function UsersTable() {
  const { data: users } = useQuery("user").list();
  
  return (
    <DataTable 
      columns={columns} 
      data={users || []}
      searchKey="name"
      searchPlaceholder="Search users..."
    />
  );
}
```

### 2. crud-form

A flexible form builder with automatic validation using react-hook-form and zod.

**Dependencies:**
- shadcn/ui: `form`, `input`, `button`, `label`, `select`, `textarea`
- npm: `react-hook-form`, `@hookform/resolvers`, `zod`

**Usage:**
```tsx
import { CrudForm } from "@/components/ui/crud-form";

const fields = [
  { name: "name", label: "Name", type: "text", required: true },
  { name: "email", label: "Email", type: "email", required: true },
  { name: "age", label: "Age", type: "number" },
];

export function UserForm() {
  return (
    <CrudForm 
      fields={fields}
      onSubmit={async (data) => {
        await createUser(data);
      }}
      submitLabel="Create User"
    />
  );
}
```

### 3. resource-list

A card-based list component for displaying resources with actions.

**Dependencies:**
- shadcn/ui: `card`, `button`, `badge`

**Usage:**
```tsx
import { ResourceList } from "@/components/ui/resource-list";
import { Badge } from "@/components/ui/badge";

export function ProjectsList() {
  const projects = useQuery("project").list();
  
  return (
    <ResourceList
      items={projects}
      renderTitle={(project) => project.name}
      renderDescription={(project) => project.description}
      renderBadge={(project) => (
        <Badge variant={project.active ? "default" : "secondary"}>
          {project.status}
        </Badge>
      )}
      actions={[
        {
          label: "Edit",
          onClick: (project) => router.push(`/projects/${project.id}/edit`),
        },
        {
          label: "Delete",
          variant: "destructive",
          onClick: (project) => deleteProject(project.id),
        },
      ]}
      emptyMessage="No projects found"
    />
  );
}
```

## CLI Options

### init

```bash
npx better-admin init [options]
```

**Options:**
- `--yes` - Skip prompts and use defaults

**Example:**
```bash
npx better-admin init --yes
```

### add

```bash
npx better-admin add <component> [options]
```

**Options:**
- `--yes` - Skip confirmation prompts
- `--overwrite` - Overwrite existing files
- `--path <path>` - Custom path for the component

**Examples:**
```bash
# Basic usage
npx better-admin add data-table

# Overwrite existing files
npx better-admin add data-table --overwrite

# Install to custom path
npx better-admin add data-table --path ./src/custom/components

# Skip all prompts
npx better-admin add data-table --yes
```

### list

```bash
npx better-admin list
```

No options required. Simply lists all available components.

## Configuration

The `better-admin.json` file in your project root:

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

### Configuration Options

- `$schema` - Schema URL for IDE autocomplete
- `style` - Component style ("default" or "new-york")
- `rsc` - Whether using React Server Components
- `tsx` - Whether using TypeScript
- `tailwind.config` - Path to Tailwind config
- `tailwind.css` - Path to global CSS file
- `tailwind.baseColor` - Base color for components
- `tailwind.cssVariables` - Use CSS variables
- `aliases.components` - Import alias for components
- `aliases.utils` - Import alias for utils
- `aliases.ui` - Import alias for UI components
- `registry` - URL to component registry

## Integration with Better Query

Better Admin components work seamlessly with Better Query:

```tsx
import { useQuery } from "better-query/react";
import { DataTable } from "@/components/ui/data-table";
import { CrudForm } from "@/components/ui/crud-form";

// List with DataTable
export function UsersList() {
  const { data: users } = useQuery("user").list();
  
  return <DataTable columns={userColumns} data={users || []} />;
}

// Create with CrudForm
export function CreateUserForm() {
  const { create } = useQuery("user");
  
  return (
    <CrudForm 
      fields={userFields}
      onSubmit={async (data) => {
        await create.mutateAsync(data);
      }}
    />
  );
}
```

## Workflow Example

Complete workflow for building an admin interface:

```bash
# 1. Initialize Better Admin
npx better-admin init

# 2. Install components
npx better-admin add data-table
npx better-admin add crud-form
npx better-admin add resource-list

# 3. Use in your app
```

Then in your code:

```tsx
// app/users/page.tsx
import { DataTable } from "@/components/ui/data-table";
import { useQuery } from "better-query/react";

export default function UsersPage() {
  const { data: users } = useQuery("user").list();
  
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Users</h1>
      <DataTable columns={userColumns} data={users || []} />
    </div>
  );
}
```

## Troubleshooting

### Component Already Exists

If you try to add a component that already exists:

```bash
npx better-admin add data-table --overwrite
```

### Custom Registry

To use a custom component registry:

```json
{
  "registry": "https://your-domain.com/registry"
}
```

### Local Development

For testing with local registry:

```json
{
  "registry": "file:///path/to/local/registry"
}
```

## Component Registry Format

Each component in the registry has this structure:

```json
{
  "name": "component-name",
  "type": "components:ui",
  "description": "Component description",
  "dependencies": {
    "shadcn": ["button", "card"],
    "npm": ["package-name"]
  },
  "registryDependencies": [],
  "files": [
    {
      "path": "components/ui/component-name.tsx",
      "content": "// Component code",
      "type": "components:ui"
    }
  ],
  "tailwind": {
    "config": {}
  }
}
```

## Best Practices

1. **Initialize First**: Always run `init` before adding components
2. **Check Dependencies**: Use `list` to see what dependencies a component needs
3. **Version Control**: Commit `better-admin.json` to version control
4. **Customize**: Edit imported components to match your needs
5. **Stay Updated**: Components are copied locally, so you have full control

## Next Steps

- [Better Query Documentation](../better-query/README.md)
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Component Examples](../../examples/)

## Support

- Report issues: [GitHub Issues](https://github.com/armelgeek/better-kit/issues)
- Discussions: [GitHub Discussions](https://github.com/armelgeek/better-kit/discussions)
