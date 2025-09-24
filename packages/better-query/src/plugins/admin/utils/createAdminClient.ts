import type { AdminPluginOptions } from '../types';

export interface AdminClientOptions {
  /**
   * Base URL for admin API
   */
  baseURL: string;

  /**
   * Admin API base path
   * @default '/admin'
   */
  basePath?: string;

  /**
   * Authentication token or session
   */
  auth?: {
    token?: string;
    session?: any;
    headers?: Record<string, string>;
  };

  /**
   * Custom headers
   */
  headers?: Record<string, string>;

  /**
   * Request timeout
   */
  timeout?: number;
}

/**
 * Admin API Client
 * 
 * Provides methods for interacting with admin endpoints
 */
export class AdminClient {
  private baseURL: string;
  private basePath: string;
  private headers: Record<string, string>;
  private timeout: number;

  constructor(options: AdminClientOptions) {
    this.baseURL = options.baseURL.replace(/\/$/, '');
    this.basePath = options.basePath || '/admin';
    this.timeout = options.timeout || 10000;
    
    this.headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    // Add auth headers
    if (options.auth?.token) {
      this.headers['Authorization'] = `Bearer ${options.auth.token}`;
    }

    if (options.auth?.headers) {
      Object.assign(this.headers, options.auth.headers);
    }
  }

  /**
   * Make HTTP request to admin API
   */
  private async request(path: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.baseURL}${this.basePath}${path}`;
    
    const config: RequestInit = {
      ...options,
      headers: {
        ...this.headers,
        ...options.headers
      }
    };

    // Add timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    config.signal = controller.signal;

    try {
      const response = await fetch(url, config);
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error: any) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      
      throw error;
    }
  }

  /**
   * Get dashboard statistics
   */
  async getDashboardStats(params: { query?: { resources?: string[] } } = {}): Promise<any> {
    const searchParams = new URLSearchParams();
    if (params.query?.resources) {
      searchParams.set('resources', params.query.resources.join(','));
    }

    const path = `/stats${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    return this.request(path, { method: 'GET' });
  }

  /**
   * Get resource metadata
   */
  async getResourceMetadata(): Promise<any> {
    return this.request('/resources', { method: 'GET' });
  }

  /**
   * Get resource schema
   */
  async getResourceSchema(params: { params: { resource: string } }): Promise<any> {
    return this.request(`/resources/${params.params.resource}/schema`, { method: 'GET' });
  }

  /**
   * Perform bulk operation
   */
  async bulkOperation(params: {
    body: {
      resource: string;
      operation: 'delete' | 'update';
      ids: string[];
      data?: Record<string, any>;
    }
  }): Promise<any> {
    return this.request('/bulk', {
      method: 'POST',
      body: JSON.stringify(params.body)
    });
  }

  /**
   * Get component configuration
   */
  async getComponentConfig(params: { params: { resource: string } }): Promise<any> {
    return this.request(`/components/${params.params.resource}`, { method: 'GET' });
  }

  /**
   * Update auth token
   */
  setAuthToken(token: string): void {
    this.headers['Authorization'] = `Bearer ${token}`;
  }

  /**
   * Remove auth token
   */
  removeAuthToken(): void {
    delete this.headers['Authorization'];
  }

  /**
   * Set custom header
   */
  setHeader(key: string, value: string): void {
    this.headers[key] = value;
  }

  /**
   * Remove custom header
   */
  removeHeader(key: string): void {
    delete this.headers[key];
  }
}

/**
 * Create admin API client
 */
export function createAdminClient(options: AdminClientOptions): AdminClient {
  return new AdminClient(options);
}

/**
 * Create admin client with auto-configuration
 */
export function createAutoAdminClient(
  queryClient: any,
  options: Partial<AdminClientOptions> = {}
): AdminClient {
  // Extract base URL from query client if available
  let baseURL = options.baseURL;
  
  if (!baseURL && queryClient?.baseURL) {
    baseURL = queryClient.baseURL;
  }

  if (!baseURL && typeof window !== 'undefined') {
    baseURL = `${window.location.protocol}//${window.location.host}`;
  }

  if (!baseURL) {
    baseURL = 'http://localhost:3000';
  }

  return createAdminClient({
    baseURL,
    basePath: '/api/query/admin', // Default admin API path
    ...options
  });
}