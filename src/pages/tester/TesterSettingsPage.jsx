import React, { useState } from 'react';
import { Settings, Lock, Bell, Check, Monitor } from 'lucide-react';

export default function TesterSettingsPage() {
  const [activeTab, setActiveTab] = useState('account');
  const [saved, setSaved] = useState(false);

  const [passwordData, setPasswordData] = useState({
    current: '',
    newPass: '',
    confirm: ''
  });

  const [notifPrefs, setNotifPrefs] = useState({
    emailOnSubmission: true,
    emailOnDeadline: true,
    smsAlerts: false,
    soundNotifications: true
  });

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="admin-projects-page-container">
      <div className="portal-card">
        <div className="portal-card-header">
          <h2 className="portal-card-title">
            <Settings size={18} color="#0A3D75" />
            <span>Tester Settings & Preferences</span>
          </h2>
        </div>

        {/* Tab Pills */}
        <div className="projects-filter-tabs">
          <button 
            type="button"
            className={`filter-tab-pill ${activeTab === 'account' ? 'active' : ''}`}
            onClick={() => setActiveTab('account')}
          >
            <span>Account Preferences</span>
          </button>
          <button 
            type="button"
            className={`filter-tab-pill ${activeTab === 'notifications' ? 'active' : ''}`}
            onClick={() => setActiveTab('notifications')}
          >
            <span>Notification Settings</span>
          </button>
          <button 
            type="button"
            className={`filter-tab-pill ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            <span>Security & Sessions</span>
          </button>
        </div>

        {saved && (
          <div style={{ background: '#DCFCE7', border: '1px solid #86EFAC', borderRadius: '8px', padding: '10px 14px', color: '#166534', fontSize: '0.84rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Check size={16} />
            <span>Settings preferences updated successfully!</span>
          </div>
        )}

        {/* Tab 1: Account Settings */}
        {activeTab === 'account' && (
          <form onSubmit={handleSave} className="form-fields-grid" style={{ maxWidth: '600px' }}>
            <div className="form-field-item" style={{ gridColumn: 'span 2' }}>
              <label className="field-label">Default QA Workspace View</label>
              <select className="portal-select" defaultValue="queue">
                <option value="queue">Testing Queue (Default)</option>
                <option value="dashboard">Analytics Dashboard</option>
                <option value="in-testing">In Testing Workspace</option>
              </select>
            </div>

            <div className="form-field-item" style={{ gridColumn: 'span 2' }}>
              <label className="field-label">Testing Timezone</label>
              <select className="portal-select" defaultValue="IST">
                <option value="IST">India Standard Time (IST, GMT+5:30)</option>
                <option value="UTC">Coordinated Universal Time (UTC)</option>
              </select>
            </div>

            <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-start', marginTop: '12px' }}>
              <button type="submit" className="btn btn-orange-primary">
                <Check size={15} />
                <span>Save Preferences</span>
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Notification Settings */}
        {activeTab === 'notifications' && (
          <form onSubmit={handleSave} style={{ maxWidth: '650px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', cursor: 'pointer' }}>
              <div>
                <strong style={{ fontSize: '0.88rem', color: '#0F172A', display: 'block' }}>Developer Submission Alerts</strong>
                <span style={{ fontSize: '0.78rem', color: '#64748B' }}>Receive email alert when developer marks 100% and submits for testing</span>
              </div>
              <input 
                type="checkbox" 
                checked={notifPrefs.emailOnSubmission}
                onChange={(e) => setNotifPrefs({ ...notifPrefs, emailOnSubmission: e.target.checked })}
              />
            </label>

            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', cursor: 'pointer' }}>
              <div>
                <strong style={{ fontSize: '0.88rem', color: '#0F172A', display: 'block' }}>Milestone Deadline Alerts</strong>
                <span style={{ fontSize: '0.78rem', color: '#64748B' }}>Get notified 48 hours prior to assigned project QA deadline</span>
              </div>
              <input 
                type="checkbox" 
                checked={notifPrefs.emailOnDeadline}
                onChange={(e) => setNotifPrefs({ ...notifPrefs, emailOnDeadline: e.target.checked })}
              />
            </label>

            <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '12px' }}>
              <button type="submit" className="btn btn-orange-primary">
                <Check size={15} />
                <span>Save Notification Settings</span>
              </button>
            </div>
          </form>
        )}

        {/* Tab 3: Security & Sessions */}
        {activeTab === 'security' && (
          <div style={{ maxWidth: '600px' }}>
            <form onSubmit={handleSave} className="form-fields-grid">
              <div className="form-field-item" style={{ gridColumn: 'span 2' }}>
                <label className="field-label">Current Password</label>
                <input 
                  type="password" 
                  className="portal-input" 
                  placeholder="••••••••••••"
                  value={passwordData.current}
                  onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })}
                />
              </div>

              <div className="form-field-item">
                <label className="field-label">New Password</label>
                <input 
                  type="password" 
                  className="portal-input" 
                  placeholder="Min 8 characters"
                  value={passwordData.newPass}
                  onChange={(e) => setPasswordData({ ...passwordData, newPass: e.target.value })}
                />
              </div>

              <div className="form-field-item">
                <label className="field-label">Confirm Password</label>
                <input 
                  type="password" 
                  className="portal-input" 
                  placeholder="Repeat new password"
                  value={passwordData.confirm}
                  onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
                />
              </div>

              <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-start', marginTop: '12px' }}>
                <button type="submit" className="btn btn-orange-primary">
                  <Lock size={15} />
                  <span>Update Password</span>
                </button>
              </div>
            </form>

            <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #E2E8F0' }}>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: '#07223D', fontWeight: 800 }}>Active QA Sessions</h4>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Monitor size={18} color="#0A3D75" />
                  <div>
                    <strong style={{ fontSize: '0.84rem', color: '#0F172A', display: 'block' }}>Chrome on Windows 11 (Current Device)</strong>
                    <span style={{ fontSize: '0.72rem', color: '#64748B' }}>IP: 103.24.120.44 • Active right now</span>
                  </div>
                </div>
                <span style={{ fontSize: '0.72rem', background: '#DCFCE7', color: '#166534', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
                  Active
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
