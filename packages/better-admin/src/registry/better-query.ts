/**
 * Better Query integration helpers for admin components
 * Provides utilities to work seamlessly with better-query
 */

/**
 * Template for components that use better-query list operation
 */
export const LIST_INTEGRATION_TEMPLATE = `
// Usage with better-query
import { useQuery } from "better-query/react";

function YourComponent() {
  const { data, isLoading, error } = useQuery("resourceName").list();
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return <ComponentName data={data || []} />;
}
`;

/**
 * Template for components that use better-query create operation
 */
export const CREATE_INTEGRATION_TEMPLATE = `
// Usage with better-query
import { useQuery } from "better-query/react";

function YourComponent() {
  const { create } = useQuery("resourceName");
  
  const handleSubmit = async (formData) => {
    try {
      await create.mutateAsync(formData);
      // Handle success (e.g., redirect, show notification)
    } catch (error) {
      // Handle error
      console.error(error);
    }
  };
  
  return <ComponentName onSubmit={handleSubmit} />;
}
`;

/**
 * Template for components that use better-query update operation
 */
export const UPDATE_INTEGRATION_TEMPLATE = `
// Usage with better-query
import { useQuery } from "better-query/react";

function YourComponent({ id }) {
  const { get, update } = useQuery("resourceName");
  const { data, isLoading } = get.useQuery({ where: { id } });
  
  const handleSubmit = async (formData) => {
    try {
      await update.mutateAsync({ where: { id }, data: formData });
      // Handle success
    } catch (error) {
      // Handle error
      console.error(error);
    }
  };
  
  if (isLoading) return <div>Loading...</div>;
  
  return <ComponentName defaultValues={data} onSubmit={handleSubmit} />;
}
`;

/**
 * Template for components that use better-query delete operation
 */
export const DELETE_INTEGRATION_TEMPLATE = `
// Usage with better-query
import { useQuery } from "better-query/react";

function YourComponent() {
  const { list, remove } = useQuery("resourceName");
  const { data } = list.useQuery();
  
  const handleDelete = async (id) => {
    if (confirm("Are you sure?")) {
      try {
        await remove.mutateAsync({ where: { id } });
        // Handle success
      } catch (error) {
        // Handle error
        console.error(error);
      }
    }
  };
  
  return <ComponentName data={data || []} onDelete={handleDelete} />;
}
`;

/**
 * Get integration template for a set of operations
 */
export function getIntegrationTemplate(
	operations: Array<"list" | "get" | "create" | "update" | "delete">,
): string {
	const templates: string[] = [];

	if (operations.includes("list")) {
		templates.push("// List Operation\n" + LIST_INTEGRATION_TEMPLATE);
	}
	if (operations.includes("create")) {
		templates.push("// Create Operation\n" + CREATE_INTEGRATION_TEMPLATE);
	}
	if (operations.includes("update")) {
		templates.push("// Update Operation\n" + UPDATE_INTEGRATION_TEMPLATE);
	}
	if (operations.includes("delete")) {
		templates.push("// Delete Operation\n" + DELETE_INTEGRATION_TEMPLATE);
	}

	return templates.join("\n\n");
}

/**
 * Common patterns for better-query integration
 */
export const INTEGRATION_PATTERNS = {
	"data-table-with-actions": {
		description: "Data table with inline actions (edit, delete)",
		operations: ["list", "delete"],
		example: `
import { DataTable } from "@/components/ui/data-table";
import { useQuery } from "better-query/react";

function UsersTable() {
  const { list, remove } = useQuery("user");
  const { data, isLoading } = list.useQuery();
  
  const columns = [
    { accessorKey: "name", header: "Name" },
    { accessorKey: "email", header: "Email" },
    {
      id: "actions",
      cell: ({ row }) => (
        <Button onClick={() => remove.mutateAsync({ where: { id: row.original.id } })}>
          Delete
        </Button>
      ),
    },
  ];
  
  if (isLoading) return <div>Loading...</div>;
  
  return <DataTable columns={columns} data={data || []} />;
}
`,
	},
	"crud-form-create": {
		description: "Form for creating new resources",
		operations: ["create"],
		example: `
import { CrudForm } from "@/components/ui/crud-form";
import { useQuery } from "better-query/react";
import { useRouter } from "next/navigation";

function CreateUserForm() {
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
`,
	},
	"crud-form-edit": {
		description: "Form for editing existing resources",
		operations: ["get", "update"],
		example: `
import { CrudForm } from "@/components/ui/crud-form";
import { useQuery } from "better-query/react";

function EditUserForm({ id }) {
  const { get, update } = useQuery("user");
  const { data, isLoading } = get.useQuery({ where: { id } });
  
  const fields = [
    { name: "name", label: "Name", type: "text", required: true },
    { name: "email", label: "Email", type: "email", required: true },
  ];
  
  if (isLoading) return <div>Loading...</div>;
  
  return (
    <CrudForm 
      fields={fields} 
      defaultValues={data}
      onSubmit={(formData) => update.mutateAsync({ where: { id }, data: formData })}
    />
  );
}
`,
	},
	"resource-list-with-actions": {
		description: "Card-based resource list with actions",
		operations: ["list"],
		example: `
import { ResourceList } from "@/components/ui/resource-list";
import { useQuery } from "better-query/react";
import { useRouter } from "next/navigation";

function ProjectsList() {
  const { list } = useQuery("project");
  const { data, isLoading } = list.useQuery();
  const router = useRouter();
  
  if (isLoading) return <div>Loading...</div>;
  
  return (
    <ResourceList
      items={data || []}
      renderTitle={(item) => item.name}
      renderDescription={(item) => item.description}
      renderBadge={(item) => <Badge>{item.status}</Badge>}
      actions={[
        { label: "View", onClick: (item) => router.push(\`/projects/\${item.id}\`) },
        { label: "Edit", onClick: (item) => router.push(\`/projects/\${item.id}/edit\`), variant: "outline" },
      ]}
    />
  );
}
`,
	},
};
