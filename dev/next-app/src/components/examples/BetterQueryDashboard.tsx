"use client";

import React, { useState } from 'react';
import ProductManager from './ProductManager';
import ProductSearchDemo from './ProductSearchDemo';
import { useProducts, useCategories, useOrders, useReviews } from '../../hooks/useCrud';

type TabType = 'overview' | 'products' | 'search' | 'categories' | 'orders' | 'reviews';

export default function BetterQueryDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  const { items: products } = useProducts();
  const { items: categories } = useCategories();
  const { items: orders } = useOrders();
  const { items: reviews } = useReviews();

  // Calculate stats
  const stats = {
    totalProducts: products.length,
    activeProducts: products.filter((p: any) => p.status === 'active').length,
    totalCategories: categories.length,
    totalOrders: orders.length,
    totalReviews: reviews.length,
    averageRating: reviews.length > 0 
      ? (reviews.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1)
      : '0.0',
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'products', label: 'Products', icon: '📦' },
    { id: 'search', label: 'Search & Filter', icon: '🔍' },
    { id: 'categories', label: 'Categories', icon: '📂' },
    { id: 'orders', label: 'Orders', icon: '🛒' },
    { id: 'reviews', label: 'Reviews', icon: '⭐' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Better Query Dashboard</h1>
              <p className="mt-1 text-sm text-gray-600">
                Comprehensive demonstration of all Better Query features
              </p>
            </div>
            <div className="text-sm text-gray-500">
              Complete CRUD • Type Safety • Pagination • Search • Validation
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto py-6">
        {activeTab === 'overview' && <OverviewTab stats={stats} />}
        {activeTab === 'products' && <ProductManager />}
        {activeTab === 'search' && <ProductSearchDemo />}
        {activeTab === 'categories' && <CategoriesTab />}
        {activeTab === 'orders' && <OrdersTab />}
        {activeTab === 'reviews' && <ReviewsTab />}
      </div>
    </div>
  );
}

// Overview Tab Component
function OverviewTab({ stats }: { stats: any }) {
  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Better Query Feature Overview</h2>
        <div className="prose max-w-none">
          <p className="text-gray-600 mb-6">
            This dashboard demonstrates all the key features of Better Query, a standalone, type-safe CRUD generator 
            that follows the architecture patterns of better-auth. Below you'll find statistics and examples of each feature.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="text-2xl">📦</div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Products</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.totalProducts}</dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <span className="text-green-600 font-medium">{stats.activeProducts}</span>
              <span className="text-gray-500"> active</span>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="text-2xl">📂</div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Categories</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.totalCategories}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="text-2xl">🛒</div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Orders</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.totalOrders}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="text-2xl">⭐</div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Reviews</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.totalReviews}</dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <span className="text-yellow-600 font-medium">{stats.averageRating}</span>
              <span className="text-gray-500"> avg rating</span>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">🚀 Core Features</h3>
          <ul className="space-y-3">
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span className="text-sm">
                <strong>Automatic CRUD Generation:</strong> Full Create, Read, Update, Delete, List operations
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span className="text-sm">
                <strong>Type Safety:</strong> Full TypeScript support with Zod schema validation
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span className="text-sm">
                <strong>Granular Permissions:</strong> Configure permissions per operation
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span className="text-sm">
                <strong>Database Agnostic:</strong> SQLite, PostgreSQL, MySQL via Kysely
              </span>
            </li>
          </ul>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">⚡ Advanced Features</h3>
          <ul className="space-y-3">
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span className="text-sm">
                <strong>Search & Filtering:</strong> Built-in search with custom filters
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span className="text-sm">
                <strong>Pagination:</strong> Automatic pagination with cursor support
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span className="text-sm">
                <strong>Hooks System:</strong> Before/after hooks for business logic
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span className="text-sm">
                <strong>Type-Safe Client:</strong> Auto-generated client with full type inference
              </span>
            </li>
          </ul>
        </div>
      </div>

      {/* Getting Started */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">🎯 Getting Started</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl mb-2">1️⃣</div>
            <h4 className="font-medium mb-2">Define Schemas</h4>
            <p className="text-sm text-gray-600">
              Create Zod schemas for your resources with validation rules
            </p>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-2">2️⃣</div>
            <h4 className="font-medium mb-2">Configure Resources</h4>
            <p className="text-sm text-gray-600">
              Set up resources with permissions, hooks, and endpoints
            </p>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-2">3️⃣</div>
            <h4 className="font-medium mb-2">Use Type-Safe Client</h4>
            <p className="text-sm text-gray-600">
              Enjoy full type safety with auto-generated client methods
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Placeholder components for other tabs
function CategoriesTab() {
  const { items: categories, create, remove } = useCategories();

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <h2 className="text-2xl font-bold mb-6">Categories Management</h2>
      <div className="bg-white shadow rounded-lg p-6">
        <p className="text-gray-600 mb-4">
          Categories ({categories.length}) - Demonstrates hierarchical data management
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((category: any) => (
            <div key={category.id} className="border rounded p-4">
              <h3 className="font-medium">{category.name}</h3>
              <p className="text-sm text-gray-600">{category.description}</p>
              <div className="mt-2 text-xs text-gray-500">
                Status: <span className="capitalize">{category.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function OrdersTab() {
  const { items: orders } = useOrders();

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <h2 className="text-2xl font-bold mb-6">Orders Management</h2>
      <div className="bg-white shadow rounded-lg p-6">
        <p className="text-gray-600 mb-4">
          Orders ({orders.length}) - Demonstrates complex business logic and relationships
        </p>
        <div className="space-y-4">
          {orders.map((order: any) => (
            <div key={order.id} className="border rounded p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium">Order #{order.id?.slice(-8)}</h3>
                  <p className="text-sm text-gray-600">
                    Status: <span className="capitalize">{order.status}</span>
                  </p>
                </div>
                <div className="text-right">
                  <div className="font-medium">${order.total?.toFixed(2)}</div>
                  <div className="text-sm text-gray-600">
                    {order.items?.length || 0} items
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ReviewsTab() {
  const { items: reviews } = useReviews();

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <h2 className="text-2xl font-bold mb-6">Reviews Management</h2>
      <div className="bg-white shadow rounded-lg p-6">
        <p className="text-gray-600 mb-4">
          Reviews ({reviews.length}) - Demonstrates user-generated content with moderation
        </p>
        <div className="space-y-4">
          {reviews.map((review: any) => (
            <div key={review.id} className="border rounded p-4">
              <div className="flex justify-between items-start mb-2">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      className={star <= (review.rating || 0) ? 'text-yellow-400' : 'text-gray-300'}
                    >
                      ⭐
                    </span>
                  ))}
                </div>
                <span className={`px-2 py-1 text-xs rounded ${
                  review.status === 'approved' ? 'bg-green-100 text-green-800' :
                  review.status === 'rejected' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {review.status}
                </span>
              </div>
              {review.title && <h4 className="font-medium mb-1">{review.title}</h4>}
              <p className="text-sm text-gray-600">{review.content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}