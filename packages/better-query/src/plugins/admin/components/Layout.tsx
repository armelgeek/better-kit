import React from 'react';

export interface AdminLayoutProps {
  /**
   * Navigation items
   */
  navigation?: Array<{
    label: string;
    href?: string;
    icon?: string;
    active?: boolean;
    onClick?: () => void;
    children?: Array<{
      label: string;
      href?: string;
      onClick?: () => void;
    }>;
  }>;

  /**
   * Current user info
   */
  user?: {
    name: string;
    email?: string;
    avatar?: string;
    role?: string;
  };

  /**
   * Header actions
   */
  headerActions?: React.ReactNode;

  /**
   * Footer content
   */
  footer?: React.ReactNode;

  /**
   * Sidebar collapsed state
   */
  sidebarCollapsed?: boolean;

  /**
   * Toggle sidebar
   */
  onToggleSidebar?: () => void;

  /**
   * Logout handler
   */
  onLogout?: () => void;

  /**
   * Custom CSS classes
   */
  className?: string;

  /**
   * Children components
   */
  children: React.ReactNode;
}

/**
 * Admin Layout Component
 * 
 * Provides a complete layout structure for admin interfaces
 */
export function AdminLayout({
  navigation = [],
  user,
  headerActions,
  footer,
  sidebarCollapsed = false,
  onToggleSidebar,
  onLogout,
  className = '',
  children
}: AdminLayoutProps) {
  
  return (
    <div className={`admin-layout ${className}`}>
      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarCollapsed ? 'admin-sidebar--collapsed' : ''}`}>
        <div className="admin-sidebar__header">
          <div className="admin-sidebar__logo">
            {sidebarCollapsed ? '🚀' : '🚀 Better Query Admin'}
          </div>
          <button
            onClick={onToggleSidebar}
            className="admin-sidebar__toggle"
            aria-label="Toggle sidebar"
          >
            {sidebarCollapsed ? '→' : '←'}
          </button>
        </div>

        <nav className="admin-sidebar__nav">
          {navigation.map((item, index) => (
            <div key={index} className="admin-nav-item">
              <a
                href={item.href}
                onClick={item.onClick}
                className={`admin-nav-link ${item.active ? 'admin-nav-link--active' : ''}`}
                title={sidebarCollapsed ? item.label : undefined}
              >
                {item.icon && <span className="admin-nav-icon">{item.icon}</span>}
                {!sidebarCollapsed && <span className="admin-nav-label">{item.label}</span>}
              </a>
              
              {item.children && !sidebarCollapsed && (
                <div className="admin-nav-children">
                  {item.children.map((child, childIndex) => (
                    <a
                      key={childIndex}
                      href={child.href}
                      onClick={child.onClick}
                      className="admin-nav-child-link"
                    >
                      {child.label}
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* User info */}
        {user && !sidebarCollapsed && (
          <div className="admin-sidebar__user">
            <div className="admin-user-info">
              {user.avatar && (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="admin-user-avatar"
                />
              )}
              <div className="admin-user-details">
                <div className="admin-user-name">{user.name}</div>
                {user.role && (
                  <div className="admin-user-role">{user.role}</div>
                )}
              </div>
            </div>
            {onLogout && (
              <button
                onClick={onLogout}
                className="admin-logout-button"
                title="Logout"
              >
                🚪
              </button>
            )}
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        {/* Header */}
        <header className="admin-header">
          <div className="admin-header__content">
            <h1 className="admin-header__title">Admin Panel</h1>
            <div className="admin-header__actions">
              {headerActions}
              {user && sidebarCollapsed && onLogout && (
                <button
                  onClick={onLogout}
                  className="admin-button admin-button--secondary"
                  title="Logout"
                >
                  🚪
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="admin-content">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <footer className="admin-footer">
            {footer}
          </footer>
        )}
      </main>

      {/* Default styles are provided via CSS classes */}
    </div>
  );
}