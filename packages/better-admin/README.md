# Better Admin

A CLI tool for installing Better Admin components with automatic shadcn/ui dependency resolution and first-class Better Query integration.

**✨ 76 Production-Ready Components** organized into 10 categories, all with Better Query integration.

## Features

- 🎯 **Better Query Native**: Components designed specifically for Better Query patterns
- 📦 **Automatic Dependencies**: Auto-installs shadcn/ui components and npm packages
- 🗂️ **76 Components**: Complete admin component library across 10 categories
- 🔧 **CLI Installation**: Simple commands to add components to your project
- 📋 **Component Registry**: Curated collection of production-ready admin components
- ⚙️ **Configurable**: Customize paths, aliases, and registry sources
- 🎨 **TypeScript First**: Full type safety with Better Query integration
- 🚀 **Based on shadcn-admin-kit**: Following proven patterns from marmelab/shadcn-admin-kit

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

Better Admin includes **76 production-ready components** organized into 10 categories:

### Data Display (`data-display`) - 11 components

Components for displaying data from Better Query:

- **data-table**: Powerful data table with sorting, filtering, pagination, and bulk actions
- **list**: List view component with filtering, pagination, and export
- **list-guesser**: Automatically generates list views based on data structure
- **text-field**: Display text data in a formatted way
- **number-field**: Display numeric data with formatting options
- **date-field**: Display dates with formatting and localization
- **email-field**: Display email addresses with mailto links
- **url-field**: Display URLs with clickable links
- **badge-field**: Display status badges and tags
- **file-field**: Display file information with download links
- **record-field**: Display nested record data

### Forms (`forms`) - 17 components

Form components with validation and Better Query mutations:

- **form**: Base form component with validation and submission
- **simple-form**: Simplified form layout for common use cases
- **text-input**: Text input field with validation
- **number-input**: Number input field with formatting
- **boolean-input**: Checkbox/toggle for boolean values
- **select-input**: Dropdown select input
- **radio-button-group-input**: Radio button group for single selection
- **file-input**: File upload input with preview
- **array-input**: Input for array/list data
- **autocomplete-input**: Autocomplete search input
- **autocomplete-array-input**: Autocomplete for multiple selections
- **reference-input**: Input for selecting related records
- **reference-array-input**: Input for selecting multiple related records
- **simple-form-iterator**: Repeatable form fields for arrays
- **filter-form**: Form for filtering list data
- **search-input**: Search input with debouncing
- **field-toggle**: Toggle field visibility

### Layout (`layout`) - 9 components

Structural components for admin interfaces:

- **admin**: Main admin application wrapper
- **layout**: Base layout component with sidebar and navigation
- **app-sidebar**: Collapsible sidebar navigation
- **breadcrumb**: Breadcrumb navigation trail
- **list-pagination**: Pagination controls for lists
- **show**: Show/detail view component
- **simple-show-layout**: Simplified show layout
- **create**: Create/new record view
- **edit**: Edit record view

### Feedback (`feedback`) - 5 components

Loading states, errors, and notifications:

- **loading**: Loading spinner and states
- **error**: Error display component
- **notification**: Toast notifications
- **spinner**: Loading spinner
- **confirm**: Confirmation dialog

### Buttons (`buttons`) - 14 components

Action buttons for common operations:

- **create-button**: Button to navigate to create view
- **edit-button**: Button to navigate to edit view
- **show-button**: Button to navigate to show view
- **delete-button**: Button to delete records with confirmation
- **export-button**: Button to export data
- **refresh-button**: Button to refresh data
- **cancel-button**: Button to cancel forms
- **bulk-delete-button**: Button for bulk delete operations
- **bulk-export-button**: Button for bulk export
- **sort-button**: Button to sort columns
- **toggle-filter-button**: Button to toggle filter visibility
- **columns-button**: Button to toggle column visibility
- **icon-button-with-tooltip**: Icon button with tooltip
- **locales-menu-button**: Language selection menu

### Fields (`fields`) - 9 components

Field components for displaying and editing data:

- **reference-field**: Display related record data
- **reference-array-field**: Display multiple related records
- **reference-many-field**: Display many-to-many relationships
- **reference-many-count**: Count of related records
- **array-field**: Display array data
- **select-field**: Display select/enum values
- **single-field-list**: List with single field display
- **count**: Display count of records
- **input-helper-text**: Helper text for inputs

### Views (`views`) - 3 components

Auto-generated view components (guessers):

- **edit-guesser**: Auto-generate edit views
- **list-guesser**: Auto-generate list views
- **show-guesser**: Auto-generate show views

### Authentication (`auth`) - 2 components

Authentication and login components:

- **authentication**: Authentication provider
- **login-page**: Login page component

### UI Components (`ui`) - 4 components

Common UI components and utilities:

- **theme-provider**: Theme context provider
- **theme-mode-toggle**: Dark/light mode toggle
- **user-menu**: User profile menu
- **saved-queries**: Saved query filters

### Toolbars (`toolbars`) - 2 components

Toolbar and action bar components:

- **bulk-actions-toolbar**: Toolbar for bulk actions
- **ready**: Ready state indicator

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

## Documentation

- **[USAGE_GUIDE.md](./USAGE_GUIDE.md)** - Comprehensive usage guide with examples for all 76 components
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Architecture and design patterns
- **[ADDING_COMPONENTS.md](./ADDING_COMPONENTS.md)** - Guide for adding new components
- **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** - Implementation details

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

## Inspiration

This project is inspired by [shadcn-admin-kit](https://marmelab.com/shadcn-admin-kit/) and follows similar patterns for admin component architecture while adding deep Better Query integration.

## License

MIT
