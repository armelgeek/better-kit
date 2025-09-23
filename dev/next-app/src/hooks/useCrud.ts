import { useState, useEffect, useCallback } from 'react';
import { queryClient } from '../lib/crud-auth';
import type { Product, Category, Order, Review, UserProfile } from '../lib/schemas';

// Generic hook for CRUD operations
interface UseResourceOptions {
  autoFetch?: boolean;
  dependencies?: any[];
}

interface UseResourceResult<T> {
  items: T[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  } | null;
  create: (data: Partial<T>) => Promise<T>;
  read: (id: string) => Promise<T>;
  update: (id: string, data: Partial<T>) => Promise<T>;
  remove: (id: string) => Promise<void>;
  list: (params?: any) => Promise<{ items: T[]; pagination: any }>;
  refresh: () => Promise<void>;
}

function useResource<T>(
  resourceName: keyof typeof queryClient,
  options: UseResourceOptions = {}
): UseResourceResult<T> {
  const { autoFetch = true, dependencies = [] } = options;
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<any>(null);

  const handleError = useCallback((err: any) => {
    const message = err?.message || err?.error?.message || 'An error occurred';
    setError(message);
    console.error(`${resourceName} error:`, err);
  }, [resourceName]);

  const list = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const resource = queryClient[resourceName] as any;
      const result = await resource.list(params);
      
      if (result.error) {
        throw new Error(result.error.message || result.error);
      }
      
      const data = result.data || {};
      const itemsData = data.items || data || [];
      const paginationData = data.pagination || null;
      
      setItems(itemsData);
      setPagination(paginationData);
      
      return { items: itemsData, pagination: paginationData };
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [resourceName, handleError]);

  const create = useCallback(async (data: Partial<T>): Promise<T> => {
    setError(null);
    try {
      const resource = queryClient[resourceName] as any;
      const result = await resource.create(data);
      
      if (result.error) {
        throw new Error(result.error.message || result.error);
      }
      
      const newItem = result.data;
      setItems(prev => [...prev, newItem]);
      return newItem;
    } catch (err) {
      handleError(err);
      throw err;
    }
  }, [resourceName, handleError]);

  const read = useCallback(async (id: string): Promise<T> => {
    setError(null);
    try {
      const resource = queryClient[resourceName] as any;
      const result = await resource.read(id);
      
      if (result.error) {
        throw new Error(result.error.message || result.error);
      }
      
      return result.data;
    } catch (err) {
      handleError(err);
      throw err;
    }
  }, [resourceName, handleError]);

  const update = useCallback(async (id: string, data: Partial<T>): Promise<T> => {
    setError(null);
    try {
      const resource = queryClient[resourceName] as any;
      const result = await resource.update(id, data);
      
      if (result.error) {
        throw new Error(result.error.message || result.error);
      }
      
      const updatedItem = result.data;
      setItems(prev => prev.map(item => 
        (item as any).id === id ? updatedItem : item
      ));
      return updatedItem;
    } catch (err) {
      handleError(err);
      throw err;
    }
  }, [resourceName, handleError]);

  const remove = useCallback(async (id: string): Promise<void> => {
    setError(null);
    try {
      const resource = queryClient[resourceName] as any;
      const result = await resource.delete(id);
      
      if (result.error) {
        throw new Error(result.error.message || result.error);
      }
      
      setItems(prev => prev.filter(item => (item as any).id !== id));
    } catch (err) {
      handleError(err);
      throw err;
    }
  }, [resourceName, handleError]);

  const refresh = useCallback(() => list(), [list]);

  useEffect(() => {
    if (autoFetch) {
      list();
    }
  }, [autoFetch, list, ...dependencies]);

  return {
    items,
    loading,
    error,
    pagination,
    create,
    read,
    update,
    remove,
    list,
    refresh,
  };
}

// Specific hooks for each resource type
export const useProducts = (options?: UseResourceOptions) => 
  useResource<Product>('product', options);

export const useCategories = (options?: UseResourceOptions) => 
  useResource<Category>('category', options);

