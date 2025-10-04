/**
 * Better Query Data Provider for Better Admin
 * 
 * Provides data operations using better-query instead of ra-core.
 * This adapter allows admin components to work seamlessly with better-query.
 */

export interface DataProviderOptions {
	/**
	 * The better-query client instance
	 */
	queryClient: any;
	/**
	 * Optional custom error handler
	 */
	onError?: (error: Error) => void;
}

export interface ListParams {
	pagination?: {
		page: number;
		perPage: number;
	};
	sort?: {
		field: string;
		order: "ASC" | "DESC";
	};
	filter?: Record<string, any>;
}

export interface ListResult<T = any> {
	data: T[];
	total: number;
}

export interface GetOneParams {
	id: string | number;
}

export interface GetManyParams {
	ids: (string | number)[];
}

export interface CreateParams<T = any> {
	data: T;
}

export interface UpdateParams<T = any> {
	id: string | number;
	data: T;
	previousData?: T;
}

export interface DeleteParams {
	id: string | number;
	previousData?: any;
}

export interface DeleteManyParams {
	ids: (string | number)[];
}

export interface DataProvider {
	/**
	 * Get a list of resources
	 */
	getList: <T = any>(
		resource: string,
		params: ListParams,
	) => Promise<ListResult<T>>;

	/**
	 * Get a single resource by id
	 */
	getOne: <T = any>(resource: string, params: GetOneParams) => Promise<T>;

	/**
	 * Get multiple resources by ids
	 */
	getMany: <T = any>(resource: string, params: GetManyParams) => Promise<T[]>;

	/**
	 * Create a new resource
	 */
	create: <T = any>(resource: string, params: CreateParams<T>) => Promise<T>;

	/**
	 * Update a resource
	 */
	update: <T = any>(resource: string, params: UpdateParams<T>) => Promise<T>;

	/**
	 * Delete a resource
	 */
	delete: <T = any>(resource: string, params: DeleteParams) => Promise<T>;

	/**
	 * Delete multiple resources
	 */
	deleteMany: (resource: string, params: DeleteManyParams) => Promise<void>;
}

/**
 * Creates a data provider that integrates better-query with better-admin
 * 
 * @example
 * ```ts
 * import { query } from './query';
 * import { createBetterQueryProvider } from 'better-admin/providers/data';
 * 
 * const dataProvider = createBetterQueryProvider({
 *   queryClient: query,
 * });
 * ```
 */
export function createBetterQueryProvider(
	options: DataProviderOptions,
): DataProvider {
	const { queryClient, onError } = options;

	return {
		getList: async (resource, params) => {
			try {
				const { pagination, sort, filter } = params;

				// Build better-query parameters
				const queryParams: any = {
					where: filter || {},
				};

				// Add pagination
				if (pagination) {
					queryParams.skip = (pagination.page - 1) * pagination.perPage;
					queryParams.take = pagination.perPage;
				}

				// Add sorting
				if (sort) {
					queryParams.orderBy = {
						[sort.field]: sort.order.toLowerCase(),
					};
				}

				// Execute query
				const resourceQuery = queryClient(resource);
				const [data, count] = await Promise.all([
					resourceQuery.list(queryParams),
					resourceQuery.count({ where: filter || {} }),
				]);

				return {
					data: data || [],
					total: count || 0,
				};
			} catch (error) {
				if (onError) {
					onError(error as Error);
				}
				throw error;
			}
		},

		getOne: async (resource, params) => {
			try {
				const resourceQuery = queryClient(resource);
				const data = await resourceQuery.get({
					where: { id: params.id },
				});

				if (!data) {
					throw new Error(`Resource not found: ${resource}/${params.id}`);
				}

				return data;
			} catch (error) {
				if (onError) {
					onError(error as Error);
				}
				throw error;
			}
		},

		getMany: async (resource, params) => {
			try {
				const resourceQuery = queryClient(resource);
				const data = await resourceQuery.list({
					where: {
						id: { in: params.ids },
					},
				});

				return data || [];
			} catch (error) {
				if (onError) {
					onError(error as Error);
				}
				throw error;
			}
		},

		create: async (resource, params) => {
			try {
				const resourceQuery = queryClient(resource);
				const data = await resourceQuery.create(params.data);

				return data;
			} catch (error) {
				if (onError) {
					onError(error as Error);
				}
				throw error;
			}
		},

		update: async (resource, params) => {
			try {
				const resourceQuery = queryClient(resource);
				const data = await resourceQuery.update({
					where: { id: params.id },
					data: params.data,
				});

				return data;
			} catch (error) {
				if (onError) {
					onError(error as Error);
				}
				throw error;
			}
		},

		delete: async (resource, params) => {
			try {
				const resourceQuery = queryClient(resource);
				const data = await resourceQuery.remove({
					where: { id: params.id },
				});

				return data || params.previousData;
			} catch (error) {
				if (onError) {
					onError(error as Error);
				}
				throw error;
			}
		},

		deleteMany: async (resource, params) => {
			try {
				const resourceQuery = queryClient(resource);
				await Promise.all(
					params.ids.map((id) =>
						resourceQuery.remove({
							where: { id },
						}),
					),
				);
			} catch (error) {
				if (onError) {
					onError(error as Error);
				}
				throw error;
			}
		},
	};
}

/**
 * Hook to use better-query in React components with simplified API
 * 
 * @example
 * ```tsx
 * import { useBetterQuery } from 'better-admin/providers/data';
 * 
 * function UsersList() {
 *   const { data, isLoading, error } = useBetterQuery('users').list();
 *   
 *   if (isLoading) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error.message}</div>;
 *   
 *   return <DataTable data={data || []} />;
 * }
 * ```
 */
export function useBetterQuery(resource: string, queryClient: any) {
	const resourceQuery = queryClient(resource);

	return {
		list: (params?: any) => resourceQuery.list.useQuery(params),
		get: (params: any) => resourceQuery.get.useQuery(params),
		create: () => resourceQuery.create,
		update: () => resourceQuery.update,
		remove: () => resourceQuery.remove,
		count: (params?: any) => resourceQuery.count.useQuery(params),
	};
}
