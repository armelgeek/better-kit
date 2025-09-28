# Better Query Todo Examples

A comprehensive collection of todo applications demonstrating Better Query integration across multiple frameworks and technologies. These examples showcase how Better Query provides a consistent, type-safe API experience regardless of your frontend or backend technology choice.

## 🎯 What You'll Learn

- **Better Query Fundamentals**: Schema definition, resource creation, and CRUD operations
- **Framework Integration**: How Better Query works with different backend frameworks
- **Client Implementation**: Building type-safe frontend clients
- **Modern UI Patterns**: Responsive design and interactive user experiences
- **Database Integration**: Auto-migration and persistent storage
- **API Design**: RESTful endpoint generation and customization

## 📚 Available Examples

### 1. 🔥 **Hono Todo** - Lightweight Backend
**Path:** `examples/todo-examples/hono-todo/`

A minimalist todo application using Hono.js as the backend framework.

**Features:**
- Ultra-fast Hono.js server
- Single-file application with embedded frontend
- Alpine.js for reactive UI
- Clean, elegant interface
- SQLite database with auto-migration

**Best for:** Developers who want a lightweight, fast backend solution.

```bash
cd hono-todo
npm install
npm run dev
# Visit: http://localhost:3000
```

### 2. ⚛️ **Next.js Todo** - Full-Stack React
**Path:** `examples/todo-examples/next-todo/`

A full-featured todo application using Next.js App Router with server-side integration.

**Features:**
- Next.js 14 App Router
- Server-side Better Query integration
- React components with TypeScript
- Custom hooks for state management
- Tailwind CSS styling
- Full type safety end-to-end

**Best for:** React developers building full-stack applications.

```bash
cd next-todo
npm install
npm run dev
# Visit: http://localhost:3000
```

### 3. 🚂 **Express Todo** - Traditional Backend
**Path:** `examples/todo-examples/express-todo/`

A professional todo application using Express.js with comprehensive features.

**Features:**
- Express.js server with CORS
- Professional dashboard interface
- Real-time statistics
- Advanced filtering system
- Lifecycle hooks demonstration
- Production-ready architecture

**Best for:** Developers familiar with Express.js and traditional server setups.

```bash
cd express-todo
npm install
npm run dev
# Visit: http://localhost:3000
```

### 4. 🍦 **Vanilla Todo** - Framework-Free Frontend
**Path:** `examples/todo-examples/vanilla-todo/`

A pure JavaScript frontend that connects to any Better Query backend.

**Features:**
- Zero frontend frameworks
- Auto-detects available backends
- Modern JavaScript (ES6+)
- Responsive Tailwind design
- Real-time statistics dashboard
- Works with any Better Query server

**Best for:** Developers who prefer vanilla JavaScript or want framework flexibility.

```bash
cd vanilla-todo
npm run dev
# Or serve with any static server
# Visit: http://localhost:3000
```

### 5. ⚛️ **React Todo** - Standalone React App
**Path:** `examples/todo-examples/react-todo/`

A sophisticated React application with advanced UI patterns and TypeScript.

**Features:**
- Modern React 18 with hooks
- Vite for lightning-fast development
- Advanced component architecture
- Custom animations and transitions
- Multi-backend compatibility
- Full TypeScript integration

**Best for:** React developers who want to see advanced patterns and component design.

```bash
cd react-todo
npm install
npm run dev
# Visit: http://localhost:3002
```

## 🏗️ Architecture Overview

### Backend Technologies
- **Better Query**: Type-safe CRUD API generation
- **Zod**: Schema validation and type inference  
- **SQLite**: Lightweight database with auto-migration
- **Kysely**: SQL query builder integration

### Frontend Technologies
- **React**: Modern component architecture
- **TypeScript**: Type safety and developer experience
- **Tailwind CSS**: Utility-first styling
- **Alpine.js**: Lightweight reactivity for vanilla JS

### Shared Features
All examples include:
- ✅ Full CRUD operations (Create, Read, Update, Delete)
- 🎯 Priority system (Low, Medium, High)
- 🏷️ Category organization
- 📅 Due date management
- 📊 Real-time statistics
- 🔍 Filtering and search
- 📱 Responsive design
- 🎨 Modern, clean UI

## 🚀 Quick Start Guide

### Option 1: Try Individual Examples
Each example is self-contained and can be run independently:

```bash
# Choose any example
cd examples/todo-examples/[example-name]
npm install
npm run dev
```

### Option 2: Multi-Example Setup
Run multiple examples to see how they interact:

1. **Start a backend** (Hono, Express, or Next.js):
   ```bash
   cd hono-todo && npm run dev
   ```

