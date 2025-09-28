# Todo App with Better Query & Better Auth

A modern, full-stack todo application demonstrating the power of **Better Query** with **Better Auth** integration. This example showcases authentication, role-based permissions, and secure CRUD operations.

## Features

### 🔐 Authentication & Authorization
- **User Registration & Login** with email/password
- **Role-based Access Control** (Admin/User roles)  
- **Session Management** with Better Auth
- **Protected Routes** and API endpoints

### 📝 Todo Management
- **User-Scoped Todos** - Users only see their own todos
- **Admin Privileges** - Admins can manage all todos
- **Full CRUD Operations** (Create, Read, Update, Delete)
- **Rich Todo Properties**: Priority, Category, Due Dates, Tags

### 🏗️ Architecture Highlights
- **Better Query** for type-safe CRUD operations
- **Better Auth Plugin** for seamless auth integration
- **Zod Validation** with React Hook Form
- **Permission-based Filtering** at the database level
- **Auto-generated API Endpoints** with authentication middleware

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm/yarn/pnpm

### Installation

1. **Clone and Navigate**
   ```bash
   git clone <repo-url>
   cd dev/next-todo
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **Open Application**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Demo vs. Production Setup

### Current Demo Status
This example currently runs in **demo mode** to showcase Better Query's core functionality without requiring external dependencies. The authentication components are included to demonstrate the integration patterns.

### What Works in Demo Mode
- ✅ Full CRUD operations for todos
- ✅ Type-safe Better Query integration
- ✅ Form validation with React Hook Form
- ✅ Responsive UI with Tailwind CSS
- ✅ SQLite database with auto-migration
- ✅ Authentication UI components (for demonstration)

### What Requires Full Better Auth Setup
- 🔐 Actual user authentication and sessions
- 🔐 Role-based access control
- 🔐 User-scoped data filtering
- 🔐 Protected API endpoints
- 🔐 Session management

### Full Better Auth Integration
To enable complete authentication functionality:

1. **Install Better Auth**
   ```bash
   npm install better-auth@latest
   ```

2. **Uncomment Integration Code**
   - In `lib/auth.ts`: Replace mock implementation with real Better Auth
   - In `lib/auth-client.ts`: Use real Better Auth React client
   - In `lib/query.ts`: Enable the Better Auth plugin
   - In `components/TodoApp.tsx`: Enable authentication checks

3. **Environment Setup**
   ```bash
   cp .env.example .env.local
   ```
   Update the `BETTER_AUTH_SECRET` with a secure key.

4. **Database Migration**
   Better Auth will automatically create its tables on first run.

## Authentication Demo

### Demo Accounts
For testing, you can create these accounts or use the sign-up form:

- **Admin User**: 
  - Email: `admin@example.com`
  - Password: `password123`
  - Can manage all todos across all users

- **Regular User**: 
  - Email: `user@example.com` 
  - Password: `password123`
  - Can only manage their own todos

### Creating New Accounts
Use the sign-up form to create new accounts. All new users get the "user" role by default.

## Architecture Deep Dive

### Better Auth Integration

The app uses the **Better Auth plugin** for Better Query to provide seamless authentication:

```typescript
// lib/query.ts
import { betterAuth as betterAuthPlugin } from "better-query/plugins";
import { auth } from "./auth";

export const query = betterQuery({
  plugins: [
    betterAuthPlugin({
      auth, // Better Auth instance
      rolePermissions: {
        admin: {
          resources: ["*"],
          operations: ["create", "read", "update", "delete", "list"],
        },
        user: {
          resources: ["todo"],
          operations: ["create", "read", "update", "delete", "list"],
        }
      },
    })
  ],
  resources: [todoResource],
});
```

### Permission System

The todo resource uses **function-based permissions** that check user authentication and ownership:

```typescript
const todoResource = createResource({
  name: "todo",
  schema: todoSchema,
  permissions: {
    create: async (context) => !!context.user,
    read: async (context) => {
      if (!context.user) return false;
      if (context.user.role === "admin") return true;
      return context.existingData?.userId === context.user.id;
    },
    update: async (context) => {
      if (!context.user) return false;
      if (context.user.role === "admin") return true;
      return context.existingData?.userId === context.user.id;
    },
    delete: async (context) => {
      if (!context.user) return false;
      if (context.user.role === "admin") return true;
      return context.existingData?.userId === context.user.id;
    },
    list: async (context) => !!context.user,
  },
});
```

### Data Scoping with Hooks

The `beforeList` hook automatically filters todos by user ownership:

```typescript
hooks: {
  beforeList: async (context) => {
    // Non-admins only see their own todos
    if (context.user && context.user.role !== "admin") {
      context.query = context.query || {};
      context.query.where = {
        ...context.query.where,
        userId: context.user.id,
      };
    }
  },
  beforeCreate: async (context) => {
    // Auto-assign user ID to new todos
    if (context.user) {
      context.data.userId = context.user.id;
      context.data.createdBy = context.user.name || context.user.email;
    }
  },
}
```

### Client-Side Authentication

The client uses a custom `useAuth` hook for authentication state management:

```typescript
// hooks/useAuth.ts
export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    isLoading: true,
    error: null,
  });

  // Sign in, sign up, sign out methods
  // Automatic session checking
  // Error handling
}
```

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/[...all]/     # Better Auth API routes
│   │   └── query/[...any]/    # Better Query API routes
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── AuthForm.tsx          # Login/Register form
│   └── TodoApp.tsx           # Main todo interface
├── hooks/
│   ├── useAuth.ts            # Authentication hook
│   └── useTodos.ts           # Todo management hook
└── lib/
    ├── auth.ts               # Better Auth configuration
    ├── auth-client.ts        # Client-side auth setup
    ├── client.ts             # Better Query client
    └── query.ts              # Server-side query setup
```

## Key Learning Points

### 1. **Seamless Integration**
Better Auth integrates naturally with Better Query through plugins, providing automatic user context in permissions and hooks.

### 2. **Type-Safe Authentication**
Full TypeScript support for user objects, sessions, and authentication state throughout the application.

### 3. **Permission-Driven Architecture**  
Permissions are evaluated at the resource level, ensuring consistent security across all endpoints.

### 4. **Database-Level Security**
User scoping happens in hooks and permissions, ensuring data isolation at the database query level.

### 5. **Developer Experience**
Minimal configuration required - just add the plugin and define permissions. Everything else is handled automatically.

## Security Features

- **Automatic Session Validation** on every API request
- **Role-Based Access Control** with granular permissions
- **Data Isolation** between users (non-admins can't access others' data)
- **Password Hashing** with bcrypt  
- **CSRF Protection** built into Better Auth
- **Secure Cookie Handling** with HTTP-only flags

## Next Steps

This example demonstrates core authentication concepts. You can extend it with:

- **Email Verification** workflow
- **Password Reset** functionality  
- **Social Authentication** (GitHub, Google, etc.)
- **Multi-tenant** organization support
- **Advanced Role Management** with custom permissions
- **Audit Logging** of user actions

## Learn More

- [Better Query Documentation](https://armelgeek.github.io/better-kit)
- [Better Auth Documentation](https://better-auth.com)
- [Better Auth Plugin Guide](https://armelgeek.github.io/better-kit/docs/plugins/better-auth)