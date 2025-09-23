"use client";

import React, { useState } from 'react';
import { useProducts, useFormState } from '../../hooks/useCrud';
import { productSchema, type ProductInput } from '../../lib/schemas';

export default function ProductManager() {
  const {
    items: products,
    loading,
    error,
    create,
    update,
    remove,
    refresh
  } = useProducts();

  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);

  // Form state for create/edit
  const {
    values: formValues,
    errors: formErrors,
    setValue,
    validate,
    reset: resetForm
  } = useFormState<ProductInput>({
    name: '',
    description: '',
    price: 0,
    originalPrice: undefined,
    status: 'draft',
    categoryId: '',
    tags: [],
    images: [],
    inventory: {
      quantity: 0,
      lowStockThreshold: 10,
      trackQuantity: true,
    },
    profile: {
      featured: false,
      category: '',
      weight: undefined,
      dimensions: {
        length: undefined,
        width: undefined,
        height: undefined,
      },
    },
    seo: {
      metaTitle: '',
      metaDescription: '',
      slug: '',
    },
  }, productSchema);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }

    try {
      if (editingProduct) {
        await update(editingProduct.id, formValues);
        setEditingProduct(null);
      } else {
        await create(formValues);
      }
      
      resetForm();
      setShowForm(false);
      refresh();
    } catch (err) {
      console.error('Failed to save product:', err);
    }
  };

  const handleEdit = (product: any) => {
    setEditingProduct(product);
    // Populate form with existing values
    Object.keys(formValues).forEach(key => {
      if (product[key] !== undefined) {
        setValue(key as keyof ProductInput, product[key]);
      }
    });
    setShowForm(true);
  };

  const handleDelete = async (productId: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      try {
        await remove(productId);
        refresh();
      } catch (err) {
        console.error('Failed to delete product:', err);
      }
    }
  };

  const resetForm = () => {
    resetForm();
    setEditingProduct(null);
    setShowForm(false);
  };

  if (loading && products.length === 0) {
    return <div className="p-4">Loading products...</div>;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Product Management</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Add Product
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          Error: {error}
        </div>
      )}

      {/* Product Form */}
      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-lg mb-6 border">
          <h2 className="text-xl font-semibold mb-4">
            {editingProduct ? 'Edit Product' : 'Create New Product'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Product Name *</label>
                <input
                  type="text"
                  value={formValues.name}
                  onChange={(e) => setValue('name', e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  required
                />
                {formErrors.name && <p className="text-red-500 text-sm">{formErrors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Price *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formValues.price}
                  onChange={(e) => setValue('price', parseFloat(e.target.value) || 0)}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  required
                />
                {formErrors.price && <p className="text-red-500 text-sm">{formErrors.price}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Original Price</label>
                <input
                  type="number"
                  step="0.01"
                  value={formValues.originalPrice || ''}
                  onChange={(e) => setValue('originalPrice', parseFloat(e.target.value) || undefined)}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  value={formValues.status}
                  onChange={(e) => setValue('status', e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={formValues.description || ''}
                onChange={(e) => setValue('description', e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2"
                rows={3}
              />
            </div>

            {/* Inventory Information */}
            <div className="border-t pt-4">
              <h3 className="text-lg font-medium mb-3">Inventory</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Quantity</label>
                  <input
                    type="number"
                    value={formValues.inventory.quantity}
                    onChange={(e) => setValue('inventory', {
                      ...formValues.inventory,
                      quantity: parseInt(e.target.value) || 0
                    })}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Low Stock Threshold</label>
                  <input
                    type="number"
                    value={formValues.inventory.lowStockThreshold}
                    onChange={(e) => setValue('inventory', {
                      ...formValues.inventory,
                      lowStockThreshold: parseInt(e.target.value) || 10
                    })}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formValues.inventory.trackQuantity}
                    onChange={(e) => setValue('inventory', {
                      ...formValues.inventory,
                      trackQuantity: e.target.checked
                    })}
                    className="mr-2"
                  />
                  <label className="text-sm font-medium">Track Quantity</label>
                </div>
              </div>
            </div>

            {/* SEO Information */}
            <div className="border-t pt-4">
              <h3 className="text-lg font-medium mb-3">SEO</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Meta Title</label>
                  <input
                    type="text"
                    value={formValues.seo?.metaTitle || ''}
                    onChange={(e) => setValue('seo', {
                      ...formValues.seo,
                      metaTitle: e.target.value
                    })}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Meta Description</label>
                  <textarea
                    value={formValues.seo?.metaDescription || ''}
                    onChange={(e) => setValue('seo', {
                      ...formValues.seo,
                      metaDescription: e.target.value
                    })}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    rows={2}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">URL Slug</label>
                  <input
                    type="text"
                    value={formValues.seo?.slug || ''}
                    onChange={(e) => setValue('seo', {
                      ...formValues.seo,
                      slug: e.target.value
                    })}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    placeholder="auto-generated-from-name"
                  />
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex space-x-3 pt-4">
              <button
                type="submit"
                className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
              >
                {editingProduct ? 'Update' : 'Create'} Product
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Products List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b">
          <h2 className="text-xl font-semibold">Products ({products.length})</h2>
        </div>
        
        {products.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No products found. Create your first product!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Inventory</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {products.map((product: any) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">{product.name}</div>
                        {product.description && (
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {product.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        ${product.price?.toFixed(2)}
                        {product.originalPrice && product.originalPrice > product.price && (
                          <span className="text-xs text-gray-500 line-through ml-2">
                            ${product.originalPrice.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        product.status === 'active' ? 'bg-green-100 text-green-800' :
                        product.status === 'inactive' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {product.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {product.inventory?.quantity || 0} units
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {product.createdAt ? new Date(product.createdAt).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm space-x-2">
                      <button
                        onClick={() => handleEdit(product)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}