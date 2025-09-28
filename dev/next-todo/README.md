# Todo App - Next.js + Better Query

A modern, full-featured todo application showcasing Better Query integration with Next.js App Router.

## Features

- ✅ **Full CRUD Operations**: Create, Read, Update, Delete todos
- ⚡ **Server Actions**: Next.js App Router with Better Query integration
- 🎯 **Priority System**: Low, Medium, High priority levels
- 🏷️ **Categories**: Organize todos with custom categories
- 📅 **Due Dates**: Set optional due dates for todos
- 🏷️ **Tags**: Add multiple tags to organize todos
- ✨ **Modern UI**: Clean, responsive interface with Tailwind CSS
- 🔄 **Real-time Updates**: Instant UI updates with React hooks
- 🗃️ **SQLite Database**: Persistent storage with auto-migration
- 📱 **Responsive Design**: Works perfectly on mobile and desktop

## Quick Start

1. **Install dependencies:**
   ```bash
   cd examples/todo-examples/next-todo
   npm install  # or pnpm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```

3. **Open your browser:**
   ```
   http://localhost:3000
   ```

## API Endpoints

The Better Query integration automatically provides these REST endpoints:

- `GET /api/query/todo/list` - List all todos with optional pagination
- `POST /api/query/todo/create` - Create a new todo
- `GET /api/query/todo/read/:id` - Get a specific todo
- `PUT /api/query/todo/update/:id` - Update a todo
- `DELETE /api/query/todo/delete/:id` - Delete a todo

## Project Structure

```
next-todo/
├── app/
│   ├── api/query/[...any]/route.ts    # Better Query API routes
│   ├── globals.css                    # Tailwind CSS
│   ├── layout.tsx                     # Root layout
│   └── page.tsx                       # Home page
├── components/
│   └── TodoApp.tsx                    # Main todo component
├── hooks/
│   └── useTodos.ts                    # Custom React hooks for todo operations
├── lib/
│   ├── query.ts                       # Better Query configuration
│   └── client.ts                      # Better Query client setup
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── README.md
```

## Todo Schema

```typescript
const todoSchema = withId({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  completed: z.boolean().default(false),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  category: z.string().optional(),
  dueDate: z.date().optional(),
  tags: z.array(z.string()).default([]),
});
```

## Custom Hooks Usage

```typescript
import { useTodos } from "@/hooks/useTodos";

export default function TodoComponent() {
  const { 
    todos, 
    loading, 
    error, 
    createTodo, 
    updateTodo, 
    deleteTodo, 
    toggleTodo 
  } = useTodos();

  // Component implementation...
}
```

## Key Better Query Features Demonstrated

1. **Resource Creation**: Schema-driven resource definition with hooks
2. **Auto-generated Endpoints**: Full CRUD API generated automatically
3. **Type Safety**: Full TypeScript support with Zod validation
4. **Client Integration**: Type-safe client with React hooks
5. **Database Integration**: SQLite with auto-migration
6. **Server Integration**: Next.js App Router compatibility
7. **Advanced Hooks**: beforeCreate and beforeUpdate lifecycle hooks

## Advanced Features

### Custom Hooks

The todo resource includes lifecycle hooks:

```typescript
hooks: {
  beforeCreate: async (context) => {
    context.data.createdAt = new Date();
    context.data.updatedAt = new Date();
  },
  beforeUpdate: async (context) => {
    context.data.updatedAt = new Date();
  },
}
```

### Type-Safe Client

The client provides full type safety:

```typescript
import { createQueryClient } from "better-query/client";

const queryClient = createQueryClient({
  baseUrl: "/api/query",
});

// Fully typed operations
const todo = await queryClient.todo.create({
  title: "My Todo",
  priority: "high", // TypeScript will enforce valid values
});
```

## Customization

### Adding New Fields

Extend the todo schema in `lib/query.ts`:

```typescript
const todoSchema = withId({
  // ... existing fields
  assignedTo: z.string().optional(),
  estimatedHours: z.number().optional(),
  status: z.enum(["pending", "in-progress", "completed"]).default("pending"),
});
```

### Adding Search

Implement search functionality:

```typescript
const searchTodos = async (query: string) => {
  const result = await queryClient.todo.list({
    search: query,
    searchFields: ["title", "description", "category"]
  });
  return result.data;
};
```

## Next Steps

- Add user authentication with Better Auth
- Implement real-time updates with WebSocket
- Add todo sharing and collaboration features
- Create mobile app using the same API
- Add file attachments to todos
- Implement todo templates and recurring tasks

This example showcases the power of Better Query for building production-ready applications with minimal boilerplate and maximum type safety.