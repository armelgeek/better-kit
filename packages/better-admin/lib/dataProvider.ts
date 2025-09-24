import type { DataProvider } from "ra-core";

export interface BetterQueryConfig {
	baseUrl: string;
	resources?: string[];
}

/**
 * Creates a data provider that integrates with better-query
 */
export function createBetterQueryProvider(config: BetterQueryConfig): DataProvider {
	const { baseUrl } = config;

	const httpClient = async (url: string, options: RequestInit = {}) => {
		const response = await fetch(`${baseUrl}${url}`, {
			...options,
			headers: {
				'Content-Type': 'application/json',
				...options.headers,
			},
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const contentType = response.headers.get('content-type');
		if (contentType && contentType.includes('application/json')) {
			return response.json();
		}

		return response.text();
	};

	return {
		// Get a list of records
		getList: async (resource, params) => {
			const { page, perPage } = params.pagination || { page: 1, perPage: 10 };
			const { field, order } = params.sort || { field: 'id', order: 'ASC' };
			
			let query = `/${resource}?page=${page}&limit=${perPage}&sort=${field}&order=${order}`;
			
			// Add filters
			if (params.filter) {
				Object.keys(params.filter).forEach(key => {
					query += `&${key}=${params.filter[key]}`;
				});
			}

			const response = await httpClient(query);
			
			return {
				data: response.data || response,
				total: response.total || response.length || 0,
			};
		},

		// Get a single record
		getOne: async (resource, params) => {
			const response = await httpClient(`/${resource}/${params.id}`);
			return { data: response.data || response };
		},

		// Get multiple records by ids
		getMany: async (resource, params) => {
			const ids = params.ids.join(',');
			const response = await httpClient(`/${resource}?ids=${ids}`);
			return { data: response.data || response };
		},

		// Get records related to another record
		getManyReference: async (resource, params) => {
			const { page, perPage } = params.pagination || { page: 1, perPage: 10 };
			const { field, order } = params.sort || { field: 'id', order: 'ASC' };
			
			let query = `/${resource}?${params.target}=${params.id}&page=${page}&limit=${perPage}&sort=${field}&order=${order}`;
			
			if (params.filter) {
				Object.keys(params.filter).forEach(key => {
					query += `&${key}=${params.filter[key]}`;
				});
			}

			const response = await httpClient(query);
			
			return {
				data: response.data || response,
				total: response.total || response.length || 0,
			};
		},

		// Create a record
		create: async (resource, params) => {
			const response = await httpClient(`/${resource}`, {
				method: 'POST',
				body: JSON.stringify(params.data),
			});
			return { data: response.data || response };
		},

		// Update a record
		update: async (resource, params) => {
			const response = await httpClient(`/${resource}/${params.id}`, {
				method: 'PUT',
				body: JSON.stringify(params.data),
			});
			return { data: response.data || response };
		},

		// Update multiple records
		updateMany: async (resource, params) => {
			const responses = await Promise.all(
				params.ids.map(id =>
					httpClient(`/${resource}/${id}`, {
						method: 'PUT',
						body: JSON.stringify(params.data),
					})
				)
			);
			return { data: responses.map(response => response.data || response) };
		},

		// Delete a record
		delete: async (resource, params) => {
			const response = await httpClient(`/${resource}/${params.id}`, {
				method: 'DELETE',
			});
			return { data: response.data || { id: params.id } };
		},

		// Delete multiple records
		deleteMany: async (resource, params) => {
			await Promise.all(
				params.ids.map(id =>
					httpClient(`/${resource}/${id}`, {
						method: 'DELETE',
					})
				)
			);
			return { data: params.ids };
		},
	};
}

// Legacy export for compatibility
export const dataProvider = createBetterQueryProvider({
	baseUrl: import.meta.env?.VITE_JSON_SERVER_URL || '/api',
});