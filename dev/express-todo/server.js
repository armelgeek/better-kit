import express from "express";
import cors from "cors";
import { createQuery } from "./query.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

// Configure CORS
app.use(cors({
  origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
  credentials: true,
}));

// Convert Request/Response for Better Query
/**
 * @param {(request: Request) => Promise<Response>} handler
 */
const toNodeHandler = (handler) => {
  /**
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  return async (req, res) => {
    try {
      const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
      // Convert Express request headers to a Fetch-compatible Headers object
      const headersInit = new Headers();
      for (const [k, v] of Object.entries(req.headers)) {
        if (v == null) continue;
        if (Array.isArray(v)) {
          headersInit.set(k, v.join(', '));
        } else {
          headersInit.set(k, String(v));
        }
      }

      const request = new Request(url, {
        method: req.method,
        headers: headersInit,
        body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined,
      });

      const response = await handler(request);
      
      // Copy response headers
      for (const [key, value] of response.headers.entries()) {
        res.setHeader(key, value);
      }
      
      // Set status and send response
      res.status(response.status);
      
      if (response.body) {
        const text = await response.text();
        try {
          const data = JSON.parse(text);
          res.json(data);
        } catch {
          res.send(text);
        }
      } else {
        res.end();
      }
    } catch (error) {
      console.error("Handler error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };
};

// Initialize Better Query and mount handler
let query;
try {
  query = createQuery();
} catch (err) {
  /** @type {any} */
  const _err = err;
  console.error('\n\n🚨 Failed to initialize Better Query:');
  console.error(_err.message || _err);
  console.error('\nActions you can take:');
  console.error('  * Ensure workspace dependencies are installed: pnpm install (from repo root)');
  console.error('  * Install system build tools for SQLite native module:');
  console.error('      sudo apt-get update && sudo apt-get install -y build-essential python3 libsqlite3-dev pkg-config');
  console.error('  * Or install the package locally in this example: cd dev/express-todo && pnpm add better-sqlite3');
  console.error('  * If you use npm instead of pnpm: npm install better-sqlite3');
  console.error('  * Consider using Node LTS (18 or 20) via nvm when prebuilt binaries are not available');
  console.error('\nExiting. After fixing the issue, restart the dev server.\n');
  process.exit(1);
}
// Mount Better Query handler for all CRUD operations
app.all("/api/query/*", toNodeHandler(query.handler));

// Use express.json() only for non-Better Query routes
app.use((req, res, next) => {
  if (!req.path.startsWith('/api/query/')) {
    express.json()(req, res, next);
  } else {
    next();
  }
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "ok", 
    message: "Express Todo API is running!",
    timestamp: new Date().toISOString()
  });
});

