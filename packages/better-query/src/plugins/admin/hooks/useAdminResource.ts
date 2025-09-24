import { useState, useEffect, useCallback } from 'react';
import type { AdminTableConfig, AdminFormConfig } from '../types';

export interface UseAdminResourceReturn {
  // Data
  data: any[];
  loading: boolean;
  error: string | null;
  
  // Pagination
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
  };

  // Operations
  operations: {
    create: (data: any) => Promise<void>;
    update: (id: string, data: any) => Promise<void>;
    delete: (id: string) => Promise<void>;
    bulkDelete: (ids: string[]) => Promise<void>;
  };

  // Actions
  search: (query: string) => void;
  refresh: () => Promise<void>;
  
  // Configuration
  tableConfig: AdminTableConfig;
  formConfig: AdminFormConfig;
}

export interface UseAdminResourceOptions {
  /**
   * Resource name
   */
  resource: string;

  /**
   * Admin/Query client instance
   */
  client: any;

  /**
   * Initial page size
   */
  pageSize?: number;

  /**
   * Auto-fetch on mount
   */
  autoFetch?: boolean;

  /**
   * Custom table configuration
   */
  tableConfig?: Partial<AdminTableConfig>;

  /**
   * Custom form configuration
   */
  formConfig?: Partial<AdminFormConfig>;
}

/**
 * Hook for managing admin resource operations
 */
export function useAdminResource({
  resource,
  client,
  pageSize = 10,
  autoFetch = true,
  tableConfig = {},
  formConfig = {}
}: UseAdminResourceOptions): UseAdminResourceReturn {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  // Generate table configuration
  const finalTableConfig: AdminTableConfig = {
    pageSize,
    pagination: true,
    search: true,
    bulkActions: true,
    ...tableConfig
  };

  // Generate form configuration from resource schema
  const [finalFormConfig, setFinalFormConfig] = useState<AdminFormConfig>({
    layout: 'vertical',
    validation: true,
    ...formConfig
  });

  // Fetch data
  const fetchData = useCallback(async (currentPage = page, search = searchQuery) => {
    if (!client?.[`list${resource.charAt(0).toUpperCase() + resource.slice(1)}s`]) {
      setError(`Client method for listing ${resource}s not found`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const listMethod = client[`list${resource.charAt(0).toUpperCase() + resource.slice(1)}s`];
      const response = await listMethod({
        query: {
          page: currentPage,
          limit: pageSize,
          search: search || undefined
        }
      });

      if (response.error) {
        throw new Error(response.error);
      }

      setData(response.data || []);
      setTotal(response.total || response.data?.length || 0);
    } catch (err: any) {
      console.error(`Failed to fetch ${resource}s:`, err);
      setError(err.message || `Failed to fetch ${resource}s`);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [client, resource, page, searchQuery, pageSize]);

  // Create operation
  const create = useCallback(async (formData: any) => {
    if (!client?.[`create${resource.charAt(0).toUpperCase() + resource.slice(1)}`]) {
      throw new Error(`Client method for creating ${resource} not found`);
    }

    const createMethod = client[`create${resource.charAt(0).toUpperCase() + resource.slice(1)}`];
    const response = await createMethod({ body: formData });

    if (response.error) {
      throw new Error(response.error);
    }

    // Refresh data after creation
    await fetchData();
    
    return response.data;
  }, [client, resource, fetchData]);

  // Update operation
  const update = useCallback(async (id: string, formData: any) => {
    if (!client?.[`update${resource.charAt(0).toUpperCase() + resource.slice(1)}`]) {
      throw new Error(`Client method for updating ${resource} not found`);
    }

    const updateMethod = client[`update${resource.charAt(0).toUpperCase() + resource.slice(1)}`];
    const response = await updateMethod({
      params: { id },
      body: formData
    });

    if (response.error) {
      throw new Error(response.error);
    }

    // Refresh data after update
    await fetchData();
    
    return response.data;
  }, [client, resource, fetchData]);

  // Delete operation
  const deleteRecord = useCallback(async (id: string) => {
    if (!client?.[`delete${resource.charAt(0).toUpperCase() + resource.slice(1)}`]) {
      throw new Error(`Client method for deleting ${resource} not found`);
    }

    const deleteMethod = client[`delete${resource.charAt(0).toUpperCase() + resource.slice(1)}`];
    const response = await deleteMethod({ params: { id } });

    if (response.error) {
      throw new Error(response.error);
    }

    // Refresh data after deletion
    await fetchData();
    
    return response.data;
  }, [client, resource, fetchData]);

  // Bulk delete operation
  const bulkDelete = useCallback(async (ids: string[]) => {
    if (!client?.bulkOperation) {
      // Fallback to individual deletes
      for (const id of ids) {
        await deleteRecord(id);
      }
      return;
    }

    const response = await client.bulkOperation({
      body: {
        resource,
        operation: 'delete',
        ids
      }
    });

    if (response.error) {
      throw new Error(response.error);
    }

    // Refresh data after bulk deletion
    await fetchData();
    
    return response.data;
  }, [client, resource, deleteRecord, fetchData]);

  // Search operation
  const search = useCallback((query: string) => {
    setSearchQuery(query);
    setPage(1); // Reset to first page
    fetchData(1, query);
  }, [fetchData]);

  // Page change handler
  const onPageChange = useCallback((newPage: number) => {
    setPage(newPage);
    fetchData(newPage);
  }, [fetchData]);

  // Refresh operation
  const refresh = useCallback(() => {
    return fetchData();
  }, [fetchData]);

  // Load resource schema for form config
  useEffect(() => {
    const loadResourceSchema = async () => {
      if (!client?.getResourceSchema || formConfig.fields) return;

      try {
        const response = await client.getResourceSchema({
          params: { resource }
        });

        if (response.schema?.fields) {
          setFinalFormConfig(prev => ({
            ...prev,
            fields: response.schema.fields.map((field: any) => ({
              key: field.key,
              label: field.key.charAt(0).toUpperCase() + field.key.slice(1),
              type: field.type,
              required: field.required
            }))
          }));
        }
      } catch (error) {
        console.warn(`Failed to load schema for ${resource}:`, error);
      }
    };

    loadResourceSchema();
  }, [client, resource, formConfig.fields]);

  // Initial fetch
  useEffect(() => {
    if (autoFetch) {
      fetchData();
    }
  }, [fetchData, autoFetch]);

  return {
    data,
    loading,
    error,
    pagination: {
      page,
      pageSize,
      total,
      onPageChange
    },
    operations: {
      create,
      update,
      delete: deleteRecord,
      bulkDelete
    },
    search,
    refresh,
    tableConfig: finalTableConfig,
    formConfig: finalFormConfig
  };
}