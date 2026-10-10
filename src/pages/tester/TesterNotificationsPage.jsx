import React, { useState } from 'react';
import { Bell, CheckSquare2, Play, Check, Clock, AlertCircle } from 'lucide-react';
import { initialTesterNotifications } from '../../data/testerMockData';

export default function TesterNotificationsPage({ 
  onOpenProject, 
  onNavigate 
}) {
  const [notifications, setNotifications] = useState(initialTesterNotifications);

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  };

  const toggleRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, unread: !n.unread } : n));
  };

  return (
    <div className="admin-projects-page-container">
      <div className="portal-card">
        <div className="portal-card-header">
          <h2 className="portal-card-title">
            <Bell size={18} color="#0A3D75" />
            <span>QA Notifications & Alerts</span>
          </h2>

          <button 
            type="button"
            className="btn btn-navy-action"
            style={{ padding: '6px 12px', fontSize: '0.78rem' }}
            onClick={markAllAsRead}
          >
            <Check size={14} />
            <span>Mark All as Read</span>
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {notifications.map((notif) => (
            <div 
              key={notif.id} 
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 16px',
                background: notif.unread ? '#EFF6FF' : '#F8FAFC',
                border: `1px solid ${notif.unread ? '#BFDBFE' : '#E2E8F0'}`,
                borderRadius: '8px',
                gap: '12px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ 
                  width: '36px', 
                  height: '36px', 
                  borderRadius: '8px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  background: notif.unread ? '#DBEAFE' : '#E2E8F0',
                  color: notif.unread ? '#1D4ED8' : '#475569',
                  flexShrink: 0
                }}>
                  {notif.type === 'submission' && <CheckSquare2 size={18} />}
                  {notif.type === 'assignment' && <Bell size={18} />}
                  {notif.type === 'resubmission' && <AlertCircle size={18} />}
                  {notif.type === 'deadline' && <Clock size={18} />}
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <strong style={{ fontSize: '0.88rem', color: '#0F172A' }}>{notif.title}</strong>
                    {notif.unread && (
                      <span style={{ fontSize: '0.65rem', fontWeight: 800, background: '#DCFCE7', color: '#166534', padding: '1px 6px', borderRadius: '4px' }}>
                        New
                      </span>
                    )}
                  </div>
                  <p style={{ margin: '3px 0 0 0', fontSize: '0.82rem', color: '#475569', lineHeight: 1.45 }}>
                    {notif.description}
                  </p>
                  <span style={{ fontSize: '0.72rem', color: '#94A3B8', display: 'block', marginTop: '4px' }}>
                    {notif.date}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                <button 
                  type="button"
                  onClick={() => toggleRead(notif.id)}
                  style={{ background: 'none', border: 'none', color: '#64748B', fontSize: '0.76rem', cursor: 'pointer', fontWeight: 600 }}
                >
                  {notif.unread ? 'Mark read' : 'Mark unread'}
                </button>
                {notif.projectId && (
                  <button 
                    type="button"
                    className="btn btn-navy-action"
                    style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                    onClick={() => onOpenProject(notif.projectId)}
                  >
                    <Play size={12} />
                    <span>Start Testing</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
