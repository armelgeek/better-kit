/**
 * Better Query - Client-Side Features Example
 *
 * This example demonstrates all the new client-side features:
 * 1. Client-side caching with multiple strategies
 * 2. Centralized error handling
 * 3. Optimistic updates for mutations
 * 4. Automatic refetch (focus, reconnect, interval)
 * 5. Infinite scroll pagination
 */

import type { BetterQuery } from "better-query";
import { cacheClientPlugin } from "better-query/client";
import { createReactQueryClient } from "better-query/react";
import {
	ErrorBoundary,
	ErrorProvider,
	useCreate,
	useDelete,
	useErrorHandler,
	useInfiniteList,
	useList,
	useRead,
	useUpdate,
} from "better-query/react";
import React from "react";

// ============================================================================
// 1. CLIENT SETUP WITH CACHING
// ============================================================================

/**
 * Create a client with caching plugin
 */
const client = createReactQueryClient({
	baseURL: "http://localhost:3000/api/query",
	queryPlugins: [
		cacheClientPlugin({
			enabled: true,
			defaultTTL: 300, // 5 minutes
			defaultStrategy: "cache-first",
			resources: {
				// Product uses cache-first strategy
				product: {
					enabled: true,
					ttl: 600, // 10 minutes
					strategy: "cache-first",
				},
				// Orders should always fetch fresh data
				order: {
					enabled: true,
					ttl: 60, // 1 minute
					strategy: "network-first",
				},
			},
		}),
	],
});

// ============================================================================
// 2. ERROR HANDLING SETUP
// ============================================================================

/**
 * Application wrapper with error handling
 */
export function App() {
	return (
		<ErrorProvider
			options={{
				logErrors: true,
				onError: (error) => {
					// Send to error tracking service (e.g., Sentry)
					console.log("Error tracked:", error);
				},
				maxErrorHistory: 20,
			}}
		>
			<ErrorBoundary
				fallback={(error) => (
					<div>
						<h1>Something went wrong</h1>
						<p>{error.message}</p>
						<button onClick={() => window.location.reload()}>Reload</button>
					</div>
				)}
			>
				<ProductList />
			</ErrorBoundary>
		</ErrorProvider>
	);
}

// ============================================================================
// 3. AUTO-REFETCH EXAMPLE
// ============================================================================

/**
 * Product details with automatic refetch
 */
function ProductDetails({ productId }: { productId: string }) {
	const { data, loading, error, isStale, refetch } = useRead(
		client,
		"product",
		productId,
		{
			// Refetch when window gains focus
			refetchOnFocus: true,
			// Refetch when network reconnects
			refetchOnReconnect: true,
			// Refetch every 30 seconds
			refetchInterval: 30000,
			// Data is considered stale after 5 minutes
			staleTime: 300000,
			// Retry failed requests 3 times
			retry: 3,
			retryDelay: 1000,
			// Success callback
			onSuccess: (data) => {
				console.log("Product loaded:", data);
			},
			// Error callback
			onError: (error) => {
				console.error("Failed to load product:", error);
			},
		},
	);

	if (loading) return <div>Loading product...</div>;
	if (error) return <div>Error: {error.message}</div>;
	if (!data) return null;

	return (
		<div>
			<h2>{data.name}</h2>
			<p>{data.description}</p>
			<p>Price: ${data.price}</p>
			{isStale && (
				<button onClick={refetch}>Data is stale - Click to refresh</button>
			)}
		</div>
	);
}

// ============================================================================
// 4. OPTIMISTIC UPDATES EXAMPLE
// ============================================================================

/**
 * Create product with optimistic update
 */
