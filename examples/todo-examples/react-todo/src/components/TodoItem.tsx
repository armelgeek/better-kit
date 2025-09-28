import React from 'react';
import { Check, Trash2, Calendar, Tag } from 'lucide-react';
import { Todo } from '../types';

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function TodoItem({ todo, onToggle, onDelete }: TodoItemProps) {
  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this todo?')) {
      await onDelete(todo.id!);
    }
  };

  const getPriorityClass = (priority: string) => {
    switch (priority) {
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'low': return '🟢';
      case 'medium': return '🟡';
      case 'high': return '🔴';
      default: return '⚪';
    }
  };

  return (
    <div className="bg-white border-2 border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:border-blue-300 animate-fade-in">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4 flex-1">
          <button
            onClick={() => onToggle(todo.id!)}
            className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
              todo.completed
                ? 'bg-green-500 border-green-500 text-white'
                : 'border-gray-300 hover:border-green-500'
            }`}
          >
            {todo.completed && <Check size={16} />}
          </button>
          
          <div className="flex-1">
            <h3
              className={`text-lg font-semibold mb-1 transition-all duration-200 ${
                todo.completed
                  ? 'text-gray-500 line-through'
                  : 'text-gray-800'
              }`}
            >
              {todo.title}
            </h3>
            
            {todo.description && (
              <p className="text-gray-600 text-sm mb-3">
                {todo.description}
              </p>
            )}
            
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold border ${getPriorityClass(todo.priority)}`}
              >
                {getPriorityIcon(todo.priority)} {todo.priority.toUpperCase()}
              </span>
              
              {todo.category && (
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium border border-blue-200 flex items-center space-x-1">
                  <Tag size={12} />
                  <span>#{todo.category}</span>
                </span>
              )}
              
              {todo.dueDate && (
                <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-xs font-medium border border-orange-200 flex items-center space-x-1">
                  <Calendar size={12} />
                  <span>{new Date(todo.dueDate).toLocaleDateString()}</span>
                </span>
              )}
              
              {todo.completed && (
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-bold border border-green-200">
                  ✅ COMPLETED
                </span>
              )}
            </div>
            
            {(todo.createdAt || todo.updatedAt) && (
              <div className="mt-2 text-xs text-gray-400">
                {todo.createdAt && (
                  <span>Created: {new Date(todo.createdAt).toLocaleDateString()}</span>
                )}
                {todo.updatedAt && todo.createdAt && <span> • </span>}
                {todo.updatedAt && (
                  <span>Updated: {new Date(todo.updatedAt).toLocaleDateString()}</span>
                )}
              </div>
            )}
          </div>
        </div>
        
        <button
          onClick={handleDelete}
          className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-all duration-200 ml-2"
          title="Delete todo"
        >
          <Trash2 size={20} />
        </button>
      </div>
    </div>
  );
}