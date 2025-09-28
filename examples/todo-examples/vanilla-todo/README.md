# Todo App - Vanilla JavaScript + Better Query

A pure JavaScript todo application that demonstrates Better Query integration without any frontend frameworks.

## Features

- 📱 **Framework-Free**: Pure vanilla JavaScript - no React, Vue, or Angular
- ✅ **Full CRUD Operations**: Create, Read, Update, Delete todos
- 🔍 **Smart Filtering**: All, Pending, Completed, High Priority filters
- 📊 **Real-time Stats**: Live statistics dashboard
- 🎯 **Priority System**: Visual priority indicators with icons
- 🏷️ **Categories**: Organize todos with custom categories
- 📅 **Due Dates**: Set optional due dates for todos
- 🌐 **Multi-Backend Support**: Automatically detects and connects to available Better Query backends
- ✨ **Modern UI**: Gradient design with Tailwind CSS
- 🔄 **Real-time Updates**: Instant UI updates with native JavaScript

## Quick Start

### Option 1: Use with existing backend
1. **Start any Better Query backend** (Hono, Express, or Next.js examples)
2. **Serve the static files:**
   ```bash
   cd examples/todo-examples/vanilla-todo
   npx serve .
   # or use any static file server
   python3 -m http.server 8000
   ```
3. **Open your browser:**
   ```
   http://localhost:3000  (if using serve)
   http://localhost:8000  (if using Python)
   ```

### Option 2: Standalone with package.json
```bash
cd examples/todo-examples/vanilla-todo
npm install
npm run dev
# Opens at http://localhost:3000
```

## Backend Compatibility

This vanilla client automatically detects and connects to any of these Better Query backends:

- **Hono Todo** - `http://localhost:3000/api/query`
- **Express Todo** - `http://localhost:3000/api/query` 
- **Next.js Todo** - `http://localhost:3000/api/query`

The client tries multiple endpoints and uses the first one that responds successfully.

## Project Structure

```
vanilla-todo/
├── index.html         # Complete single-page application
├── package.json       # Optional - for easy serving
└── README.md          # This file
```

## Architecture

### Better Query Client Implementation

The app includes a lightweight Better Query client implementation:

```javascript
class BetterQueryClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }

  todo = {
    list: () => this.request('/todo/list'),
    create: (data) => this.request('/todo/create', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => this.request(`/todo/update/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => this.request(`/todo/delete/${id}`, { method: 'DELETE' }),
  };
}
```

### State Management

Pure JavaScript state management with reactive updates:

```javascript
let todos = [];
let currentFilter = 'all';

// State updates trigger UI re-renders
function updateTodos(newTodos) {
  todos = newTodos;
  renderTodos();
  updateStats();
}
```

### Error Handling

Robust error handling with user-friendly messages:

```javascript
// Automatic backend detection
for (const endpoint of possibleEndpoints) {
  try {
    const testClient = new BetterQueryClient(endpoint);
    await testClient.todo.list();
    queryClient = testClient;
    break;
  } catch (error) {
    console.log(`Failed to connect to ${endpoint}`);
  }
}
```

## Features Demonstrated

### 1. **Multi-Backend Auto-Detection**
```javascript
const possibleEndpoints = [
  'http://localhost:3000/api/query',
  '/api/query',
  'http://localhost:3001/api/query',
];
```

### 2. **Real-time Statistics**
- Total todos count
- Completed todos
- Pending todos  
- High priority todos

### 3. **Advanced Filtering**
- All todos
- Pending only
- Completed only
- High priority only

### 4. **Rich Todo Data**
```javascript
const todoData = {
  title: 'Required field',
  description: 'Optional details',
  priority: 'low' | 'medium' | 'high',
  category: 'Optional category',
  dueDate: new Date(), // Optional
  completed: false,
};
```

### 5. **Responsive Design**
- Mobile-first responsive layout
- Gradient backgrounds
- Hover effects and transitions
- Icon-based priority system

## Customization

### Adding New Features

Extend the todo schema by updating the form and API calls:

```javascript
// Add new field to form
const todoData = {
  // ... existing fields
  assignedTo: document.getElementById('assignedTo').value,
  tags: document.getElementById('tags').value.split(','),
};
```

### Styling

The app uses Tailwind CSS via CDN. Customize the design by:
- Modifying CSS classes in the HTML
- Adding custom CSS styles
- Using a different CSS framework

### Backend Integration

To connect to a different Better Query backend:
1. Add the endpoint to `possibleEndpoints` array
2. Ensure the backend exposes the standard Better Query API
3. The client will automatically detect and connect

## Performance Optimizations

- **Minimal Bundle Size**: No framework dependencies
- **Efficient DOM Updates**: Manual DOM manipulation for optimal performance
- **Smart Filtering**: Client-side filtering for instant results
- **Debounced Updates**: Prevents excessive API calls

## Browser Support

Works in all modern browsers that support:
- ES6+ features (classes, async/await, fetch)
- Modern DOM APIs
- CSS Grid and Flexbox

## Next Steps

- Add drag-and-drop todo reordering
- Implement todo search functionality
- Add keyboard shortcuts
- Create PWA with offline support
- Add data export/import features

This example demonstrates how Better Query can be used with any frontend technology, even pure vanilla JavaScript, while maintaining full type safety and modern development patterns.