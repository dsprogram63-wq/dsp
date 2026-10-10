import React from 'react';
import { 
  LayoutDashboard, 
  FolderKanban, 
  IndianRupee,
  User, 
  LogOut,
  X,
  ShieldCheck
} from 'lucide-react';
import Logo from '../Logo';

export default function TesterSidebar({ 
  currentPath, 
  onNavigate, 
  collapsed, 
  mobileOpen, 
  onCloseMobile,
  projectsCount,
  projects
}) {
  const pCount = projectsCount !== undefined && projectsCount !== null
    ? projectsCount
    : (Array.isArray(projects) ? projects.length : undefined);

  const menuItems = [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'projects', label: 'Projects', icon: FolderKanban, badge: pCount !== undefined ? String(pCount) : undefined },
    { key: 'earnings', label: 'Earnings', icon: IndianRupee },
    { key: 'profile', label: 'Profile', icon: User }
  ];

  const handleItemClick = (key) => {
    onNavigate(`tester/${key}`);
    if (mobileOpen) {
      onCloseMobile();
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div 
          className="portal-sidebar-overlay"
          onClick={onCloseMobile}
        />
      )}

      <aside className={`portal-sidebar admin-sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
        {/* Sidebar Header */}
        <div className="sidebar-header">
          {!collapsed && (
            <div className="sidebar-logo-wrap" onClick={() => handleItemClick('dashboard')}>
              <Logo size="normal" />
            </div>
          )}

          {collapsed && (
            <div className="sidebar-logo-collapsed" onClick={() => handleItemClick('dashboard')}>
              <img src="/assets/logo-icon.png" alt="Dahej Support QA" style={{ height: '32px', width: 'auto' }} />
            </div>
          )}

          {/* Close for mobile */}
          <button 
            type="button" 
            className="sidebar-mobile-close"
            onClick={onCloseMobile}
          >
            <X size={20} />
          </button>
        </div>

        {/* QA Tester Badge Strip (Matching Admin Style) */}
        {!collapsed && (
          <div className="admin-sidebar-badge-strip">
            <ShieldCheck size={13} color="#0A3D75" />
            <span>QA Testing Workspace</span>
          </div>
        )}

        {/* Navigation Items */}
        <div className="sidebar-nav-scroll">
          <ul className="sidebar-nav-list">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPath === item.key || 
                (item.key === 'projects' && (currentPath === 'projects' || currentPath.startsWith('projects/') || currentPath === 'project-detail')) ||
                (item.key === 'testing-queue' && currentPath === 'testing-queue');

              return (
                <li key={item.key}>
                  <button
                    type="button"
                    onClick={() => handleItemClick(item.key)}
                    className={`sidebar-nav-button ${isActive ? 'active' : ''}`}
                    title={collapsed ? item.label : undefined}
                  >
                    <div className="nav-icon-wrap">
                      <Icon size={19} />
                    </div>

                    {!collapsed && (
                      <span className="nav-label-text">
                        {item.label}
                      </span>
                    )}

                    {!collapsed && item.badge && (
                      <span className={`nav-pill-badge ${item.alertBadge ? 'alert' : ''} ${item.isTestingBadge ? 'testing-pill' : ''}`}>
                        {item.badge}
                      </span>
                    )}

                    {!collapsed && item.badgeCount > 0 && (
                      <span className="nav-alert-badge">
                        {item.badgeCount}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Sidebar Footer (Logout) */}
        <div className="sidebar-footer">
          <button
            type="button"
            onClick={() => onNavigate('logout')}
            className="sidebar-logout-button"
            title="Logout from QA Tester Panel"
          >
            <LogOut size={18} />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
