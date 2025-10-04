# Shadcn Admin Kit - Better Kit

A modern admin interface built with [shadcn-admin-kit](https://github.com/marmelab/shadcn-admin-kit), providing a complete admin dashboard solution with React Admin integration.

## 🎯 Overview

This admin kit combines the power of:
- **[shadcn/ui](https://ui.shadcn.com/)** - Beautiful, accessible components
- **[React Admin](https://marmelab.com/react-admin/)** - Full-featured admin framework
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first styling
- **[Vite](https://vitejs.dev/)** - Lightning-fast build tool

## 📚 Documentation

For complete documentation on available components and usage patterns, visit:
- **[Official Documentation](https://marmelab.com/shadcn-admin-kit/docs)**
- **[Component Demo](https://marmelab.com/shadcn-admin-kit/demo)**
- **[GitHub Repository](https://github.com/marmelab/shadcn-admin-kit)**

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- pnpm (recommended) or npm

### Installation

1. Install dependencies:
```bash
pnpm install
```

2. Start the development server:
```bash
pnpm dev
```

The admin interface will be available at `http://localhost:3010`

### Building for Production

```bash
pnpm build
```

This creates an optimized build in the `dist` directory.

### Preview Production Build

```bash
pnpm preview
```

## 📦 Project Structure

```
admin/
├── src/
│   ├── components/
│   │   ├── admin/          # Admin-specific components
│   │   └── ui/             # shadcn/ui base components
│   ├── demo/               # Demo application with sample data
│   │   ├── App.tsx         # Main demo app
│   │   ├── authProvider.ts # Authentication logic
│   │   ├── dataProvider.ts # Data fetching logic
│   │   ├── products/       # Products resource
│   │   ├── orders/         # Orders resource
│   │   ├── customers/      # Customers resource
│   │   ├── categories/     # Categories resource
│   │   └── reviews/        # Reviews resource
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utility functions
│   ├── stories/            # Storybook stories
│   ├── index.css           # Global styles
│   └── main.tsx            # Application entry point
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── README.md
```

## 🎨 Available Components

The admin kit includes a comprehensive set of components built on top of shadcn/ui:

### Layout Components
- **Admin** - Main admin wrapper
- **Layout** - Page layout with sidebar
- **AppSidebar** - Navigation sidebar
- **Breadcrumb** - Navigation breadcrumbs

### Data Display
- **DataTable** - Feature-rich data tables
- **List** - List views with filtering/sorting
- **Show** - Detail views
- **ArrayField**, **DateField**, **EmailField**, **NumberField**, **TextField**, **UrlField** - Field components
- **ReferenceField**, **ReferenceArrayField** - Relational data display
- **BadgeField** - Status badges
- **FileField** - File display

### Forms & Inputs
- **Create** - Creation forms
- **Edit** - Edit forms
- **SimpleForm** - Form wrapper
- **TextInput**, **NumberInput**, **BooleanInput** - Basic inputs
- **AutocompleteInput**, **AutocompleteArrayInput** - Autocomplete fields
- **ReferenceInput**, **ReferenceArrayInput** - Relational inputs
- **FileInput** - File uploads
- **RadioButtonGroupInput** - Radio buttons
- **SelectInput** - Dropdown selects
- **ArrayInput**, **SimpleFormIterator** - Array/nested inputs

### Actions & Buttons
- **CreateButton**, **EditButton**, **ShowButton**, **DeleteButton** - CRUD actions
- **ExportButton**, **BulkExportButton** - Export functionality
- **RefreshButton** - Refresh data
- **BulkDeleteButton** - Bulk operations
- **CancelButton** - Cancel actions
- **SortButton** - Sorting controls
- **ColumnsButton** - Column visibility

### Filtering & Search
- **FilterForm** - Advanced filtering
- **SearchInput** - Search functionality
- **ToggleFilterButton** - Toggle filters
- **SavedQueries** - Save/load filter sets

### UI Components
- **Loading** - Loading states
- **Error** - Error displays
- **Notification** - Toast notifications
- **Confirm** - Confirmation dialogs
- **ThemeModeToggle** - Dark/light mode
- **UserMenu** - User profile menu
- **LocalesMenuButton** - Language switcher

### Auto-Generated Views
- **ListGuesser**, **EditGuesser**, **ShowGuesser** - Auto-generated CRUD views

## 🔧 Configuration

### Customizing the Theme

Edit `src/index.css` to customize the color scheme:

```css
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    /* ... other color variables */
  }
}
```

### Adding a Resource

Create a new resource following this pattern:

```tsx
// src/demo/myresource/index.tsx
import { List, Datagrid, TextField, Create, Edit, SimpleForm, TextInput } from '@/components/admin';

const MyResourceList = () => (
  <List>
    <Datagrid>
      <TextField source="id" />
      <TextField source="name" />
    </Datagrid>
  </List>
);

const MyResourceCreate = () => (
  <Create>
    <SimpleForm>
      <TextInput source="name" />
    </SimpleForm>
  </Create>
);

const MyResourceEdit = () => (
  <Edit>
    <SimpleForm>
      <TextInput source="name" />
    </SimpleForm>
  </Edit>
);

export const myresource = {
  name: 'myresource',
  list: MyResourceList,
  create: MyResourceCreate,
  edit: MyResourceEdit,
};
```

Then register it in `src/demo/App.tsx`:

```tsx
import { myresource } from './myresource';

<Admin ...>
  <Resource {...myresource} />
</Admin>
```

## 🎭 Testing

The project includes Vitest for testing:

```bash
pnpm test
```

## 📝 Code Quality

### Linting
```bash
pnpm lint        # Check for issues
pnpm lint:fix    # Auto-fix issues
```

### Type Checking
```bash
pnpm typecheck
```

## 🤝 Integration with Better Kit

This admin kit is part of the Better Kit monorepo and can be integrated with:

- **[Better Query](../packages/better-query)** - Type-safe CRUD operations
- **[Better Admin CLI](../packages/better-admin)** - Component installation tool

## 📖 Learn More

### shadcn-admin-kit Resources
- [Documentation](https://marmelab.com/shadcn-admin-kit/docs)
- [GitHub](https://github.com/marmelab/shadcn-admin-kit)
- [Demo](https://marmelab.com/shadcn-admin-kit/demo)

### React Admin Resources
- [React Admin Docs](https://marmelab.com/react-admin/documentation.html)
- [Tutorial](https://marmelab.com/react-admin/Tutorial.html)
- [Examples](https://marmelab.com/react-admin/Examples.html)

### shadcn/ui Resources
- [Component Docs](https://ui.shadcn.com/docs)
- [Themes](https://ui.shadcn.com/themes)
- [Examples](https://ui.shadcn.com/examples)

## 📄 License

Part of Better Kit - MIT License

## 🙏 Credits

Built on top of:
- [shadcn-admin-kit](https://github.com/marmelab/shadcn-admin-kit) by Marmelab
- [shadcn/ui](https://ui.shadcn.com/) by @shadcn
- [React Admin](https://marmelab.com/react-admin/) by Marmelab
