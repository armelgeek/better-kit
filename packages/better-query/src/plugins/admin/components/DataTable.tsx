import React, { useState, useEffect } from 'react';
import type { AdminComponentProps, AdminTableConfig } from '../types';

export interface AdminDataTableProps extends AdminComponentProps {
  /**
   * Data to display in the table
   */
  data?: any[];

  /**
   * Loading state
   */
  loading?: boolean;

  /**
   * Table configuration
   */
  config?: AdminTableConfig;

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
   * Search functionality
   */
  onSearch?: (query: string) => void;

  /**
   * Row actions
   */
  onEdit?: (record: any) => void;
  onDelete?: (record: any) => void;

  /**
   * Bulk actions
   */
  onBulkAction?: (action: string, selectedIds: string[]) => void;

  /**
   * Custom CSS classes
   */
  className?: string;
}

/**
 * Admin Data Table Component
 * 
 * Provides a ready-to-use data table for admin interfaces
 * with features like pagination, search, sorting, and bulk actions
 */
export function AdminDataTable({
  resource,
  data = [],
  loading = false,
  config = {},
  pagination,
  onSearch,
  onEdit,
  onDelete,
  onBulkAction,
  className = '',
  ...props
}: AdminDataTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [sortField, setSortField] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const {
    columns = [],
    pageSize = 10,
    pagination: paginationEnabled = true,
    search: searchEnabled = true,
    bulkActions = false
  } = config;

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (onSearch) {
      onSearch(query);
    }
  };

  // Handle row selection
  const handleRowSelect = (id: string, selected: boolean) => {
    setSelectedRows(prev => 
      selected 
        ? [...prev, id]
        : prev.filter(rowId => rowId !== id)
    );
  };

  // Handle select all
  const handleSelectAll = (selected: boolean) => {
    setSelectedRows(selected ? data.map(item => item.id) : []);
  };

  // Handle sorting
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Auto-generate columns from data if not provided
  const tableColumns = columns.length > 0 ? columns : (
    data.length > 0 ? Object.keys(data[0]).map(key => ({
      key,
      label: key.charAt(0).toUpperCase() + key.slice(1),
      sortable: true
    })) : []
  );

  if (loading) {
    return (
      <div className={`admin-data-table admin-data-table--loading ${className}`}>
        <div className="admin-data-table__loader">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`admin-data-table ${className}`}>
      {/* Search Bar */}
      {searchEnabled && (
        <div className="admin-data-table__search mb-4">
          <input
            type="text"
            placeholder={`Search ${resource}...`}
            value={searchQuery}
            onChange={handleSearchChange}
            className="admin-input admin-input--search"
          />
        </div>
      )}

      {/* Bulk Actions */}
      {bulkActions && selectedRows.length > 0 && (
        <div className="admin-data-table__bulk-actions mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              {selectedRows.length} item(s) selected
            </span>
            <button
              onClick={() => onBulkAction?.('delete', selectedRows)}
              className="admin-button admin-button--danger admin-button--sm"
            >
              Delete Selected
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="admin-data-table__container">
        <table className="admin-table">
          <thead>
            <tr>
              {bulkActions && (
                <th className="admin-table__header">
                  <input
                    type="checkbox"
                    checked={selectedRows.length === data.length && data.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                </th>
              )}
              {tableColumns.map((column) => (
                <th 
                  key={column.key}
                  className={`admin-table__header ${column.sortable ? 'sortable' : ''}`}
                  onClick={column.sortable ? () => handleSort(column.key) : undefined}
                >
                  <div className="flex items-center gap-1">
                    {column.label}
                    {column.sortable && sortField === column.key && (
                      <span className="sort-indicator">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
              {(onEdit || onDelete) && (
                <th className="admin-table__header">Actions</th>
              )}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td 
                  colSpan={tableColumns.length + (bulkActions ? 1 : 0) + (onEdit || onDelete ? 1 : 0)}
                  className="admin-table__cell text-center py-8 text-gray-500"
                >
                  No {resource} found
                </td>
              </tr>
            ) : (
              data.map((record) => (
                <tr key={record.id} className="admin-table__row">
                  {bulkActions && (
                    <td className="admin-table__cell">
                      <input
                        type="checkbox"
                        checked={selectedRows.includes(record.id)}
                        onChange={(e) => handleRowSelect(record.id, e.target.checked)}
                      />
                    </td>
                  )}
                  {tableColumns.map((column) => (
                    <td key={column.key} className="admin-table__cell">
                      {'render' in column && column.render 
                        ? column.render(record[column.key], record)
                        : String(record[column.key] || '')
                      }
                    </td>
                  ))}
                  {(onEdit || onDelete) && (
                    <td className="admin-table__cell">
                      <div className="flex gap-2">
                        {onEdit && (
                          <button
                            onClick={() => onEdit(record)}
                            className="admin-button admin-button--sm admin-button--secondary"
                          >
                            Edit
                          </button>
                        )}
                        {onDelete && (
                          <button
                            onClick={() => onDelete(record)}
                            className="admin-button admin-button--sm admin-button--danger"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {paginationEnabled && pagination && (
        <div className="admin-data-table__pagination mt-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {((pagination.page - 1) * pagination.pageSize) + 1} to{' '}
              {Math.min(pagination.page * pagination.pageSize, pagination.total)} of{' '}
              {pagination.total} results
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => pagination.onPageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="admin-button admin-button--sm admin-button--secondary"
              >
                Previous
              </button>
              <span className="flex items-center px-3 py-1 text-sm">
                Page {pagination.page}
              </span>
              <button
                onClick={() => pagination.onPageChange(pagination.page + 1)}
                disabled={pagination.page * pagination.pageSize >= pagination.total}
                className="admin-button admin-button--sm admin-button--secondary"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Default styles are provided via CSS classes */}
    </div>
  );
}