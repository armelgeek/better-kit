export function packageJsonTemplate(withAuth: boolean): string {
	const authDependencies = withAuth ? `    "better-auth": "^1.0.0",
` : "";
	
	return `{
  "name": "better-query-app",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "generate:types": "better-query generate"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "next": "^14.2.0",
${authDependencies}    "better-query": "^0.0.1",
    "better-sqlite3": "^11.1.2",
    "zod": "^3.22.5"
  },
  "devDependencies": {
    "typescript": "^5.5.0",
    "@types/node": "^20.12.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@types/better-sqlite3": "^7.6.11",
    "eslint": "^8.57.0",
    "eslint-config-next": "^14.2.0",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0"
  }
}`;
}