import React from 'react';

export interface AdminStatsProps {
  /**
   * Statistics data
   */
  stats: Array<{
    resource: string;
    count: number;
    label: string;
    icon?: string;
    color?: string;
    trend?: {
      value: number;
      direction: 'up' | 'down';
      period: string;
    };
  }>;

  /**
   * Loading state
   */
  loading?: boolean;

  /**
   * Error state
   */
  error?: string;

  /**
   * Custom CSS classes
   */
  className?: string;

  /**
   * Grid columns
   */
  columns?: 1 | 2 | 3 | 4;

  /**
   * Stat card click handler
   */
  onStatClick?: (resource: string) => void;
}

/**
 * Admin Stats Component
 * 
 * Displays statistics cards in a responsive grid
 */
export function AdminStats({
  stats,
  loading = false,
  error,
  className = '',
  columns = 4,
  onStatClick
}: AdminStatsProps) {

  if (error) {
    return (
      <div className={`admin-stats admin-stats--error ${className}`}>
        <div className="admin-error">
          <div className="admin-error__icon">⚠️</div>
          <div className="admin-error__message">
            Failed to load statistics: {error}
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`admin-stats admin-stats--loading ${className}`}>
        <div className={`admin-stats-grid admin-stats-grid--cols-${columns}`}>
          {[...Array(columns)].map((_, i) => (
            <div key={i} className="admin-stat-card admin-stat-card--skeleton">
              <div className="animate-pulse">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-6 h-6 bg-gray-200 rounded"></div>
                  <div className="space-y-1 text-right">
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                    <div className="h-3 bg-gray-200 rounded w-12"></div>
                  </div>
                </div>
                <div className="h-8 bg-gray-200 rounded w-20"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (stats.length === 0) {
    return (
      <div className={`admin-stats admin-stats--empty ${className}`}>
        <div className="admin-empty">
          <div className="admin-empty__icon">📊</div>
          <div className="admin-empty__message">
            No statistics available
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`admin-stats ${className}`}>
      <div className={`admin-stats-grid admin-stats-grid--cols-${columns}`}>
        {stats.map((stat) => (
          <div
            key={stat.resource}
            className={`admin-stat-card ${onStatClick ? 'admin-stat-card--clickable' : ''}`}
            onClick={onStatClick ? () => onStatClick(stat.resource) : undefined}
          >
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
              
              <div className="admin-stat-card__body">
                <div 
                  className="admin-stat-card__count"
                  style={{ color: stat.color || '#1f2937' }}
                >
                  {stat.count.toLocaleString()}
                </div>
                
                {stat.trend && (
                  <div className={`admin-stat-card__trend admin-stat-card__trend--${stat.trend.direction}`}>
                    <span className="admin-stat-card__trend-icon">
                      {stat.trend.direction === 'up' ? '↗️' : '↘️'}
                    </span>
                    <span className="admin-stat-card__trend-value">
                      {Math.abs(stat.trend.value)}%
                    </span>
                    <span className="admin-stat-card__trend-period">
                      {stat.trend.period}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Default styles are provided via CSS classes */}
    </div>
  );
}