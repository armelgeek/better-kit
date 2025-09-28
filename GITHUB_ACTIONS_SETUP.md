# GitHub Actions & GitHub Pages Setup

This document describes the GitHub Actions CI/CD and GitHub Pages deployment setup for the Better Kit documentation.

## Overview

The project now includes automated CI/CD pipelines and GitHub Pages deployment for the documentation site.

### Features

- **Continuous Integration**: Automated testing, linting, and building on every push and pull request
- **GitHub Pages Deployment**: Automatic deployment of documentation to GitHub Pages on pushes to main/master
- **Static Site Generation**: Next.js static export optimized for GitHub Pages hosting
- **Monorepo Support**: Proper handling of the monorepo structure with correct build dependencies

## Workflows

### 1. CI Workflow (`.github/workflows/ci.yml`)

Runs on every push and pull request to `main` or `master` branches.

**Jobs:**
- **lint-and-test**: Runs linting, type checking, and tests
- **build-docs**: Builds the documentation and uploads artifacts

**Steps:**
1. Checkout code
2. Setup Node.js 18
3. Setup pnpm
4. Install dependencies
5. Build packages
6. Run linter (continues on error for now)
7. Run type checking
8. Run tests
9. Build documentation

### 2. Deploy Workflow (`.github/workflows/deploy.yml`)

Runs on pushes to `main` or `master` branches and can be manually triggered.

**Jobs:**
- **build**: Builds the documentation for production
- **deploy**: Deploys to GitHub Pages

**Features:**
- Uses GitHub Pages actions for optimal deployment
- Configured with proper permissions for GitHub Pages
- Handles concurrency to prevent conflicting deployments

## Configuration Changes

### Next.js Configuration (`docs/next.config.js`)

The Next.js configuration has been updated for GitHub Pages compatibility:

```javascript
{
  output: 'export',           // Enable static export
  basePath: '/better-kit',    // GitHub Pages base path
  trailingSlash: true,        // Required for static hosting
  images: { unoptimized: true }, // Required for static export
}
```

### Package Scripts (`docs/package.json`)

Updated build scripts:
- `build`: Clean Next.js build without post-processing
- `build:with-orama`: Build with search indexing (for development)

### Static Files

- Added `.nojekyll` file to prevent Jekyll processing
- Disabled problematic API routes that don't work with static export
- Fixed external API calls to handle build-time failures gracefully

## GitHub Pages Setup

To enable GitHub Pages for this repository:

1. Go to repository Settings → Pages
2. Set Source to "GitHub Actions"
3. The deployment workflow will automatically deploy on pushes to main/master

The documentation will be available at: `https://armelgeek.github.io/better-kit/`

## Local Development

For local development of the documentation:

```bash
cd docs
pnpm install
pnpm dev
```

To test the production build locally:

```bash
cd docs
pnpm build
# Serve the 'out' directory with any static file server
```

## Troubleshooting

### Build Failures

Common issues and solutions:

1. **API Route Errors**: Some API routes don't work with static export. They've been disabled or modified to handle static builds.

2. **External API Calls**: Calls to external APIs (GitHub, npm) during build are handled with try-catch blocks and fallback values.

3. **Missing Components**: Components referenced in MDX files must be properly imported or replaced with standard markdown.

### Development vs Production

- Development builds support all features including dynamic API routes
- Production builds for GitHub Pages use static export with limited functionality
- Environment variables automatically handle the different configurations

## Monitoring

- Check the Actions tab for workflow status
- Build logs provide detailed information about any failures
- GitHub Pages deployment status is visible in the repository settings

## Future Improvements

- Re-enable dynamic features when possible
- Add automated testing for the deployed site
- Implement cache optimization strategies
- Add deployment notifications