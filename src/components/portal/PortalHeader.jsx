import React, { useState, useRef, useEffect } from 'react';
import { 
  Menu, 
  Search, 
  Bell, 
  User, 
  Settings, 
  LogOut, 
  ChevronDown, 
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ExternalLink
} from 'lucide-react';
import { initialNotifications } from '../../data/mockData';

export default function PortalHeader({ 
  title, 
  subtitle, 
  profile, 
  onToggleSidebar, 
  onNavigate,
  onOpenMobileSidebar
}) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const profileRef = useRef(null);
  const notifRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadNotifs = initialNotifications.filter(n => n.unread);

  return (
    <header className="portal-header">
      {/* Left: Hamburger & Page Title */}
      <div className="header-left">
        <button 
          type="button" 
          onClick={onOpenMobileSidebar}
          className="header-mobile-toggle"
          aria-label="Open navigation menu"
        >
          <Menu size={22} />
        </button>

        <button 
          type="button" 
          onClick={onToggleSidebar}
          className="header-desktop-toggle"
          aria-label="Toggle sidebar collapse"
        >
          <Menu size={20} />
        </button>

        <div className="header-title-stack">
          <h1 className="header-page-title">{title || 'Dashboard'}</h1>
        </div>
      </div>

      {/* Right: Search, Notifications & Profile */}
      <div className="header-right">
        {/* Global Quick Search */}
        <div className="header-search-wrap">
          <Search size={16} className="header-search-icon" />
          <input
            type="text"
            placeholder="Search projects, tasks, IDs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="header-search-input"
          />
        </div>

        {/* Notifications Icon & Popover */}
        <div className="header-dropdown-container" ref={notifRef}>
          <button
            type="button"
            className="header-icon-button"
            onClick={() => setNotifOpen(!notifOpen)}
            aria-label="Notifications"
          >
            <Bell size={20} />
            {unreadNotifs.length > 0 && (
              <span className="header-notif-dot" />
            )}
          </button>

          {notifOpen && (
            <div className="header-popover notif-popover">
              <div className="popover-header">
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#0A3D75' }}>
                    Notifications
                  </h4>
                  <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                    {unreadNotifs.length} new alerts
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setNotifOpen(false);
                    onNavigate('notifications');
                  }}
                  className="popover-link-action"
                >
                  View All
                </button>
              </div>

              <div className="popover-list">
                {initialNotifications.slice(0, 3).map((n) => (
                  <div 
                    key={n.id} 
                    className={`popover-item ${n.unread ? 'unread' : ''}`}
                    onClick={() => {
                      setNotifOpen(false);
                      onNavigate('notifications');
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
            </div>
          )}
        </div>

        {/* Profile Dropdown */}
        <div className="header-dropdown-container" ref={profileRef}>
          <button
            type="button"
            className="header-profile-btn"
            onClick={() => setProfileOpen(!profileOpen)}
            aria-expanded={profileOpen}
          >
            <img
              src={profile?.avatar || '/assets/logo-icon.png'}
              alt={profile?.fullName || 'Freelancer Profile'}
              className="header-avatar-img"
            />
            <div className="header-profile-text">
              <span className="profile-name-str">{profile?.fullName || profile?.name || 'Freelancer'}</span>
              <span className="profile-status-str">
                <span className="status-indicator-green" />
                Verified Member
              </span>
            </div>
            <ChevronDown size={14} color="#64748B" />
          </button>

          {profileOpen && (
            <div className="header-popover profile-popover">
              <div className="profile-popover-head">
                <span className="popover-user-name">{profile?.fullName || profile?.name || 'Freelancer'}</span>
                <span className="popover-user-email">{profile?.email || ''}</span>
                <span className="popover-fl-id">ID: {profile?.freelancerId || profile?.id || 'DEV-MEMBER'}</span>
              </div>

              <ul className="profile-popover-menu">
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false);
                      onNavigate('profile');
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
                      setProfileOpen(false);
                      onNavigate('settings');
                    }}
                    className="popover-menu-item"
                  >
                    <Settings size={16} />
                    <span>Settings</span>
                  </button>
                </li>
                <li className="popover-menu-divider" />
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false);
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
