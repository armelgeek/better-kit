"use client";

import { useTodos } from "@/hooks/useTodos";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {  useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

const todoSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title must be less than 200 characters"),
  description: z.string().max(500, "Description must be less than 500 characters").transform(val => val || undefined).optional(),
  priority: z.enum(["low", "medium", "high"]),
  category: z.string().max(100, "Category must be less than 100 characters").transform(val => val || undefined).optional(),
  dueDate: z.string().transform(val => val || undefined).optional(), // Will be converted to Date later
});

type TodoFormData = z.infer<typeof todoSchema>;

export default function TodoApp() {
  const { data: session } = useSession();
  const router = useRouter();
  const { todos, loading, error, createTodo, toggleTodo, deleteTodo, updateTodo } = useTodos();

  const addTodoForm = useForm<TodoFormData>({
    resolver: zodResolver(todoSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "medium",
      category: "",
      dueDate: "",
    },
  });

  // React Hook Form for editing todos
  const editTodoForm = useForm<TodoFormData>({
    resolver: zodResolver(todoSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "medium",
      category: "",
      dueDate: "",
    },
  });

  const [editingTodo, setEditingTodo] = useState<any>(null);

  const handleSubmit = async (data: TodoFormData) => {
    try {
      const normalizedDueDate = data.dueDate ? new Date(data.dueDate) : undefined;
      const todoData = {
        ...data,
        completed: false,
        dueDate: normalizedDueDate,
        tags: [] as string[],
      };
      await createTodo(todoData);

      addTodoForm.reset();
    } catch (err) {
      console.error("Failed to create todo:", err);
    }
  };

  const handleToggle = async (todoId: string) => {
    try {
      await toggleTodo(todoId);
    } catch (err) {
      console.error("Failed to toggle todo:", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this todo?")) {
      try {
        await deleteTodo(id);
      } catch (err) {
        console.error("Failed to delete todo:", err);
      }
    }
  };

  const handleEditStart = (todo: any) => {
    setEditingTodo(todo);
    const dueDateStr = todo.dueDate ? new Date(todo.dueDate).toISOString().split('T')[0] : "";
    editTodoForm.reset({
      title: todo.title,
      description: todo.description || "",
      priority: todo.priority,
      category: todo.category || "",
      dueDate: dueDateStr,
    });
  };

  const handleEditCancel = () => {
    setEditingTodo(null);
    editTodoForm.reset();
  };

  const handleEditSubmit = async (data: TodoFormData) => {
    if (!editingTodo?.id) return;

    try {
      const updatedTodo = {
        ...editingTodo,
        ...data,
        createdAt: editingTodo.createdAt,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      };

      const { completed, createdAt, updatedAt, ...rest } = updatedTodo;
      await updateTodo(editingTodo.id, rest);
      setEditingTodo(null);

      editTodoForm.reset();
    } catch (err) {
      console.error("Failed to update todo:", err);
    }
  };
 

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="mx-auto px-4 max-w-xl">
        <form onSubmit={addTodoForm.handleSubmit(handleSubmit)} className="flex gap-2 mb-6">
          <input
            type="text"
            placeholder="Add a todo..."
            {...addTodoForm.register("title")}
            className="border px-3 py-2 rounded w-full"
          />
          <button
            type="submit"
            disabled={addTodoForm.formState.isSubmitting}
            className="px-4 py-2 rounded bg-blue-500 text-white"
          >
            {addTodoForm.formState.isSubmitting ? "..." : "+"}
          </button>
        </form>
        {addTodoForm.formState.errors.title && (
          <p className="text-red-500 text-sm mb-2">{addTodoForm.formState.errors.title.message}</p>
        )}
        <ul className="space-y-2">
          {todos.length === 0 ? (
            <li className="text-gray-400 text-center py-8">No todos yet.</li>
          ) : (
            todos.map((todo) => (
              <li key={todo.id} className="flex items-center gap-2 border-b py-2">
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => todo.id && handleToggle(todo.id)}
                  className="w-4 h-4"
                />
                {editingTodo?.id === todo.id ? (
                  <form onSubmit={editTodoForm.handleSubmit(handleEditSubmit)} className="flex-1 flex gap-2">
                    <input
                      type="text"
                      {...editTodoForm.register("title")}
                      className="border px-2 py-1 rounded w-full"
                    />
                    <button type="submit" className="px-2 py-1 bg-blue-500 text-white rounded">Save</button>
                    <button type="button" onClick={handleEditCancel} className="px-2 py-1 bg-gray-200 rounded">Cancel</button>
                  </form>
                ) : (
                  <>
                    <span className={`flex-1 ${todo.completed ? "line-through text-gray-400" : ""}`}>{todo.title}</span>
                    <button onClick={() => handleEditStart(todo)} className="text-blue-500 px-2">Edit</button>
                    <button onClick={() => todo.id && handleDelete(todo.id)} className="text-red-500 px-2">Delete</button>
                  </>
                )}
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}