/** @type {import('next').NextConfig} */
const nextConfig = {
	experimental: {},
	typescript: {
		// Temporarily ignore type errors during build
		ignoreBuildErrors: true,
	},
};

module.exports = nextConfig;
