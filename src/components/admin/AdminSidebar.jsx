import React from 'react';
import { 
  LayoutDashboard, 
  FolderKanban, 
  PlusCircle, 
  Clock, 
  Send, 
  CheckCircle, 
  CheckSquare2,
  Users, 
  ShieldCheck,
  IndianRupee, 
  Bell, 
  Settings, 
  LogOut,
  X,
  Shield
} from 'lucide-react';
import Logo from '../Logo';

export default function AdminSidebar({ 
  currentPath, 
  onNavigate, 
  collapsed, 
  mobileOpen, 
  onCloseMobile,
  unreadCount = 2,
  projectsCount,
  developersCount,
  testersCount,
  projects = [],
  developers = [],
  testers = []
}) {
  const pCount = projectsCount !== undefined && projectsCount !== null 
    ? projectsCount 
    : (Array.isArray(projects) ? projects.length : 0);

  const dCount = developersCount !== undefined && developersCount !== null 
    ? developersCount 
    : (Array.isArray(developers) ? developers.length : 0);

  const tCount = testersCount !== undefined && testersCount !== null 
    ? testersCount 
    : (Array.isArray(testers) ? testers.length : 0);

  const menuItems = [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'projects', label: 'Projects', icon: FolderKanban, badge: String(pCount) },
    { key: 'developers', label: 'Developers', icon: Users, badge: String(dCount) },
    { key: 'testers', label: 'Testers', icon: ShieldCheck, badge: String(tCount) },
    { key: 'earnings', label: 'Earnings', icon: IndianRupee },
    { key: 'settings', label: 'Settings / Profile', icon: Settings }
  ];

  const handleItemClick = (key) => {
    onNavigate(`admin/${key}`);
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
              <img src="/assets/logo-icon.png" alt="Dahej Support Admin" style={{ height: '32px', width: 'auto' }} />
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

        {/* Admin Badge Tag */}
        {!collapsed && (
          <div className="admin-sidebar-badge-strip">
            <Shield size={13} color="#0A3D75" />
            <span>Operations & Management</span>
          </div>
        )}

        {/* Navigation Items */}
        <div className="sidebar-nav-scroll">
          <ul className="sidebar-nav-list">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPath === item.key || 
                (item.key === 'projects' && (
                  currentPath === 'projects' || 
                  currentPath.startsWith('projects/') ||
                  currentPath === 'create-project' ||
                  currentPath === 'active-projects' ||
                  currentPath === 'submitted-projects' ||
                  currentPath === 'testing-queue' ||
                  currentPath === 'completed-projects'
                )) ||
                (item.key === 'developers' && (currentPath === 'developers' || currentPath.startsWith('developers/'))) ||
                (item.key === 'testers' && (currentPath === 'testers' || currentPath.startsWith('testers/'))) ||
                (item.key === 'earnings' && currentPath === 'earnings') ||
                (item.key === 'settings' && currentPath === 'settings');
              
              return (
                <li key={item.key}>
                  <button
                    type="button"
                    onClick={() => handleItemClick(item.key)}
                    className={`sidebar-nav-button ${isActive ? 'active' : ''} ${item.isHighlight ? 'nav-btn-highlight' : ''}`}
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
            title="Logout from Admin Panel"
          >
            <LogOut size={18} />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
