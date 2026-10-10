import React, { useState } from 'react';
import { 
  Bell, 
  CheckCheck, 
  Clock, 
  ShieldAlert, 
  FolderKanban, 
  IndianRupee, 
  CheckCircle2, 
  Send, 
  Users, 
  ArrowRight 
} from 'lucide-react';
import EmptyState from '../../components/portal/EmptyState';
import { initialAdminNotifications } from '../../data/adminMockData';

export default function AdminNotificationsPage({ onOpenProject, onNavigate }) {
  const [notifications, setNotifications] = useState(initialAdminNotifications);
  const [selectedFilter, setSelectedFilter] = useState('All');

  const filterTabs = ['All', 'Unread', 'Submissions', 'Progress', 'Revisions'];

  const getIconForType = (type) => {
    switch (type) {
      case 'submission':
        return <Send size={20} color="#D97706" />;
      case 'revision':
        return <ShieldAlert size={20} color="#DC2626" />;
      case 'progress':
        return <FolderKanban size={20} color="#0A3D75" />;
      case 'assigned':
        return <Users size={20} color="#6366F1" />;
      case 'approved':
        return <CheckCircle2 size={20} color="#10B981" />;
      case 'deadline':
        return <Clock size={20} color="#D97706" />;
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
    setNotifications(prev => prev.map(n => 
      n.id === notif.id ? { ...n, unread: false } : n
    ));

    if (notif.type === 'submission') {
      onNavigate(`admin/projects/${notif.projectId}/review`);
    } else if (notif.projectId) {
      onOpenProject(notif.projectId);
    }
  };

  const filtered = notifications.filter(n => {
    if (selectedFilter === 'Unread') return n.unread;
    if (selectedFilter === 'Submissions') return n.type === 'submission';
    if (selectedFilter === 'Progress') return n.type === 'progress' || n.type === 'assigned' || n.type === 'approved';
    if (selectedFilter === 'Revisions') return n.type === 'revision';
    return true;
  });

  const unreadTotal = notifications.filter(n => n.unread).length;

  return (
    <div className="notifications-page-container">
      {/* Header Card */}
      <div className="portal-card notif-header-card">
        <div className="notif-header-left">
          <div className="notif-icon-bubble">
            <Bell size={22} color="#0A3D75" />
            {unreadTotal > 0 && <span className="notif-dot-pulse" />}
          </div>
          <div>
            <h2 className="notif-heading">Admin Operations Alerts</h2>
            <p className="notif-subheading">
              You have <strong style={{ color: '#0A3D75' }}>{unreadTotal} unread</strong> alert{unreadTotal === 1 ? '' : 's'} across active developer projects.
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
        {filterTabs.map(tab => (
          <button
            key={tab}
            type="button"
            className={`filter-tab-pill ${selectedFilter === tab ? 'active' : ''}`}
            onClick={() => setSelectedFilter(tab)}
          >
            <span>{tab}</span>
          </button>
        ))}
      </div>

      {/* Notifications List */}
      {filtered.length > 0 ? (
        <div className="notifications-list">
          {filtered.map((notif) => (
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
                      <span>{notif.type === 'submission' ? 'Open Submission Review' : 'Open Project Workspace'}</span>
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
            description="You are completely up to date with project deliveries."
            actionLabel="View All Notifications"
            onAction={() => setSelectedFilter('All')}
          />
        </div>
      )}
    </div>
  );
}
