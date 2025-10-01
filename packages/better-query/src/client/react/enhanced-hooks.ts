"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { BetterQuery } from "../../query";
import type { ReactQueryClient } from "./index";

/**
 * Options for query hooks
 */
export interface UseQueryOptions {
	/** Enable automatic fetching on mount */
	enabled?: boolean;
	/** Refetch on window focus */
	refetchOnFocus?: boolean;
	/** Refetch on network reconnect */
	refetchOnReconnect?: boolean;
	/** Refetch interval in milliseconds */
	refetchInterval?: number;
	/** Stale time in milliseconds - data is considered fresh during this time */
	staleTime?: number;
	/** Error retry count */
	retry?: number;
	/** Error retry delay in milliseconds */
	retryDelay?: number;
	/** On success callback */
	onSuccess?: (data: any) => void;
	/** On error callback */
	onError?: (error: any) => void;
}

/**
 * Options for mutation hooks
 */
export interface UseMutationOptions<TData = any, TVariables = any> {
	/** Enable optimistic updates */
	optimistic?: boolean;
	/** Function to generate optimistic data */
	optimisticData?: (variables: TVariables) => TData;
	/** Mutations to invalidate after success */
	invalidateQueries?: string[];
	/** On success callback */
	onSuccess?: (data: TData, variables: TVariables) => void;
	/** On error callback */
	onError?: (error: any, variables: TVariables) => void;
	/** On settled callback (called on both success and error) */
	onSettled?: (
		data: TData | undefined,
		error: any,
		variables: TVariables,
	) => void;
}

/**
 * Enhanced useRead hook with automatic refetch and caching
 */
export function useRead<T extends BetterQuery = BetterQuery>(
	client: ReactQueryClient<T>,
	resourceName: string,
	id?: string,
	options: UseQueryOptions = {},
) {
	const {
		enabled = true,
		refetchOnFocus = false,
		refetchOnReconnect = false,
		refetchInterval,
		staleTime = 0,
		retry = 0,
		retryDelay = 1000,
		onSuccess,
		onError,
	} = options;

	const [data, setData] = useState<any>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<any>(null);
	const [isStale, setIsStale] = useState(false);

	const lastFetchTimeRef = useRef<number>(0);
	const retryCountRef = useRef(0);
	const isMountedRef = useRef(true);

	const read = useCallback(
		async (readId?: string, opts?: any) => {
			const targetId = readId || id;
			if (!targetId)
				return { data: null, error: { message: "ID is required" } };

			setLoading(true);
			setError(null);

			try {
				const result = await (client as any)[resourceName].read(targetId, opts);

				if (!isMountedRef.current) return result;

				if (result.error) {
					setError(result.error);
					if (onError) onError(result.error);

					// Retry logic
					if (retryCountRef.current < retry) {
						retryCountRef.current++;
						setTimeout(() => read(targetId, opts), retryDelay);
						return result;
					}
				} else {
					setData(result.data);
					lastFetchTimeRef.current = Date.now();
					setIsStale(false);
					retryCountRef.current = 0;
					if (onSuccess) onSuccess(result.data);
				}

				return result;
			} catch (err) {
				if (!isMountedRef.current) return { data: null, error: err };
				setError(err);
				if (onError) onError(err);
				return { data: null, error: err };
			} finally {
				if (isMountedRef.current) {
					setLoading(false);
				}
			}
		},
		[resourceName, id, client, retry, retryDelay, onSuccess, onError],
	);

	// Check if data is stale
	useEffect(() => {
		if (staleTime > 0 && lastFetchTimeRef.current > 0) {
			const checkStale = () => {
				const elapsed = Date.now() - lastFetchTimeRef.current;
				setIsStale(elapsed > staleTime);
			};

			const interval = setInterval(checkStale, 1000);
			return () => clearInterval(interval);
		}
	}, [staleTime]);

	// Auto-fetch on mount
	useEffect(() => {
		if (enabled && id) {
			read();
		}
	}, [enabled, id, read]);

	// Refetch on window focus
	useEffect(() => {
		if (!refetchOnFocus) return;

		const handleFocus = () => {
			if (id && isStale) {
				read();
			}
		};

		window.addEventListener("focus", handleFocus);
		return () => window.removeEventListener("focus", handleFocus);
	}, [refetchOnFocus, id, isStale, read]);

	// Refetch on network reconnect
	useEffect(() => {
		if (!refetchOnReconnect) return;

		const handleOnline = () => {
			if (id) {
				read();
			}
		};

		window.addEventListener("online", handleOnline);
		return () => window.removeEventListener("online", handleOnline);
	}, [refetchOnReconnect, id, read]);

	// Refetch on interval
	useEffect(() => {
		if (!refetchInterval || !id) return;

		const interval = setInterval(() => {
			read();
		}, refetchInterval);

		return () => clearInterval(interval);
	}, [refetchInterval, id, read]);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			isMountedRef.current = false;
		};
	}, []);

	return {
		data,
		loading,
		error,
		isStale,
		refetch: () => read(),
		read,
	};
}

/**
 * Enhanced useList hook with pagination and infinite scroll support
 */
