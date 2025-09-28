# Todo App - Express.js + Better Query

A professional todo application demonstrating Better Query integration with Express.js and modern web technologies.

## Features

- ✅ **Full CRUD Operations**: Create, Read, Update, Delete todos
- 📊 **Live Statistics**: Real-time dashboard with todo metrics
- 🔍 **Advanced Filtering**: All, Pending, Completed filters with counters
- 🎯 **Priority System**: Visual priority indicators (High, Medium, Low)
- 🏷️ **Categories**: Organize todos with custom categories
- 📅 **Due Dates**: Set optional due dates for todos
- ✨ **Professional UI**: Gradient design with hover effects
- 🔄 **Real-time Updates**: Instant UI updates with Alpine.js
- 🗃️ **SQLite Database**: Persistent storage with auto-migration
- 📱 **Responsive Design**: Mobile-first responsive layout

## Quick Start

1. **Install dependencies (preferred: pnpm workspace)**:
   ```bash
   # From the repository root
   pnpm install
   
   # OR, if you prefer npm, install dependencies for this example only
   cd dev/express-todo
   npm install
   ```

   Note: This repository uses pnpm workspaces. Using pnpm from the repo root ensures workspace packages (e.g. `packages/better-query`) are linked correctly.

2. **Install system dependencies for SQLite native build (Linux / Debian/Ubuntu)**:
   ```bash
   sudo apt-get update && sudo apt-get install -y build-essential python3 libsqlite3-dev pkg-config
   ```

   If you're on another Linux distribution, install your platform's equivalents. If you are using Node 22 and encounter missing prebuilt binaries, consider switching to an LTS Node (18 or 20) via nvm.

3. **Start the server (from example directory)**:
   ```bash
   cd dev/express-todo
   pnpm run dev
   # or with npm if you installed dependencies locally
   npm run dev
   ```

4. **Open your browser:**
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
- `GET /api/health` - Health check endpoint

## Project Structure

```
express-todo/
├── server.js          # Express server with Better Query integration
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

1. **Resource Creation**: Schema-driven resource definition with lifecycle hooks
2. **Auto-generated Endpoints**: Full CRUD API generated automatically
3. **Type Safety**: Zod schema validation for all operations
4. **Database Integration**: SQLite with auto-migration
5. **Express Integration**: Proper middleware handling and CORS configuration
6. **Lifecycle Hooks**: afterCreate and afterDelete hooks for logging

## Express Integration Details

### Request/Response Conversion

The Express integration includes a custom handler to convert Express req/res to Web API Request/Response:

```javascript
const toNodeHandler = (handler) => async (req, res) => {
  const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
  const request = new Request(url, {
    method: req.method,
    headers: req.headers,
    body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined,
  });

  const response = await handler(request);
  // Handle response conversion...
};
```

### CORS Configuration

```javascript
app.use(cors({
  origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
  credentials: true,
}));
```

### Middleware Ordering

Important: Better Query handler is mounted **before** `express.json()` to avoid conflicts:

```javascript
// Mount Better Query first
app.all("/api/query/*", toNodeHandler(query.handler));

// Then use express.json() for other routes
app.use((req, res, next) => {
  if (!req.path.startsWith('/api/query/')) {
    express.json()(req, res, next);
  } else {
    next();
  }
});
```

## Frontend Technology Stack

- **Alpine.js**: Lightweight reactive framework for interactivity
- **Tailwind CSS**: Utility-first CSS framework for styling
- **Modern Vanilla JS**: ES6+ features for API communication

## Statistics Dashboard

The interface includes a live statistics dashboard:
- Total todos count
- Completed todos count
- Pending todos count

## Advanced Features

### Lifecycle Hooks

```javascript
hooks: {
  afterCreate: async (context) => {
    console.log(`✅ Todo created: "${context.result.title}"`);
  },
  afterDelete: async (context) => {
    console.log(`🗑️ Todo deleted: ID ${context.id}`);
  },
}
```

### Error Handling

Comprehensive error handling with user-friendly messages:
- API connection failures
- Validation errors
- Network timeouts

## Customization

### Adding New Fields

Extend the todo schema in `query.js`:

```javascript
const todoSchema = withId({
  // ... existing fields
  assignedTo: z.string().optional(),
  tags: z.array(z.string()).default([]),
  estimatedHours: z.number().optional(),
});
```

### Adding New Endpoints

Create custom endpoints alongside Better Query:

```javascript
app.get('/api/todos/stats', async (req, res) => {
  const client = await getBetterQueryClient();
  const todos = await client.todo.list();
  
  const stats = {
    total: todos.data.length,
    completed: todos.data.filter(t => t.completed).length,
    // ... more stats
  };
  
  res.json(stats);
});
```

## Deployment

### Production Configuration

```bash
# Set environment variables
export NODE_ENV=production
export PORT=3000

# Start server
npm start
```

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## Next Steps

- Add user authentication with Better Auth
- Implement WebSocket for real-time updates
- Add todo templates and recurring tasks
- Create mobile app using the same API
- Add file upload functionality
- Implement team collaboration features

This example demonstrates the flexibility and power of Better Query for building production-ready REST APIs with Express.js, while maintaining clean code architecture and excellent developer experience.