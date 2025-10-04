# Better Admin - Live Demo

## Command Output Examples

### 1. Help Command

\`\`\`bash
$ npx better-admin --help
\`\`\`

Output:
\`\`\`
Usage: better-admin [options] [command]

CLI for Better Admin - Install components with automatic shadcn/ui dependencies

Options:
  -V, --version              output the version number
  -h, --help                 display help for command

Commands:
  init [options]             Initialize Better Admin in your project
  add [options] <component>  Add a component to your project
  list                       List all available components
  help [command]             display help for command
\`\`\`

### 2. Init Command

\`\`\`bash
$ npx better-admin init --yes
\`\`\`

Output:
\`\`\`
🚀 Initializing Better Admin...

✔ Configuration written to better-admin.json

✅ Better Admin initialized successfully!

⚠️  shadcn/ui doesn't seem to be installed.
   When you add components, shadcn/ui components will be installed automatically.

�� Next steps:

  1. Add your first component:
     npx better-admin add data-table

  2. List available components:
     npx better-admin list
\`\`\`

Created file: **better-admin.json**
\`\`\`json
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
\`\`\`

### 3. List Command

\`\`\`bash
$ npx better-admin list
\`\`\`

Output:
\`\`\`
📋 Available Better Admin components:

✔ Registry fetched

  • data-table
    A powerful data table component with sorting, filtering, and pagination
    Dependencies: table, button, input, dropdown-menu, select

  • crud-form
    A flexible CRUD form builder with validation
    Dependencies: form, input, button, label, select, textarea

  • resource-list
    A reusable list component for displaying resources
    Dependencies: card, button, badge

  • example-card
    A simple example card component with no dependencies

💡 Usage:

   npx better-admin add <component-name>
\`\`\`

### 4. Add Command (with dependencies)

\`\`\`bash
$ npx better-admin add data-table
\`\`\`

Output:
\`\`\`
📦 Adding data-table...

✔ Component metadata fetched

📥 Installing shadcn/ui dependencies...

✔ shadcn/ui components installed

📥 Installing npm dependencies...

✔ npm dependencies installed

📝 Copying component files...

✓ components/ui/data-table.tsx

✅ Successfully added data-table!
\`\`\`

**What happened behind the scenes:**
1. Fetched component metadata from registry
2. Detected dependencies: table, button, input, dropdown-menu, select
3. Ran: \`npx shadcn@latest add table button input dropdown-menu select --yes\`
4. Installed: \`pnpm add @tanstack/react-table\`
5. Copied data-table.tsx to components/ui/

### 5. Add Command (no dependencies)

\`\`\`bash
$ npx better-admin add example-card --yes
\`\`\`

Output:
\`\`\`
📦 Adding example-card...

✔ Component metadata fetched

📝 Copying component files...

✓ components/ui/example-card.tsx

✅ Successfully added example-card!
\`\`\`

### 6. Add Command (with overwrite)

\`\`\`bash
$ npx better-admin add data-table --overwrite
\`\`\`

Output:
\`\`\`
📦 Adding data-table...

✔ Component metadata fetched

📥 Installing shadcn/ui dependencies...

✔ shadcn/ui components installed (already installed, skipped)

📥 Installing npm dependencies...

✔ npm dependencies installed (already installed, skipped)

📝 Copying component files...

✓ components/ui/data-table.tsx (overwritten)

✅ Successfully added data-table!
\`\`\`

## Component Usage Examples

### Using data-table

\`\`\`tsx
import { DataTable } from "@/components/ui/data-table";
import { useQuery } from "better-query/react";

const userColumns = [
  { accessorKey: "id", header: "ID" },
  { accessorKey: "name", header: "Name" },
  { accessorKey: "email", header: "Email" },
  { accessorKey: "role", header: "Role" },
];

export function UsersPage() {
  const { data: users } = useQuery("user").list();

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Users</h1>
      <DataTable 
        columns={userColumns} 
        data={users || []}
        searchKey="name"
        searchPlaceholder="Search users..."
      />
    </div>
  );
}
\`\`\`

### Using crud-form

\`\`\`tsx
import { CrudForm } from "@/components/ui/crud-form";
import { useQuery } from "better-query/react";
import { useRouter } from "next/navigation";

const userFields = [
  { name: "name", label: "Name", type: "text", required: true },
  { name: "email", label: "Email", type: "email", required: true },
  { name: "role", label: "Role", type: "text", required: true },
];

export function CreateUserForm() {
  const { create } = useQuery("user");
  const router = useRouter();

  return (
    <div className="max-w-md mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Create User</h2>
      <CrudForm 
        fields={userFields}
        onSubmit={async (data) => {
          await create.mutateAsync(data);
          router.push("/users");
        }}
        submitLabel="Create User"
        isLoading={create.isPending}
      />
    </div>
  );
}
\`\`\`

### Using resource-list

\`\`\`tsx
import { ResourceList } from "@/components/ui/resource-list";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "better-query/react";

export function ProjectsList() {
  const { data: projects } = useQuery("project").list();
  const { deleteOne } = useQuery("project");

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Projects</h1>
      <ResourceList
        items={projects || []}
        renderTitle={(project) => project.name}
        renderDescription={(project) => project.description}
        renderBadge={(project) => (
          <Badge variant={project.status === "active" ? "default" : "secondary"}>
            {project.status}
          </Badge>
        )}
        actions={[
          {
            label: "Edit",
            onClick: (project) => router.push(\`/projects/\${project.id}/edit\`),
          },
          {
            label: "Delete",
            variant: "destructive",
            onClick: async (project) => {
              if (confirm("Delete this project?")) {
                await deleteOne.mutateAsync(project.id);
              }
            },
          },
        ]}
        emptyMessage="No projects found. Create your first project!"
      />
    </div>
  );
}
\`\`\`

## Full Workflow Example

\`\`\`bash
# Step 1: Create a new Next.js project
npx create-next-app@latest my-admin --typescript --tailwind --app

cd my-admin

# Step 2: Install shadcn/ui
npx shadcn@latest init

# Step 3: Initialize Better Admin
npx better-admin init

# Step 4: List available components
npx better-admin list

# Step 5: Install components
npx better-admin add data-table
npx better-admin add crud-form
npx better-admin add resource-list

# Step 6: Start building your admin interface!
# Components are now available in components/ui/
\`\`\`

## Troubleshooting

### Component already exists

\`\`\`bash
$ npx better-admin add data-table
\`\`\`

Output:
\`\`\`
📦 Adding data-table...

✔ Component metadata fetched

📝 Copying component files...

⚠️  components/ui/data-table.tsx already exists (use --overwrite to replace)

✅ Successfully added data-table!
\`\`\`

Solution:
\`\`\`bash
$ npx better-admin add data-table --overwrite
\`\`\`

### Configuration not found

\`\`\`bash
$ npx better-admin add data-table
\`\`\`

Output:
\`\`\`
📦 Adding data-table...

⚠️  Better Admin is not initialized in this project.
   Run: npx better-admin init
\`\`\`

Solution:
\`\`\`bash
$ npx better-admin init
\`\`\`

## Summary

Better Admin provides a seamless experience for installing admin components:

1. **Zero Config**: Initialize with one command
2. **Automatic Dependencies**: No manual shadcn/ui installation
3. **Type Safe**: Full TypeScript support
4. **Flexible**: Works with any React framework
5. **Well Integrated**: Perfect companion to Better Query

Try it now:
\`\`\`bash
npx better-admin init
npx better-admin add data-table
\`\`\`
