/**
 * Example: Projects List with Resource List
 * 
 * Shows how to use ResourceList component with Better Query
 * for displaying projects in a card-based grid layout.
 */

"use client";

import { ResourceList } from "@/components/ui/resource-list";
import { useQuery } from "better-query/react";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";

interface Project {
	id: string;
	name: string;
	description: string;
	status: "active" | "completed" | "archived";
	createdAt: Date;
}

export function ProjectsListPage() {
	const router = useRouter();

	// Better Query integration - list operation
	const { list, remove } = useQuery("project");
	const { data: projects, isLoading, error } = list.useQuery();

	// Handle loading state
	if (isLoading) {
		return <div className="p-8">Loading projects...</div>;
	}

	// Handle error state
	if (error) {
		return (
			<div className="p-8 text-red-600">
				Error loading projects: {error.message}
			</div>
		);
	}

	return (
		<div className="container mx-auto py-8">
			<div className="mb-6 flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold">Projects</h1>
					<p className="text-muted-foreground">
						Manage your projects
					</p>
				</div>
				<button
					className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
					onClick={() => router.push("/projects/create")}
				>
					Create Project
				</button>
			</div>

			<ResourceList
				items={projects || []}
				renderTitle={(project) => project.name}
				renderDescription={(project) => project.description}
				renderBadge={(project) => {
					const statusColors = {
						active: "default",
						completed: "secondary",
						archived: "outline",
					} as const;

					return (
						<Badge variant={statusColors[project.status]}>
							{project.status}
						</Badge>
					);
				}}
				actions={[
					{
						label: "View",
						onClick: (project) => router.push(`/projects/${project.id}`),
						variant: "default",
					},
					{
						label: "Edit",
						onClick: (project) => router.push(`/projects/${project.id}/edit`),
						variant: "outline",
					},
					{
						label: "Delete",
						onClick: async (project) => {
							if (confirm(`Delete project "${project.name}"?`)) {
								try {
									await remove.mutateAsync({
										where: { id: project.id },
									});
								} catch (error) {
									console.error("Failed to delete project:", error);
									alert("Failed to delete project");
								}
							}
						},
						variant: "destructive",
					},
				]}
				emptyMessage="No projects yet. Create your first project!"
			/>
		</div>
	);
}
