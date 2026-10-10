import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  Bell, 
  Menu, 
  ChevronDown, 
  ShieldCheck, 
  User, 
  Settings, 
  LogOut, 
  Check, 
  FolderKanban, 
  Layers
} from 'lucide-react';
import { initialTesterNotifications, initialTesterProfile } from '../../data/testerMockData';
import { initialAdminProjects } from '../../data/adminMockData';

export default function TesterHeader({
  title = 'QA Testing Workspace',
  profile,
  onToggleSidebar,
  onOpenMobileSidebar,
  onNavigate,
  onOpenProject
}) {
  const activeProfile = profile || initialTesterProfile;
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState(initialTesterNotifications);

  const notifRef = useRef(null);
  const profileRef = useRef(null);
  const searchRef = useRef(null);

  const unreadCount = notifications.filter(n => n.unread).length;

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchFocused(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  };

  const matchingProjects = searchQuery.trim() 
    ? initialAdminProjects.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.developer.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 3)
    : [];

  const hasSearchResults = searchQuery.trim() && matchingProjects.length > 0;

  return (
    <header className="portal-header admin-header">
      {/* Left: Desktop Toggle, Mobile Toggle & Page Title */}
      <div className="header-left portal-header-left">
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          className="header-mobile-toggle"
          aria-label="Toggle navigation menu"
        >
          <Menu size={20} />
        </button>

        <button
          type="button"
          onClick={onToggleSidebar}
          className="header-desktop-toggle"
          aria-label="Toggle sidebar collapse"
          title="Toggle sidebar"
        >
          <Menu size={18} />
        </button>

        <div className="header-title-stack portal-title-block">
          <h1 className="header-page-title portal-page-title">{title}</h1>
        </div>
      </div>

      {/* Right: Global Search, Role Switcher, Notifications & Profile */}
      <div className="header-right portal-header-right">
        {/* Global QA Search */}
        <div className="header-search-wrap admin-search-wrapper" ref={searchRef}>
          <div className="header-search-box">
            <Search size={15} className="header-search-icon" />
            <input
              type="text"
              placeholder="Search projects, checklist, bugs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              className="header-search-input"
            />
          </div>

          {/* Search Dropdown Results */}
          {isSearchFocused && hasSearchResults && (
            <div className="admin-search-dropdown">
              <div className="search-result-group">
                <div className="search-group-title">Assigned Projects</div>
                {matchingProjects.map((p) => (
                  <div
                    key={p.id}
                    className="search-result-item"
                    onClick={() => {
                      onNavigate(`tester/projects/${p.id}`);
                      setIsSearchFocused(false);
                      setSearchQuery('');
                    }}
                  >
                    <FolderKanban size={15} color="#F3821D" />
                    <div className="result-text">
                      <div className="result-main-text">{p.name}</div>
                      <div className="result-sub-text">{p.id} • {p.developer}</div>
                    </div>
                    <span className="result-badge">{p.testingStatus || p.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Notifications Popover */}
        <div className="header-dropdown-container" ref={notifRef}>
          <button
            type="button"
            className="header-icon-button"
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            aria-label="Notifications"
            title="Notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="header-notif-dot" />
            )}
          </button>

          {isNotifOpen && (
            <div className="header-popover notif-popover">
              <div className="popover-header">
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800, color: '#0A3D75' }}>
                    QA Notifications
                  </h4>
                  <span style={{ fontSize: '0.74rem', color: '#64748B' }}>
                    {unreadCount > 0 ? `${unreadCount} new alerts` : 'All alerts up to date'}
                  </span>
                </div>
                {unreadCount > 0 && (
                  <button type="button" onClick={handleMarkAllRead} className="popover-link-action">
                    Mark read
                  </button>
                )}
              </div>

              <div className="popover-list">
                {notifications.slice(0, 4).map((n) => (
                  <div 
                    key={n.id} 
                    className={`popover-item ${n.unread ? 'unread' : ''}`}
                    onClick={() => {
                      setIsNotifOpen(false);
                      if (n.projectId) {
                        onNavigate(`tester/projects/${n.projectId}`);
                      } else {
                        onNavigate('tester/notifications');
                      }
                    }}
                  >
                    <div className="popover-item-dot" />
                    <div>
                      <div className="popover-item-title">{n.title}</div>
                      <div className="popover-item-time">{n.date}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ padding: '10px 16px', borderTop: '1px solid #F1F5F9', textAlign: 'center', background: '#FAFCFE' }}>
                <button
                  type="button"
                  onClick={() => {
                    setIsNotifOpen(false);
                    onNavigate('tester/notifications');
                  }}
                  className="popover-link-action"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  <span>View All Notifications</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Tester Profile Pill & Popover */}
        <div className="header-dropdown-container" ref={profileRef}>
          <button
            type="button"
            className="header-profile-btn"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            aria-expanded={isProfileOpen}
            aria-label="QA Tester profile menu"
          >
            <img
              src={activeProfile.avatar}
              alt={activeProfile.name}
              className="header-avatar-img"
            />
            <div className="header-profile-text">
              <span className="profile-name-str">{activeProfile.name}</span>
              <span className="profile-status-str" style={{ color: '#0A3D75' }}>
                <ShieldCheck size={11} color="#0A3D75" />
                {activeProfile.roleTitle || activeProfile.specialization || 'QA Lead'}
              </span>
            </div>
            <ChevronDown size={14} color="#64748B" />
          </button>

          {isProfileOpen && (
            <div className="header-popover profile-popover">
              <div className="profile-popover-head">
                <span className="popover-user-name">{activeProfile.name}</span>
                <span className="popover-user-email">{activeProfile.email}</span>
                <span className="popover-fl-id" style={{ background: '#EBF3FA', color: '#0A3D75' }}>
                  ID: {activeProfile.id || activeProfile.testerId} • {activeProfile.roleTitle || 'QA Lead'}
                </span>
              </div>

              <ul className="profile-popover-menu">
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileOpen(false);
                      onNavigate('tester/profile');
                    }}
                    className="popover-menu-item"
                  >
                    <User size={16} />
                    <span>My Profile</span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileOpen(false);
                      onNavigate('tester/settings');
                    }}
                    className="popover-menu-item"
                  >
                    <Settings size={16} />
                    <span>Account Settings</span>
                  </button>
                </li>
                <li className="popover-menu-divider" />
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileOpen(false);
                      onNavigate('logout');
                    }}
                    className="popover-menu-item logout-item"
                  >
                    <LogOut size={16} />
                    <span>Logout</span>
                  </button>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
