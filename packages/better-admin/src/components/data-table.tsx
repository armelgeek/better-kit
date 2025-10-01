import * as React from "react";
import { useState } from "react";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "./ui/table";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

export interface DataTableColumn<T = any> {
	key: string;
	label: string;
	sortable?: boolean;
	render?: (value: any, row: T) => React.ReactNode;
}

export interface DataTableAction<T = any> {
	label: string;
	onClick: (row: T) => void;
	variant?: "default" | "destructive" | "outline" | "secondary" | "ghost";
	icon?: React.ReactNode;
}

export interface DataTableProps<T = any> {
	data: T[];
	columns: DataTableColumn<T>[];
	actions?: DataTableAction<T>[];
	loading?: boolean;
	searchable?: boolean;
	searchPlaceholder?: string;
	title?: string;
	description?: string;
	// Pagination
	page?: number;
	totalPages?: number;
	onPageChange?: (page: number) => void;
	// Sorting
	sortBy?: string;
	sortOrder?: "asc" | "desc";
	onSort?: (column: string) => void;
	// Search
	onSearch?: (query: string) => void;
	// Empty state
	emptyMessage?: string;
}

export function DataTable<T extends Record<string, any>>({
	data,
	columns,
	actions,
	loading,
	searchable,
	searchPlaceholder = "Search...",
	title,
	description,
	page = 1,
	totalPages = 1,
	onPageChange,
	sortBy,
	sortOrder = "asc",
	onSort,
	onSearch,
	emptyMessage = "No data found.",
}: DataTableProps<T>) {
	const [searchQuery, setSearchQuery] = useState("");

	const handleSearchSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (onSearch) {
			onSearch(searchQuery);
		}
	};

	const handleSort = (column: DataTableColumn<T>) => {
		if (column.sortable && onSort) {
			onSort(column.key);
		}
	};

	return (
		<Card>
			{(title || description || searchable) && (
				<CardHeader>
					<div className="flex items-center justify-between">
						<div>
							{title && <CardTitle>{title}</CardTitle>}
							{description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
						</div>
						{searchable && (
							<form onSubmit={handleSearchSubmit} className="flex gap-2">
								<Input
									type="text"
									placeholder={searchPlaceholder}
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									className="w-64"
								/>
								<Button type="submit" variant="outline">
									Search
								</Button>
							</form>
						)}
					</div>
				</CardHeader>
			)}
			<CardContent>
				{loading ? (
					<div className="flex justify-center items-center h-64">
						<p className="text-gray-500">Loading...</p>
					</div>
				) : (
					<>
						<div className="rounded-lg border border-gray-200 overflow-hidden">
							<Table>
								<TableHeader>
									<TableRow>
										{columns.map((column) => (
											<TableHead
												key={column.key}
												className={column.sortable ? "cursor-pointer hover:bg-gray-100" : ""}
												onClick={() => column.sortable && handleSort(column)}
											>
												<div className="flex items-center gap-1">
													{column.label}
													{column.sortable && sortBy === column.key && (
														<span className="text-xs">
															{sortOrder === "asc" ? "↑" : "↓"}
														</span>
													)}
												</div>
											</TableHead>
										))}
										{actions && actions.length > 0 && (
											<TableHead className="text-right">Actions</TableHead>
										)}
									</TableRow>
								</TableHeader>
								<TableBody>
									{data.length === 0 ? (
										<TableRow>
											<TableCell
												colSpan={columns.length + (actions ? 1 : 0)}
												className="text-center py-8 text-gray-500"
											>
												{emptyMessage}
											</TableCell>
										</TableRow>
									) : (
										data.map((row, index) => (
											<TableRow key={index}>
												{columns.map((column) => (
													<TableCell key={column.key}>
														{column.render
															? column.render(row[column.key], row)
															: row[column.key]}
													</TableCell>
												))}
												{actions && actions.length > 0 && (
													<TableCell className="text-right space-x-2">
														{actions.map((action, actionIndex) => (
															<Button
																key={actionIndex}
																variant={action.variant || "ghost"}
																size="sm"
																onClick={() => action.onClick(row)}
															>
																{action.icon}
																{action.label}
															</Button>
														))}
													</TableCell>
												)}
											</TableRow>
										))
									)}
								</TableBody>
							</Table>
						</div>

						{/* Pagination */}
						{totalPages > 1 && onPageChange && (
							<div className="flex items-center justify-between mt-4">
								<p className="text-sm text-gray-500">
									Page {page} of {totalPages}
								</p>
								<div className="flex gap-2">
									<Button
										variant="outline"
										size="sm"
										onClick={() => onPageChange(page - 1)}
										disabled={page === 1}
									>
										Previous
									</Button>
									<Button
										variant="outline"
										size="sm"
										onClick={() => onPageChange(page + 1)}
										disabled={page === totalPages}
									>
										Next
									</Button>
								</div>
							</div>
						)}
					</>
				)}
			</CardContent>
		</Card>
	);
}
