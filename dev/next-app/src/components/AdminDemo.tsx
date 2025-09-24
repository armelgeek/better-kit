"use client";

import React, { useState } from 'react';
import { 
  AdminLayout, 
  AdminDashboard, 
  AdminResourceManager,
  AdminStats,
  useAdminStats,
  useAdminResource,
  useAdminAuth,
  createAdminClient
} from 'better-query/plugins';

// Mock admin client for demo
const adminClient = {
  getDashboardStats: async () => ({
    stats: [
      { resource: 'users', count: 1250, label: 'Users' },
      { resource: 'products', count: 340, label: 'Products' },
      { resource: 'orders', count: 89, label: 'Orders' },
      { resource: 'reviews', count: 456, label: 'Reviews' }
    ]
  })
};

// Mock query client
const queryClient = {
  listUsers: async () => ({ data: [], total: 0 }),
  listProducts: async () => ({ data: [], total: 0 }),
  createUser: async () => ({}),
  updateUser: async () => ({}),
  deleteUser: async () => ({})
};

export default function AdminDemo() {
  const [currentResource, setCurrentResource] = useState<string>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Mock auth for demo
  const mockUser = {
    id: 'admin-1',
    name: 'Admin User',
    email: 'admin@example.com',
    role: 'admin',
    avatar: '👤'
  };

  // Navigation items
  const navigation = [
    {
      label: 'Dashboard',
      icon: '📊',
      active: currentResource === 'dashboard',
      onClick: () => setCurrentResource('dashboard')
    },
    {
      label: 'Users',
      icon: '👤',
      active: currentResource === 'users',
      onClick: () => setCurrentResource('users')
    },
    {
      label: 'Products',
      icon: '📦',
      active: currentResource === 'products', 
      onClick: () => setCurrentResource('products')
    },
    {
      label: 'Orders',
      icon: '🛒',
      active: currentResource === 'orders',
      onClick: () => setCurrentResource('orders')
    }
  ];

  // Mock stats data
  const statsData = [
    {
      resource: 'users',
      count: 1250,
      label: 'Total Users',
      icon: '👤',
      color: '#3b82f6',
      trend: { value: 12, direction: 'up' as const, period: 'vs last month' }
    },
    {
      resource: 'products', 
      count: 340,
      label: 'Products',
      icon: '📦',
      color: '#10b981',
      trend: { value: 5, direction: 'up' as const, period: 'vs last month' }
    },
    {
      resource: 'orders',
      count: 89,
      label: 'Orders',
      icon: '🛒', 
      color: '#f59e0b',
      trend: { value: 3, direction: 'down' as const, period: 'vs last week' }
    },
    {
      resource: 'reviews',
      count: 456,
      label: 'Reviews',
      icon: '⭐',
      color: '#f97316'
    }
  ];

  const quickActions = [
    {
      label: 'Add User',
      resource: 'users',
      action: 'create' as const,
      icon: '➕',
      onClick: () => setCurrentResource('users')
    },
    {
      label: 'View Products',
      resource: 'products',
      action: 'list' as const,
      icon: '👁️',
      onClick: () => setCurrentResource('products')
    }
  ];

  const activities = [
    {
      id: '1',
      action: 'Created',
      resource: 'user',
      timestamp: new Date(Date.now() - 1000 * 60 * 5),
      user: 'John Doe'
    },
    {
      id: '2',
      action: 'Updated',
      resource: 'product',
      timestamp: new Date(Date.now() - 1000 * 60 * 15),
      user: 'Jane Smith'
    }
  ];

  const renderContent = () => {
    switch (currentResource) {
      case 'dashboard':
        return (
          <AdminDashboard
            title="Better Query Admin"
            stats={statsData}
            quickActions={quickActions}
            activities={activities}
          />
        );
      
      case 'users':
        return (
          <div className="p-6">
            <AdminResourceManager
              resource="users"
              data={[]}
              loading={false}
              tableConfig={{
                columns: [
                  { key: 'name', label: 'Name', sortable: true },
                  { key: 'email', label: 'Email', sortable: true },
                  { key: 'role', label: 'Role', sortable: true },
                  { key: 'createdAt', label: 'Created', sortable: true }
                ],
                pageSize: 10,
                pagination: true,
                search: true,
                bulkActions: true
              }}
              formConfig={{
                fields: [
                  { key: 'name', label: 'Name', type: 'text', required: true },
                  { key: 'email', label: 'Email', type: 'email', required: true },
                  { key: 'role', label: 'Role', type: 'select', required: true, options: [
                    { value: 'user', label: 'User' },
                    { value: 'admin', label: 'Admin' }
                  ]}
                ],
                layout: 'vertical',
                validation: true
              }}
              operations={{
                create: async (data) => console.log('Create user:', data),
                update: async (id, data) => console.log('Update user:', id, data),
                delete: async (id) => console.log('Delete user:', id),
                bulkDelete: async (ids) => console.log('Bulk delete users:', ids)
              }}
              onSearch={(query) => console.log('Search users:', query)}
              onRefresh={() => console.log('Refresh users')}
            />
          </div>
        );

      case 'products':
        return (
          <div className="p-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold mb-4">Products Management</h2>
              <p className="text-gray-600 mb-4">
                This would show the AdminResourceManager for products with full CRUD functionality.
              </p>
              <AdminStats
                stats={statsData.filter(s => s.resource === 'products')}
                columns={1}
              />
            </div>
          </div>
        );

      case 'orders':
        return (
          <div className="p-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold mb-4">Orders Management</h2>
              <p className="text-gray-600">
                This would show order management functionality.
              </p>
            </div>
          </div>
        );

      default:
        return (
          <div className="p-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold">Page Not Found</h2>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Demo Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold">Better Query Admin Demo</h1>
          <p className="text-blue-100 mt-1">
            Complete admin interface with shadcn-admin-kit inspired components
          </p>
        </div>
      </div>

      <AdminLayout
        navigation={navigation}
        user={mockUser}
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
        onLogout={() => alert('Logout clicked')}
        headerActions={
          <div className="flex items-center gap-2">
            <button className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700">
              Settings
            </button>
          </div>
        }
        footer={
          <div className="text-sm text-gray-600">
            © 2024 Better Query Admin - Powered by shadcn-admin-kit inspired components
          </div>
        }
      >
        {renderContent()}
      </AdminLayout>

      {/* Embedded CSS for basic styling */}
      <style jsx global>{`
        /* Admin Layout Styles */
        .admin-layout { display: flex; height: 100vh; background-color: #f3f4f6; }
        .admin-sidebar { width: 16rem; background-color: white; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border-right: 1px solid #e5e7eb; display: flex; flex-direction: column; transition: all 0.3s; }
        .admin-sidebar--collapsed { width: 4rem; }
        .admin-sidebar__header { padding: 1rem; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; justify-content: space-between; }
        .admin-sidebar__logo { font-weight: 700; color: #111827; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .admin-sidebar__toggle { padding: 0.25rem; border-radius: 0.375rem; color: #6b7280; cursor: pointer; }
        .admin-sidebar__toggle:hover { background-color: #f3f4f6; }
        .admin-sidebar__nav { flex: 1; padding: 1rem 0; space: 0.25rem 0; overflow-y: auto; }
        .admin-nav-item { padding: 0 0.75rem; }
        .admin-nav-link { display: flex; align-items: center; gap: 0.75rem; padding: 0.5rem 0.75rem; font-size: 0.875rem; color: #374151; border-radius: 0.5rem; transition: colors 0.15s; cursor: pointer; }
        .admin-nav-link:hover { background-color: #f3f4f6; }
        .admin-nav-link--active { background-color: #dbeafe; color: #1d4ed8; }
        .admin-nav-icon { font-size: 1.125rem; flex-shrink: 0; }
        .admin-nav-label { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .admin-sidebar__user { padding: 1rem; border-top: 1px solid #e5e7eb; display: flex; align-items: center; justify-content: space-between; }
        .admin-user-info { display: flex; align-items: center; gap: 0.75rem; flex: 1; min-width: 0; }
        .admin-user-avatar { width: 2rem; height: 2rem; border-radius: 9999px; flex-shrink: 0; }
        .admin-user-details { min-width: 0; flex: 1; }
        .admin-user-name { font-size: 0.875rem; font-weight: 500; color: #111827; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .admin-user-role { font-size: 0.75rem; color: #6b7280; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .admin-logout-button { padding: 0.25rem; border-radius: 0.375rem; color: #6b7280; cursor: pointer; }
        .admin-logout-button:hover { background-color: #f3f4f6; }
        .admin-main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
        .admin-header { background-color: white; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border-bottom: 1px solid #e5e7eb; padding: 1rem 1.5rem; }
        .admin-header__content { display: flex; align-items: center; justify-content: space-between; }
        .admin-header__title { font-size: 1.25rem; font-weight: 600; color: #111827; }
        .admin-header__actions { display: flex; align-items: center; gap: 0.75rem; }
        .admin-content { flex: 1; overflow: auto; }
        .admin-footer { background-color: white; border-top: 1px solid #e5e7eb; padding: 1rem 1.5rem; }

        /* Stats Component Styles */
        .admin-stats { width: 100%; }
        .admin-stats-grid { display: grid; gap: 1.5rem; }
        .admin-stats-grid--cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
        .admin-stats-grid--cols-2 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
        .admin-stats-grid--cols-3 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
        .admin-stats-grid--cols-4 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
        @media (min-width: 768px) {
          .admin-stats-grid--cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .admin-stats-grid--cols-3 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .admin-stats-grid--cols-4 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        @media (min-width: 1024px) {
          .admin-stats-grid--cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
          .admin-stats-grid--cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
        }
        .admin-stat-card { background-color: white; border-radius: 0.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border: 1px solid #e5e7eb; padding: 1.5rem; }
        .admin-stat-card__content { display: flex; flex-direction: column; gap: 1rem; }
        .admin-stat-card__header { display: flex; align-items: flex-start; justify-content: space-between; }
        .admin-stat-card__icon { font-size: 1.5rem; flex-shrink: 0; }
        .admin-stat-card__meta { text-align: right; flex: 1; }
        .admin-stat-card__label { font-size: 0.875rem; font-weight: 500; color: #4b5563; }
        .admin-stat-card__resource { font-size: 0.75rem; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 0.25rem; }
        .admin-stat-card__body { display: flex; align-items: flex-end; justify-content: space-between; }
        .admin-stat-card__count { font-size: 1.5rem; font-weight: 700; }
        .admin-stat-card__trend { display: flex; align-items: center; gap: 0.25rem; font-size: 0.75rem; font-weight: 500; }
        .admin-stat-card__trend--up { color: #059669; }
        .admin-stat-card__trend--down { color: #dc2626; }
        .admin-stat-card__trend-period { color: #6b7280; }
      `}</style>
    </div>
  );
}