# Todo App - React + Better Query

A modern, feature-rich todo application built with React, TypeScript, and Better Query, showcasing advanced frontend patterns and seamless API integration.

## Features

- ⚛️ **Modern React**: Built with React 18, hooks, and functional components
- 📘 **TypeScript**: Full type safety throughout the application
- ✅ **Complete CRUD**: Create, read, update, delete todos with optimistic updates
- 📊 **Interactive Dashboard**: Real-time statistics with animated cards
- 🔍 **Advanced Filtering**: Multiple filter options with live counts
- 🎯 **Priority Management**: Visual priority system with icons and colors  
- 🏷️ **Smart Categories**: Tag-based organization system
- 📅 **Due Date Tracking**: Calendar integration for deadline management
- ✨ **Modern UI/UX**: Gradient design with smooth animations
- 📱 **Responsive Design**: Mobile-first approach with adaptive layouts
- 🔄 **Auto-Detection**: Automatically connects to available Better Query backends
- 🎭 **Loading States**: Elegant loading and error handling
- 🏗️ **Component Architecture**: Modular, reusable React components

## Quick Start

1. **Install dependencies:**
   ```bash
   cd examples/todo-examples/react-todo
   npm install  # or pnpm install
   ```

2. **Start a Better Query backend** (choose one):
   ```bash
   # Option 1: Hono backend
   cd ../hono-todo && npm run dev
   
   # Option 2: Express backend
   cd ../express-todo && npm run dev
   
   # Option 3: Next.js backend
   cd ../next-todo && npm run dev
   ```

3. **Start the React development server:**
   ```bash
   npm run dev
   # Opens at http://localhost:3002
   ```

## Architecture

### Technology Stack

- **React 18**: Latest React with hooks and concurrent features
- **TypeScript**: Type-safe development with strict mode enabled
- **Vite**: Lightning-fast build tool and development server
- **Tailwind CSS**: Utility-first CSS framework with custom animations
- **Lucide React**: Beautiful, customizable icons

### Project Structure

```
react-todo/
├── src/
│   ├── components/
│   │   ├── AddTodoForm.tsx      # Expandable todo creation form
│   │   ├── TodoItem.tsx         # Individual todo display component
│   │   ├── StatsCards.tsx       # Statistics dashboard
│   │   └── FilterTabs.tsx       # Filter and sorting controls
│   ├── hooks/
│   │   └── useTodos.ts          # Custom hook for todo operations
│   ├── utils/
│   │   └── api.ts              # Better Query client implementation
│   ├── types.ts                 # TypeScript type definitions
│   ├── App.tsx                  # Main application component
│   ├── main.tsx                 # Application entry point
│   └── index.css               # Global styles and Tailwind imports
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── README.md
```

## Custom Better Query Client

The app includes a fully-typed Better Query client implementation:

```typescript
class BetterQueryClient {
  private baseUrl: string;

  todo = {
    list: (): Promise<ApiResponse<Todo[]>> => 
      this.request<Todo[]>('/todo/list'),
    
    create: (data: CreateTodoData): Promise<ApiResponse<Todo>> =>
      this.request<Todo>('/todo/create', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    
    update: (id: string, data: Partial<Todo>): Promise<ApiResponse<Todo>> =>
      this.request<Todo>(`/todo/update/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    
    delete: (id: string): Promise<ApiResponse<void>> =>
      this.request<void>(`/todo/delete/${id}`, {
        method: 'DELETE',
      }),
  };
}
```

## React Hooks Integration

### Custom `useTodos` Hook

```typescript
export function useTodos() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const createTodo = async (todoData: CreateTodoData): Promise<Todo | null> => {
    // Optimistic update logic
    // Error handling
    // State synchronization
  };

  return {
    todos,
    loading,
    error,
    createTodo,
    updateTodo,
    deleteTodo,
    toggleTodo,
  };
}
```

## Component Architecture

### 1. **AddTodoForm** - Expandable Creation Form
- Collapsible design for clean interface
- Full form validation with TypeScript
- Optimistic UI updates
- Smooth animations and transitions

### 2. **TodoItem** - Individual Todo Display
- Interactive completion checkbox
- Priority indicators with icons
- Category and due date badges
- Hover effects and micro-interactions

### 3. **StatsCards** - Analytics Dashboard
- Real-time statistics calculation
- Animated counter displays
- Color-coded metrics
- Progress indicators

### 4. **FilterTabs** - Advanced Filtering
- Multiple filter options
- Live count updates
- Active state management
- Responsive tab design

## Advanced Features

### Auto-Backend Detection

The client automatically detects and connects to available Better Query backends:

```typescript
const possibleEndpoints = [
  'http://localhost:3000/api/query',  // Express/Hono
  'http://localhost:3001/api/query',  // Alternative port
  '/api/query',                       // Same origin (Next.js)
];

