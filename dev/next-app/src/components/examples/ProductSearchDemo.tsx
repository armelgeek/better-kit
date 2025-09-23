"use client";

import React from 'react';
import { useProductSearch, useCategories } from '../../hooks/useCrud';

export default function ProductSearchDemo() {
  const {
    products,
    loading,
    error,
    pagination,
    searchParams,
    updateSearch,
    resetSearch,
    search,
  } = useProductSearch();

  const { items: categories } = useCategories();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    search();
  };

  const handlePageChange = (newPage: number) => {
    updateSearch({ page: newPage });
  };

  const handleSortChange = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    updateSearch({ sortBy, sortOrder, page: 1 });
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-4">Product Search & Filtering</h1>
        <p className="text-gray-600">
          Demonstrates advanced search, filtering, pagination, and sorting capabilities
        </p>
      </div>

      {/* Search Form */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <form onSubmit={handleSearchSubmit} className="space-y-4">
          {/* Search and Basic Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Search Products</label>
              <input
                type="text"
                placeholder="Search by name, description..."
                value={searchParams.search}
                onChange={(e) => updateSearch({ search: e.target.value, page: 1 })}
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <select
                value={searchParams.categoryId}
                onChange={(e) => updateSearch({ categoryId: e.target.value, page: 1 })}
                className="w-full border border-gray-300 rounded px-3 py-2"
              >
                <option value="">All Categories</option>
                {categories.map((category: any) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                value={searchParams.status}
                onChange={(e) => updateSearch({ status: e.target.value, page: 1 })}
                className="w-full border border-gray-300 rounded px-3 py-2"
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="draft">Draft</option>
              </select>
            </div>

            <div className="flex items-end">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={searchParams.featured}
                  onChange={(e) => updateSearch({ featured: e.target.checked, page: 1 })}
                  className="mr-2"
                />
                <label className="text-sm font-medium">Featured Only</label>
              </div>
            </div>
          </div>

          {/* Price Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Minimum Price</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={searchParams.minPrice}
                onChange={(e) => updateSearch({ minPrice: e.target.value, page: 1 })}
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Maximum Price</label>
              <input
                type="number"
                step="0.01"
                placeholder="999.99"
                value={searchParams.maxPrice}
                onChange={(e) => updateSearch({ maxPrice: e.target.value, page: 1 })}
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
            </div>
          </div>

          {/* Sort Options */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Sort By</label>
              <select
                value={searchParams.sortBy}
                onChange={(e) => updateSearch({ sortBy: e.target.value, page: 1 })}
                className="w-full border border-gray-300 rounded px-3 py-2"
              >
                <option value="createdAt">Created Date</option>
                <option value="name">Name</option>
                <option value="price">Price</option>
                <option value="updatedAt">Updated Date</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Sort Order</label>
              <select
                value={searchParams.sortOrder}
                onChange={(e) => updateSearch({ sortOrder: e.target.value as 'asc' | 'desc', page: 1 })}
                className="w-full border border-gray-300 rounded px-3 py-2"
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Results Per Page</label>
              <select
                value={searchParams.limit}
                onChange={(e) => updateSearch({ limit: parseInt(e.target.value), page: 1 })}
                className="w-full border border-gray-300 rounded px-3 py-2"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          {/* Search Actions */}
          <div className="flex space-x-3">
            <button
              type="submit"
              className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
            >
              Search
            </button>
            <button
              type="button"
              onClick={resetSearch}
              className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600"
            >
              Reset Filters
            </button>
          </div>
        </form>
      </div>

      {/* Results Summary */}
      {pagination && (
        <div className="mb-4 text-sm text-gray-600">
          Showing {((pagination.page - 1) * pagination.limit) + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          Error: {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="mt-2 text-gray-600">Searching products...</p>
        </div>
      )}

      {/* Products Grid */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          {products.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-500">
              <p className="text-lg">No products found</p>
              <p className="text-sm">Try adjusting your search criteria</p>
            </div>
          ) : (
            products.map((product: any) => (
              <div key={product.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
                {/* Product Image Placeholder */}
                <div className="h-48 bg-gray-200 rounded-t-lg flex items-center justify-center">
                  <span className="text-gray-400">No Image</span>
                </div>
                
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-lg text-gray-900 truncate">{product.name}</h3>
                    {product.profile?.featured && (
                      <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
                        Featured
                      </span>
                    )}
                  </div>
                  
                  {product.description && (
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {product.description}
                    </p>
                  )}

                  <div className="flex justify-between items-center mb-3">
                    <div className="text-lg font-bold text-gray-900">
                      ${product.price?.toFixed(2)}
                      {product.originalPrice && product.originalPrice > product.price && (
                        <span className="text-sm text-gray-500 line-through ml-2">
                          ${product.originalPrice.toFixed(2)}
                        </span>
                      )}
                    </div>
                    
                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                      product.status === 'active' ? 'bg-green-100 text-green-800' :
                      product.status === 'inactive' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {product.status}
                    </span>
                  </div>

                  <div className="text-xs text-gray-500 space-y-1">
                    <div>Stock: {product.inventory?.quantity || 0} units</div>
                    <div>Created: {product.createdAt ? new Date(product.createdAt).toLocaleDateString() : '-'}</div>
                    {product.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {product.tags.slice(0, 3).map((tag: string, index: number) => (
                          <span key={index} className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                            {tag}
                          </span>
                        ))}
                        {product.tags.length > 3 && (
                          <span className="text-gray-400 text-xs">+{product.tags.length - 3} more</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2">
          {/* Previous Button */}
          <button
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={!pagination.hasPrev}
            className={`px-3 py-2 rounded ${
              pagination.hasPrev
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Previous
          </button>

          {/* Page Numbers */}
          {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
            const pageNumber = Math.max(1, pagination.page - 2) + i;
            if (pageNumber > pagination.totalPages) return null;
            
            return (
              <button
                key={pageNumber}
                onClick={() => handlePageChange(pageNumber)}
                className={`px-3 py-2 rounded ${
                  pageNumber === pagination.page
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {pageNumber}
              </button>
            );
          })}

          {/* Next Button */}
          <button
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={!pagination.hasNext}
            className={`px-3 py-2 rounded ${
              pagination.hasNext
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Next
          </button>
        </div>
      )}

      {/* Quick Stats */}
      <div className="mt-8 bg-gray-50 p-4 rounded-lg">
        <h3 className="font-medium mb-2">Search Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Total Products:</span>
            <span className="ml-1 font-medium">{pagination?.total || 0}</span>
          </div>
          <div>
            <span className="text-gray-600">Current Page:</span>
            <span className="ml-1 font-medium">{pagination?.page || 1}</span>
          </div>
          <div>
            <span className="text-gray-600">Per Page:</span>
            <span className="ml-1 font-medium">{pagination?.limit || 10}</span>
          </div>
          <div>
            <span className="text-gray-600">Total Pages:</span>
            <span className="ml-1 font-medium">{pagination?.totalPages || 1}</span>
          </div>
        </div>
      </div>
    </div>
  );
}