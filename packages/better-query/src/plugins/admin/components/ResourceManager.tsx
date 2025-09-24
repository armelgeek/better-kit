import React, { useState } from 'react';
import { AdminDataTable } from './DataTable';
import { AdminForm } from './Form';
import type { AdminComponentProps, AdminTableConfig, AdminFormConfig } from '../types';

export interface AdminResourceManagerProps extends AdminComponentProps {
  /**
   * Resource data
   */
  data?: any[];

  /**
   * Loading state
   */
  loading?: boolean;

  /**
   * Error message
   */
  error?: string;

  /**
   * Table configuration
   */
  tableConfig?: AdminTableConfig;

  /**
   * Form configuration
   */
  formConfig?: AdminFormConfig;

  /**
   * Pagination info
   */
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
  };

  /**
   * CRUD operations
   */
  operations?: {
    create?: (data: any) => Promise<void>;
    update?: (id: string, data: any) => Promise<void>;
    delete?: (id: string) => Promise<void>;
    bulkDelete?: (ids: string[]) => Promise<void>;
  };

  /**
   * Search functionality
   */
  onSearch?: (query: string) => void;

  /**
   * Refresh data
   */
  onRefresh?: () => void;

  /**
   * Custom CSS classes
   */
  className?: string;
}

type ViewMode = 'list' | 'create' | 'edit';

/**
 * Admin Resource Manager Component
 * 
 * Provides a complete CRUD interface for managing resources
 * combining data table and form components
 */
export function AdminResourceManager({
  resource,
  data = [],
  loading = false,
  error,
  tableConfig = {},
  formConfig = {},
  pagination,
  operations = {},
  onSearch,
  onRefresh,
  className = '',
  ...props
}: AdminResourceManagerProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Handle create new record
  const handleCreate = () => {
    setEditingRecord(null);
    setViewMode('create');
    setFormErrors({});
  };

  // Handle edit record
  const handleEdit = (record: any) => {
    setEditingRecord(record);
    setViewMode('edit');
    setFormErrors({});
  };

  // Handle delete record
  const handleDelete = async (record: any) => {
    if (!operations.delete) return;

    const confirmed = window.confirm(`Are you sure you want to delete this ${resource}?`);
    if (!confirmed) return;

    try {
      await operations.delete(record.id);
      onRefresh?.();
    } catch (error) {
      console.error(`Failed to delete ${resource}:`, error);
      alert(`Failed to delete ${resource}. Please try again.`);
    }
  };

  // Handle bulk actions
  const handleBulkAction = async (action: string, selectedIds: string[]) => {
    if (action === 'delete' && operations.bulkDelete) {
      const confirmed = window.confirm(`Are you sure you want to delete ${selectedIds.length} ${resource}(s)?`);
      if (!confirmed) return;

      try {
        await operations.bulkDelete(selectedIds);
        onRefresh?.();
      } catch (error) {
        console.error(`Failed to bulk delete ${resource}s:`, error);
        alert(`Failed to delete ${resource}s. Please try again.`);
      }
    }
  };

  // Handle form submission
  const handleFormSubmit = async (formData: Record<string, any>) => {
    setFormLoading(true);
    setFormErrors({});

    try {
      if (viewMode === 'create' && operations.create) {
        await operations.create(formData);
      } else if (viewMode === 'edit' && operations.update && editingRecord) {
        await operations.update(editingRecord.id, formData);
      }

      setViewMode('list');
      setEditingRecord(null);
      onRefresh?.();
    } catch (error: any) {
      console.error(`Failed to ${viewMode} ${resource}:`, error);
      
      // Handle validation errors
      if (error.errors && typeof error.errors === 'object') {
        setFormErrors(error.errors);
      } else {
        alert(`Failed to ${viewMode} ${resource}. Please try again.`);
      }
    } finally {
      setFormLoading(false);
    }
  };

  // Handle form cancel
  const handleFormCancel = () => {
    setViewMode('list');
    setEditingRecord(null);
    setFormErrors({});
  };

  if (viewMode === 'create' || viewMode === 'edit') {
    return (
      <div className={`admin-resource-manager admin-resource-manager--form ${className}`}>
        <AdminForm
          resource={resource}
          initialData={editingRecord}
          config={formConfig}
          mode={viewMode}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
          loading={formLoading}
          errors={formErrors}
        />
      </div>
    );
  }

  return (
    <div className={`admin-resource-manager ${className}`}>
      {/* Header */}
      <div className="admin-resource-manager__header">
        <div className="admin-resource-manager__title">
          <h2 className="admin-title">
            Manage {resource.charAt(0).toUpperCase() + resource.slice(1)}
          </h2>
          {data.length > 0 && (
            <span className="admin-count">({data.length} items)</span>
          )}
        </div>

        <div className="admin-resource-manager__actions">
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="admin-button admin-button--secondary"
              disabled={loading}
              title="Refresh data"
            >
              🔄 Refresh
            </button>
          )}
          
          {operations.create && (
            <button
              onClick={handleCreate}
              className="admin-button admin-button--primary"
            >
              ➕ Create {resource}
            </button>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="admin-resource-manager__error">
          <div className="admin-error">
            <div className="admin-error__icon">⚠️</div>
            <div className="admin-error__message">{error}</div>
          </div>
        </div>
      )}

      {/* Data Table */}
      <div className="admin-resource-manager__table">
        <AdminDataTable
          resource={resource}
          data={data}
          loading={loading}
          config={{
            ...tableConfig,
            bulkActions: Boolean(operations.bulkDelete)
          }}
          pagination={pagination}
          onSearch={onSearch}
          onEdit={operations.update ? handleEdit : undefined}
          onDelete={operations.delete ? handleDelete : undefined}
          onBulkAction={handleBulkAction}
        />
      </div>

      {/* Default styles are provided via CSS classes */}
    </div>
  );
}