export const useOrders = (options?: UseResourceOptions) => 
  useResource<Order>('order', options);

export const useReviews = (options?: UseResourceOptions) => 
  useResource<Review>('review', options);

export const useUserProfiles = (options?: UseResourceOptions) => 
  useResource<UserProfile>('userProfile', options);

// Advanced hooks with specific functionality

// Hook for managing product search and filtering
export const useProductSearch = () => {
  const [searchParams, setSearchParams] = useState({
    search: '',
    categoryId: '',
    status: '',
    minPrice: '',
    maxPrice: '',
    featured: false,
    sortBy: 'createdAt',
    sortOrder: 'desc' as 'asc' | 'desc',
    page: 1,
    limit: 10,
  });

  const { items: products, loading, error, pagination, list } = useProducts({ 
    autoFetch: false 
  });

  const search = useCallback(async (params = searchParams) => {
    const searchData: any = { ...params };
    
    // Clean up empty values
    Object.keys(searchData).forEach(key => {
      if (searchData[key] === '' || searchData[key] === null || searchData[key] === undefined) {
        delete searchData[key];
      }
    });

    // Add price filtering
    if (searchData.minPrice || searchData.maxPrice) {
      searchData.filters = {
        priceRange: {
          ...(searchData.minPrice && { min: parseFloat(searchData.minPrice) }),
          ...(searchData.maxPrice && { max: parseFloat(searchData.maxPrice) }),
        }
      };
    }
    delete searchData.minPrice;
    delete searchData.maxPrice;

    return list(searchData);
  }, [list, searchParams]);

  const updateSearch = useCallback((updates: Partial<typeof searchParams>) => {
    setSearchParams(prev => ({ ...prev, ...updates }));
  }, []);

  const resetSearch = useCallback(() => {
    setSearchParams({
      search: '',
      categoryId: '',
      status: '',
      minPrice: '',
      maxPrice: '',
      featured: false,
      sortBy: 'createdAt',
      sortOrder: 'desc',
      page: 1,
      limit: 10,
    });
  }, []);

  useEffect(() => {
    search();
  }, [search]);

  return {
    products,
    loading,
    error,
    pagination,
    searchParams,
    updateSearch,
    resetSearch,
    search,
  };
};

// Hook for managing cart functionality (if implementing e-commerce)
export const useCart = () => {
  const [cartItems, setCartItems] = useState<Array<{
    productId: string;
    quantity: number;
    product?: Product;
  }>>([]);

  const addToCart = useCallback((productId: string, quantity = 1) => {
    setCartItems(prev => {
      const existingItem = prev.find(item => item.productId === productId);
      if (existingItem) {
        return prev.map(item =>
          item.productId === productId
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { productId, quantity }];
    });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCartItems(prev => prev.filter(item => item.productId !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    setCartItems(prev =>
      prev.map(item =>
        item.productId === productId ? { ...item, quantity } : item
      )
    );
  }, [removeFromCart]);

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    totalItems,
  };
};

// Hook for managing form state with validation
export const useFormState = <T extends Record<string, any>>(
  initialState: T,
  validationSchema?: any
) => {
  const [values, setValues] = useState<T>(initialState);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});

  const setValue = useCallback((field: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);

  const setTouched = useCallback((field: keyof T) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  }, []);

  const validate = useCallback(() => {
    if (!validationSchema) return true;

    try {
      validationSchema.parse(values);
      setErrors({});
      return true;
    } catch (err: any) {
      const fieldErrors: Partial<Record<keyof T, string>> = {};
      err.errors?.forEach((error: any) => {
        const field = error.path?.[0];
        if (field) {
          fieldErrors[field] = error.message;
        }
      });
      setErrors(fieldErrors);
      return false;
    }
  }, [values, validationSchema]);

  const reset = useCallback(() => {
    setValues(initialState);
    setErrors({});
    setTouched({});
  }, [initialState]);

  return {
    values,
    errors,
    touched,
    setValue,
    setTouched,
    validate,
    reset,
  };
};