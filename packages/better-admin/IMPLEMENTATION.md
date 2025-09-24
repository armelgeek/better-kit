# Better Admin Implementation

This implementation creates a comprehensive admin library similar to shadcn-admin-kit but with key improvements:

## Key Features

### 🎯 **Direct Radix UI Integration**
- All UI components use Radix UI primitives directly without shadcn/ui dependency
- Greater flexibility and customization
- Better portability across projects

### 🔗 **Better Query Integration** 
- `createBetterQueryProvider()` function that maps to Better Query's REST API patterns
- Supports all CRUD operations (create, read, update, delete, list)
- Handles pagination, filtering, sorting, and relationships

### 🔐 **Better Auth Integration**
- `createBetterAuthProvider()` for seamless authentication
- Compatible with Better Auth's session management
- Supports login, logout, session checks, and user identity

### 📱 **Component Architecture**

#### Core Admin Components:
- `Admin` - Main admin wrapper (uses ra-core)
- `Resource` - Resource definition component
- `List`, `Create`, `Edit`, `Show` - CRUD operation components

#### Simple Components (Standalone):
- `SimpleAdmin` - Lightweight admin wrapper without external dependencies
- `SimpleResource` - Basic resource component
- `SimpleList` - List view component
- `SimpleDataTable` - Data table with built-in rendering
- `SimpleTextField` - Basic field component

#### UI Components (Radix UI):
- All components from the shadcn component collection but using Radix directly
- `Button`, `Card`, `Dialog`, `Dropdown`, `Table`, etc.
- Complete theming system with CSS variables

## Usage Examples

### Basic Setup
```typescript
import { Admin, Resource, List, createBetterQueryProvider } from "better-admin";

const dataProvider = createBetterQueryProvider({
  baseUrl: "/api/query",
});

function App() {
  return (
    <Admin dataProvider={dataProvider}>
      <Resource name="user" list={UserList} />
      <Resource name="post" list={PostList} />
    </Admin>
  );
}
```

### Standalone Usage (No ra-core dependency)
```typescript
import { SimpleAdmin, SimpleList, SimpleDataTable, SimpleTextField } from "better-admin";

const UserList = () => (
  <SimpleList title="Users">
    <SimpleDataTable data={users}>
      <SimpleTextField source="name" />
      <SimpleTextField source="email" />
    </SimpleDataTable>
  </SimpleList>
);

function App() {
  return (
    <SimpleAdmin title="My Admin">
      <UserList />
    </SimpleAdmin>
  );
}
```

## Integration with Better Query

### Backend Setup (better-query)
```typescript
import { betterQuery, createResource, withId } from "better-query";
import { z } from "zod";

const userSchema = withId({
  name: z.string().min(1),
  email: z.string().email(),
  role: z.enum(["admin", "user"]),
});

export const query = betterQuery({
  basePath: "/api/query",
  database: { provider: "sqlite", url: "data.db" },
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
  ],
});
```

### Data Provider Integration
The `createBetterQueryProvider` automatically handles:
- REST API endpoints (`GET /api/query/user`, `POST /api/query/user`, etc.)
- Pagination with `page` and `limit` parameters
- Sorting with `sort` and `order` parameters
- Filtering with query parameters
- Relationships and nested data

## Benefits vs shadcn-admin-kit

1. **Better Integration**: Purpose-built for Better Query's API patterns
2. **More Flexible**: Direct Radix UI usage without shadcn/ui constraints  
3. **Better Auth**: Native integration with Better Auth
4. **TypeScript First**: Full type safety throughout the stack
5. **Modular**: Use individual components or full admin suite
6. **Portable**: No dependencies on specific UI frameworks

## File Structure

```
packages/better-admin/
├── components/
│   ├── admin/           # Full-featured admin components (uses ra-core)
│   ├── simple/          # Lightweight standalone components
│   └── ui/              # Radix UI-based components
├── lib/
│   ├── dataProvider.ts  # Better Query integration
│   └── authProvider.ts  # Better Auth integration
├── examples/
│   ├── basic-usage.tsx       # Basic ra-core based example
│   ├── advanced-usage.tsx    # Advanced features example
│   ├── better-query-setup.ts # Backend setup example
│   └── demo.tsx             # Standalone demo
└── README.md
```

## Next Steps

To complete the implementation:

1. **Install Dependencies**: Add all required Radix UI packages and peer dependencies
2. **Build System**: Configure tsup to build all entry points properly
3. **Testing**: Add comprehensive test suite
4. **Documentation**: Create detailed component documentation
5. **Examples**: Build working demo applications
6. **Integration Tests**: Test with actual Better Query and Better Auth instances

This implementation provides a solid foundation for a flexible, powerful admin interface that integrates seamlessly with the Better Kit ecosystem.