// Serve static HTML for the todo interface
app.get("/", (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Todo App - Express + Better Query</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/alpinejs@3.x.x/dist/cdn.min.js" defer></script>
</head>
<body class="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen py-8">
    <div class="container mx-auto px-4 max-w-4xl">
        <div class="bg-white rounded-xl shadow-xl p-8">
            <div class="text-center mb-8">
                <h1 class="text-4xl font-bold text-gray-800 mb-2">Todo Express</h1>
                <p class="text-gray-600">Professional todo management with Express.js + Better Query</p>
            </div>

            <div x-data="todoApp()" x-init="loadTodos()">
                <!-- Stats Cards -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div class="bg-blue-50 p-4 rounded-lg text-center">
                        <div class="text-2xl font-bold text-blue-600" x-text="todos.length"></div>
                        <div class="text-sm text-blue-600">Total Todos</div>
                    </div>
                    <div class="bg-green-50 p-4 rounded-lg text-center">
                        <div class="text-2xl font-bold text-green-600" x-text="completedCount"></div>
                        <div class="text-sm text-green-600">Completed</div>
                    </div>
                    <div class="bg-orange-50 p-4 rounded-lg text-center">
                        <div class="text-2xl font-bold text-orange-600" x-text="pendingCount"></div>
                        <div class="text-sm text-orange-600">Pending</div>
                    </div>
                </div>

                <!-- Add Todo Form -->
                <div class="mb-8 p-6 bg-gray-50 rounded-xl border">
                    <h2 class="text-xl font-semibold mb-4 flex items-center">
                        <span class="mr-2">➕</span> Add New Todo
                    </h2>
                    <form @submit.prevent="addTodo()" class="space-y-4">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input 
                                x-model="newTodo.title" 
                                type="text" 
                                placeholder="What needs to be done?" 
                                required
                                class="border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            />
                            <select x-model="newTodo.priority" class="border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                                <option value="low">🟢 Low Priority</option>
                                <option value="medium">🟡 Medium Priority</option>
                                <option value="high">🔴 High Priority</option>
                            </select>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input 
                                x-model="newTodo.category" 
                                type="text" 
                                placeholder="Category (e.g., work, personal)"
                                class="border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            <input 
                                x-model="newTodo.dueDate" 
                                type="date"
                                class="border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <textarea 
                            x-model="newTodo.description" 
                            placeholder="Additional details (optional)" 
                            class="border border-gray-300 rounded-lg px-4 py-3 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            rows="3"
                        ></textarea>
                        <button 
                            type="submit"
                            class="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-colors shadow-lg hover:shadow-xl"
                        >
                            Add Todo
                        </button>
                    </form>
                </div>

                <!-- Filter Tabs -->
                <div class="flex flex-wrap gap-2 mb-6">
                    <button 
                        @click="filter = 'all'"
                        :class="filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'"
                        class="px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                        All
                    </button>
                    <button 
                        @click="filter = 'pending'"
                        :class="filter === 'pending' ? 'bg-orange-600 text-white' : 'bg-gray-200 text-gray-700'"
                        class="px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                        Pending
                    </button>
                    <button 
                        @click="filter = 'completed'"
                        :class="filter === 'completed' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'"
                        class="px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                        Completed
                    </button>
                </div>

                <!-- Todos List -->
                <div>
                    <div class="space-y-4">
                        <template x-for="todo in filteredTodos" :key="todo.id">
                            <div class="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                                <div class="flex items-start justify-between">
                                    <div class="flex items-start space-x-4 flex-1">
                                        <input 
                                            type="checkbox" 
                                            :checked="todo.completed"
                                            @change="toggleTodo(todo)"
                                            class="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                                        />
                                        <div class="flex-1">
                                            <h3 
                                                class="text-lg font-medium mb-1"
                                                :class="todo.completed ? 'text-gray-500 line-through' : 'text-gray-800'"
                                                x-text="todo.title"
                                            ></h3>
                                            <p 
                                                x-show="todo.description" 
                                                x-text="todo.description"
                                                class="text-gray-600 text-sm mb-3"
                                            ></p>
                                            <div class="flex flex-wrap items-center gap-2">
                                                <span 
                                                    class="px-3 py-1 rounded-full text-xs font-medium"
                                                    :class="{
                                                        'bg-green-100 text-green-800': todo.priority === 'low',
                                                        'bg-yellow-100 text-yellow-800': todo.priority === 'medium', 
                                                        'bg-red-100 text-red-800': todo.priority === 'high'
                                                    }"
                                                    x-text="todo.priority.toUpperCase() + ' PRIORITY'"
                                                ></span>
                                                <span x-show="todo.category" class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium" x-text="'#' + todo.category"></span>
                                                <span x-show="todo.dueDate" class="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-xs font-medium" x-text="'Due: ' + new Date(todo.dueDate).toLocaleDateString()"></span>
                                                <span x-show="todo.completed" class="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium">✅ COMPLETED</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button 
                                        @click="deleteTodo(todo.id)"
                                        class="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors"
                                        title="Delete todo"
                                    >
                                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </template>
                    </div>

                    <div x-show="filteredTodos.length === 0" class="text-center py-12 text-gray-500">
                        <div class="text-6xl mb-4">
                            <span x-show="filter === 'all'">📝</span>
                            <span x-show="filter === 'pending'">⏳</span>
                            <span x-show="filter === 'completed'">🎉</span>
                        </div>
                        <p class="text-lg" x-show="filter === 'all'">No todos yet!</p>
                        <p class="text-lg" x-show="filter === 'pending'">No pending todos!</p>
                        <p class="text-lg" x-show="filter === 'completed'">No completed todos!</p>
                        <p x-show="filter === 'all'">Add your first todo above to get started.</p>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        function todoApp() {
            return {
                todos: [],
                filter: 'all',
                newTodo: {
                    title: '',
                    description: '',
                    priority: 'medium',
                    category: '',
                    dueDate: ''
                },

                get completedCount() {
                    return this.todos.filter(t => t.completed).length;
                },

                get pendingCount() {
                    return this.todos.filter(t => !t.completed).length;
                },

                get filteredTodos() {
                    if (this.filter === 'completed') {
                        return this.todos.filter(t => t.completed);
                    } else if (this.filter === 'pending') {
                        return this.todos.filter(t => !t.completed);
                    }
                    return this.todos;
                },

                async loadTodos() {
                    try {
                        const response = await fetch('/api/query/todo/list');
                        const result = await response.json();
                        if (result.data) {
                            this.todos = result.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                        }
                    } catch (error) {
                        console.error('Failed to load todos:', error);
                        alert('Failed to load todos. Please refresh the page.');
                    }
                },

                async addTodo() {
                    if (!this.newTodo.title.trim()) return;

                    try {
                        const todoData = { ...this.newTodo };
                        
                        // Clean empty fields
                        if (!todoData.description) delete todoData.description;
                        if (!todoData.category) delete todoData.category;
                        if (!todoData.dueDate) delete todoData.dueDate;
                        else todoData.dueDate = new Date(todoData.dueDate);

                        const response = await fetch('/api/query/todo/create', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(todoData)
                        });

                        const result = await response.json();
                        if (result.data) {
                            this.todos.unshift(result.data);
                            this.resetForm();
                        } else {
                            throw new Error(result.message || 'Failed to create todo');
                        }
                    } catch (error) {
                        console.error('Failed to add todo:', error);
                        alert('Failed to create todo: ' + error.message);
                    }
                },

                async toggleTodo(todo) {
                    try {
                        const response = await fetch(\`/api/query/todo/update/\${todo.id}\`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ 
                                ...todo,
                                completed: !todo.completed 
                            })
                        });

                        const result = await response.json();
                        if (result.data) {
                            const index = this.todos.findIndex(t => t.id === todo.id);
                            if (index !== -1) {
                                this.todos[index] = result.data;
                            }
                        } else {
                            throw new Error(result.message || 'Failed to update todo');
                        }
                    } catch (error) {
                        console.error('Failed to toggle todo:', error);
                        alert('Failed to update todo: ' + error.message);
                    }
                },

                async deleteTodo(id) {
                    if (!confirm('Are you sure you want to delete this todo?')) return;

                    try {
                        const response = await fetch(\`/api/query/todo/delete/\${id}\`, {
                            method: 'DELETE'
                        });

                        if (response.ok) {
                            this.todos = this.todos.filter(todo => todo.id !== id);
                        } else {
                            const result = await response.json();
                            throw new Error(result.message || 'Failed to delete todo');
                        }
                    } catch (error) {
                        console.error('Failed to delete todo:', error);
                        alert('Failed to delete todo: ' + error.message);
                    }
                },

                resetForm() {
                    this.newTodo = {
                        title: '',
                        description: '',
                        priority: 'medium',
                        category: '',
                        dueDate: ''
                    };
                }
            }
        }
    </script>
</body>
</html>`);
});

app.listen(port, () => {
  console.log(`🚀 Express Todo App running on http://localhost:${port}`);
  console.log(`📚 API docs: http://localhost:${port}/api/query/`);
  console.log(`🔧 Health check: http://localhost:${port}/api/health`);
});