# Next.js Demo: Better Query with Drizzle & Prisma Relationships

This is a comprehensive demonstration of **Better Query** with both **Drizzle ORM** and **Prisma ORM**, showcasing various relationship types including:

- ✅ **hasMany** (One-to-Many relationships)
- ✅ **belongsTo** (Many-to-One relationships)  
- ✅ **belongsToMany** (Many-to-Many relationships with junction tables)
- ✅ **Self-referential** (Recursive relationships)

## 🎯 What This Demo Shows

This application demonstrates the same data model implemented with two different ORMs:

1. **Drizzle ORM** - Type-safe, SQL-like ORM
2. **Prisma ORM** - Next-generation ORM with intuitive schema

Both implementations use **Better Query** to provide a consistent, type-safe CRUD API.

## 📊 Data Model

### Entities

- **User** - Application users with roles
- **Project** - Containers for organizing todos  
- **Todo** - Main task entity with multiple relationships
- **Priority** - Priority levels (1-5)
- **Tag** - Labels for categorizing todos
- **Comment** - User comments on todos
- **TodoTag** - Junction table for Todo ↔ Tag many-to-many relationship

### Relationships

| Type | Example | Description |
|------|---------|-------------|
| **hasMany** | User → Todos | One user has many todos |
| | User → Projects | One user has many projects |
| | Project → Todos | One project has many todos |
| | Todo → Comments | One todo has many comments |
| **belongsTo** | Todo → User | Each todo belongs to one user |
| | Todo → Project | Each todo belongs to one project |
| | Todo → Priority | Each todo has one priority |
| | Comment → Todo | Each comment belongs to one todo |
| **belongsToMany** | Todo ↔ Tags | Todos can have many tags, tags can be on many todos |
| **Self-referential** | Todo → Subtasks | Todos can have child todos (subtasks) |

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ or Bun
- npm, pnpm, or yarn

### Installation

```bash
# Install dependencies
npm install

# For Prisma: Generate the Prisma Client
npm run db:prisma:generate

# For Prisma: Push schema to database
npm run db:prisma:push
```

### Development

```bash
# Start the development server
npm run dev

# Visit http://localhost:3005
```

The application will be available at **http://localhost:3005**

## 📁 Project Structure

```
next-demo-relations/
├── app/
│   ├── api/
│   │   ├── drizzle/[...any]/    # Drizzle API endpoints
│   │   │   └── route.ts
│   │   └── prisma/[...any]/     # Prisma API endpoints
│   │       └── route.ts
│   ├── drizzle/                 # Drizzle demo page
│   │   └── page.tsx
│   ├── prisma/                  # Prisma demo page
│   │   └── page.tsx
│   ├── layout.tsx
│   ├── page.tsx                 # Home page
│   └── globals.css
├── lib/
│   ├── schema/
│   │   └── drizzle.ts          # Drizzle schema definition
│   ├── query-drizzle.ts        # Better Query with Drizzle
│   └── query-prisma.ts         # Better Query with Prisma
├── prisma/
│   └── schema.prisma           # Prisma schema definition
├── package.json
├── tsconfig.json
└── README.md
```

## 🔧 API Endpoints

### Drizzle API

All Drizzle endpoints are prefixed with `/api/drizzle/`:

- `GET /api/drizzle/user/list` - List all users
- `POST /api/drizzle/user/create` - Create a user
- `GET /api/drizzle/user/:id` - Get a user by ID
- `PATCH /api/drizzle/user/update` - Update a user
- `DELETE /api/drizzle/user/delete` - Delete a user

And similarly for: `todo`, `project`, `priority`, `tag`, `comment`

### Prisma API

All Prisma endpoints are prefixed with `/api/prisma/`:

- `GET /api/prisma/user/list` - List all users
- `POST /api/prisma/user/create` - Create a user
- `GET /api/prisma/user/:id` - Get a user by ID
- `PATCH /api/prisma/user/update` - Update a user
- `DELETE /api/prisma/user/delete` - Delete a user

And similarly for: `todo`, `project`, `priority`, `tag`, `comment`

## 💡 Usage Examples

### Create a User (Drizzle)

```bash
curl -X POST http://localhost:3005/api/drizzle/user/create \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "name": "John Doe",
    "role": "user"
  }'
```

### Create a Todo with Relationships (Drizzle)

```bash
curl -X POST http://localhost:3005/api/drizzle/todo/create \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Complete documentation",
    "description": "Write comprehensive README",
    "userId": "user-id-here",
    "projectId": "project-id-here",
    "priorityId": "priority-id-here",
    "completed": false
  }'
```

