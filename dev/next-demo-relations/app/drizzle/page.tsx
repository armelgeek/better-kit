'use client';

import { useState, useEffect } from 'react';

export default function DrizzleDemoPage() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <a href="/" className="text-green-600 hover:text-green-700 mb-4 inline-block">
            ← Back to Home
          </a>
          <h1 className="text-4xl font-bold mb-2">Drizzle ORM Demo</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Better Query with Drizzle ORM - Relationship Examples
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg mb-8">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'overview'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('examples')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'examples'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Code Examples
              </button>
              <button
                onClick={() => setActiveTab('api')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'api'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                API Testing
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold mb-4">Drizzle ORM Features</h2>
                
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <h3 className="font-semibold mb-2">✅ Type-Safe Schema Definition</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Define your database schema with TypeScript, get full type safety and autocompletion.
                  </p>
                </div>

                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <h3 className="font-semibold mb-2">✅ Relational Queries</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Built-in support for defining and querying relationships between tables.
                  </p>
                </div>

                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <h3 className="font-semibold mb-2">✅ SQL-Like Syntax</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Write queries that feel like SQL but with TypeScript safety.
                  </p>
                </div>

                <h3 className="text-xl font-bold mt-8 mb-4">Relationships Implemented</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="border border-gray-200 dark:border-gray-700 rounded p-4">
                    <h4 className="font-semibold mb-2">hasMany</h4>
                    <ul className="text-sm space-y-1 text-gray-600 dark:text-gray-400">
                      <li>• User has many Todos</li>
                      <li>• User has many Projects</li>
                      <li>• Project has many Todos</li>
                      <li>• Todo has many Comments</li>
                    </ul>
                  </div>
                  <div className="border border-gray-200 dark:border-gray-700 rounded p-4">
                    <h4 className="font-semibold mb-2">belongsTo</h4>
                    <ul className="text-sm space-y-1 text-gray-600 dark:text-gray-400">
                      <li>• Todo belongs to User</li>
                      <li>• Todo belongs to Project</li>
                      <li>• Todo belongs to Priority</li>
                      <li>• Comment belongs to Todo</li>
                    </ul>
                  </div>
                  <div className="border border-gray-200 dark:border-gray-700 rounded p-4">
                    <h4 className="font-semibold mb-2">belongsToMany</h4>
                    <ul className="text-sm space-y-1 text-gray-600 dark:text-gray-400">
                      <li>• Todo ↔ Tags</li>
                      <li>• Through TodoTags junction</li>
                    </ul>
                  </div>
                  <div className="border border-gray-200 dark:border-gray-700 rounded p-4">
                    <h4 className="font-semibold mb-2">Self-referential</h4>
                    <ul className="text-sm space-y-1 text-gray-600 dark:text-gray-400">
                      <li>• Todo has parent Todo</li>
                      <li>• Todo has many subtasks</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'examples' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold mb-4">Code Examples</h2>
                
                <div>
                  <h3 className="text-lg font-semibold mb-2">Schema Definition</h3>
                  <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded overflow-x-auto text-sm">
                    <code>{`import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

export const users = sqliteTable('user', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  // ... more fields
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
}));`}</code>
                  </pre>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Better Query Resource</h3>
                  <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded overflow-x-auto text-sm">
                    <code>{`const todoResource = createResource({
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
});`}</code>
                  </pre>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Query Usage</h3>
                  <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded overflow-x-auto text-sm">
                    <code>{`// Create a user
const user = await fetch('/api/drizzle/user/create', {
  method: 'POST',
  body: JSON.stringify({
    email: 'john@example.com',
    name: 'John Doe',
    role: 'user'
  })
});

// Create a todo for the user
const todo = await fetch('/api/drizzle/todo/create', {
  method: 'POST',
  body: JSON.stringify({
    title: 'Complete demo',
    userId: user.id,
    completed: false
  })
});

// List all todos with user relation
const todos = await fetch('/api/drizzle/todo/list');`}</code>
                  </pre>
                </div>
              </div>
            )}

            {activeTab === 'api' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold mb-4">API Testing</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Use these endpoints to test the Drizzle implementation with Better Query.
                </p>

                <div className="space-y-4">
                  <div className="border border-gray-200 dark:border-gray-700 rounded p-4">
                    <div className="flex items-center mb-2">
                      <span className="bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded mr-2">
                        GET
                      </span>
                      <code className="text-sm">/api/drizzle/user/list</code>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">List all users</p>
                  </div>

                  <div className="border border-gray-200 dark:border-gray-700 rounded p-4">
                    <div className="flex items-center mb-2">
                      <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded mr-2">
                        POST
                      </span>
                      <code className="text-sm">/api/drizzle/user/create</code>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Create a new user</p>
                    <pre className="bg-gray-100 dark:bg-gray-900 p-2 rounded text-xs overflow-x-auto">
{`{
  "email": "user@example.com",
  "name": "John Doe",
  "role": "user"
}`}
                    </pre>
                  </div>

                  <div className="border border-gray-200 dark:border-gray-700 rounded p-4">
                    <div className="flex items-center mb-2">
                      <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded mr-2">
                        POST
                      </span>
                      <code className="text-sm">/api/drizzle/todo/create</code>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Create a new todo</p>
                    <pre className="bg-gray-100 dark:bg-gray-900 p-2 rounded text-xs overflow-x-auto">
{`{
  "title": "Complete demo",
  "description": "Finish the demo app",
  "userId": "user-id-here",
  "completed": false
}`}
                    </pre>
                  </div>

                  <div className="border border-gray-200 dark:border-gray-700 rounded p-4">
                    <div className="flex items-center mb-2">
                      <span className="bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded mr-2">
                        GET
                      </span>
                      <code className="text-sm">/api/drizzle/todo/list</code>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">List all todos with relationships</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
