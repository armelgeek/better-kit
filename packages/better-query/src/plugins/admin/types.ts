import type { Plugin } from '../../types/plugins';

/**
 * Admin Plugin Options
 */
export interface AdminPluginOptions {
  /**
   * Enable the admin plugin
   * @default true
   */
  enabled?: boolean;

  /**
   * Admin API base path
   * @default '/admin'
   */
  basePath?: string;

  /**
   * Enable auto-CRUD generation for admin interface
   * @default true
   */
  autoCrud?: boolean;

  /**
   * Resources to include in admin interface
   * If not specified, all resources are included
   */
  resources?: string[];

  /**
   * Admin authentication options
   */
  auth?: {
    /**
     * Enable admin authentication
     * @default true
     */
    enabled?: boolean;

    /**
     * Admin role required to access admin interface
     * @default 'admin'
     */
    requiredRole?: string;

    /**
     * Custom authentication function
     */
    authenticate?: (context: any) => Promise<boolean> | boolean;
  };

  /**
   * Admin dashboard configuration
   */
  dashboard?: {
    /**
     * Dashboard title
     * @default 'Admin Dashboard'
     */
    title?: string;

    /**
     * Dashboard stats to show
     */
    stats?: Array<{
      resource: string;
      label?: string;
      icon?: string;
    }>;
  };

  /**
   * Component customization options
   */
  components?: {
    /**
     * Custom theme configuration
     */
    theme?: {
      primaryColor?: string;
      borderRadius?: string;
    };

    /**
     * Custom component overrides
     */
    overrides?: Record<string, any>;
  };
}

/**
 * Admin Component Props
 */
export interface AdminComponentProps {
  /**
   * Resource name
   */
  resource: string;

  /**
   * Component configuration
   */
  config?: Record<string, any>;

  /**
   * Additional props
   */
  [key: string]: any;
}

/**
 * Admin Table Configuration
 */
export interface AdminTableConfig {
  /**
   * Columns to display
   */
  columns?: Array<{
    key: string;
    label: string;
    sortable?: boolean;
    filterable?: boolean;
    render?: (value: any, record: any) => React.ReactNode;
  }>;

  /**
   * Default page size
   * @default 10
   */
  pageSize?: number;

  /**
   * Enable pagination
   * @default true
   */
  pagination?: boolean;

  /**
   * Enable search
   * @default true
   */
  search?: boolean;

  /**
   * Enable bulk actions
   * @default false
   */
  bulkActions?: boolean;
}

/**
 * Admin Form Configuration
 */
export interface AdminFormConfig {
  /**
   * Form fields configuration
   */
  fields?: Array<{
    key: string;
    label: string;
    type: 'text' | 'email' | 'password' | 'textarea' | 'select' | 'checkbox' | 'date' | 'number';
    required?: boolean;
    options?: Array<{ value: any; label: string }>;
    validation?: Record<string, any>;
  }>;

  /**
   * Form layout
   * @default 'vertical'
   */
  layout?: 'vertical' | 'horizontal';

  /**
   * Enable form validation
   * @default true
   */
  validation?: boolean;
}