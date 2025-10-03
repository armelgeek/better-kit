export default function HomePage() {
  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-12 text-center">
          <h1 className="text-4xl font-bold mb-4">
            Better Query Demo: Drizzle & Prisma
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Demonstration of relationship types: hasMany, belongsTo, belongsToMany, and Self-referential
          </p>
        </header>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Drizzle Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mr-4">
                <span className="text-2xl">🐉</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold">Drizzle ORM</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">TypeScript SQL ORM</p>
              </div>
            </div>
            <div className="space-y-3 mb-6">
              <div className="flex items-center text-sm">
                <span className="text-green-500 mr-2">✓</span>
                <span>Type-safe SQL queries</span>
              </div>
              <div className="flex items-center text-sm">
                <span className="text-green-500 mr-2">✓</span>
                <span>Relational queries</span>
              </div>
              <div className="flex items-center text-sm">
                <span className="text-green-500 mr-2">✓</span>
                <span>Lightweight & fast</span>
              </div>
            </div>
            <a
              href="/drizzle"
              className="block w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded text-center transition-colors"
            >
              View Drizzle Demo
            </a>
          </div>

          {/* Prisma Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mr-4">
                <span className="text-2xl">🔷</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold">Prisma ORM</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">Next-generation ORM</p>
              </div>
            </div>
            <div className="space-y-3 mb-6">
              <div className="flex items-center text-sm">
                <span className="text-blue-500 mr-2">✓</span>
                <span>Auto-generated client</span>
              </div>
              <div className="flex items-center text-sm">
                <span className="text-blue-500 mr-2">✓</span>
                <span>Intuitive data model</span>
              </div>
              <div className="flex items-center text-sm">
                <span className="text-blue-500 mr-2">✓</span>
                <span>Migration system</span>
              </div>
            </div>
            <a
              href="/prisma"
              className="block w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded text-center transition-colors"
            >
              View Prisma Demo
            </a>
          </div>
        </div>

        {/* Relationship Types */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6">Relationship Types Demonstrated</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-2 flex items-center">
                <span className="text-2xl mr-2">👥</span>
                hasMany
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                One-to-many relationship
              </p>
              <ul className="text-sm space-y-1">
                <li>• User → Todos</li>
                <li>• User → Projects</li>
                <li>• Project → Todos</li>
                <li>• Todo → Comments</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2 flex items-center">
                <span className="text-2xl mr-2">👤</span>
                belongsTo
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Many-to-one relationship
              </p>
              <ul className="text-sm space-y-1">
                <li>• Todo → User</li>
                <li>• Todo → Project</li>
                <li>• Todo → Priority</li>
                <li>• Comment → Todo</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2 flex items-center">
                <span className="text-2xl mr-2">🔗</span>
                belongsToMany
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Many-to-many relationship (with junction table)
              </p>
              <ul className="text-sm space-y-1">
                <li>• Todo ↔ Tags</li>
                <li>• Through: TodoTags junction table</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2 flex items-center">
                <span className="text-2xl mr-2">🔄</span>
                Self-referential
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Recursive relationship
              </p>
              <ul className="text-sm space-y-1">
                <li>• Todo → Parent Todo</li>
                <li>• Todo → Subtasks</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Data Model */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-6">Data Model Overview</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="border border-gray-200 dark:border-gray-700 rounded p-4">
              <h3 className="font-bold mb-2">User</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Application users with roles
              </p>
            </div>
            <div className="border border-gray-200 dark:border-gray-700 rounded p-4">
              <h3 className="font-bold mb-2">Project</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Containers for organizing todos
              </p>
            </div>
            <div className="border border-gray-200 dark:border-gray-700 rounded p-4">
              <h3 className="font-bold mb-2">Todo</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Main task entity with relationships
              </p>
            </div>
            <div className="border border-gray-200 dark:border-gray-700 rounded p-4">
              <h3 className="font-bold mb-2">Priority</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Priority levels for todos (1-5)
              </p>
            </div>
            <div className="border border-gray-200 dark:border-gray-700 rounded p-4">
              <h3 className="font-bold mb-2">Tag</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Labels for categorizing todos
              </p>
            </div>
            <div className="border border-gray-200 dark:border-gray-700 rounded p-4">
              <h3 className="font-bold mb-2">Comment</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                User comments on todos
              </p>
            </div>
          </div>
        </div>

        {/* API Endpoints */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mt-8">
          <h2 className="text-2xl font-bold mb-6">API Endpoints</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-3 text-green-600">Drizzle API</h3>
              <div className="space-y-2 text-sm font-mono">
                <div className="bg-gray-100 dark:bg-gray-900 p-2 rounded">
                  <span className="text-green-600">GET</span> /api/drizzle/user/list
                </div>
                <div className="bg-gray-100 dark:bg-gray-900 p-2 rounded">
                  <span className="text-blue-600">POST</span> /api/drizzle/todo/create
                </div>
                <div className="bg-gray-100 dark:bg-gray-900 p-2 rounded">
                  <span className="text-orange-600">PATCH</span> /api/drizzle/todo/update
                </div>
                <div className="bg-gray-100 dark:bg-gray-900 p-2 rounded">
                  <span className="text-red-600">DELETE</span> /api/drizzle/todo/delete
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-3 text-blue-600">Prisma API</h3>
              <div className="space-y-2 text-sm font-mono">
                <div className="bg-gray-100 dark:bg-gray-900 p-2 rounded">
                  <span className="text-green-600">GET</span> /api/prisma/user/list
                </div>
                <div className="bg-gray-100 dark:bg-gray-900 p-2 rounded">
                  <span className="text-blue-600">POST</span> /api/prisma/todo/create
                </div>
                <div className="bg-gray-100 dark:bg-gray-900 p-2 rounded">
                  <span className="text-orange-600">PATCH</span> /api/prisma/todo/update
                </div>
                <div className="bg-gray-100 dark:bg-gray-900 p-2 rounded">
                  <span className="text-red-600">DELETE</span> /api/prisma/todo/delete
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
