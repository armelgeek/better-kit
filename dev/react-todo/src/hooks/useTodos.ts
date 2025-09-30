import { useEffect, useState } from "react";
import { CreateTodoData, Todo } from "../types";
import { getBetterQueryClient } from "../utils/api";

export function useTodos() {
	const [todos, setTodos] = useState<Todo[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const loadTodos = async () => {
		setLoading(true);
		setError(null);

		try {
			const client = await getBetterQueryClient();
			if (!client) {
				throw new Error(
					"Could not connect to Better Query API. Please start a backend server.",
				);
			}

			const result = await client.todo.list();
			if (result.error) {
				throw new Error(result.error.message);
			}

			setTodos(result.data || []);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to load todos");
		} finally {
			setLoading(false);
		}
	};

	const createTodo = async (todoData: CreateTodoData): Promise<Todo | null> => {
		try {
			const client = await getBetterQueryClient();
			if (!client) throw new Error("No API client available");

			const result = await client.todo.create(todoData);
			if (result.error) {
				throw new Error(result.error.message);
			}

			if (result.data) {
				setTodos((prev) => [result.data!, ...prev]);
				return result.data;
			}
			return null;
		} catch (err) {
			throw new Error(
				err instanceof Error ? err.message : "Failed to create todo",
			);
		}
	};

	const updateTodo = async (
		id: string,
		updates: Partial<Todo>,
	): Promise<Todo | null> => {
		try {
			const client = await getBetterQueryClient();
			if (!client) throw new Error("No API client available");

			const result = await client.todo.update(id, updates);
			if (result.error) {
				throw new Error(result.error.message);
			}

			if (result.data) {
				setTodos((prev) =>
					prev.map((todo) => (todo.id === id ? result.data! : todo)),
				);
				return result.data;
			}
			return null;
		} catch (err) {
			throw new Error(
				err instanceof Error ? err.message : "Failed to update todo",
			);
		}
	};

	const deleteTodo = async (id: string): Promise<void> => {
		try {
			const client = await getBetterQueryClient();
			if (!client) throw new Error("No API client available");

			const result = await client.todo.delete(id);
			if (result.error) {
				throw new Error(result.error.message);
			}

			setTodos((prev) => prev.filter((todo) => todo.id !== id));
		} catch (err) {
			throw new Error(
				err instanceof Error ? err.message : "Failed to delete todo",
			);
		}
	};

	const toggleTodo = async (id: string): Promise<void> => {
		const todo = todos.find((t) => t.id === id);
		if (todo) {
			await updateTodo(id, { completed: !todo.completed });
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
