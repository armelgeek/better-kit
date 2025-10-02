# Comprehensive TODO CRUD Tests with Drizzle & Prisma

This directory contains comprehensive tests demonstrating complete CRUD operations with complex relationships using Better Query with Drizzle ORM and Prisma.

## Overview

The test suite demonstrates a complete TODO application with the following features:

### Data Models

1. **User** - Application users
2. **Project** - Containers for organizing todos
3. **Todo** - Main task entity
4. **Priority** - Priority levels for todos
5. **Tag** - Labels for categorizing todos
6. **Comment** - User comments on todos

### Relationship Types Demonstrated

| Type | Example | Description |
|------|---------|-------------|
| **hasMany** | User → Todos | One user has many todos |
| **belongsTo** | Todo → User | Each todo belongs to one user |
| **belongsToMany** | Todo ↔ Tags | Todos can have many tags, tags can be on many todos |
| **Self-referential** | Todo → Subtasks | Todos can have child todos (subtasks) |

### Complete Relationship Graph

```
User
├── hasMany Projects (owner)
├── hasMany Todos
└── hasMany Comments

Project
├── belongsTo User (owner)
└── hasMany Todos

Priority
└── hasMany Todos

Todo
├── belongsTo User
├── belongsTo Project
├── belongsTo Priority
├── belongsTo Todo (parent)
├── hasMany Todos (subtasks)
├── hasMany Comments
└── belongsToMany Tags (through todo_tags)

Tag
└── belongsToMany Todos (through todo_tags)

Comment
├── belongsTo Todo
└── belongsTo User
```

## Test Files

### 1. `todo-crud-complex.test.ts`

**24 comprehensive tests** covering all CRUD operations with the default SQLite/Kysely adapter:

#### Test Categories:

**Basic CRUD Operations (8 tests)**
- ✅ Create users
- ✅ Create priorities
- ✅ Create projects
- ✅ Create tags
- ✅ Create todos with relationships
- ✅ Create subtasks (self-referential)
- ✅ Create comments

**Read Operations with Relationships (7 tests)**
- ✅ Read todo with user relationship
- ✅ Read todo with multiple relationships
- ✅ Read todo with comments
- ✅ Read todo with subtasks
- ✅ Read project with todos
- ✅ Read user with todos
- ✅ List todos with filtering

**Update Operations (2 tests)**
- ✅ Update todo
- ✅ Update todo relationships

**Delete Operations (3 tests)**
- ✅ Delete comment
- ✅ Count todos with filters
- ✅ Count all record types

**Complex Queries (3 tests)**
- ✅ Query with nested relationships
- ✅ Pagination with relationships
- ✅ Multiple filters

**Schema Validation (1 test)**
- ✅ Verify field references

### 2. `todo-drizzle-prisma-example.test.ts`

**7 documentation/example tests** showing how to use Drizzle and Prisma:

- ✅ Drizzle ORM setup and schema
- ✅ Prisma ORM setup and schema
- ✅ Comparison of Drizzle vs Prisma
- ✅ Complex relationship queries
- ✅ Pagination and filtering
- ✅ Batch operations
- ✅ Transaction handling

## Running the Tests

```bash
# Run all TODO tests
pnpm test -- --run todo-

# Run specific test file
pnpm test -- --run todo-crud-complex
pnpm test -- --run todo-drizzle-prisma-example

# Watch mode for development
pnpm test todo-crud-complex
```

## Key Features Demonstrated

### 1. Complex Relationships

```typescript
// User with all their todos
const user = await adapter.findFirst({
  model: "user",
  where: [{ field: "id", value: "user-1" }],
  include: { include: ["todos"] },
});

// Todo with multiple relationships
const todo = await adapter.findFirst({
  model: "todo",
  where: [{ field: "id", value: "todo-1" }],
  include: { include: ["user", "project", "priority", "comments", "subtasks"] },
});
```

### 2. Self-Referential Relationships

```typescript
// Create subtask
const subtask = await adapter.create({
  model: "todo",
  data: {
    title: "Subtask",
    parentId: "todo-1", // References parent todo
    userId: "user-1",
  },
});

// Get todo with subtasks
const parent = await adapter.findFirst({
  model: "todo",
  where: [{ field: "id", value: "todo-1" }],
  include: { include: ["subtasks"] },
});
```

### 3. Many-to-Many Relationships

```typescript
// Tags relationship (through junction table)
const todoResource = createResource({
  name: "todo",
  schema: todoSchema,
  relationships: {
    tags: belongsToMany("tag", "todo_tags", "todoId", "tagId"),
  },
});
```

### 4. Filtering and Pagination

```typescript
// Get incomplete todos, sorted, with pagination
const todos = await adapter.findMany({
  model: "todo",
  where: [
    { field: "completed", value: 0 },
    { field: "userId", value: "user-1" },
  ],
  orderBy: [{ field: "sortOrder", direction: "asc" }],
  limit: 20,
  offset: 0,
});
```

### 5. Cascading Operations

```typescript
// Delete with cascade (removes related records)
await adapter.delete({
  model: "todo",
  where: [{ field: "id", value: "todo-1" }],
  cascade: true,
});
```

