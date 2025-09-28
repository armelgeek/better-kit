"use client";

import { useState, useEffect } from "react";
import { queryClient } from "@/lib/client";
import { todoSchema } from "@/lib/query";

type Todo = typeof todoSchema;
export function useTodos() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTodos = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await queryClient.todo.list();
      if (result.data) {
        setTodos(result.data.items || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load todos");
    } finally {
      setLoading(false);
    }
  };

  const createTodo = async (todoData: Omit<Todo, "id" | "createdAt" | "updatedAt">) => {
    try {
      const result = await queryClient.todo.create(todoData);
      if (result.data) {
        setTodos(prev => [result.data, ...prev]);
        return result.data;
      }
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : "Failed to create todo");
    }
  };

  const updateTodo = async (id: string, updates: Partial<Todo>) => {
    try {
      const result = await queryClient.todo.update(id, updates);
      if (result.data) {
        setTodos(prev => prev.map((todo) => 
          todo.id === id ? result.data : todo
        ));
        return result.data;
      }
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : "Failed to update todo");
    }
  };

  const deleteTodo = async (id: string) => {
    try {
      await queryClient.todo.delete(id);
      setTodos(prev => prev.filter((todo: Todo) => todo.id !== id));
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : "Failed to delete todo");
    }
  };

  const toggleTodo = async (id: string) => {
    const todo = todos.find(t => t.id === id);
    if (todo) {
      return updateTodo(id, { completed: !todo.completed });
    }
  };

  useEffect(() => {
    loadTodos();
  }, []);

  return {
    todos,
    loading,
    error,
    loadTodos,
    createTodo,
    updateTodo,
    deleteTodo,
    toggleTodo,
  };
}