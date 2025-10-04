# Adding New Components to Better Admin

This guide walks you through adding new components to the Better Admin registry.

## Quick Start

### 1. Create Your Component

Create your React component with TypeScript:

```tsx
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";

interface MyComponentProps {
  data: any[];
  onAction?: (item: any) => void;
}

export function MyComponent({ data, onAction }: MyComponentProps) {
  return (
    <div>
      {data.map((item, index) => (
        <div key={index}>
          <span>{item.name}</span>
          {onAction && (
            <Button onClick={() => onAction(item)}>Action</Button>
          )}
        </div>
      ))}
    </div>
  );
}
```

### 2. Create Component Metadata

Create `registry/components/my-component.json`:

```json
{
  "name": "my-component",
  "type": "components:ui",
  "category": "data-display",
  "description": "A component that displays items with actions",
  "dependencies": {
    "shadcn": ["button"],
    "npm": []
  },
  "registryDependencies": [],
  "betterQuery": {
    "operations": ["list"],
    "hook": "useQuery('resource').list()",
    "example": "const { data } = useQuery('item').list();\n<MyComponent data={data || []} />"
  },
  "files": [
    {
      "path": "components/ui/my-component.tsx",
      "content": "\"use client\";\n\nimport * as React from \"react\";\nimport { Button } from \"@/components/ui/button\";\n\ninterface MyComponentProps {\n  data: any[];\n  onAction?: (item: any) => void;\n}\n\nexport function MyComponent({ data, onAction }: MyComponentProps) {\n  return (\n    <div>\n      {data.map((item, index) => (\n        <div key={index}>\n          <span>{item.name}</span>\n          {onAction && (\n            <Button onClick={() => onAction(item)}>Action</Button>\n          )}\n        </div>\n      ))}\n    </div>\n  );\n}",
      "type": "components:ui"
    }
  ],
  "tailwind": {
    "config": {}
  }
}
```

### 3. Add to Registry Index

Update `registry/index.json`:

```json
{
  "version": "1.0.0",
  "categories": [...],
  "components": [
    ...
    {
      "name": "my-component",
      "description": "A component that displays items with actions"
    }
  ]
}
```

### 4. Test Installation

```bash
npx better-admin add my-component
```

## Component Categories

### Data Display (`data-display`)

**Use for:** Tables, lists, grids, cards that display data

**Typical Props:**
- `data: T[]` - Array of items to display
- `isLoading?: boolean` - Loading state
- `error?: Error` - Error state
- `onItemClick?: (item: T) => void` - Item interaction

**Better Query Integration:**
```typescript
const { data, isLoading, error } = useQuery("resource").list();
<Component data={data || []} isLoading={isLoading} error={error} />
```

**Example Components:**
- `data-table` - Sortable, filterable table
- `resource-list` - Card-based grid
- `data-grid` - Customizable grid layout

### Forms (`forms`)

**Use for:** Create/edit forms, input components, form builders

**Typical Props:**
- `fields: Field[]` - Form field configuration
- `onSubmit: (data: any) => void | Promise<void>` - Submit handler
- `defaultValues?: Record<string, any>` - Initial values
- `isLoading?: boolean` - Submit state

**Better Query Integration:**
```typescript
// Create
const { create } = useQuery("resource");
<Form onSubmit={create.mutateAsync} />

// Update
const { update } = useQuery("resource");
<Form defaultValues={data} onSubmit={(d) => update.mutateAsync({ where: { id }, data: d })} />
```

**Example Components:**
- `crud-form` - Dynamic form builder
- `inline-edit` - Inline editing
- `multi-step-form` - Wizard form

### Layout (`layout`)

**Use for:** Page layouts, navigation, containers

**Typical Props:**
- `children: React.ReactNode` - Content
- `sidebar?: React.ReactNode` - Sidebar content
- `header?: React.ReactNode` - Header content

**Better Query Integration:** Usually none (layout components)

**Example Components:**
- `admin-layout` - Main layout wrapper
- `sidebar` - Navigation sidebar
- `header` - Page header

### Feedback (`feedback`)

**Use for:** Loading states, errors, notifications, toasts

**Typical Props:**
- `isLoading?: boolean` - Loading state
- `error?: Error` - Error to display
- `message?: string` - Notification message
- `variant?: string` - Style variant

**Better Query Integration:**
```typescript
const { data, isLoading, error } = useQuery("resource").list();
<LoadingState isLoading={isLoading} />
<ErrorDisplay error={error} />
```

