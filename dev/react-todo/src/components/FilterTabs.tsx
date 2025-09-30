import { Filter } from "lucide-react";
import React, { useState } from "react";
import { Todo } from "../types";

type FilterType = "all" | "pending" | "completed" | "high" | "medium" | "low";

interface FilterTabsProps {
	todos: Todo[];
	onFilteredTodosChange: (filteredTodos: Todo[]) => void;
}

export function FilterTabs({ todos, onFilteredTodosChange }: FilterTabsProps) {
	const [activeFilter, setActiveFilter] = useState<FilterType>("all");

	const filters = [
		{ id: "all", label: "All", count: todos.length },
		{
			id: "pending",
			label: "Pending",
			count: todos.filter((t) => !t.completed).length,
		},
		{
			id: "completed",
			label: "Completed",
			count: todos.filter((t) => t.completed).length,
		},
		{
			id: "high",
			label: "High Priority",
			count: todos.filter((t) => t.priority === "high").length,
		},
		{
			id: "medium",
			label: "Medium Priority",
			count: todos.filter((t) => t.priority === "medium").length,
		},
		{
			id: "low",
			label: "Low Priority",
			count: todos.filter((t) => t.priority === "low").length,
		},
	];

	const handleFilterChange = (filterId: FilterType) => {
		setActiveFilter(filterId);

		let filteredTodos: Todo[] = [];

		switch (filterId) {
			case "all":
				filteredTodos = todos;
				break;
			case "pending":
				filteredTodos = todos.filter((t) => !t.completed);
				break;
			case "completed":
				filteredTodos = todos.filter((t) => t.completed);
				break;
			case "high":
			case "medium":
			case "low":
				filteredTodos = todos.filter((t) => t.priority === filterId);
				break;
		}

		onFilteredTodosChange(filteredTodos);
	};

	return (
		<div className="mb-6">
			<div className="flex items-center space-x-2 mb-4">
				<Filter size={18} className="text-gray-500" />
				<h3 className="text-lg font-semibold text-gray-800">Filter Todos</h3>
			</div>

			<div className="flex flex-wrap gap-2">
				{filters.map((filter) => (
					<button
						key={filter.id}
						onClick={() => handleFilterChange(filter.id as FilterType)}
						className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 ${
							activeFilter === filter.id
								? "bg-blue-600 text-white shadow-lg"
								: "bg-gray-200 text-gray-700 hover:bg-gray-300"
						}`}
					>
						<span>{filter.label}</span>
						{filter.count > 0 && (
							<span
								className={`text-xs px-2 py-1 rounded-full ${
									activeFilter === filter.id
										? "bg-blue-500 text-white"
										: "bg-gray-300 text-gray-600"
								}`}
							>
								{filter.count}
							</span>
						)}
					</button>
				))}
			</div>
		</div>
	);
}
