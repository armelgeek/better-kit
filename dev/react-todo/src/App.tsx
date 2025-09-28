import React, { useState } from 'react';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { useTodos } from './hooks/useTodos';
import { AddTodoForm } from './components/AddTodoForm';
import { TodoItem } from './components/TodoItem';
import { StatsCards } from './components/StatsCards';
import { FilterTabs } from './components/FilterTabs';
import { Todo } from './types';

function App() {
  const { todos, loading, error, createTodo, toggleTodo, deleteTodo, loadTodos } = useTodos();
  const [filteredTodos, setFilteredTodos] = useState<Todo[]>([]);
  const [displayTodos, setDisplayTodos] = useState<Todo[]>([]);

  // Update filtered todos when todos change
  React.useEffect(() => {
    setDisplayTodos(todos);
    setFilteredTodos(todos);
  }, [todos]);

  const handleAddTodo = async (todoData: any) => {
    try {
      await createTodo(todoData);
    } catch (error) {
      console.error('Failed to add todo:', error);
      alert('Failed to add todo: ' + (error as Error).message);
    }
  };

  const handleToggleTodo = async (id: string) => {
    try {
      await toggleTodo(id);
    } catch (error) {
      console.error('Failed to toggle todo:', error);
      alert('Failed to update todo: ' + (error as Error).message);
    }
  };

  const handleDeleteTodo = async (id: string) => {
    try {
      await deleteTodo(id);
    } catch (error) {
      console.error('Failed to delete todo:', error);
      alert('Failed to delete todo: ' + (error as Error).message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-xl text-gray-600">Loading your todos...</p>
          <p className="text-sm text-gray-500 mt-2">Connecting to Better Query API</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Connection Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={loadTodos}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2 mx-auto"
            >
              <RefreshCw size={16} />
              <span>Retry Connection</span>
            </button>
            <div className="text-sm text-gray-500">
              <p>Make sure one of these servers is running:</p>
              <ul className="mt-2 text-xs space-y-1">
                <li>• Hono server at localhost:3000</li>
                <li>• Express server at localhost:3000</li>
                <li>• Next.js server at localhost:3000</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              <span className="text-blue-600">📝</span> React Todo
            </h1>
            <p className="text-gray-600">
              Modern todo management with React + Better Query
            </p>
          </div>

          {/* Stats Cards */}
          <StatsCards todos={todos} />

          {/* Add Todo Form */}
          <AddTodoForm onAddTodo={handleAddTodo} />

          {/* Filter Tabs */}
          <FilterTabs 
            todos={todos} 
            onFilteredTodosChange={setDisplayTodos}
          />

          {/* Todos List */}
          <div className="space-y-4">
            {displayTodos.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <div className="text-6xl mb-4">
                  {todos.length === 0 ? '📝' : '🔍'}
                </div>
                <p className="text-xl mb-2">
                  {todos.length === 0 ? 'No todos yet!' : 'No todos match the current filter'}
                </p>
                <p>
                  {todos.length === 0 
                    ? 'Add your first todo above to get started.' 
                    : 'Try changing the filter or add a new todo.'
                  }
                </p>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-800">
                    Your Todos ({displayTodos.length})
                  </h2>
                </div>
                {displayTodos.map((todo, index) => (
                  <div
                    key={todo.id}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <TodoItem
                      todo={todo}
                      onToggle={handleToggleTodo}
                      onDelete={handleDeleteTodo}
                    />
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>
            Powered by{' '}
            <span className="font-semibold text-blue-600">Better Query</span> •{' '}
            Built with <span className="font-semibold text-blue-600">React</span> & TypeScript
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;