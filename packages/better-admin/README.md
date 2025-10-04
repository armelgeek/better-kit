# Better Admin

A CLI tool for installing Better Admin components with automatic shadcn/ui dependency resolution and first-class Better Query integration.

## Features

- 🎯 **Better Query Native**: Components designed specifically for Better Query patterns
- 📦 **Automatic Dependencies**: Auto-installs shadcn/ui components and npm packages
- 🗂️ **Organized by Category**: Components grouped by purpose (data-display, forms, layout, feedback)
- 🔧 **CLI Installation**: Simple commands to add components to your project
- 📋 **Component Registry**: Curated collection of production-ready admin components
- ⚙️ **Configurable**: Customize paths, aliases, and registry sources
- 🎨 **TypeScript First**: Full type safety with Better Query integration

## Installation

Initialize Better Admin in your project:

```bash
npx better-admin init
```

This creates a `better-admin.json` configuration file with sensible defaults.

## Quick Start

### 1. List Available Components

```bash
npx better-admin list
```

**Filter by category:**
```bash
npx better-admin list --category data-display
```

**Show only Better Query components:**
```bash
npx better-admin list --with-query
```

### 2. Add a Component

```bash
npx better-admin add data-table
```

This automatically:
1. ✓ Detects required shadcn/ui dependencies
2. ✓ Installs missing shadcn/ui components
3. ✓ Installs npm packages
4. ✓ Copies component to your project

### 3. Use with Better Query

```tsx
import { DataTable } from "@/components/ui/data-table";
import { useQuery } from "better-query/react";

export function UsersPage() {
  const { list } = useQuery("user");
  const { data, isLoading } = list.useQuery();
  
  if (isLoading) return <div>Loading...</div>;
  
  return <DataTable columns={columns} data={data || []} />;
}
```

## Component Categories

### Data Display (`data-display`)

Components for displaying data from Better Query:

- **data-table**: Sortable, filterable table with pagination
- **resource-list**: Card-based grid layout for resources

### Forms (`forms`)

Form components with validation and Better Query mutations:

- **crud-form**: Dynamic form builder with Zod validation

### Layout (`layout`)

Structural components for admin interfaces:

- **example-card**: Simple card component (example)

### Feedback (`feedback`)

Loading states, errors, and notifications (coming soon)

## Better Query Integration

All components are designed to work seamlessly with Better Query:

### List View Pattern

```tsx
const { list } = useQuery("resource");
const { data, isLoading, error } = list.useQuery();

<DataTable data={data || []} columns={columns} />
```

### Create Pattern

```tsx
const { create } = useQuery("resource");

<CrudForm 
  fields={fields} 
  onSubmit={create.mutateAsync} 
/>
```

### Edit Pattern

```tsx
const { get, update } = useQuery("resource");
const { data } = get.useQuery({ where: { id } });

<CrudForm 
  defaultValues={data}
  onSubmit={(formData) => update.mutateAsync({ where: { id }, data: formData })}
/>
```

## Available Components

### data-table

A powerful data table with sorting, filtering, and pagination.

**Dependencies:**
- shadcn/ui: table, button, input, dropdown-menu, select
- npm: @tanstack/react-table

**Better Query:** `list` operation

**Example:**
```tsx
const { list } = useQuery("user");
const { data } = list.useQuery();

<DataTable 
  columns={columns} 
  data={data || []}
  searchKey="name"
/>
```

### crud-form

Flexible form builder with automatic validation.

**Dependencies:**
- shadcn/ui: form, input, button, label, select, textarea
- npm: react-hook-form, @hookform/resolvers, zod

**Better Query:** `create`, `update` operations

**Example:**
```tsx
const { create } = useQuery("user");

<CrudForm
  fields={[
    { name: "name", label: "Name", type: "text", required: true },
    { name: "email", label: "Email", type: "email", required: true },
  ]}
  onSubmit={create.mutateAsync}
/>
```

### resource-list

Card-based grid layout for displaying resources.

**Dependencies:**
- shadcn/ui: card, button, badge

**Better Query:** `list` operation

**Example:**
```tsx
const { list } = useQuery("project");
const { data } = list.useQuery();

<ResourceList
  items={data || []}
  renderTitle={(item) => item.name}
  renderDescription={(item) => item.description}
  actions={[
    { label: "View", onClick: (item) => viewItem(item) },
    { label: "Edit", onClick: (item) => editItem(item) },
  ]}
/>
```

## CLI Commands

### init

Initialize Better Admin configuration:

```bash
npx better-admin init [--yes]
```

Options:
- `--yes`: Skip prompts and use defaults

### add

Add a component to your project:

```bash
npx better-admin add <component> [options]
```

Options:
- `--yes`: Skip confirmation prompts
- `--overwrite`: Overwrite existing files
- `--path <path>`: Custom installation path

### list

List available components:

```bash
npx better-admin list [options]
```

Options:
- `--category <category>`: Filter by category
- `--with-query`: Show only Better Query integrated components

## Configuration

The `better-admin.json` file configures paths and aliases:

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

## Examples

See the [examples](./examples) directory for complete, working examples:

- **users-list.tsx**: User management with DataTable
- **user-create.tsx**: Create user form with CrudForm
- **user-edit.tsx**: Edit user form with get + update
- **projects-list.tsx**: Projects display with ResourceList

## Documentation

- **[ARCHITECTURE.md](./ARCHITECTURE.md)**: Detailed architecture guide
- **[ADDING_COMPONENTS.md](./ADDING_COMPONENTS.md)**: Guide for adding new components
- **[USAGE.md](./USAGE.md)**: Comprehensive usage guide
- **[examples/README.md](./examples/README.md)**: Examples and patterns

## How It Works

1. **Component Registry**: Each component has JSON metadata defining dependencies
2. **Dependency Detection**: CLI reads metadata to identify shadcn/ui and npm dependencies
3. **Automatic Installation**: Missing dependencies are installed automatically
4. **File Copying**: Component files are copied with correct paths from config

## Example Workflow

```bash
# 1. Initialize Better Admin
npx better-admin init

# 2. Browse components by category
npx better-admin list --category data-display

# 3. Add a component
npx better-admin add data-table

# The CLI automatically:
# ✓ Installs shadcn/ui components (table, button, input, dropdown-menu, select)
# ✓ Installs npm packages (@tanstack/react-table)
# ✓ Copies data-table.tsx to components/ui/

# 4. Use in your app with Better Query
```

## Architecture

Better Admin uses a modular architecture with:

- **Registry System**: Structured component metadata with categories
- **Better Query Integration**: Built-in patterns and helpers
- **Template System**: Reusable component templates
- **Category Organization**: Components grouped by purpose
- **Validation**: Metadata validation and type checking

See [ARCHITECTURE.md](./ARCHITECTURE.md) for details.

## Contributing

We welcome contributions! To add a component:

1. Create your component following our patterns
2. Add component metadata JSON
3. Update registry index
4. Test locally
5. Submit pull request

See [ADDING_COMPONENTS.md](./ADDING_COMPONENTS.md) for detailed instructions.

## Troubleshooting

### Config Not Found
```bash
npx better-admin init
```

### Component Already Exists
```bash
npx better-admin add <component> --overwrite
```

### Custom Registry
```json
{
  "registry": "https://your-domain.com/registry"
}
```

### Local Development
```json
{
  "registry": "file:///path/to/local/registry"
}
```

## License

MIT