**Example Components:**
- `loading-spinner` - Loading indicator
- `error-boundary` - Error handler
- `toast` - Notifications

## Component Template Patterns

### Pattern 1: Simple Data Display

```tsx
"use client";

import * as React from "react";

interface ComponentProps<T> {
  data: T[];
  renderItem: (item: T) => React.ReactNode;
  emptyMessage?: string;
}

export function Component<T>({ data, renderItem, emptyMessage }: ComponentProps<T>) {
  if (!data || data.length === 0) {
    return <div>{emptyMessage || "No items"}</div>;
  }
  
  return (
    <div>
      {data.map((item, index) => (
        <div key={index}>{renderItem(item)}</div>
      ))}
    </div>
  );
}
```

### Pattern 2: Data Display with Loading/Error

```tsx
"use client";

import * as React from "react";

interface ComponentProps<T> {
  data: T[];
  isLoading?: boolean;
  error?: Error;
  renderItem: (item: T) => React.ReactNode;
}

export function Component<T>({ data, isLoading, error, renderItem }: ComponentProps<T>) {
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!data || data.length === 0) return <div>No items</div>;
  
  return (
    <div>
      {data.map((item, index) => (
        <div key={index}>{renderItem(item)}</div>
      ))}
    </div>
  );
}
```

### Pattern 3: Form Component

```tsx
"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

interface Field {
  name: string;
  label: string;
  type: string;
  required?: boolean;
}

interface FormProps {
  fields: Field[];
  onSubmit: (data: any) => void | Promise<void>;
  defaultValues?: Record<string, any>;
  isLoading?: boolean;
}

export function Component({ fields, onSubmit, defaultValues, isLoading }: FormProps) {
  // Build schema
  const schemaShape: Record<string, z.ZodTypeAny> = {};
  fields.forEach(field => {
    let schema: z.ZodTypeAny = z.string();
    if (field.required) schema = schema.min(1, `${field.label} is required`);
    schemaShape[field.name] = schema;
  });
  
  const form = useForm({
    resolver: zodResolver(z.object(schemaShape)),
    defaultValues,
  });
  
  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* Form fields */}
    </form>
  );
}
```

### Pattern 4: Action Component

```tsx
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";

interface ActionProps {
  onClick: () => void | Promise<void>;
  label: string;
  confirmMessage?: string;
  variant?: "default" | "destructive";
}

export function Component({ onClick, label, confirmMessage, variant }: ActionProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  
  const handleClick = async () => {
    if (confirmMessage && !confirm(confirmMessage)) return;
    
    setIsLoading(true);
    try {
      await onClick();
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Button variant={variant} onClick={handleClick} disabled={isLoading}>
      {isLoading ? "Loading..." : label}
    </Button>
  );
}
```

## Better Query Integration Examples

### Example 1: List with Data Table

```json
{
  "betterQuery": {
    "operations": ["list"],
    "hook": "useQuery('resource').list()",
    "example": "const { data, isLoading } = useQuery('user').list();\n<DataTable data={data || []} columns={columns} />"
  }
}
```

### Example 2: Create Form

```json
{
  "betterQuery": {
    "operations": ["create"],
    "hook": "useQuery('resource').create",
    "example": "const { create } = useQuery('user');\n<CrudForm fields={fields} onSubmit={create.mutateAsync} />"
  }
}
```

### Example 3: Edit Form

```json
{
  "betterQuery": {
    "operations": ["get", "update"],
    "hook": "useQuery('resource').get / .update",
    "example": "const { get, update } = useQuery('user');\nconst { data } = get.useQuery({ where: { id } });\n<CrudForm defaultValues={data} onSubmit={(d) => update.mutateAsync({ where: { id }, data: d })} />"
  }
}
```

### Example 4: List with Delete

```json
{
  "betterQuery": {
    "operations": ["list", "delete"],
    "hook": "useQuery('resource').list / .remove",
    "example": "const { list, remove } = useQuery('user');\nconst { data } = list.useQuery();\n<ResourceList items={data || []} onDelete={(item) => remove.mutateAsync({ where: { id: item.id } })} />"
  }
}
```

## Metadata Reference

### Required Fields

```json
{
  "name": "component-name",           // kebab-case name
  "type": "components:ui",           // Always "components:ui"
  "category": "data-display",        // Category ID
  "description": "Component description"  // Short description
}
```

### Optional Fields

