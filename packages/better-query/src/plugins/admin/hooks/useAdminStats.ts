import { useState, useEffect } from 'react';

export interface AdminStats {
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
}

export interface UseAdminStatsReturn {
  stats: AdminStats[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export interface UseAdminStatsOptions {
  /**
   * Admin client instance
   */
  client: any;

  /**
   * Resources to fetch stats for
   */
  resources?: string[];

  /**
   * Auto-refresh interval in ms
   */
  refreshInterval?: number;

  /**
   * Enable auto-refresh
   */
  autoRefresh?: boolean;
}

/**
 * Hook for fetching admin dashboard statistics
 */
export function useAdminStats({
  client,
  resources = [],
  refreshInterval = 30000, // 30 seconds
  autoRefresh = false
}: UseAdminStatsOptions): UseAdminStatsReturn {
  const [stats, setStats] = useState<AdminStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    if (!client?.getDashboardStats) {
      setError('Admin client not properly configured');
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const response = await client.getDashboardStats({
        query: { resources }
      });

      if (response.error) {
        throw new Error(response.error);
      }

      // Transform stats data
      const transformedStats: AdminStats[] = response.stats.map((stat: any) => ({
        resource: stat.resource,
        count: stat.count,
        label: stat.label || stat.resource,
        icon: getResourceIcon(stat.resource),
        color: getResourceColor(stat.resource),
        // Add trend data if available
        ...(stat.trend && { trend: stat.trend })
      }));

      setStats(transformedStats);
    } catch (err: any) {
      console.error('Failed to fetch admin stats:', err);
      setError(err.message || 'Failed to fetch statistics');
    } finally {
      setLoading(false);
    }
  };

  const refresh = async () => {
    setLoading(true);
    await fetchStats();
  };

  // Initial fetch
  useEffect(() => {
    fetchStats();
  }, [client, resources.join(',')]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh || refreshInterval <= 0) return;

    const interval = setInterval(() => {
      fetchStats();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, client]);

  return {
    stats,
    loading,
    error,
    refresh
  };
}

/**
 * Get icon for resource type
 */
function getResourceIcon(resource: string): string {
  const iconMap: Record<string, string> = {
    user: '👤',
    product: '📦',
    order: '🛒',
    category: '📁',
    review: '⭐',
    post: '📝',
    comment: '💬',
    file: '📄',
    image: '🖼️',
    tag: '🏷️',
    admin: '⚙️'
  };

  return iconMap[resource.toLowerCase()] || '📊';
}

/**
 * Get color for resource type
 */
function getResourceColor(resource: string): string {
  const colorMap: Record<string, string> = {
    user: '#3b82f6',
    product: '#10b981',
    order: '#f59e0b',
    category: '#8b5cf6',
    review: '#f97316',
    post: '#06b6d4',
    comment: '#84cc16',
    file: '#6b7280',
    image: '#ec4899',
    tag: '#14b8a6',
    admin: '#ef4444'
  };

  return colorMap[resource.toLowerCase()] || '#6b7280';
}