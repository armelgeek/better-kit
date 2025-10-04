# Better Admin - Architecture Guide

## Overview

Better Admin is a CLI-based component management system designed specifically for admin interfaces built with Better Query. It provides a modular, extensible architecture that makes it easy to add new components and integrate them seamlessly with Better Query.

## Architecture Principles

### 1. **Modularity**
- Components are organized by category (data-display, forms, layout, feedback)
- Each component is self-contained with its own metadata
- Easy to add new components without modifying core code

### 2. **Better Query First**
- All components designed to work seamlessly with Better Query
- Built-in patterns for CRUD operations
- Type-safe integration with Better Query hooks

### 3. **Convention over Configuration**
- Sensible defaults that work out of the box
- Minimal configuration required
- Follow Next.js and React best practices

### 4. **Developer Experience**
- Simple CLI commands (init, add, list)
- Automatic dependency installation
- Clear error messages and helpful guides

## Directory Structure

```
packages/better-admin/
├── src/
│   ├── cli/                      # CLI implementation
│   │   ├── commands/             # Command implementations
│   │   │   ├── init.ts          # Initialize config
│   │   │   ├── add.ts           # Add components
│   │   │   └── list.ts          # List components
│   │   ├── utils/               # CLI utilities
│   │   │   ├── config.ts        # Config management
│   │   │   ├── installer.ts     # Dependency installer
│   │   │   └── registry.ts      # Registry fetcher
│   │   └── index.ts             # CLI entry point
│   │
│   ├── registry/                # Registry system (NEW)
│   │   ├── index.ts             # Core registry types & utilities
│   │   ├── better-query.ts      # Better Query integration helpers
│   │   └── templates.ts         # Component templates
│   │
│   ├── types.ts                 # TypeScript type exports
│   └── index.ts                 # Package exports
│
├── registry/                    # Component registry
│   ├── index.json              # Registry index with categories
│   └── components/             # Component definitions
│       ├── data-table.json
│       ├── crud-form.json
│       ├── resource-list.json
│       └── example-card.json
│
└── docs/                       # Documentation
    └── ARCHITECTURE.md         # This file
```

## Core Concepts

### Component Registry

The registry is a structured collection of component metadata organized by categories:

```typescript
interface Registry {
  version: string;
  categories: ComponentCategory[];
  components: ComponentMetadata[];
}
```

**Categories:**
- `data-display`: Components for displaying data (tables, lists, cards) - 11 components
- `forms`: Form components for CRUD operations - 17 components
- `layout`: Layout and structural components - 9 components
- `feedback`: Loading states, errors, notifications - 5 components
- `buttons`: Action buttons for common operations - 14 components
- `fields`: Field components for displaying and editing data - 9 components
- `views`: Auto-generated view components (guessers) - 3 components
- `auth`: Authentication and login components - 2 components
- `ui`: Common UI components and utilities - 4 components
- `toolbars`: Toolbar and action bar components - 2 components

**Total: 76 components**

### Component Metadata

Each component has rich metadata that describes its characteristics:

```typescript
interface ComponentMetadata {
  name: string;                    // Component name
  type: "components:ui";          // Component type
  category: string;               // Category ID
  description: string;            // Human-readable description
  dependencies: {                 // External dependencies
    shadcn?: string[];           // shadcn/ui components
    npm?: string[];              // npm packages
  };
  files: ComponentFile[];        // Component files
  betterQuery?: {                // Better Query integration
    hook?: string;               // Hook used
    operations?: string[];       // CRUD operations
    example?: string;            // Usage example
  };
}
```

### Better Query Integration

Components are designed with Better Query in mind:

**Data Display Components:**
```typescript
const { data, isLoading } = useQuery("resource").list();
<DataTable data={data || []} columns={columns} />
```

**Form Components:**
```typescript
const { create } = useQuery("resource");
<CrudForm fields={fields} onSubmit={create.mutateAsync} />
```

**Integration Patterns:**
- `data-table-with-actions`: List + Delete
- `crud-form-create`: Create operation
- `crud-form-edit`: Get + Update operations
- `resource-list-with-actions`: List with custom actions

## Component Lifecycle

### Adding a New Component

