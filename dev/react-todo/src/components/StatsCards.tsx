import React from 'react';
import { BarChart3, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { Todo } from '../types';

interface StatsCardsProps {
  todos: Todo[];
}

export function StatsCards({ todos }: StatsCardsProps) {
  const totalTodos = todos.length;
  const completedTodos = todos.filter(t => t.completed).length;
  const pendingTodos = todos.filter(t => !t.completed).length;
  const highPriorityTodos = todos.filter(t => t.priority === 'high' && !t.completed).length;
  const completionRate = totalTodos > 0 ? Math.round((completedTodos / totalTodos) * 100) : 0;

  const stats = [
    {
      title: 'Total Todos',
      value: totalTodos,
      icon: BarChart3,
      color: 'from-blue-500 to-blue-600',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Completed',
      value: completedTodos,
      icon: CheckCircle,
      color: 'from-green-500 to-green-600',
      textColor: 'text-green-600',
      bgColor: 'bg-green-50',
      subtitle: `${completionRate}% done`,
    },
    {
      title: 'Pending',
      value: pendingTodos,
      icon: Clock,
      color: 'from-orange-500 to-orange-600',
      textColor: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'High Priority',
      value: highPriorityTodos,
      icon: AlertTriangle,
      color: 'from-red-500 to-red-600',
      textColor: 'text-red-600',
      bgColor: 'bg-red-50',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {stats.map((stat, index) => {
        const IconComponent = stat.icon;
        return (
          <div
            key={stat.title}
            className={`${stat.bgColor} p-6 rounded-xl border-2 border-gray-100 hover:border-gray-200 transition-all duration-300 hover:shadow-lg transform hover:scale-105 animate-bounce-in`}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="flex items-center justify-between mb-2">
              <IconComponent className={`w-8 h-8 ${stat.textColor}`} />
            </div>
            <div className={`text-3xl font-bold ${stat.textColor} mb-1`}>
              {stat.value}
            </div>
            <div className="text-sm font-medium text-gray-600">
              {stat.title}
            </div>
            {stat.subtitle && (
              <div className={`text-xs ${stat.textColor} mt-1 font-medium`}>
                {stat.subtitle}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}