2. **Start frontend clients** in separate terminals:
   ```bash
   cd vanilla-todo && npm run dev
   cd react-todo && npm run dev
   ```

3. **See them all connect** to the same Better Query API!

## 🎨 UI/UX Highlights

### Design System
- **Color Palette**: Blue and purple gradients with semantic colors
- **Typography**: Modern font stack with clear hierarchy
- **Spacing**: Consistent 4px/8px grid system
- **Animations**: Smooth transitions and micro-interactions
- **Icons**: Lucide React and emoji-based iconography

### Responsive Design
- **Mobile-first**: All interfaces adapt to small screens
- **Tablet optimized**: Improved layouts for medium screens
- **Desktop enhanced**: Full feature set for large displays

### Accessibility
- **Semantic HTML**: Proper heading hierarchy and landmarks
- **Keyboard navigation**: Full keyboard support
- **Screen readers**: ARIA labels and descriptions
- **Color contrast**: WCAG AA compliant color ratios

## 📖 Learning Path

### 1. Start with Basics (Hono Todo)
- Understand Better Query fundamentals
- See schema definition and resource creation
- Learn about auto-generated endpoints

### 2. Explore Full-Stack (Next.js Todo)
- See server-side integration
- Learn about React hooks with Better Query
- Understand type safety end-to-end

### 3. Dive into Backend (Express Todo)
- Learn Express.js integration patterns
- See lifecycle hooks in action
- Understand CORS and middleware setup

### 4. Master Frontend (React Todo)
- Explore advanced React patterns
- See client-side Better Query usage
- Learn about component architecture

### 5. Go Framework-Free (Vanilla Todo)
- Understand core Better Query concepts
- See how to build without frameworks
- Learn about multi-backend compatibility

## 🛠️ Development Tips

### Local Development
```bash
# Install all dependencies
cd examples/todo-examples
find . -name "package.json" -execdir npm install \;

# Start multiple servers
npm run dev --prefix hono-todo &
npm run dev --prefix react-todo &
npm run dev --prefix vanilla-todo &
```

### Database Inspection
Each example creates a SQLite database (`todos.db`) that you can inspect:

```bash
sqlite3 todos.db
.tables
.schema todo
SELECT * FROM todo;
```

### API Testing
Test the Better Query endpoints directly:

```bash
# List todos
curl http://localhost:3000/api/query/todo/list

# Create todo
curl -X POST http://localhost:3000/api/query/todo/create \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Todo","priority":"high"}'
```

## 🔧 Customization Guide

### Adding New Fields
1. **Update the schema** in `query.js/ts`:
   ```javascript
   const todoSchema = withId({
     // ... existing fields
     tags: z.array(z.string()).default([]),
     estimatedHours: z.number().optional(),
   });
   ```

2. **Update the frontend** to handle new fields
3. **Restart the server** to apply schema changes

### Adding Custom Endpoints
```javascript
// In your Better Query configuration
const query = betterQuery({
  // ... config
  customEndpoints: {
    '/todo/stats': {
      method: 'GET',
      handler: async () => {
        // Custom logic here
        return { totalTodos: 42 };
      },
    },
  },
});
```

### Styling Customization
All examples use Tailwind CSS. Customize by:
- Modifying `tailwind.config.js`
- Adding custom CSS classes
- Using CSS custom properties

## 🎯 Production Considerations

### Security
- Implement authentication (consider Better Auth integration)
- Add input validation and sanitization
- Set up proper CORS policies
- Use HTTPS in production

### Performance
- Enable database indexing for large datasets
- Implement pagination for list endpoints
- Add caching strategies
- Optimize bundle sizes

### Monitoring
- Add logging and error tracking
- Implement health checks
- Monitor database performance
- Track user analytics

## 🤝 Contributing

Want to add more examples or improve existing ones?

1. **Fork the repository**
2. **Create a new example** following the existing patterns
3. **Ensure consistency** with the design system
4. **Add comprehensive documentation**
5. **Submit a pull request**

Example ideas:
- Vue.js todo application
- Svelte todo application  
- Mobile app with React Native
- Desktop app with Electron
- Real-time collaboration features

## 📝 License

These examples are part of the Better Query project and follow the same license terms. Feel free to use them as starting points for your own applications!

## 🙋‍♂️ Need Help?

- **Documentation**: Check the Better Query docs
- **Issues**: Open a GitHub issue
- **Community**: Join our Discord server
- **Examples**: Study the source code in these examples

---

**Happy coding with Better Query!** 🚀

These examples demonstrate that regardless of your technology preferences, Better Query provides a consistent, powerful, and type-safe way to build modern applications with minimal boilerplate and maximum developer experience.