export function useList<T extends BetterQuery = BetterQuery>(
	client: ReactQueryClient<T>,
	resourceName: string,
	params?: any,
	options: UseQueryOptions = {},
) {
	const {
		enabled = true,
		refetchOnFocus = false,
		refetchOnReconnect = false,
		refetchInterval,
		staleTime = 0,
		retry = 0,
		retryDelay = 1000,
		onSuccess,
		onError,
	} = options;

	const [data, setData] = useState<any>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<any>(null);
	const [isStale, setIsStale] = useState(false);

	const lastFetchTimeRef = useRef<number>(0);
	const retryCountRef = useRef(0);
	const isMountedRef = useRef(true);

	const list = useCallback(
		async (listParams?: any, opts?: any) => {
			const targetParams = listParams || params;
			setLoading(true);
			setError(null);

			try {
				const result = await (client as any)[resourceName].list(
					targetParams,
					opts,
				);

				if (!isMountedRef.current) return result;

				if (result.error) {
					setError(result.error);
					if (onError) onError(result.error);

					// Retry logic
					if (retryCountRef.current < retry) {
						retryCountRef.current++;
						setTimeout(() => list(targetParams, opts), retryDelay);
						return result;
					}
				} else {
					setData(result.data);
					lastFetchTimeRef.current = Date.now();
					setIsStale(false);
					retryCountRef.current = 0;
					if (onSuccess) onSuccess(result.data);
				}

				return result;
			} catch (err) {
				if (!isMountedRef.current) return { data: null, error: err };
				setError(err);
				if (onError) onError(err);
				return { data: null, error: err };
			} finally {
				if (isMountedRef.current) {
					setLoading(false);
				}
			}
		},
		[resourceName, params, client, retry, retryDelay, onSuccess, onError],
	);

	// Check if data is stale
	useEffect(() => {
		if (staleTime > 0 && lastFetchTimeRef.current > 0) {
			const checkStale = () => {
				const elapsed = Date.now() - lastFetchTimeRef.current;
				setIsStale(elapsed > staleTime);
			};

			const interval = setInterval(checkStale, 1000);
			return () => clearInterval(interval);
		}
	}, [staleTime]);

	// Auto-fetch on mount
	useEffect(() => {
		if (enabled) {
			list();
		}
	}, [enabled, list]);

	// Refetch on window focus
	useEffect(() => {
		if (!refetchOnFocus) return;

		const handleFocus = () => {
			if (isStale) {
				list();
			}
		};

		window.addEventListener("focus", handleFocus);
		return () => window.removeEventListener("focus", handleFocus);
	}, [refetchOnFocus, isStale, list]);

	// Refetch on network reconnect
	useEffect(() => {
		if (!refetchOnReconnect) return;

		const handleOnline = () => {
			list();
		};

		window.addEventListener("online", handleOnline);
		return () => window.removeEventListener("online", handleOnline);
	}, [refetchOnReconnect, list]);

	// Refetch on interval
	useEffect(() => {
		if (!refetchInterval) return;

		const interval = setInterval(() => {
			list();
		}, refetchInterval);

		return () => clearInterval(interval);
	}, [refetchInterval, list]);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			isMountedRef.current = false;
		};
	}, []);

	return {
		data,
		loading,
		error,
		isStale,
		refetch: () => list(),
		list,
	};
}

/**
 * Enhanced useCreate hook with optimistic updates
 */
export function useCreate<T extends BetterQuery = BetterQuery>(
	client: ReactQueryClient<T>,
	resourceName: string,
	options: UseMutationOptions = {},
) {
	const {
		optimistic = false,
		optimisticData,
		invalidateQueries = [],
		onSuccess,
		onError,
		onSettled,
	} = options;

	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<any>(null);
	const [optimisticUpdate, setOptimisticUpdate] = useState<any>(null);

	const create = useCallback(
		async (data: any, opts?: any) => {
			setLoading(true);
			setError(null);

			// Optimistic update
			if (optimistic && optimisticData) {
				setOptimisticUpdate(optimisticData(data));
			}

			try {
				const result = await (client as any)[resourceName].create(data, opts);

				if (result.error) {
					setError(result.error);
					setOptimisticUpdate(null);
					if (onError) onError(result.error, data);
				} else {
					setOptimisticUpdate(null);
					if (onSuccess) onSuccess(result.data, data);

					// Invalidate related queries
					if (invalidateQueries.length > 0) {
						// TODO: Implement query invalidation
					}
				}

				if (onSettled) onSettled(result.data, result.error, data);

				return result;
			} catch (err) {
				setError(err);
				setOptimisticUpdate(null);
				if (onError) onError(err, data);
				if (onSettled) onSettled(undefined, err, data);
				return { data: null, error: err };
			} finally {
				setLoading(false);
			}
		},
		[
			resourceName,
			client,
			optimistic,
			optimisticData,
			invalidateQueries,
			onSuccess,
			onError,
			onSettled,
		],
	);

	return { create, loading, error, optimisticUpdate };
}

/**
 * Enhanced useUpdate hook with optimistic updates
 */
