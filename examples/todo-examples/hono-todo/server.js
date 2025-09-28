import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { cors } from "hono/cors";
import { serveStatic } from "hono/bun"; // Import for static file serving
import { query } from "./query.js";

const app = new Hono();

// Configure CORS for cross-origin requests
app.use(
  "/api/query/*",
  cors({
    origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["POST", "GET", "OPTIONS", "PUT", "DELETE"],
    credentials: true,
  })
);

// Mount Better Query handler
app.on(["POST", "GET", "PUT", "DELETE"], "/api/query/*", (c) => {
  return query.handler(c.req.raw);
});

// Serve static files (HTML interface)
app.get("/", (c) => {
  return c.html(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Todo App - Hono + Better Query</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/alpinejs@3.x.x/dist/cdn.min.js" defer></script>
</head>
<body class="bg-gray-100 min-h-screen py-8">
    <div class="container mx-auto px-4 max-w-4xl">
        <div class="bg-white rounded-lg shadow-lg p-6">
            <div class="text-center mb-8">
                <h1 class="text-3xl font-bold text-gray-800 mb-2">Todo App</h1>
                <p class="text-gray-600">Simple and elegant todo management with Hono.js + Better Query</p>
            </div>

            <div x-data="todoApp()" x-init="loadTodos()">
                <!-- Add Todo Form -->
                <div class="mb-8 p-4 bg-gray-50 rounded-lg">
                    <h2 class="text-xl font-semibold mb-4">Add New Todo</h2>
                    <form @submit.prevent="addTodo()" class="space-y-4">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input 
                                x-model="newTodo.title" 
                                type="text" 
                                placeholder="Todo title..." 
                                required
                                class="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                            />
                            <select x-model="newTodo.priority" class="border rounded-lg px-3 py-2">
                                <option value="low">Low Priority</option>
                                <option value="medium">Medium Priority</option>
                                <option value="high">High Priority</option>
                            </select>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input 
                                x-model="newTodo.category" 
                                type="text" 
                                placeholder="Category (optional)"
                                class="border rounded-lg px-3 py-2"
                            />
                            <input 
                                x-model="newTodo.dueDate" 
                                type="date"
                                class="border rounded-lg px-3 py-2"
                            />
                        </div>
                        <textarea 
                            x-model="newTodo.description" 
                            placeholder="Description (optional)" 
                            class="border rounded-lg px-3 py-2 w-full"
                            rows="3"
                        ></textarea>
                        <button 
                            type="submit"
                            class="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium"
                        >
                            Add Todo
                        </button>
                    </form>
                </div>

                <!-- Todos List -->
                <div>
                    <div class="flex justify-between items-center mb-4">
                        <h2 class="text-xl font-semibold">Your Todos</h2>
                        <span class="text-gray-500" x-text="todos.length + ' todos'"></span>
                    </div>

                    <template x-for="todo in todos" :key="todo.id">
                        <div class="bg-white border rounded-lg p-4 mb-3 shadow-sm">
                            <div class="flex items-start justify-between">
                                <div class="flex items-start space-x-3 flex-1">
                                    <input 
                                        type="checkbox" 
                                        :checked="todo.completed"
                                        @change="toggleTodo(todo)"
                                        class="mt-1 w-4 h-4 text-blue-600"
                                    />
                                    <div class="flex-1">
                                        <h3 
                                            class="font-medium"
                                            :class="todo.completed ? 'text-gray-500 line-through' : 'text-gray-800'"
                                            x-text="todo.title"
                                        ></h3>
                                        <p 
                                            x-show="todo.description" 
                                            x-text="todo.description"
                                            class="text-gray-600 text-sm mt-1"
                                        ></p>
                                        <div class="flex items-center space-x-4 text-xs text-gray-500 mt-2">
                                            <span 
                                                class="px-2 py-1 rounded"
                                                :class="{
                                                    'bg-green-100 text-green-800': todo.priority === 'low',
                                                    'bg-yellow-100 text-yellow-800': todo.priority === 'medium', 
                                                    'bg-red-100 text-red-800': todo.priority === 'high'
                                                }"
                                                x-text="todo.priority + ' priority'"
                                            ></span>
                                            <span x-show="todo.category" x-text="'#' + todo.category"></span>
                                            <span x-show="todo.dueDate" x-text="'Due: ' + new Date(todo.dueDate).toLocaleDateString()"></span>
                                        </div>
                                    </div>
                                </div>
                                <button 
                                    @click="deleteTodo(todo.id)"
                                    class="text-red-500 hover:text-red-700 ml-2"
                                >
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </template>

                    <div x-show="todos.length === 0" class="text-center py-8 text-gray-500">
                        <p>No todos yet! Add your first todo above.</p>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        function todoApp() {
            return {
                todos: [],
                newTodo: {
                    title: '',
                    description: '',
                    priority: 'medium',
                    category: '',
                    dueDate: ''
                },

                async loadTodos() {
                    try {
                        const response = await fetch('/api/query/todo/list');
                        const result = await response.json();
                        if (result.data) {
                            this.todos = result.data;
                        }
                    } catch (error) {
                        console.error('Failed to load todos:', error);
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
                        }
                    } catch (error) {
                        console.error('Failed to add todo:', error);
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
                        }
                    } catch (error) {
                        console.error('Failed to toggle todo:', error);
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
                        }
                    } catch (error) {
                        console.error('Failed to delete todo:', error);
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

// Health check endpoint
app.get("/api/health", (c) => {
  return c.json({ status: "ok", message: "Hono Todo API is running!" });
});

const port = 3000;
console.log(`🚀 Todo App running on http://localhost:${port}`);
console.log(`📚 API docs: http://localhost:${port}/api/query/`);

serve({
  fetch: app.fetch,
  port,
});