1. **Create Component Code**
   - Write the React component
   - Ensure it follows Better Query patterns
   - Add TypeScript types

2. **Create Metadata File**
   ```json
   {
     "name": "my-component",
     "type": "components:ui",
     "category": "data-display",
     "description": "Description here",
     "dependencies": {
       "shadcn": ["button", "card"],
       "npm": ["some-package"]
     },
     "betterQuery": {
       "operations": ["list"],
       "hook": "useQuery('resource').list()"
     },
     "files": [...]
   }
   ```

3. **Add to Registry**
   - Add entry to `registry/index.json`
   - Place metadata file in `registry/components/`

4. **Test Installation**
   ```bash
   npx better-admin add my-component
   ```

### Component Categories

#### Data Display (`data-display`)

Components that display data from Better Query:

- **Characteristics:**
  - Accept `data` prop (array of items)
  - Handle loading and error states
  - Support customization through props
  - Work with Better Query `list()` operation

- **Examples:**
  - `data-table`: Sortable, filterable table
  - `resource-list`: Card-based grid layout

#### Forms (`forms`)

Components for creating and editing data:

- **Characteristics:**
  - Accept `fields` configuration
  - Support `defaultValues` for editing
  - Handle validation with Zod
  - Integrate with Better Query mutations

- **Examples:**
  - `crud-form`: Dynamic form builder

#### Layout (`layout`)

Structural components for admin interfaces:

- **Characteristics:**
  - Provide consistent layouts
  - Support responsive design
  - No Better Query dependency

- **Examples:**
  - `admin-layout`: Main layout wrapper
  - `sidebar`: Navigation sidebar

#### Feedback (`feedback`)

User feedback components:

- **Characteristics:**
  - Show loading states
  - Display errors
  - Provide notifications

- **Examples:**
  - `loading-spinner`: Loading indicator
  - `error-boundary`: Error handling
  - `toast`: Notifications

## CLI Architecture

### Command Structure

```
better-admin
├── init                 # Initialize configuration
│   ├── --yes           # Skip prompts
│   └── [options]
│
├── add <component>     # Add a component
│   ├── --yes          # Skip confirmation
│   ├── --overwrite    # Overwrite existing
│   └── --path <path>  # Custom path
│
└── list               # List components
    ├── --category     # Filter by category
    └── --with-query   # Show only Better Query components
```

### Installation Flow

1. **Fetch Component Metadata**
   - Read from registry URL
   - Validate structure
   - Extract dependencies

2. **Install shadcn/ui Dependencies**
   - Detect required components
   - Run `npx shadcn@latest add [components]`
   - Skip if already installed

3. **Install npm Dependencies**
   - Detect package manager (pnpm, npm, yarn, bun)
   - Install required packages
   - Show progress

4. **Copy Component Files**
   - Respect configuration aliases
   - Create directories as needed
   - Handle file conflicts

## Better Query Integration Patterns

### Pattern 1: List View with Table

```typescript
import { DataTable } from "@/components/ui/data-table";
import { useQuery } from "better-query/react";

function UsersPage() {
  const { list } = useQuery("user");
  const { data, isLoading, error } = list.useQuery();
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return <DataTable columns={userColumns} data={data || []} />;
}
```

### Pattern 2: Create Form

```typescript
import { CrudForm } from "@/components/ui/crud-form";
import { useQuery } from "better-query/react";
import { useRouter } from "next/navigation";

function CreateUserPage() {
  const { create } = useQuery("user");
  const router = useRouter();
  
  const fields = [
    { name: "name", label: "Name", type: "text", required: true },
    { name: "email", label: "Email", type: "email", required: true },
  ];
  
  const handleSubmit = async (data) => {
    await create.mutateAsync(data);
    router.push("/users");
  };
  
  return <CrudForm fields={fields} onSubmit={handleSubmit} />;
}
```

### Pattern 3: Edit Form

```typescript
import { CrudForm } from "@/components/ui/crud-form";
import { useQuery } from "better-query/react";

function EditUserPage({ params }: { params: { id: string } }) {
  const { get, update } = useQuery("user");
  const { data, isLoading } = get.useQuery({ where: { id: params.id } });
  
  if (isLoading) return <div>Loading...</div>;
  
  return (
    <CrudForm
      fields={fields}
      defaultValues={data}
      onSubmit={(formData) => 
        update.mutateAsync({ where: { id: params.id }, data: formData })
      }
    />
  );
}
```

