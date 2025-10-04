# Better Admin

A CLI tool for installing Better Admin components with automatic shadcn/ui dependency resolution.

## Features

- 🎯 Install components via CLI: `npx better-admin add [component]`
- 🔍 Automatic detection of shadcn/ui dependencies
- 📦 Automatic installation of missing shadcn/ui components
- 📋 Copy components directly into your project
- ⚙️ Configurable paths and aliases

## Installation

Initialize Better Admin in your project:

```bash
npx better-admin init
```

This will create a `better-admin.json` configuration file in your project root.

## Usage

### List Available Components

```bash
npx better-admin list
```

### Add a Component

```bash
npx better-admin add data-table
```

This will:
1. Detect required shadcn/ui dependencies
2. Automatically install missing shadcn/ui components
3. Install npm dependencies
4. Copy the component into your project

### Options

```bash
# Skip prompts and use defaults
npx better-admin init --yes

# Overwrite existing files
npx better-admin add data-table --overwrite

# Install to custom path
npx better-admin add data-table --path ./custom/path
```

## Available Components

### data-table

A powerful data table component with sorting, filtering, and pagination built on @tanstack/react-table.

**Dependencies:**
- shadcn/ui: table, button, input, dropdown-menu, select
- npm: @tanstack/react-table

### crud-form

A flexible CRUD form builder with validation using react-hook-form and zod.

**Dependencies:**
- shadcn/ui: form, input, button, label, select, textarea
- npm: react-hook-form, @hookform/resolvers, zod

### resource-list

A reusable list component for displaying resources with actions.

**Dependencies:**
- shadcn/ui: card, button, badge

## Configuration

The `better-admin.json` file configures paths and aliases:

```json
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
```

## How It Works

1. **Component Metadata**: Each component has a JSON file defining its dependencies
2. **Dependency Detection**: The CLI reads the component metadata to identify shadcn/ui dependencies
3. **Automatic Installation**: Missing shadcn/ui components are installed via `npx shadcn@latest add`
4. **File Copying**: Component files are copied to your project with the correct paths

## Example Workflow

```bash
# 1. Initialize Better Admin
npx better-admin init

# 2. Install a component with all dependencies
npx better-admin add data-table

# The CLI automatically:
# ✓ Detects dependencies: table, button, input, dropdown-menu, select
# ✓ Installs missing shadcn/ui components
# ✓ Installs @tanstack/react-table
# ✓ Copies data-table.tsx to components/ui/
```

## License

MIT