export function useUpdate<T extends BetterQuery = BetterQuery>(
	client: ReactQueryClient<T>,
	resourceName: string,
	options: UseMutationOptions = {},
) {
	const {
		optimistic = false,
		optimisticData,
		invalidateQueries = [],
		onSuccess,
		onError,
		onSettled,
	} = options;

	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<any>(null);
	const [optimisticUpdate, setOptimisticUpdate] = useState<any>(null);

	const update = useCallback(
		async (id: string, data: any, opts?: any) => {
			setLoading(true);
			setError(null);

			// Optimistic update
			if (optimistic && optimisticData) {
				setOptimisticUpdate(optimisticData({ id, ...data }));
			}

			try {
				const result = await (client as any)[resourceName].update(
					id,
					data,
					opts,
				);

				if (result.error) {
					setError(result.error);
					setOptimisticUpdate(null);
					if (onError) onError(result.error, { id, data });
				} else {
					setOptimisticUpdate(null);
					if (onSuccess) onSuccess(result.data, { id, data });

					// Invalidate related queries
					if (invalidateQueries.length > 0) {
						// TODO: Implement query invalidation
					}
				}

				if (onSettled) onSettled(result.data, result.error, { id, data });

				return result;
			} catch (err) {
				setError(err);
				setOptimisticUpdate(null);
				if (onError) onError(err, { id, data });
				if (onSettled) onSettled(undefined, err, { id, data });
				return { data: null, error: err };
			} finally {
				setLoading(false);
			}
		},
		[
			resourceName,
			client,
			optimistic,
			optimisticData,
			invalidateQueries,
			onSuccess,
			onError,
			onSettled,
		],
	);

	return { update, loading, error, optimisticUpdate };
}

/**
 * Enhanced useDelete hook with optimistic updates
 */
export function useDelete<T extends BetterQuery = BetterQuery>(
	client: ReactQueryClient<T>,
	resourceName: string,
	options: UseMutationOptions = {},
) {
	const {
		optimistic = false,
		invalidateQueries = [],
		onSuccess,
		onError,
		onSettled,
	} = options;

	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<any>(null);
	const [deletedId, setDeletedId] = useState<string | null>(null);

	const deleteItem = useCallback(
		async (id: string, opts?: any) => {
			setLoading(true);
			setError(null);

			// Optimistic delete
			if (optimistic) {
				setDeletedId(id);
			}

			try {
				const result = await (client as any)[resourceName].delete(id, opts);

				if (result.error) {
					setError(result.error);
					setDeletedId(null);
					if (onError) onError(result.error, id);
				} else {
					setDeletedId(null);
					if (onSuccess) onSuccess(result.data, id);

					// Invalidate related queries
					if (invalidateQueries.length > 0) {
						// TODO: Implement query invalidation
					}
				}

				if (onSettled) onSettled(result.data, result.error, id);

				return result;
			} catch (err) {
				setError(err);
				setDeletedId(null);
				if (onError) onError(err, id);
				if (onSettled) onSettled(undefined, err, id);
				return { data: null, error: err };
			} finally {
				setLoading(false);
			}
		},
		[
			resourceName,
			client,
			optimistic,
			invalidateQueries,
			onSuccess,
			onError,
			onSettled,
		],
	);

	return { delete: deleteItem, loading, error, deletedId };
}

/**
 * Hook for infinite scroll with pagination
 */
export function useInfiniteList<T extends BetterQuery = BetterQuery>(
	client: ReactQueryClient<T>,
	resourceName: string,
	baseParams?: any,
	options: UseQueryOptions & { pageSize?: number } = {},
) {
	const { pageSize = 20, ...queryOptions } = options;

	const [pages, setPages] = useState<any[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<any>(null);
	const [hasMore, setHasMore] = useState(true);
	const [currentPage, setCurrentPage] = useState(1);

	const fetchNextPage = useCallback(async () => {
		if (loading || !hasMore) return;

		setLoading(true);
		setError(null);

		try {
			const result = await (client as any)[resourceName].list({
				...baseParams,
				page: currentPage,
				limit: pageSize,
			});

			if (result.error) {
				setError(result.error);
			} else if (result.data) {
				const newItems = result.data.items || result.data;
				setPages((prev) => [...prev, ...newItems]);
				setHasMore(
					result.data.pagination ? result.data.pagination.hasNext : false,
				);
				setCurrentPage((prev) => prev + 1);
			}

			return result;
		} catch (err) {
			setError(err);
			return { data: null, error: err };
		} finally {
			setLoading(false);
		}
	}, [
		client,
		resourceName,
		baseParams,
		currentPage,
		pageSize,
		loading,
		hasMore,
	]);

	const reset = useCallback(() => {
		setPages([]);
		setCurrentPage(1);
		setHasMore(true);
		setError(null);
	}, []);

	// Auto-fetch first page
	useEffect(() => {
		if (options.enabled !== false && pages.length === 0) {
			fetchNextPage();
		}
	}, []);

	return {
		data: pages,
		loading,
		error,
		hasMore,
		fetchNextPage,
		reset,
	};
}
