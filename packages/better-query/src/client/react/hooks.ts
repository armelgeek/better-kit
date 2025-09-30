"use client";
import { useCallback, useEffect, useState } from "react";
import type { BetterQuery } from "../../query";
import type { ReactQueryClient } from "./index";

/**
 * Generic hook for CRUD operations with loading and error states
 */
export function useQuery<T extends BetterQuery = BetterQuery>(
	client: ReactQueryClient<T>,
) {
	return {
		useCreate: (resourceName: string) => {
			const [loading, setLoading] = useState(false);
			const [error, setError] = useState<any>(null);

			const create = useCallback(
				async (data: any, options?: any) => {
					setLoading(true);
					setError(null);
					try {
						const result = await (client as any)[resourceName].create(
							data,
							options,
						);
						if (result.error) {
							setError(result.error);
						}
						return result;
					} catch (err) {
						setError(err);
						return { data: null, error: err };
					} finally {
						setLoading(false);
					}
				},
				[resourceName],
			);

			return { create, loading, error };
		},

		useRead: (resourceName: string, id?: string) => {
			const [data, setData] = useState<any>(null);
			const [loading, setLoading] = useState(false);
			const [error, setError] = useState<any>(null);

			const read = useCallback(
				async (readId?: string, options?: any) => {
					const targetId = readId || id;
					if (!targetId)
						return { data: null, error: { message: "ID is required" } };

					setLoading(true);
					setError(null);
					try {
						const result = await (client as any)[resourceName].read(
							targetId,
							options,
						);
						if (result.error) {
							setError(result.error);
						} else {
							setData(result.data);
						}
						return result;
					} catch (err) {
						setError(err);
						return { data: null, error: err };
					} finally {
						setLoading(false);
					}
				},
				[resourceName, id],
			);

			// Auto-fetch if ID is provided
			useEffect(() => {
				if (id) {
					read();
				}
			}, [id, read]);

			return { data, read, loading, error, refetch: () => read() };
		},

		useUpdate: (resourceName: string) => {
			const [loading, setLoading] = useState(false);
			const [error, setError] = useState<any>(null);

			const update = useCallback(
				async (id: string, data: any, options?: any) => {
					setLoading(true);
					setError(null);
					try {
						const result = await (client as any)[resourceName].update(
							id,
							data,
							options,
						);
						if (result.error) {
							setError(result.error);
						}
						return result;
					} catch (err) {
						setError(err);
						return { data: null, error: err };
					} finally {
						setLoading(false);
					}
				},
				[resourceName],
			);

			return { update, loading, error };
		},

		useDelete: (resourceName: string) => {
			const [loading, setLoading] = useState(false);
			const [error, setError] = useState<any>(null);

			const deleteItem = useCallback(
				async (id: string, options?: any) => {
					setLoading(true);
					setError(null);
					try {
						const result = await (client as any)[resourceName].delete(
							id,
							options,
						);
						if (result.error) {
							setError(result.error);
						}
						return result;
					} catch (err) {
						setError(err);
						return { data: null, error: err };
					} finally {
						setLoading(false);
					}
				},
				[resourceName],
			);

			return { delete: deleteItem, loading, error };
		},

		useList: (resourceName: string, params?: any) => {
			const [data, setData] = useState<any>(null);
			const [loading, setLoading] = useState(false);
			const [error, setError] = useState<any>(null);

			const list = useCallback(
				async (listParams?: any, options?: any) => {
					const targetParams = listParams || params;
					setLoading(true);
					setError(null);
					try {
						const result = await (client as any)[resourceName].list(
							targetParams,
							options,
						);
						if (result.error) {
							setError(result.error);
						} else {
							setData(result.data);
						}
						return result;
					} catch (err) {
						setError(err);
						return { data: null, error: err };
					} finally {
						setLoading(false);
					}
				},
				[resourceName, params],
			);

			// Auto-fetch on mount
			useEffect(() => {
				list();
			}, [list]);

			return { data, list, loading, error, refetch: () => list() };
		},
	};
}

/**
 * Hook for a specific resource
 */
export function useResource<T extends BetterQuery = BetterQuery>(
	client: ReactQueryClient<T>,
	resourceName: string,
) {
	const hooks = useQuery(client);

	return {
		useCreate: () => hooks.useCreate(resourceName),
		useRead: (id?: string) => hooks.useRead(resourceName, id),
		useUpdate: () => hooks.useUpdate(resourceName),
		useDelete: () => hooks.useDelete(resourceName),
		useList: (params?: any) => hooks.useList(resourceName, params),
	};
}
