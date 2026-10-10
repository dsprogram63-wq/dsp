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
  Users, 
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { initialAdminNotifications, initialAdminProjects, initialDevelopers } from '../../data/adminMockData';

export default function AdminHeader({
  title = 'Admin Dashboard',
  subtitle = 'Overview of all projects, developers, and milestones',
  breadcrumbs = [],
  profile,
  projects = initialAdminProjects,
  developers = initialDevelopers,
  testers = initialTesters,
  onToggleSidebar,
  onOpenMobileSidebar,
  onNavigate
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState(initialAdminNotifications);

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

  // Live search matching
  const matchingProjects = searchQuery.trim() 
    ? (projects || []).filter(p => 
        (p.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.developer || '').toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 3)
    : [];

  const matchingDevelopers = searchQuery.trim()
    ? (developers || []).filter(d =>
        (d.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (d.primarySkill || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (d.id || '').toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 3)
    : [];

  const hasSearchResults = searchQuery.trim() && (matchingProjects.length > 0 || matchingDevelopers.length > 0);

  return (
    <header className="portal-header admin-header">
      {/* Left: Desktop Toggle, Mobile Toggle & Page Title / Breadcrumbs */}
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

      {/* Right: Global Search, Notifications & Admin Profile */}
      <div className="header-right portal-header-right">
        {/* Global Admin Search */}
        <div className="header-search-wrap admin-search-wrapper" ref={searchRef}>
          <div className="header-search-box">
            <Search size={15} className="header-search-icon" />
            <input
              type="text"
              placeholder="Search projects, developers, IDs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              className="header-search-input"
            />
          </div>

          {/* Search Dropdown Results */}
          {isSearchFocused && hasSearchResults && (
            <div className="admin-search-dropdown">
              {matchingProjects.length > 0 && (
                <div className="search-result-group">
                  <div className="search-group-title">Projects</div>
                  {matchingProjects.map((p) => (
                    <div
                      key={p.id}
                      className="search-result-item"
                      onClick={() => {
                        onNavigate(`admin/projects/${p.id}`);
                        setIsSearchFocused(false);
                        setSearchQuery('');
                      }}
                    >
                      <FolderKanban size={15} color="#0A3D75" />
                      <div className="result-text">
                        <div className="result-main-text">{p.name}</div>
                        <div className="result-sub-text">{p.id} • {p.developer}</div>
                      </div>
                      <span className="result-badge">{p.status}</span>
                    </div>
                  ))}
                </div>
              )}

              {matchingDevelopers.length > 0 && (
                <div className="search-result-group">
                  <div className="search-group-title">Developers</div>
                  {matchingDevelopers.map((d) => (
                    <div
                      key={d.id}
                      className="search-result-item"
                      onClick={() => {
                        onNavigate(`admin/developers/${d.id}`);
                        setIsSearchFocused(false);
                        setSearchQuery('');
                      }}
                    >
                      <Users size={15} color="#F3821D" />
                      <div className="result-text">
                        <div className="result-main-text">{d.name}</div>
                        <div className="result-sub-text">{d.primarySkill} • {d.availability}</div>
                      </div>
                      <span className="result-badge">{d.id}</span>
                    </div>
                  ))}
                </div>
              )}
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
                    Admin Notifications
                  </h4>
                  <span style={{ fontSize: '0.74rem', color: '#64748B' }}>
                    {unreadCount} new alerts
                  </span>
                </div>

                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    className="popover-link-action"
                  >
                    Mark read
                  </button>
                )}
              </div>

              <div className="popover-list">
                {notifications.slice(0, 4).map((notif) => (
                  <div
                    key={notif.id}
                    className={`popover-item ${notif.unread ? 'unread' : ''}`}
                    onClick={() => {
                      setIsNotifOpen(false);
                      if (notif.projectId) {
                        onNavigate(`admin/projects/${notif.projectId}`);
                      } else {
                        onNavigate('admin/notifications');
                      }
                    }}
                  >
                    <div className="popover-item-dot" />
                    <div>
                      <div className="popover-item-title">{notif.title}</div>
                      <div className="popover-item-time">{notif.date}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ padding: '10px 16px', borderTop: '1px solid #F1F5F9', textAlign: 'center', background: '#FAFCFE' }}>
                <button
                  type="button"
                  onClick={() => {
                    setIsNotifOpen(false);
                    onNavigate('admin/notifications');
                  }}
                  className="popover-link-action"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  <span>View All Notifications</span>
                  <ExternalLink size={13} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Admin Profile Dropdown */}
        <div className="header-dropdown-container" ref={profileRef}>
          <button
            type="button"
            className="header-profile-btn"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            aria-expanded={isProfileOpen}
          >
            <img
              src={profile?.avatar || '/assets/logo-icon.png'}
              alt={profile?.name || 'Admin'}
              className="header-avatar-img"
            />
            <div className="header-profile-text">
              <span className="profile-name-str">{profile?.name || 'Keval Patel'}</span>
              <span className="profile-status-str" style={{ color: '#0A3D75' }}>
                <ShieldCheck size={11} color="#0A3D75" />
                Master Admin
              </span>
            </div>
            <ChevronDown size={14} color="#64748B" />
          </button>

          {isProfileOpen && (
            <div className="header-popover profile-popover">
              <div className="profile-popover-head">
                <span className="popover-user-name">{profile?.name || 'Keval Patel'}</span>
                <span className="popover-user-email">{profile?.email || 'admin@dahejsupport.com'}</span>
                <span className="popover-fl-id" style={{ background: '#EBF3FA', color: '#0A3D75' }}>
                  ID: {profile?.id || 'DS-ADM-001'}
                </span>
              </div>

              <ul className="profile-popover-menu">
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileOpen(false);
                      onNavigate('admin/settings');
                    }}
                    className="popover-menu-item"
                  >
                    <User size={16} />
                    <span>Admin Profile</span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileOpen(false);
                      onNavigate('admin/settings');
                    }}
                    className="popover-menu-item"
                  >
                    <Settings size={16} />
                    <span>System Settings</span>
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
