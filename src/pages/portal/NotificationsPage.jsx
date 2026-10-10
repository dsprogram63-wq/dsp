import React, { useState } from 'react';
import { 
  Bell, 
  CheckCheck, 
  Clock, 
  ShieldAlert, 
  FolderKanban, 
  IndianRupee, 
  CheckCircle2, 
  Calendar,
  Filter,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import EmptyState from '../../components/portal/EmptyState';
import { initialNotifications } from '../../data/mockData';
import './NotificationsPage.css';

export default function NotificationsPage({ onOpenProject, onNavigate }) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [selectedFilter, setSelectedFilter] = useState('All');

  const filterTabs = ['All', 'Unread', 'Projects', 'Revisions', 'Earnings'];

  const getIconForType = (type) => {
    switch (type) {
      case 'revision':
        return <ShieldAlert size={20} color="#DC2626" />;
      case 'project':
        return <FolderKanban size={20} color="#0A3D75" />;
      case 'earning':
        return <IndianRupee size={20} color="#10B981" />;
      case 'deadline':
        return <Clock size={20} color="#D97706" />;
      case 'approved':
        return <CheckCircle2 size={20} color="#10B981" />;
      default:
        return <Bell size={20} color="#0A3D75" />;
    }
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  };

  const handleToggleRead = (id, e) => {
    e.stopPropagation();
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, unread: !n.unread } : n
    ));
  };

  const handleNotificationClick = (notif) => {
    // Mark as read
    setNotifications(prev => prev.map(n => 
      n.id === notif.id ? { ...n, unread: false } : n
    ));

    if (notif.projectId) {
      onOpenProject(notif.projectId);
    } else if (notif.type === 'earning') {
      onNavigate('earnings');
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (selectedFilter === 'Unread') return n.unread;
    if (selectedFilter === 'Projects') return n.type === 'project' || n.type === 'approved' || n.type === 'deadline';
    if (selectedFilter === 'Revisions') return n.type === 'revision';
    if (selectedFilter === 'Earnings') return n.type === 'earning';
    return true;
  });

  const unreadTotal = notifications.filter(n => n.unread).length;

  return (
    <div className="notifications-page-container">
      {/* Top Header Card */}
      <div className="portal-card notif-header-card">
        <div className="notif-header-left">
          <div className="notif-icon-bubble">
            <Bell size={22} color="#0A3D75" />
            {unreadTotal > 0 && <span className="notif-dot-pulse" />}
          </div>
          <div>
            <h2 className="notif-heading">Activity & System Notifications</h2>
            <p className="notif-subheading">
              You have <strong style={{ color: '#0A3D75' }}>{unreadTotal} unread</strong> alert{unreadTotal === 1 ? '' : 's'} requiring attention.
            </p>
          </div>
        </div>

        {unreadTotal > 0 && (
          <button
            type="button"
            className="btn-mark-all-read"
            onClick={handleMarkAllAsRead}
          >
            <CheckCheck size={16} />
            <span>Mark All as Read</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="notif-filters-bar">
        {filterTabs.map(tab => {
          let count = 0;
          if (tab === 'All') count = notifications.length;
          else if (tab === 'Unread') count = unreadTotal;
          else if (tab === 'Projects') count = notifications.filter(n => n.type === 'project' || n.type === 'approved' || n.type === 'deadline').length;
          else if (tab === 'Revisions') count = notifications.filter(n => n.type === 'revision').length;
          else if (tab === 'Earnings') count = notifications.filter(n => n.type === 'earning').length;

          return (
            <button
              key={tab}
              type="button"
              className={`filter-tab-pill ${selectedFilter === tab ? 'active' : ''}`}
              onClick={() => setSelectedFilter(tab)}
            >
              <span>{tab}</span>
              <span className="filter-tab-count">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Notifications List */}
      {filteredNotifications.length > 0 ? (
        <div className="notifications-list">
          {filteredNotifications.map((notif) => (
            <div
              key={notif.id}
              className={`notification-item-card ${notif.unread ? 'unread' : ''}`}
              onClick={() => handleNotificationClick(notif)}
            >
              <div className={`notif-type-icon-box ${notif.type}`}>
                {getIconForType(notif.type)}
              </div>

              <div className="notif-item-body">
                <div className="notif-item-top">
                  <h4 className="notif-item-title">{notif.title}</h4>
                  <div className="notif-item-actions">
                    <span className="notif-item-date">{notif.date}</span>
                    <button
                      type="button"
                      className="btn-toggle-read"
                      onClick={(e) => handleToggleRead(notif.id, e)}
                      title={notif.unread ? 'Mark read' : 'Mark unread'}
                    >
                      <span className={`read-dot ${notif.unread ? 'active' : ''}`} />
                    </button>
                  </div>
                </div>

                <p className="notif-item-desc">{notif.description}</p>

                {notif.projectId && (
                  <div className="notif-item-footer">
                    <span className="notif-project-chip">Project: {notif.projectId}</span>
                    <span className="notif-open-link">
                      <span>Open Details</span>
                      <ArrowRight size={13} />
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="portal-card">
          <EmptyState
            icon={Bell}
            title="No notifications found"
            description="You are completely up to date. New project and payout notifications will appear here."
            actionLabel="View All Notifications"
            onAction={() => setSelectedFilter('All')}
          />
        </div>
      )}
    </div>
  );
}