```json
{
  "dependencies": {
    "shadcn": ["button", "card"],    // shadcn/ui components
    "npm": ["package-name"]          // npm packages
  },
  "registryDependencies": [],        // Other registry components
  "betterQuery": {                   // Better Query integration
    "operations": ["list"],          // CRUD operations
    "hook": "useQuery(...)",        // Hook usage
    "example": "..."                // Usage example
  },
  "tailwind": {
    "config": {}                    // Tailwind config additions
  }
}
```

## Dependencies

### shadcn/ui Dependencies

List all shadcn/ui components your component uses:

```json
{
  "dependencies": {
    "shadcn": ["button", "card", "input", "form", "label"]
  }
}
```

The CLI will automatically install these when the component is added.

### npm Dependencies

List all npm packages required:

```json
{
  "dependencies": {
    "npm": ["@tanstack/react-table", "date-fns"]
  }
}
```

Common packages:
- `@tanstack/react-table` - For tables
- `react-hook-form` - For forms
- `@hookform/resolvers` - Form validation
- `zod` - Schema validation
- `date-fns` - Date manipulation

## Testing Your Component

### 1. Local Testing

```bash
# Test with local registry
cd packages/better-admin
export REGISTRY_PATH=$(pwd)/registry
npx better-admin add my-component
```

### 2. Test in Example App

```bash
# Create test Next.js app
npx create-next-app@latest test-app
cd test-app

# Install dependencies
npx shadcn@latest init
npm install better-query

# Initialize better-admin
npx better-admin init

# Add your component
npx better-admin add my-component

# Test the component
# Create a test page and use the component
```

### 3. Verify Installation

Check that:
- [ ] Component file is created in correct location
- [ ] shadcn/ui dependencies are installed
- [ ] npm packages are installed
- [ ] Component imports work
- [ ] Component renders without errors
- [ ] Better Query integration works

## Best Practices

### 1. Component Design

- **Single Responsibility**: Each component should do one thing well
- **Type Safety**: Use TypeScript for all props and internal state
- **Composability**: Design components to work together
- **Accessibility**: Follow ARIA guidelines
- **Responsiveness**: Work on all screen sizes

### 2. Props Design

- **Required vs Optional**: Mark props appropriately
- **Sensible Defaults**: Provide good default values
- **Flexible Callbacks**: Use `() => void | Promise<void>` for async support
- **Generic Types**: Use TypeScript generics for reusable components

### 3. Better Query Integration

- **Handle Loading States**: Always show loading feedback
- **Handle Errors**: Display errors user-friendly
- **Optimistic Updates**: Use Better Query's optimistic updates
- **Invalidation**: Invalidate queries after mutations

### 4. Documentation

- **Clear Description**: Write a clear, concise description
- **Usage Example**: Provide a complete working example
- **Props Documentation**: Document all props in TypeScript
- **Common Patterns**: Show common usage patterns

## Common Pitfalls

### 1. Missing "use client"

Always add `"use client"` for components that use hooks:

```tsx
"use client";

import * as React from "react";
```

### 2. Incorrect Import Paths

Use alias imports from config:

```tsx
import { Button } from "@/components/ui/button";  // ✅ Correct
import { Button } from "../ui/button";            // ❌ Wrong
```

### 3. Hardcoded Styles

Use Tailwind classes, not inline styles:

```tsx
<div className="p-4 bg-white">  // ✅ Correct
<div style={{ padding: 16 }}>   // ❌ Wrong
```

### 4. Missing Error Handling

Always handle errors:

```tsx
// ✅ Correct
if (error) return <div>Error: {error.message}</div>;

// ❌ Wrong
// No error handling
```

## Publishing Components

### 1. Create Pull Request

```bash
git checkout -b add-my-component
git add registry/components/my-component.json
git add registry/index.json
git commit -m "Add my-component"
git push origin add-my-component
```

### 2. PR Checklist

- [ ] Component follows TypeScript best practices
- [ ] Metadata is complete and accurate
- [ ] Dependencies are listed correctly
- [ ] Better Query integration is documented
- [ ] Component tested locally
- [ ] No console errors or warnings
- [ ] Documentation updated if needed

### 3. Review Process

1. Automated checks run
2. Manual code review
3. Test in example project
4. Merge to main branch
5. Component available in registry

## Getting Help

- **Documentation**: Check ARCHITECTURE.md
- **Examples**: Look at existing components
- **Issues**: Open a GitHub issue
- **Discord**: Join our community

## Summary

Adding components to Better Admin is straightforward:

1. Create your React component
2. Write the metadata JSON
3. Add to registry index
4. Test locally
5. Submit pull request

Focus on creating reusable, well-documented components that integrate seamlessly with Better Query!
