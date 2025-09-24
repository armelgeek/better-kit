import React from 'react';

export interface AdminDashboardProps {
  /**
   * Dashboard title
   */
  title?: string;

  /**
   * Dashboard statistics
   */
  stats?: Array<{
    resource: string;
    count: number;
    label: string;
    icon?: string;
    color?: string;
  }>;

  /**
   * Recent activities
   */
  activities?: Array<{
    id: string;
    action: string;
    resource: string;
    timestamp: Date;
    user?: string;
  }>;

  /**
   * Quick actions
   */
  quickActions?: Array<{
    label: string;
    resource: string;
    action: 'create' | 'list' | 'custom';
    icon?: string;
    onClick: () => void;
  }>;

  /**
   * Loading state
   */
  loading?: boolean;

  /**
   * Custom CSS classes
   */
  className?: string;

  /**
   * Children components
   */
  children?: React.ReactNode;
}

/**
 * Admin Dashboard Component
 * 
 * Provides a ready-to-use dashboard for admin interfaces
 * with statistics, recent activities, and quick actions
 */
export function AdminDashboard({
  title = 'Admin Dashboard',
  stats = [],
  activities = [],
  quickActions = [],
  loading = false,
  className = '',
  children
}: AdminDashboardProps) {
  
  if (loading) {
    return (
      <div className={`admin-dashboard admin-dashboard--loading ${className}`}>
        <div className="admin-dashboard__loader">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-64 bg-gray-200 rounded"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`admin-dashboard ${className}`}>
      {/* Dashboard Header */}
      <div className="admin-dashboard__header">
        <h1 className="admin-dashboard__title">{title}</h1>
        <div className="admin-dashboard__subtitle">
          Welcome to your admin panel. Here's what's happening today.
        </div>
      </div>

      {/* Stats Cards */}
      {stats.length > 0 && (
        <div className="admin-dashboard__stats">
          <div className="admin-stats-grid">
            {stats.map((stat) => (
              <div key={stat.resource} className="admin-stat-card">
                <div className="admin-stat-card__content">
                  <div className="admin-stat-card__header">
                    {stat.icon && (
                      <div 
                        className="admin-stat-card__icon"
                        style={{ color: stat.color || '#3b82f6' }}
                      >
                        {stat.icon}
                      </div>
                    )}
                    <div className="admin-stat-card__meta">
                      <div className="admin-stat-card__label">{stat.label}</div>
                      <div className="admin-stat-card__resource">{stat.resource}</div>
                    </div>
                  </div>
                  <div 
                    className="admin-stat-card__count"
                    style={{ color: stat.color || '#1f2937' }}
                  >
                    {stat.count.toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="admin-dashboard__content">
        {/* Quick Actions */}
        {quickActions.length > 0 && (
          <div className="admin-dashboard__section">
            <h2 className="admin-section__title">Quick Actions</h2>
            <div className="admin-quick-actions">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  onClick={action.onClick}
                  className="admin-quick-action"
                >
                  {action.icon && (
                    <div className="admin-quick-action__icon">{action.icon}</div>
                  )}
                  <div className="admin-quick-action__content">
                    <div className="admin-quick-action__label">{action.label}</div>
                    <div className="admin-quick-action__resource">{action.resource}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Recent Activities */}
        {activities.length > 0 && (
          <div className="admin-dashboard__section">
            <h2 className="admin-section__title">Recent Activities</h2>
            <div className="admin-activities">
              {activities.slice(0, 10).map((activity) => (
                <div key={activity.id} className="admin-activity">
                  <div className="admin-activity__content">
                    <div className="admin-activity__action">
                      <span className="font-medium">{activity.action}</span>
                      {' '}on{' '}
                      <span className="font-medium">{activity.resource}</span>
                    </div>
                    <div className="admin-activity__meta">
                      {activity.user && (
                        <span className="admin-activity__user">by {activity.user}</span>
                      )}
                      <span className="admin-activity__timestamp">
                        {formatRelativeTime(activity.timestamp)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {activities.length === 0 && (
                <div className="admin-activities__empty">
                  No recent activities
                </div>
              )}
            </div>
          </div>
        )}

        {/* Custom Content */}
        {children && (
          <div className="admin-dashboard__custom">
            {children}
          </div>
        )}
      </div>

      {/* Default styles are provided via CSS classes */}
    </div>
  );
}

/**
 * Format relative time
 */
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString();
}