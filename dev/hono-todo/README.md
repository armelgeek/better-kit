# Todo App - Hono + Better Query

A simple and elegant todo application demonstrating Better Query integration with Hono.js.

## Features

- ✅ **Full CRUD Operations**: Create, Read, Update, Delete todos
- 🎯 **Priority System**: Low, Medium, High priority levels  
- 🏷️ **Categories**: Organize todos with custom categories
- 📅 **Due Dates**: Set optional due dates for todos
- ✨ **Modern UI**: Clean, responsive interface with Tailwind CSS
- 🔄 **Real-time Updates**: Instant UI updates with Alpine.js
- 🗃️ **SQLite Database**: Persistent storage with auto-migration

## Quick Start

1. **Install dependencies:**
   ```bash
   cd examples/todo-examples/hono-todo
   npm install  # or pnpm install
   ```

2. **Start the server:**
   ```bash
   npm run dev
   ```

3. **Open your browser:**
   ```
   http://localhost:3000
   ```

## API Endpoints

The Better Query integration automatically provides these REST endpoints:

- `GET /api/query/todo/list` - List all todos
- `POST /api/query/todo/create` - Create a new todo
- `GET /api/query/todo/read/:id` - Get a specific todo
- `PUT /api/query/todo/update/:id` - Update a todo
- `DELETE /api/query/todo/delete/:id` - Delete a todo

## Project Structure

```
hono-todo/
├── server.js          # Hono server with Better Query integration
├── query.js          # Better Query configuration and schema
├── package.json      # Dependencies and scripts
└── README.md         # This file
```

## Todo Schema

```javascript
const todoSchema = withId({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  completed: z.boolean().default(false),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  category: z.string().optional(),
  dueDate: z.date().optional(),
});
```

## Key Better Query Features Demonstrated

1. **Resource Creation**: Simple schema-driven resource definition
2. **Auto-generated Endpoints**: Full CRUD API generated automatically  
3. **Type Safety**: Zod schema validation for all operations
4. **Database Integration**: SQLite with auto-migration
5. **Permission System**: Configurable access control per operation
6. **Framework Integration**: Seamless Hono.js integration

## Customization

### Adding New Fields

Modify the `todoSchema` in `query.js`:

```javascript
const todoSchema = withId({
  // ... existing fields
  tags: z.array(z.string()).default([]),
  estimatedHours: z.number().optional(),
});
```

### Adding Permissions

Update the resource permissions in `query.js`:

```javascript
const todoResource = createResource({
  name: "todo",
  schema: todoSchema,
  permissions: {
    create: (user) => !!user, // Only authenticated users
    // ... other permissions
  },
});
```

## Next Steps

- Add user authentication with Better Auth
- Implement todo sharing and collaboration
- Add file attachments to todos
- Create mobile app using the same API

This example showcases the power and simplicity of Better Query for building type-safe, full-featured APIs with minimal code.