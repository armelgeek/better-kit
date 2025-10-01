"use client";
import { useCallback, useEffect, useState } from "react";
import type { AdminListParams, AdminListResponse } from "../../types";
import type { AdminClient } from "../index";

/**
 * Hook for list operations with admin formatting
 */
export function useAdminList<TData = any>(
	client: AdminClient,
	resource: string,
	initialParams?: AdminListParams,
) {
	const [data, setData] = useState<AdminListResponse<TData> | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<Error | null>(null);
	const [params, setParams] = useState<AdminListParams>(initialParams || {});

	const fetch = useCallback(
		async (newParams?: AdminListParams) => {
			setLoading(true);
			setError(null);
			const queryParams = newParams || params;
			try {
				const result = await client.list<TData>(resource, queryParams);
				setData(result);
				if (newParams) setParams(newParams);
			} catch (err) {
				setError(err as Error);
			} finally {
				setLoading(false);
			}
		},
		[client, resource, params],
	);

	// Auto-fetch on mount
	useEffect(() => {
		fetch();
	}, []);

	const setPage = (page: number) => {
		fetch({ ...params, page });
	};

	const setPerPage = (perPage: number) => {
		fetch({ ...params, perPage, page: 1 });
	};

	const setSort = (sortBy: string, sortOrder: "asc" | "desc" = "asc") => {
		fetch({ ...params, sortBy, sortOrder });
	};

	const setSearch = (search: string) => {
		fetch({ ...params, search, page: 1 });
	};

	const setFilters = (filters: Record<string, any>) => {
		fetch({ ...params, filters, page: 1 });
	};

	return {
		data: data?.data || [],
		total: data?.total || 0,
		page: data?.page || 1,
		perPage: data?.perPage || 10,
		totalPages: data?.totalPages || 0,
		loading,
		error,
		refetch: fetch,
		setPage,
		setPerPage,
		setSort,
		setSearch,
		setFilters,
		params,
	};
}

/**
 * Hook for get operation
 */
export function useAdminGet<TData = any>(
	client: AdminClient,
	resource: string,
	id?: string,
) {
	const [data, setData] = useState<TData | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<Error | null>(null);

	const fetch = useCallback(
		async (fetchId?: string) => {
			const targetId = fetchId || id;
			if (!targetId) return;

			setLoading(true);
			setError(null);
			try {
				const result = await client.get<TData>(resource, targetId);
				setData(result);
			} catch (err) {
				setError(err as Error);
			} finally {
				setLoading(false);
			}
		},
		[client, resource, id],
	);

	// Auto-fetch if ID is provided
	useEffect(() => {
		if (id) {
			fetch();
		}
	}, [id]);

	return {
		data,
		loading,
		error,
		refetch: fetch,
	};
}

/**
 * Hook for create operation
 */
export function useAdminCreate<TData = any>(
	client: AdminClient,
	resource: string,
) {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<Error | null>(null);

	const create = useCallback(
		async (data: any): Promise<TData | null> => {
			setLoading(true);
			setError(null);
			try {
				const result = await client.create<TData>(resource, data);
				return result;
			} catch (err) {
				setError(err as Error);
				return null;
			} finally {
				setLoading(false);
			}
		},
		[client, resource],
	);

	return {
		create,
		loading,
		error,
	};
}

/**
 * Hook for update operation
 */
export function useAdminUpdate<TData = any>(
	client: AdminClient,
	resource: string,
) {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<Error | null>(null);

	const update = useCallback(
		async (id: string, data: any): Promise<TData | null> => {
			setLoading(true);
			setError(null);
			try {
				const result = await client.update<TData>(resource, id, data);
				return result;
			} catch (err) {
				setError(err as Error);
				return null;
			} finally {
				setLoading(false);
			}
		},
		[client, resource],
	);

	return {
		update,
		loading,
		error,
	};
}

/**
 * Hook for delete operation
 */
export function useAdminDelete(client: AdminClient, resource: string) {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<Error | null>(null);

	const deleteItem = useCallback(
		async (id: string): Promise<boolean> => {
			setLoading(true);
			setError(null);
			try {
				await client.delete(resource, id);
				return true;
			} catch (err) {
				setError(err as Error);
				return false;
			} finally {
				setLoading(false);
			}
		},
		[client, resource],
	);

	const bulkDelete = useCallback(
		async (ids: string[]): Promise<boolean> => {
			setLoading(true);
			setError(null);
			try {
				await client.bulkDelete(resource, ids);
				return true;
			} catch (err) {
				setError(err as Error);
				return false;
			} finally {
				setLoading(false);
			}
		},
		[client, resource],
	);

	return {
		delete: deleteItem,
		bulkDelete,
		loading,
		error,
	};
}

/**
 * Combined hook for a specific resource with all operations
 */
export function useAdminResource<TData = any>(
	client: AdminClient,
	resource: string,
) {
	return {
		useList: (params?: AdminListParams) =>
			useAdminList<TData>(client, resource, params),
		useGet: (id?: string) => useAdminGet<TData>(client, resource, id),
		useCreate: () => useAdminCreate<TData>(client, resource),
		useUpdate: () => useAdminUpdate<TData>(client, resource),
		useDelete: () => useAdminDelete(client, resource),
	};
}