function CreateProductForm() {
	const { handleError } = useErrorHandler();

	const { create, loading, optimisticUpdate } = useCreate(client, "product", {
		optimistic: true,
		// Generate optimistic data before the request completes
		optimisticData: (data) => ({
			id: `temp-${Date.now()}`,
			...data,
			createdAt: new Date(),
		}),
		// Success callback
		onSuccess: (data, variables) => {
			console.log("Product created successfully:", data);
		},
		// Error callback with centralized error handling
		onError: (error, variables) => {
			handleError(error, {
				resource: "product",
				operation: "create",
			});
		},
		// Called on both success and error
		onSettled: (data, error, variables) => {
			console.log("Creation completed");
		},
	});

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const formData = new FormData(e.target as HTMLFormElement);

		try {
			await create({
				name: formData.get("name"),
				description: formData.get("description"),
				price: Number(formData.get("price")),
			});
		} catch (error) {
			// Error is already handled by onError callback
		}
	};

	return (
		<form onSubmit={handleSubmit}>
			<input name="name" placeholder="Product name" required />
			<input name="description" placeholder="Description" />
			<input name="price" type="number" placeholder="Price" required />
			<button type="submit" disabled={loading}>
				{loading ? "Creating..." : "Create Product"}
			</button>

			{optimisticUpdate && (
				<div style={{ background: "#ffffcc", padding: "10px" }}>
					Creating: {optimisticUpdate.name}...
				</div>
			)}
		</form>
	);
}

/**
 * Update product with optimistic update
 */
function EditProductForm({ productId }: { productId: string }) {
	const { data: product } = useRead(client, "product", productId);
	const { handleError } = useErrorHandler();

	const { update, loading, optimisticUpdate } = useUpdate(client, "product", {
		optimistic: true,
		optimisticData: (variables) => ({
			...product,
			...variables.data,
			updatedAt: new Date(),
		}),
		onSuccess: (data) => {
			console.log("Product updated:", data);
		},
		onError: (error, variables) => {
			handleError(error, {
				resource: "product",
				operation: "update",
			});
		},
	});

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const formData = new FormData(e.target as HTMLFormElement);

		await update(productId, {
			name: formData.get("name"),
			price: Number(formData.get("price")),
		});
	};

	const displayData = optimisticUpdate || product;

	return (
		<form onSubmit={handleSubmit}>
			<h3>Editing: {displayData?.name}</h3>
			<input name="name" defaultValue={displayData?.name} required />
			<input
				name="price"
				type="number"
				defaultValue={displayData?.price}
				required
			/>
			<button type="submit" disabled={loading}>
				{loading ? "Saving..." : "Save Changes"}
			</button>
		</form>
	);
}

/**
 * Delete product with optimistic update
 */
function DeleteProductButton({ productId }: { productId: string }) {
	const { handleError } = useErrorHandler();

	const {
		delete: deleteProduct,
		loading,
		deletedId,
	} = useDelete(client, "product", {
		optimistic: true,
		onSuccess: (data, id) => {
			console.log("Product deleted:", id);
		},
		onError: (error, id) => {
			handleError(error, {
				resource: "product",
				operation: "delete",
			});
		},
	});

	const handleDelete = async () => {
		if (window.confirm("Are you sure you want to delete this product?")) {
			await deleteProduct(productId);
		}
	};

	if (deletedId === productId) {
		return <div style={{ opacity: 0.5 }}>Deleting...</div>;
	}

	return (
		<button onClick={handleDelete} disabled={loading}>
			{loading ? "Deleting..." : "Delete"}
		</button>
	);
}

// ============================================================================
// 5. PAGINATION AND INFINITE SCROLL
// ============================================================================

/**
 * Product list with pagination
 */
function ProductList() {
	const { errors, lastError, clearError } = useErrorHandler();

	const { data, loading, error, refetch } = useList(
		client,
		"product",
		{
			page: 1,
			limit: 20,
			sortBy: "createdAt",
			sortOrder: "desc",
		},
		{
			enabled: true,
			refetchOnFocus: true,
			refetchInterval: 60000, // Refetch every minute
		},
	);

	if (loading) return <div>Loading products...</div>;
	if (error) return <div>Error: {error.message}</div>;

	return (
		<div>
			<h1>Products</h1>

			{/* Display errors from error handler */}
			{lastError && (
				<div
					style={{
						background: "#ffebee",
						padding: "10px",
						marginBottom: "10px",
					}}
				>
					<strong>Error:</strong> {lastError.message}
					<button onClick={() => clearError(lastError.timestamp)}>
						Dismiss
					</button>
				</div>
			)}

			<button onClick={refetch}>Refresh</button>

			<div>
				{data?.items?.map((product: any) => (
					<div key={product.id}>
						<h3>{product.name}</h3>
						<p>${product.price}</p>
						<DeleteProductButton productId={product.id} />
					</div>
				))}
			</div>

			{/* Pagination info */}
			{data?.pagination && (
				<div>
					Page {data.pagination.page} of {data.pagination.totalPages}
					<br />
					Total: {data.pagination.total} products
				</div>
			)}
		</div>
	);
}