### List Todos (Prisma)

```bash
curl http://localhost:3005/api/prisma/todo/list
```

## 📚 Code Examples

### Drizzle Schema Definition

```typescript
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

export const users = sqliteTable('user', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  role: text('role').notNull().default('user'),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull(),
});

export const todos = sqliteTable('todo', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  userId: text('userId').notNull().references(() => users.id),
  // ... more fields
});

export const usersRelations = relations(users, ({ many }) => ({
  todos: many(todos),
}));

export const todosRelations = relations(todos, ({ one }) => ({
  user: one(users, { 
    fields: [todos.userId], 
    references: [users.id] 
  }),
}));
```

### Prisma Schema Definition

```prisma
model User {
  id        String    @id @default(cuid())
  email     String    @unique
  name      String
  role      String    @default("user")
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  
  todos     Todo[]
  projects  Project[]
}

model Todo {
  id          String    @id @default(cuid())
  title       String
  userId      String
  completed   Boolean   @default(false)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  user     User      @relation(fields: [userId], references: [id])
  comments Comment[]
}
```

### Better Query Resource Definition

Both Drizzle and Prisma use the same Better Query resource definition:

```typescript
const todoResource = createResource({
  name: 'todo',
  schema: todoSchema,
  relationships: {
    user: { 
      type: 'belongsTo', 
      target: 'user', 
      foreignKey: 'userId' 
    },
    project: { 
      type: 'belongsTo', 
      target: 'project', 
      foreignKey: 'projectId' 
    },
    subtasks: { 
      type: 'hasMany', 
      target: 'todo', 
      foreignKey: 'parentId' 
    },
    tags: { 
      type: 'belongsToMany', 
      target: 'tag', 
      through: 'todo_tags',
      foreignKey: 'todoId',
      targetKey: 'tagId'
    },
  },
});
```

## 🎨 Features Demonstrated

### Drizzle Implementation (`/drizzle`)

- ✅ Type-safe schema definition with Drizzle
- ✅ Relational queries using Drizzle relations
- ✅ Better Query integration with Drizzle adapter
- ✅ All relationship types working

### Prisma Implementation (`/prisma`)

- ✅ Intuitive schema definition with Prisma
- ✅ Auto-generated type-safe client
- ✅ Better Query integration with Prisma adapter
- ✅ All relationship types working

### Common Features

- ✅ Full CRUD operations for all entities
- ✅ Type-safe API endpoints
- ✅ Automatic validation with Zod
- ✅ Auto-migration support
- ✅ Clean, modern UI with Tailwind CSS

## 🔍 Testing the Application

### Using the UI

1. Visit http://localhost:3005
2. Click on "View Drizzle Demo" or "View Prisma Demo"
3. Explore the tabs:
   - **Overview**: Learn about features and relationships
   - **Code Examples**: See implementation details
   - **API Testing**: Test endpoints directly

### Using curl

Test the API endpoints directly with curl:

```bash
# List users (Drizzle)
curl http://localhost:3005/api/drizzle/user/list

# Create a user (Prisma)
curl -X POST http://localhost:3005/api/prisma/user/create \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"Test User","role":"user"}'

# List todos (Drizzle)
curl http://localhost:3005/api/drizzle/todo/list
```

## 📖 Learn More

### About Better Query

Better Query is a type-safe CRUD API generator that provides:

- 🎯 Automatic endpoint generation
- 🔒 Type safety end-to-end
- 🔗 Relationship management
- ✅ Built-in validation
- 🔌 Plugin system
- 📊 Multiple ORM support

### About Drizzle ORM

Drizzle ORM is a lightweight, type-safe ORM for TypeScript:

- [Drizzle Documentation](https://orm.drizzle.team/)
- [Drizzle GitHub](https://github.com/drizzle-team/drizzle-orm)

### About Prisma ORM

Prisma is a next-generation ORM for Node.js and TypeScript:

- [Prisma Documentation](https://www.prisma.io/docs)
- [Prisma GitHub](https://github.com/prisma/prisma)

## 🤝 Contributing

This is a demonstration application. Feel free to use it as a reference for your own projects!

## 📝 License

This demo is part of the Better Query project. See the main project for license information.

## 🙋‍♂️ Need Help?

- Check the Better Query documentation
- Open an issue on GitHub
- Review the code examples in this demo

---

**Happy coding with Better Query!** 🚀
