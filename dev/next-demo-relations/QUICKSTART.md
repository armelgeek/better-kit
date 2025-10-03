# 🚀 Quick Start Guide

## Get Started in 3 Minutes

### 1. Navigate to the Demo
```bash
cd dev/next-demo-relations
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Prisma (if using Prisma)
```bash
npm run db:prisma:generate
npm run db:prisma:push
```

### 4. Start the Dev Server
```bash
npm run dev
```

### 5. Open in Browser
```
http://localhost:3005
```

## 📖 What You'll See

### Home Page
- Overview of both Drizzle and Prisma implementations
- Relationship types explained
- Data model visualization
- API endpoint reference

### Drizzle Demo (`/drizzle`)
- Drizzle ORM features and benefits
- Code examples with Drizzle syntax
- API testing interface
- Interactive tabs for exploration

### Prisma Demo (`/prisma`)
- Prisma ORM features and benefits
- Code examples with Prisma syntax
- API testing interface
- Interactive tabs for exploration

## 🧪 Test the APIs

### Using curl

```bash
# Create a user (Drizzle)
curl -X POST http://localhost:3005/api/drizzle/user/create \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"Test User","role":"user"}'

# List users (Drizzle)
curl http://localhost:3005/api/drizzle/user/list

# Create a user (Prisma)
curl -X POST http://localhost:3005/api/prisma/user/create \
  -H "Content-Type: application/json" \
  -d '{"email":"prisma@example.com","name":"Prisma User","role":"user"}'

# List users (Prisma)
curl http://localhost:3005/api/prisma/user/list
```

### Using Browser DevTools

Open the browser console and run:

```javascript
// Create a user with Drizzle
fetch('/api/drizzle/user/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'john@example.com',
    name: 'John Doe',
    role: 'user'
  })
}).then(r => r.json()).then(console.log);

// List all users
fetch('/api/drizzle/user/list')
  .then(r => r.json())
  .then(console.log);
```

## 📚 Key Resources

- **README.md** - Complete documentation
- **IMPLEMENTATION_SUMMARY.md** - Technical details and statistics
- **lib/schema/drizzle.ts** - Drizzle schema with relationships
- **prisma/schema.prisma** - Prisma schema with relationships
- **lib/query-drizzle.ts** - Better Query configuration for Drizzle
- **lib/query-prisma.ts** - Better Query configuration for Prisma

## 🎯 Relationship Examples to Test

### 1. hasMany (One-to-Many)
```bash
# Create a user
curl -X POST http://localhost:3005/api/drizzle/user/create \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","name":"Test User","role":"user"}'

# Create multiple todos for that user
curl -X POST http://localhost:3005/api/drizzle/todo/create \
  -H "Content-Type: application/json" \
  -d '{"title":"Todo 1","userId":"user-id-here","completed":false}'
```

### 2. belongsTo (Many-to-One)
```bash
# List todos and see their user relationship
curl http://localhost:3005/api/drizzle/todo/list
```

### 3. belongsToMany (Many-to-Many)
```bash
# Create a tag
curl -X POST http://localhost:3005/api/drizzle/tag/create \
  -H "Content-Type: application/json" \
  -d '{"name":"Important","color":"red"}'

# Create a todo
curl -X POST http://localhost:3005/api/drizzle/todo/create \
  -H "Content-Type: application/json" \
  -d '{"title":"Tagged Todo","userId":"user-id-here","completed":false}'

# Create junction record
curl -X POST http://localhost:3005/api/drizzle/todo_tags/create \
  -H "Content-Type: application/json" \
  -d '{"todoId":"todo-id-here","tagId":"tag-id-here"}'
```

### 4. Self-referential
```bash
# Create a parent todo
curl -X POST http://localhost:3005/api/drizzle/todo/create \
  -H "Content-Type: application/json" \
  -d '{"title":"Parent Task","userId":"user-id-here","completed":false}'

# Create a subtask
curl -X POST http://localhost:3005/api/drizzle/todo/create \
  -H "Content-Type: application/json" \
  -d '{"title":"Subtask","userId":"user-id-here","parentId":"parent-todo-id","completed":false}'
```

## 🐛 Troubleshooting

### Port Already in Use
If port 3005 is taken, edit `package.json` and change the port:
```json
"dev": "next dev -p 3006"
```

### Database Issues
Delete the database files and restart:
```bash
rm -f *.db *.db-shm *.db-wal
npm run dev
```

### TypeScript Errors
Make sure you're in the correct directory and dependencies are installed:
```bash
cd dev/next-demo-relations
npm install
```

## 💡 Next Steps

1. Explore the UI at http://localhost:3005
2. Check out the code in `lib/` and `app/`
3. Try creating records via the API
4. Compare Drizzle and Prisma implementations
5. Use this as a template for your own projects!

## 🎉 Enjoy!

This demo showcases the power and flexibility of Better Query with both Drizzle and Prisma. Have fun exploring!
