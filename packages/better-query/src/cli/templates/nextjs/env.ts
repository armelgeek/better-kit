export function envTemplate(withAuth: boolean, database: string): string {
	let dbUrl = "";
	switch (database) {
		case "sqlite":
			dbUrl = "sqlite:./data.db";
			break;
		case "postgres":
			dbUrl = "postgresql://user:password@localhost:5432/mydb";
			break;
		case "mysql":
			dbUrl = "mysql://user:password@localhost:3306/mydb";
			break;
	}

	let content = `# Database
DATABASE_URL=${dbUrl}

# Better Query
NEXT_PUBLIC_API_URL=http://localhost:3000/api/query
`;

	if (withAuth) {
		content += `
# Better Auth
BETTER_AUTH_SECRET=your-secret-key-here-change-in-production
BETTER_AUTH_URL=http://localhost:3000
`;
	}

	return content;
}
