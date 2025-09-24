# Better Admin

Better Admin is a powerful admin interface library built on top of React Admin, using Radix UI primitives directly for maximum flexibility and portability. It provides seamless integration with Better Query for data management and Better Auth for authentication.

## Features

- 🎨 **Modern UI**: Built with Radix UI primitives for maximum flexibility
- 🔗 **Better Query Integration**: Seamless integration with Better Query for data operations
- 🔐 **Better Auth Integration**: Built-in authentication with Better Auth
- 📱 **Responsive**: Mobile-first responsive design
- 🎯 **TypeScript**: Full TypeScript support with type safety
- 🧩 **Modular**: Flexible component architecture
- 🎨 **Theming**: Built-in dark/light theme support

## Installation

```bash
npm install better-admin better-query
# or
pnpm add better-admin better-query
# or
yarn add better-admin better-query
```

## Quick Start

### 1. Setup Better Query

First, set up your Better Query instance:

```typescript
// lib/query.ts
import { betterQuery, createResource, withId } from "better-query";
import { z } from "zod";

// Define your schemas
const userSchema = withId({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  role: z.enum(["admin", "user"]).default("user"),
  createdAt: z.date().default(() => new Date()),
});

const postSchema = withId({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  authorId: z.string(),
  published: z.boolean().default(false),
  createdAt: z.date().default(() => new Date()),
});

// Create your query instance
export const query = betterQuery({
  basePath: "/api/query",
  database: { 
    provider: "sqlite", 
    url: "data.db", 
    autoMigrate: true 
  },
  resources: [
    createResource({
      name: "user",
      schema: userSchema,
      permissions: {
        create: () => true,
        read: () => true,
        update: () => true,
        delete: () => true,
        list: () => true,
      },
    }),
    createResource({
      name: "post",
      schema: postSchema,
      permissions: {
        create: () => true,
        read: () => true,
        update: () => true,
        delete: () => true,
        list: () => true,
      },
    }),
  ],
});
```

### 2. Create Your Admin App

```typescript
// app.tsx
import {
  Admin,
  Resource,
  List,
  Create,
  Edit,
  Show,
  createBetterQueryProvider,
} from "better-admin";
import { UserList, UserCreate, UserEdit, UserShow } from "./users";
import { PostList, PostCreate, PostEdit, PostShow } from "./posts";

// Create the data provider
const dataProvider = createBetterQueryProvider({
  baseUrl: "/api/query",
});

function App() {
  return (
    <Admin dataProvider={dataProvider}>
      <Resource
        name="user"
        list={UserList}
        create={UserCreate}
        edit={UserEdit}
        show={UserShow}
      />
      <Resource
        name="post"
        list={PostList}
        create={PostCreate}
        edit={PostEdit}
        show={PostShow}
      />
    </Admin>
  );
}

export default App;
```

### 3. Create Resource Components

```typescript
// users.tsx
import {
  List,
  Create,
  Edit,
  Show,
  SimpleForm,
  SimpleShowLayout,
  DataTable,
  TextField,
  TextInput,
  SelectInput,
  BooleanField,
  DateField,
} from "better-admin";

export const UserList = () => (
  <List>
    <DataTable>
      <TextField source="name" />
      <TextField source="email" />
      <TextField source="role" />
      <DateField source="createdAt" />
    </DataTable>
  </List>
);

export const UserCreate = () => (
  <Create>
    <SimpleForm>
      <TextInput source="name" required />
      <TextInput source="email" type="email" required />
      <SelectInput 
        source="role" 
        choices={[
          { id: "user", name: "User" },
          { id: "admin", name: "Admin" },
        ]} 
      />
    </SimpleForm>
  </Create>
);

export const UserEdit = () => (
  <Edit>
    <SimpleForm>
      <TextInput source="name" required />
      <TextInput source="email" type="email" required />
      <SelectInput 
        source="role" 
        choices={[
          { id: "user", name: "User" },
          { id: "admin", name: "Admin" },
        ]} 
      />
    </SimpleForm>
  </Edit>
);

export const UserShow = () => (
  <Show>
    <SimpleShowLayout>
      <TextField source="name" />
      <TextField source="email" />
      <TextField source="role" />
      <DateField source="createdAt" />
    </SimpleShowLayout>
  </Show>
);
```

### 4. API Routes (Next.js Example)

```typescript
// app/api/query/[...query]/route.ts
import { query } from "@/lib/query";

export const GET = query.handler;
export const POST = query.handler;
export const PUT = query.handler;
export const PATCH = query.handler;
export const DELETE = query.handler;
```

## Better Auth Integration

Better Admin includes built-in support for Better Auth:

```typescript
// lib/auth.ts
import { betterAuth } from "better-auth";

export const auth = betterAuth({
  database: { provider: "sqlite", url: "auth.db" },
  secret: process.env.BETTER_AUTH_SECRET!,
  emailAndPassword: { enabled: true },
});

// app.tsx
import { authProvider } from "better-admin";

function App() {
  return (
    <Admin 
      dataProvider={dataProvider}
      authProvider={authProvider}
    >
      {/* resources */}
    </Admin>
  );
}
```

## Components

### Core Components

- `Admin` - Main admin app wrapper
- `Resource` - Defines a resource with CRUD operations
- `List` - List view for resources
- `Create` - Create form for resources
- `Edit` - Edit form for resources
- `Show` - Detail view for resources

### UI Components

All UI components are built directly on Radix UI primitives:

- `Button`, `Input`, `Select`, `Checkbox`, `Switch`
- `Dialog`, `Popover`, `Tooltip`, `DropdownMenu`
- `Card`, `Table`, `Avatar`, `Badge`
- `NavigationMenu`, `Sidebar`, `Breadcrumb`

### Layout Components

- `Layout` - Main layout with sidebar navigation
- `LoginPage` - Customizable login page
- `ThemeProvider` - Theme management

## Theming

Better Admin includes built-in theme support with CSS variables:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 222.2 47.4% 11.2%;
  --primary-foreground: 210 40% 98%;
  /* ... */
}

[data-theme="dark"] {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  /* ... */
}
```

## Advanced Usage

### Custom Data Provider

```typescript
import { createBetterQueryProvider } from "better-admin";

const dataProvider = createBetterQueryProvider({
  baseUrl: "/api/query",
  resources: ["user", "post", "comment"],
});
```

### Custom Components

```typescript
import { List, DataTable, TextField } from "better-admin";

const CustomUserList = () => (
  <List>
    <DataTable>
      <TextField source="name" label="Full Name" />
      <TextField source="email" />
      <CustomField source="status" />
    </DataTable>
  </List>
);
```

## Comparison with shadcn-admin-kit

Better Admin provides similar functionality to shadcn-admin-kit but with key improvements:

- **Direct Radix UI integration**: No dependency on shadcn/ui for better flexibility
- **Better Query integration**: Purpose-built for Better Query's API patterns  
- **Better Auth integration**: Seamless authentication workflow
- **TypeScript-first**: Full type safety throughout the stack
- **Modular architecture**: Use only the components you need

## Contributing

Contributions are welcome! Please read our contributing guide and submit PRs to help improve Better Admin.

## License

MIT License