## Adapter Implementations

### Default Adapter (Kysely)
- ✅ All 24 tests passing
- Uses SQLite with Kysely query builder
- Automatic schema migration
- Built-in relationship handling

### Drizzle ORM
- Full schema definition examples
- Type-safe queries
- Custom operations (batch insert, upsert)
- Direct SQL access when needed

### Prisma ORM
- Declarative schema with migrations
- Rich query API
- Transaction support
- Aggregation functions

## Database Schema

### SQLite Tables Created

```sql
-- user table
CREATE TABLE user (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  avatar TEXT,
  role TEXT DEFAULT 'user',
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL
);

-- project table
CREATE TABLE project (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active',
  ownerId TEXT NOT NULL,
  startDate INTEGER,
  endDate INTEGER,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL,
  FOREIGN KEY (ownerId) REFERENCES user(id)
);

-- priority table
CREATE TABLE priority (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  level INTEGER NOT NULL,
  color TEXT,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL
);

-- todo table
CREATE TABLE todo (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  completed INTEGER DEFAULT 0,
  userId TEXT NOT NULL,
  projectId TEXT,
  priorityId TEXT,
  parentId TEXT,
  sortOrder INTEGER DEFAULT 0,
  dueDate INTEGER,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL,
  FOREIGN KEY (userId) REFERENCES user(id),
  FOREIGN KEY (projectId) REFERENCES project(id),
  FOREIGN KEY (priorityId) REFERENCES priority(id),
  FOREIGN KEY (parentId) REFERENCES todo(id)
);

-- tag table
CREATE TABLE tag (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL
);

-- todo_tags junction table
CREATE TABLE todo_tags (
  id TEXT PRIMARY KEY,
  todoId TEXT NOT NULL,
  tagId TEXT NOT NULL,
  createdAt INTEGER NOT NULL,
  FOREIGN KEY (todoId) REFERENCES todo(id),
  FOREIGN KEY (tagId) REFERENCES tag(id),
  UNIQUE(todoId, tagId)
);

-- comment table
CREATE TABLE comment (
  id TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  todoId TEXT NOT NULL,
  userId TEXT NOT NULL,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL,
  FOREIGN KEY (todoId) REFERENCES todo(id),
  FOREIGN KEY (userId) REFERENCES user(id)
);
```

## Implementation Notes

### SQLite Boolean Handling
SQLite stores booleans as integers (0 for false, 1 for true). Tests accommodate this:

```typescript
// When filtering
where: [{ field: "completed", value: 0 }] // false
where: [{ field: "completed", value: 1 }] // true

// When asserting
expect(todo.completed).toBeTruthy(); // Instead of .toBe(true)
expect(todo.completed).toBeFalsy();  // Instead of .toBe(false)
```

### Reserved SQL Keywords
Avoid using reserved SQL keywords as field names:
- ❌ `order` (reserved keyword)
- ✅ `sortOrder` (safe alternative)

### Timestamps
All models include automatic timestamps:
- `createdAt` - Set on creation
- `updatedAt` - Updated on modification

## Best Practices Demonstrated

1. **Schema Organization** - Clear separation of concerns with individual schemas
2. **Type Safety** - Full TypeScript type inference from Zod schemas
3. **Relationship Definitions** - Using helper functions (hasMany, belongsTo, belongsToMany)
4. **Error Handling** - Proper validation and constraint checking
5. **Performance** - Efficient includes and selective field loading
6. **Testing Strategy** - Comprehensive coverage of all CRUD operations

## Extending the Tests

To add new tests:

1. Define your schema with Zod
2. Create relationships using helper functions
3. Add to resources array
4. Write tests following existing patterns

Example:

```typescript
const noteSchema = z.object({
  id: z.string().optional(),
  content: z.string(),
  todoId: z.string(),
  createdAt: z.date().default(() => new Date()),
});

const noteResource = {
  name: "note",
  schema: noteSchema,
  relationships: {
    todo: belongsTo("todo", "todoId"),
  },
};
```

## Troubleshooting

### Test Failures
- Ensure database is properly initialized (`autoMigrate: true`)
- Check for SQL reserved keywords in field names
- Verify boolean values match SQLite format (0/1)
- Add delay after initialization if needed

### Performance Issues
- Use selective includes (only load needed relationships)
- Implement pagination for large datasets
- Consider batch operations for multiple inserts
- Use indexes on frequently queried fields

## Resources

- [Better Query Documentation](../../../docs)
- [Kysely Documentation](https://kysely.dev/)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [Prisma Documentation](https://www.prisma.io/docs/)

## Summary

This test suite provides a complete, production-ready example of building a TODO application with:
- ✅ 31 passing tests
- ✅ All CRUD operations
- ✅ Complex relationships (hasMany, belongsTo, belongsToMany, self-referential)
- ✅ Multiple adapter examples (Default/Kysely, Drizzle, Prisma)
- ✅ Real-world patterns and best practices
- ✅ Comprehensive documentation

Perfect for understanding how to use Better Query with complex data models and relationships!