export async function getBetterQueryClient(): Promise<BetterQueryClient | null> {
  for (const endpoint of possibleEndpoints) {
    try {
      const testClient = new BetterQueryClient(endpoint);
      const result = await testClient.todo.list();
      
      if (!result.error) {
        console.log(`✅ Connected to Better Query API at: ${endpoint}`);
        return testClient;
      }
    } catch (error) {
      console.log(`❌ Failed to connect to ${endpoint}`);
    }
  }
  return null;
}
```

### Type Safety

Full TypeScript integration with strict type checking:

```typescript
interface Todo {
  id?: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  category?: string;
  dueDate?: Date;
  tags?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}
```

### Error Handling

Comprehensive error handling with graceful fallbacks:

```typescript
try {
  const result = await queryClient.todo.create(todoData);
  if (result.error) {
    throw new Error(result.error.message);
  }
  // Handle success...
} catch (error) {
  setError(error instanceof Error ? error.message : 'Unknown error');
}
```

## Performance Optimizations

- **React.memo**: Prevents unnecessary re-renders
- **useCallback**: Optimizes event handlers
- **Optimistic Updates**: Immediate UI feedback
- **Lazy Loading**: Components loaded on demand
- **Efficient State Management**: Minimal state updates

## Styling and Animations

### Custom Tailwind Animations

```javascript
theme: {
  extend: {
    animation: {
      'bounce-in': 'bounceIn 0.6s ease-out',
      'slide-in': 'slideIn 0.3s ease-out',
      'fade-in': 'fadeIn 0.2s ease-out',
    },
  },
}
```

### Component-Level Styling

- Gradient backgrounds for visual hierarchy
- Hover effects for interactive elements
- Focus states for accessibility
- Responsive breakpoints for all devices

## Development Workflow

### Hot Module Replacement

Vite provides instant feedback during development:
- Component changes reflect immediately
- State is preserved across updates
- CSS changes apply without page refresh

### TypeScript Integration

- Strict type checking prevents runtime errors
- IntelliSense provides auto-completion
- Refactoring tools ensure code consistency

## Testing Strategy

While tests aren't included in this example, the architecture supports:
- Unit tests for components with React Testing Library
- Integration tests for hooks
- End-to-end tests with Playwright or Cypress

## Build and Deployment

### Production Build

```bash
npm run build
# Creates optimized bundle in dist/
```

### Preview Production Build

```bash
npm run preview
# Serves production build locally
```

### Deployment Options

- **Vercel**: Zero-config deployment for React apps
- **Netlify**: JAMstack-focused hosting platform
- **AWS S3 + CloudFront**: Scalable static hosting
- **Docker**: Containerized deployment

```dockerfile
# Multi-stage build for optimized production image
FROM node:18-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
```

## Customization Guide

### Adding New Features

1. **Extend Types**: Add new fields to the `Todo` interface
2. **Update API Client**: Add new endpoints to the client
3. **Create Components**: Build UI components for new features
4. **Update Hooks**: Extend the `useTodos` hook

### Theming

Customize the visual design by modifying:
- `tailwind.config.js` for colors and spacing
- Component classes for specific styling
- CSS custom properties for dynamic theming

## Best Practices Demonstrated

1. **Component Composition**: Small, focused components
2. **Custom Hooks**: Reusable state logic
3. **Type Safety**: Comprehensive TypeScript usage
4. **Error Boundaries**: Graceful error handling
5. **Accessibility**: Semantic HTML and ARIA attributes
6. **Performance**: Optimized rendering and state updates

## Next Steps

- Add drag-and-drop todo reordering
- Implement todo search and filtering
- Add keyboard shortcuts
- Create PWA with offline support
- Add todo sharing and collaboration
- Implement real-time updates with WebSockets

This React example demonstrates how to build a production-ready frontend application that seamlessly integrates with Better Query, showcasing modern React patterns, TypeScript best practices, and excellent user experience design.