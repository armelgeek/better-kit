/**
 * Example: Setting up Better Query with Better Admin
 * 
 * This example shows how to configure better-query and integrate it
 * with better-admin components for data operations.
 */

// 1. Setup better-query (typically in lib/query.ts)
import { betterQuery, createResource } from "better-query";
import { auth } from "./auth";
import Database from "better-sqlite3";

const db = new Database("app.db");

// Define your resources
const userResource = createResource({
	name: "user",
	schema: {
		id: { type: "string", primary: true },
		name: { type: "string", required: true },
		email: { type: "string", required: true },
		role: { type: "string" },
		createdAt: { type: "date" },
	},
	middlewares: [
		{
			handler: async (context) => {
				// Add authentication to all requests
				const session = await auth.api.getSession({
					headers: context.request.headers,
				});
				if (session) {
					context.user = session.user;
				}
			},
		},
	],
	permissions: {
		create: async (context) => !!context.user,
		read: async (context) => !!context.user,
		update: async (context) => {
			const user = context.user as any;
			return user?.role === "admin" || context.existingData?.id === user?.id;
		},
		delete: async (context) => {
			const user = context.user as any;
			return user?.role === "admin";
		},
	},
});

export const query = betterQuery({
	database: db,
	resources: [userResource],
});

// 2. Create data provider for better-admin
import { createBetterQueryProvider } from "better-admin";

export const dataProvider = createBetterQueryProvider({
	queryClient: query,
	onError: (error) => {
		console.error("Data error:", error);
	},
});

// 3. Use in your admin app
import { Admin } from "better-admin/components";

export function App() {
	return (
		<Admin authProvider={authProvider} dataProvider={dataProvider}>
			{/* Your resources and routes */}
		</Admin>
	);
}

// 4. Use in list components
import { useBetterQuery } from "better-admin";
import { DataTable } from "@/components/ui/data-table";

export function UsersList() {
	const { list } = useBetterQuery("user", query);
	const { data, isLoading, error } = list.useQuery();

	if (isLoading) return <div>Loading...</div>;
	if (error) return <div>Error: {error.message}</div>;

	return <DataTable columns={columns} data={data || []} />;
}

// 5. Use in create forms
import { CrudForm } from "@/components/ui/crud-form";

export function UserCreate() {
	const { create } = useBetterQuery("user", query);

	const fields = [
		{ name: "name", label: "Name", type: "text", required: true },
		{ name: "email", label: "Email", type: "email", required: true },
		{ name: "role", label: "Role", type: "select", options: ["user", "admin"] },
	];

	return (
		<CrudForm
			fields={fields}
			onSubmit={async (data) => {
				await create.mutateAsync(data);
				// Redirect or show success message
			}}
			submitLabel="Create User"
		/>
	);
}

// 6. Use in edit forms
export function UserEdit({ id }: { id: string }) {
	const { get, update } = useBetterQuery("user", query);
	const { data, isLoading } = get.useQuery({ where: { id } });

	if (isLoading) return <div>Loading...</div>;

	return (
		<CrudForm
			fields={fields}
			defaultValues={data}
			onSubmit={async (formData) => {
				await update.mutateAsync({ where: { id }, data: formData });
				// Redirect or show success message
			}}
			submitLabel="Update User"
		/>
	);
}

// 7. Use with pagination and filters
export function UsersListAdvanced() {
	const { list } = useBetterQuery("user", query);
	const [page, setPage] = useState(1);
	const [filters, setFilters] = useState({});

	const { data, isLoading } = list.useQuery({
		where: filters,
		skip: (page - 1) * 10,
		take: 10,
		orderBy: { createdAt: "desc" },
	});

	return (
		<div>
			<FilterForm onSubmit={setFilters} />
			<DataTable columns={columns} data={data || []} />
			<Pagination page={page} onChange={setPage} />
		</div>
	);
}