/**
 * Infinite scroll product list
 */
function InfiniteProductList() {
	const { data, loading, hasMore, fetchNextPage, reset } = useInfiniteList(
		client,
		"product",
		{
			sortBy: "createdAt",
			sortOrder: "desc",
		},
		{
			pageSize: 20,
			enabled: true,
		},
	);

	// Intersection Observer for infinite scroll
	const observerRef = React.useRef<HTMLDivElement>(null);

	React.useEffect(() => {
		if (!observerRef.current || !hasMore || loading) return;

		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting) {
					fetchNextPage();
				}
			},
			{ threshold: 1.0 },
		);

		observer.observe(observerRef.current);
		return () => observer.disconnect();
	}, [hasMore, loading, fetchNextPage]);

	return (
		<div>
			<h1>Infinite Scroll Products</h1>
			<button onClick={reset}>Reset</button>

			<div>
				{data.map((product: any) => (
					<div key={product.id}>
						<h3>{product.name}</h3>
						<p>${product.price}</p>
					</div>
				))}
			</div>

			{hasMore && (
				<div ref={observerRef} style={{ height: "50px", padding: "20px" }}>
					{loading ? "Loading more..." : "Scroll for more"}
				</div>
			)}
		</div>
	);
}

// ============================================================================
// 6. CACHE MANAGEMENT
// ============================================================================

/**
 * Cache management utilities
 */
function CacheManagement() {
	const handleInvalidateAll = async () => {
		await (client as any).cacheClient.invalidate();
		console.log("All cache invalidated");
	};

	const handleInvalidateProducts = async () => {
		await (client as any).cacheClient.invalidate("bq-cache:product:*");
		console.log("Product cache invalidated");
	};

	const handleGetStats = async () => {
		const stats = await (client as any).cacheClient.getStats();
		console.log("Cache stats:", stats);
	};

	const handleClearCache = async () => {
		await (client as any).cacheClient.clearCache();
		console.log("Cache cleared");
	};

	return (
		<div>
			<h2>Cache Management</h2>
			<button onClick={handleInvalidateAll}>Invalidate All Cache</button>
			<button onClick={handleInvalidateProducts}>
				Invalidate Product Cache
			</button>
			<button onClick={handleGetStats}>Get Cache Stats</button>
			<button onClick={handleClearCache}>Clear All Cache</button>
		</div>
	);
}

// ============================================================================
// 7. ERROR DISPLAY COMPONENT
// ============================================================================

/**
 * Global error display
 */
function ErrorDisplay() {
	const { errors, clearErrors } = useErrorHandler();

	if (errors.length === 0) return null;

	return (
		<div
			style={{
				position: "fixed",
				bottom: 0,
				right: 0,
				maxWidth: "400px",
				padding: "20px",
				background: "white",
				boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
			}}
		>
			<h3>Recent Errors</h3>
			<button onClick={clearErrors}>Clear All</button>
			{errors.map((error) => (
				<div
					key={error.timestamp}
					style={{
						padding: "10px",
						marginTop: "10px",
						background: "#ffebee",
						borderRadius: "4px",
					}}
				>
					<strong>{error.type}</strong>: {error.message}
					{error.resource && <div>Resource: {error.resource}</div>}
					{error.operation && <div>Operation: {error.operation}</div>}
				</div>
			))}
		</div>
	);
}

export {
	App,
	ProductDetails,
	CreateProductForm,
	EditProductForm,
	DeleteProductButton,
	ProductList,
	InfiniteProductList,
	CacheManagement,
	ErrorDisplay,
};
