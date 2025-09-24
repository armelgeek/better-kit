export function nextConfigTemplate(): string {
	return `/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['better-sqlite3']
  }
};

export default nextConfig;`;
}