### Pattern 4: Resource List with Actions

```typescript
import { ResourceList } from "@/components/ui/resource-list";
import { useQuery } from "better-query/react";

function ProjectsPage() {
  const { list, remove } = useQuery("project");
  const { data } = list.useQuery();
  
  return (
    <ResourceList
      items={data || []}
      renderTitle={(item) => item.name}
      renderDescription={(item) => item.description}
      actions={[
        { label: "View", onClick: (item) => router.push(`/projects/${item.id}`) },
        { label: "Delete", onClick: (item) => remove.mutateAsync({ where: { id: item.id } }), variant: "destructive" },
      ]}
    />
  );
}
```

## Extending the System

### Adding a New Category

1. Update `src/registry/index.ts`:
   ```typescript
   {
     id: "new-category",
     name: "New Category",
     description: "Description of the category"
   }
   ```

2. Update `registry/index.json`:
   ```json
   {
     "categories": [
       ...
       {
         "id": "new-category",
         "name": "New Category",
         "description": "Description"
       }
     ]
   }
   ```

### Creating a Component Template

Use the template generator:

```typescript
import { generateComponentMetadata } from "./registry/templates";

const metadata = generateComponentMetadata({
  name: "my-component",
  category: "data-display",
  description: "My component description",
  componentCode: `...`,
  betterQuery: {
    operations: ["list"],
  }
});
```

## Best Practices

### Component Design

1. **Keep it Simple**: Components should do one thing well
2. **Type Safety**: Use TypeScript for all props and interfaces
3. **Better Query First**: Design around Better Query patterns
4. **Composability**: Make components composable with others
5. **Error Handling**: Always handle loading and error states

### Registry Management

1. **Semantic Versioning**: Version your registry changes
2. **Backwards Compatibility**: Don't break existing components
3. **Documentation**: Document each component thoroughly
4. **Testing**: Test component installation locally first

### CLI Usage

1. **Configuration**: Always run `init` before `add`
2. **Dependencies**: Let CLI handle dependency installation
3. **Conflicts**: Use `--overwrite` carefully
4. **Categories**: Use `list --category` to filter components

## Future Enhancements

### Planned Features

1. **Component Update Command**
   - Detect component updates
   - Show diff before updating
   - Preserve user modifications

2. **Component Search**
   - Search by name, description, tags
   - Filter by multiple criteria
   - Interactive selection

3. **Custom Templates**
   - User-defined component templates
   - Template variables and placeholders
   - Local template registry

4. **Visual Preview**
   - Component screenshots
   - Interactive demos
   - Storybook integration

5. **Dependency Graph**
   - Visualize component dependencies
   - Detect circular dependencies
   - Optimize installation order

## Troubleshooting

### Common Issues

1. **Config Not Found**
   ```bash
   npx better-admin init
   ```

2. **shadcn/ui Not Installed**
   - CLI will auto-install shadcn components
   - Or manually: `npx shadcn@latest init`

3. **Component Already Exists**
   ```bash
   npx better-admin add <component> --overwrite
   ```

4. **Better Query Hook Not Working**
   - Ensure Better Query is installed
   - Check import paths
   - Verify resource schema

## Contributing

### Adding Components

1. Fork the repository
2. Create component in `registry/components/`
3. Add to `registry/index.json`
4. Test locally
5. Submit pull request

### Guidelines

- Follow TypeScript best practices
- Include Better Query integration
- Add comprehensive documentation
- Test with multiple package managers
- Update this architecture guide

## Summary

Better Admin provides a clean, modular architecture for managing admin UI components with first-class Better Query support. The system is designed to be:

- **Easy to Use**: Simple CLI commands
- **Easy to Extend**: Add components without changing core code
- **Better Query Native**: Built for Better Query patterns
- **Type Safe**: Full TypeScript support
- **Well Organized**: Clear categories and structure

This architecture ensures that adding new components is straightforward, and the system remains maintainable as it grows.
