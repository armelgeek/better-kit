"use client";

import { useState } from "react";
import { useTodos } from "./hooks/useTodos";

export default function TodoApp() {
	const {
		todos,
		loading,
		error,
		createTodo,
		toggleTodo,
		deleteTodo,
		updateTodo,
	} = useTodos();
	const [newTodo, setNewTodo] = useState({
		title: "",
		description: "",
		priority: "medium" as const,
		category: "",
		dueDate: new Date(),
		tags: [],
	});
	const [editingTodo, setEditingTodo] = useState<any>(null);
	const [editForm, setEditForm] = useState({
		title: "",
		description: "",
		priority: "medium" as const,
		category: "",
		dueDate: new Date(),
		tags: [],
	});

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!newTodo.title.trim()) return;

		try {
			const todoData = {
				...newTodo,
				completed: false,
			};

			await createTodo(todoData);

			// Reset form
			setNewTodo({
				title: "",
				description: "",
				priority: "medium",
				category: "",
				dueDate: new Date(),
				tags: [],
			});
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
		setEditForm({
			title: todo.title,
			description: todo.description || "",
			priority: todo.priority,
			category: todo.category || "",
			dueDate: new Date(todo.dueDate),
			tags: todo.tags || [],
		});
	};

	const handleEditCancel = () => {
		setEditingTodo(null);
		setEditForm({
			title: "",
			description: "",
			priority: "medium",
			category: "",
			dueDate: new Date(),
			tags: [],
		});
	};

	const handleEditSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!editForm.title.trim() || !editingTodo?.id) return;

		try {
			const updatedTodo = {
				...editingTodo,
				...editForm,
			};

			await updateTodo(editingTodo.id, updatedTodo);
			setEditingTodo(null);

			// Reset form
			setEditForm({
				title: "",
				description: "",
				priority: "medium",
				category: "",
				dueDate: new Date(),
				tags: [],
			});
		} catch (err) {
			console.error("Failed to update todo:", err);
		}
	};

	const priorityColors = {
		low: "bg-green-100 text-green-800",
		medium: "bg-yellow-100 text-yellow-800",
		high: "bg-red-100 text-red-800",
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-gray-100 flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
					<p className="mt-4 text-gray-600">Loading todos...</p>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="min-h-screen bg-gray-100 flex items-center justify-center">
				<div className="bg-white p-8 rounded-lg shadow-lg text-center">
					<div className="text-red-500 text-6xl mb-4">⚠️</div>
					<h2 className="text-2xl font-bold text-gray-800 mb-2">
						Error Loading Todos
					</h2>
					<p className="text-gray-600">{error}</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-100 py-8">
			<div className="container mx-auto px-4 max-w-4xl">
				<div className="bg-white rounded-lg shadow-lg p-6">
					{/* Header */}
					<div className="text-center mb-8">
						<h1 className="text-3xl font-bold text-gray-800 mb-2">Todo App</h1>
						<p className="text-gray-600">
							Simple and elegant todo management with Next.js + Better Query
						</p>
					</div>

					{/* Add Todo Form */}
					<div className="mb-8 p-6 bg-gray-50 rounded-lg">
						<h2 className="text-xl font-semibold mb-4">Add New Todo</h2>
						<form onSubmit={handleSubmit} className="space-y-4">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<input
									type="text"
									placeholder="Todo title..."
									value={newTodo.title}
									onChange={(e) =>
										setNewTodo({ ...newTodo, title: e.target.value })
									}
									required
									className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
								/>
								<select
									value={newTodo.priority}
									onChange={(e) =>
										setNewTodo({ ...newTodo, priority: e.target.value as any })
									}
									className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
								>
									<option value="low">Low Priority</option>
									<option value="medium">Medium Priority</option>
									<option value="high">High Priority</option>
								</select>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<input
									type="text"
									placeholder="Category (optional)"
									value={newTodo.category}
									onChange={(e) =>
										setNewTodo({ ...newTodo, category: e.target.value })
									}
									className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
								/>
								<input
									type="date"
									value={new Date(newTodo.dueDate).toISOString().split("T")[0]}
									onChange={(e) =>
										setNewTodo({
											...newTodo,
											dueDate: new Date(e.target.value),
										})
									}
									className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
								/>
							</div>

							<textarea
								placeholder="Description (optional)"
								value={newTodo.description}
								onChange={(e) =>
									setNewTodo({ ...newTodo, description: e.target.value })
								}
								className="border rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
								rows={3}
							/>

							<button
								type="submit"
								className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
							>
								Add Todo
							</button>
						</form>
					</div>

					{/* Edit Todo Modal/Form */}
					{editingTodo && (
						<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
							<div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
								<h2 className="text-xl font-semibold mb-4">Edit Todo</h2>
								<form onSubmit={handleEditSubmit} className="space-y-4">
									<input
										type="text"
										placeholder="Todo title..."
										value={editForm.title}
										onChange={(e) =>
											setEditForm({ ...editForm, title: e.target.value })
										}
										required
										className="border rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
									/>

									<select
										value={editForm.priority}
										onChange={(e) =>
											setEditForm({
												...editForm,
												priority: e.target.value as any,
											})
										}
										className="border rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
									>
										<option value="low">Low Priority</option>
										<option value="medium">Medium Priority</option>
										<option value="high">High Priority</option>
									</select>

									<input
										type="text"
										placeholder="Category (optional)"
										value={editForm.category}
										onChange={(e) =>
											setEditForm({ ...editForm, category: e.target.value })
										}
										className="border rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
									/>

									<input
										type="date"
										value={
											new Date(editForm.dueDate).toISOString().split("T")[0]
										}
										onChange={(e) =>
											setEditForm({
												...editForm,
												dueDate: new Date(e.target.value),
											})
										}
										className="border rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
									/>

									<textarea
										placeholder="Description (optional)"
										value={editForm.description}
										onChange={(e) =>
											setEditForm({ ...editForm, description: e.target.value })
										}
										className="border rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
										rows={3}
									/>

									<div className="flex space-x-3 pt-4">
										<button
											type="submit"
											className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg font-medium transition-colors"
										>
											Save Changes
										</button>
										<button
											type="button"
											onClick={handleEditCancel}
											className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 rounded-lg font-medium transition-colors"
										>
											Cancel
										</button>
									</div>
								</form>
							</div>
						</div>
					)}

					{/* Todos List */}
					<div>
						<div className="flex justify-between items-center mb-4">
							<h2 className="text-xl font-semibold">Your Todos</h2>
							<span className="text-gray-500">{todos.length} todos</span>
						</div>

						{todos.length === 0 ? (
							<div className="text-center py-12 text-gray-500">
								<div className="text-6xl mb-4">📝</div>
								<p className="text-lg">No todos yet!</p>
								<p>Add your first todo above to get started.</p>
							</div>
						) : (
							<div className="space-y-3">
								{todos.map((todo) => (
									<div
										key={todo.id}
										className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
									>
										<div className="flex items-start justify-between">
											<div className="flex items-start space-x-3 flex-1">
												<input
													type="checkbox"
													checked={todo.completed}
													onChange={() => {
														if (todo.id) {
															handleToggle(todo.id);
														} else {
															console.warn("Todo ID is missing");
														}
													}}
													className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
												/>
												<div className="flex-1">
													<h3
														className={`font-medium ${
															todo.completed
																? "text-gray-500 line-through"
																: "text-gray-800"
														}`}
													>
														{todo.title}
													</h3>
													{todo.description && (
														<p className="text-gray-600 text-sm mt-1">
															{todo.description}
														</p>
													)}
													<div className="flex items-center space-x-4 text-xs text-gray-500 mt-2">
														<span
															className={`px-2 py-1 rounded ${
																priorityColors[todo.priority]
															}`}
														>
															{todo.priority} priority
														</span>
														{todo.category && (
															<span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
																#{todo.category}
															</span>
														)}
														{todo.dueDate && (
															<span className="text-orange-600">
																Due:{" "}
																{new Date(todo.dueDate).toLocaleDateString()}
															</span>
														)}
													</div>
												</div>
											</div>
											<div className="flex space-x-2">
												<button
													onClick={() => handleEditStart(todo)}
													className="text-blue-500 hover:text-blue-700 p-1 rounded transition-colors"
													title="Edit todo"
												>
													<svg
														className="w-5 h-5"
														fill="none"
														stroke="currentColor"
														viewBox="0 0 24 24"
													>
														<path
															strokeLinecap="round"
															strokeLinejoin="round"
															strokeWidth={2}
															d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
														/>
													</svg>
												</button>
												<button
													onClick={() => todo.id && handleDelete(todo.id)}
													className="text-red-500 hover:text-red-700 p-1 rounded transition-colors"
													title="Delete todo"
												>
													<svg
														className="w-5 h-5"
														fill="none"
														stroke="currentColor"
														viewBox="0 0 24 24"
													>
														<path
															strokeLinecap="round"
															strokeLinejoin="round"
															strokeWidth={2}
															d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
														/>
													</svg>
												</button>
											</div>
										</div>
									</div>
								))}
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
