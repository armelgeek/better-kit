export function readmeTemplate(withAuth: boolean): string {
	const authSection = withAuth ? `

## Authentication

This project includes Better Auth integration:

- Sign in/Sign up functionality
- Session management
- Role-based permissions

### Environment Variables

Make sure to set the following environment variables:

\`\`\`
BETTER_AUTH_SECRET=your-secret-key-here
\`\`\`

### Auth Routes

- \`/api/auth/signin\` - Sign in page
- \`/api/auth/signup\` - Sign up page
- \`/api/auth/signout\` - Sign out
` : "";

	return `# Better Query App

This is a [Next.js](https://nextjs.org/) project with [Better Query](https://github.com/armelgeek/better-kit) for type-safe CRUD operations.

## Getting Started

First, install the dependencies:

\`\`\`bash
npm install
# or
yarn install
# or
pnpm install
\`\`\`

Then, run the development server:

\`\`\`bash
npm run dev
# or
yarn dev
# or
pnpm dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

- \`src/lib/query.ts\` - Better Query configuration
- \`src/lib/client.ts\` - Type-safe client setup
- \`src/lib/schemas.ts\` - Zod schemas for your resources
- \`src/app/api/query/[...any]/route.ts\` - API routes handler
- \`src/app/page.tsx\` - Main application page
${authSection}
## Features

- ✅ Type-safe CRUD operations
- ✅ Auto-generated API endpoints
- ✅ Database auto-migration
- ✅ Zod schema validation${withAuth ? "\n- ✅ Better Auth integration" : ""}

## Type Generation

Generate TypeScript types from your Better Query configuration:

\`\`\`bash
npm run generate:types
\`\`\`

## Learn More

To learn more about Better Query, check out the [Better Query Documentation](https://github.com/armelgeek/better-kit).

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
`;
}