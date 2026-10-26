import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Bell, 
  CheckCircle, 
  ShieldCheck, 
  Laptop, 
  Mail,
  History,
  Search,
  Download,
  AlertTriangle,
  Globe,
  Smartphone,
  RefreshCw,
  User,
  Shield,
  Activity,
  Copy,
  Check
} from 'lucide-react';
import StatusBadge from '../../components/portal/StatusBadge';
import EmptyState from '../../components/portal/EmptyState';
import { exportToCSV } from '../../utils/exportUtils';
import { getLoginLogs } from '../../utils/loginLogger';
import '../portal/SettingsPage.css';

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState('general');
  const [toastMessage, setToastMessage] = useState(null);
  const [copiedSettingsTrustId, setCopiedSettingsTrustId] = useState(false);

  // General Settings state with LocalStorage persistence
  const [generalSettings, setGeneralSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('dahej_admin_general_settings');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return {
      currency: 'INR',
      timezone: 'IST',
      autoReviewWindow: '48',
      platformMaintenance: false,
      sessionTimeout: '30'
    };
  });

  // Alert / Notification Preferences with LocalStorage persistence
  const [notifPrefs, setNotifPrefs] = useState(() => {
    try {
      const saved = localStorage.getItem('dahej_admin_notif_prefs');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return {
      submissionAlerts: true,
      deadlineAlerts: true,
      developerRegistration: true,
      weeklyPayoutDigest: true,
      securityAlerts: true
    };
  });

  // Login logs state & filters
  const [logsList, setLogsList] = useState(getLoginLogs);
  const [logSearch, setLogSearch] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('All');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('All');

  // Reactively sync logs whenever any login event occurs across windows/tabs
  useEffect(() => {
    const syncLogs = () => {
      setLogsList(getLoginLogs());
    };
    window.addEventListener('dahej_login_logs_updated', syncLogs);
    window.addEventListener('storage', syncLogs);
    return () => {
      window.removeEventListener('dahej_login_logs_updated', syncLogs);
      window.removeEventListener('storage', syncLogs);
    };
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  const handleTogglePref = (key, title) => {
    setNotifPrefs(prev => {
      const updated = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem('dahej_admin_notif_prefs', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      showToast(`${title} ${updated[key] ? 'enabled' : 'disabled'}`);
      return updated;
    });
  };

  const handleSaveGeneralSettings = (e) => {
    e?.preventDefault();
    try {
      localStorage.setItem('dahej_admin_general_settings', JSON.stringify(generalSettings));
    } catch (err) {
      console.error(err);
    }
    showToast('General operations settings saved successfully!');
  };

  const handleSaveAllAlerts = () => {
    try {
      localStorage.setItem('dahej_admin_notif_prefs', JSON.stringify(notifPrefs));
    } catch (err) {
      console.error(err);
    }
    showToast('All alert triggers & preferences saved successfully!');
  };

  // Filtered Logs
  const filteredLogs = logsList.filter(log => {
    if (selectedRoleFilter !== 'All' && log.role !== selectedRoleFilter) return false;
    if (selectedStatusFilter !== 'All' && log.status !== selectedStatusFilter) return false;
    if (logSearch.trim()) {
      const q = logSearch.toLowerCase();
      return (
        log.user.toLowerCase().includes(q) ||
        log.email.toLowerCase().includes(q) ||
        log.id.toLowerCase().includes(q) ||
        log.ipAddress.toLowerCase().includes(q) ||
        (log.longitude && log.longitude.toLowerCase().includes(q)) ||
        (log.latitude && log.latitude.toLowerCase().includes(q)) ||
        log.location.toLowerCase().includes(q) ||
        log.device.toLowerCase().includes(q) ||
        log.authMethod.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleExportLogs = () => {
    const headers = [
      { label: 'Log ID', key: 'id' },
      { label: 'Timestamp', key: 'timestamp' },
      { label: 'User Full Name', key: 'user' },
      { label: 'Email Address', key: 'email' },
      { label: 'User Role', key: 'role' },
      { label: 'Login Status', key: 'status' },
      { label: 'Auth Method', key: 'authMethod' },
      { label: 'IP Address', key: 'ipAddress' },
      { label: 'Location / City', key: 'location' },
      { label: 'Longitude', key: (l) => l.longitude || '—' },
      { label: 'Latitude', key: (l) => l.latitude || '—' },
      { label: 'Device / Browser Info', key: 'device' },
      { label: 'Device Type', key: 'deviceType' }
    ];

    exportToCSV('Dahej_Support_Login_Security_Logs', headers, filteredLogs);
    showToast(`Exported ${filteredLogs.length} login log records to Excel / CSV!`);
  };

  const handleRefreshLogs = () => {
    const fresh = getLoginLogs();
    setLogsList(fresh);
    showToast(`Login logs refreshed (${fresh.length} security events tracked).`);
  };

  const successCount = logsList.filter(l => l.status === 'Success').length;
  const failedCount = logsList.filter(l => l.status === 'Failed').length;

  return (
    <div className="settings-page-container">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="settings-page-toast">
          <CheckCircle size={18} color="#10B981" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="settings-tabs-bar">
        <button
          type="button"
          className={`settings-tab-btn ${activeTab === 'general' ? 'active' : ''}`}
          onClick={() => setActiveTab('general')}
        >
          <Settings size={16} />
          <span>General Operations</span>
        </button>

        <button
          type="button"
          className={`settings-tab-btn ${activeTab === 'login-logs' ? 'active' : ''}`}
          onClick={() => setActiveTab('login-logs')}
        >
          <History size={16} />
          <span>Login Logs</span>
        </button>

        <button
          type="button"
          className={`settings-tab-btn ${activeTab === 'notifications' ? 'active' : ''}`}
          onClick={() => setActiveTab('notifications')}
        >
          <Bell size={16} />
          <span>Alert Preferences</span>
        </button>
      </div>

      {/* 1. GENERAL OPERATIONS */}
      {activeTab === 'general' && (
        <>
        <form onSubmit={handleSaveGeneralSettings} className="portal-card">
          <div className="portal-card-header">
            <h2 className="portal-card-title">
              <Settings size={18} color="#0A3D75" />
              <span>General Operations & Defaults</span>
            </h2>
          </div>

          <div className="settings-form-grid">
            <div className="settings-field-box">
              <label className="settings-field-label">Default Currency Format</label>
              <select 
                className="settings-select" 
                value={generalSettings.currency}
                onChange={(e) => setGeneralSettings({ ...generalSettings, currency: e.target.value })}
              >
                <option value="INR">Indian Rupee (₹ INR)</option>
                <option value="USD">US Dollar ($ USD)</option>
                <option value="EUR">Euro (€ EUR)</option>
                <option value="GBP">British Pound (£ GBP)</option>
              </select>
              <span className="settings-field-help">Applied to all Freelancer & Tester Payout milestone values</span>
            </div>

            <div className="settings-field-box">
              <label className="settings-field-label">Operational Timezone</label>
              <select 
                className="settings-select" 
                value={generalSettings.timezone}
                onChange={(e) => setGeneralSettings({ ...generalSettings, timezone: e.target.value })}
              >
                <option value="IST">Asia/Kolkata (IST +5:30)</option>
                <option value="UTC">Universal Coordinated Time (UTC)</option>
                <option value="EST">US Eastern Standard (EST -5:00)</option>
                <option value="GST">Gulf Standard Time (GST +4:00)</option>
              </select>
              <span className="settings-field-help">Used for automated timestamps, reminders, and daily digests</span>
            </div>

            <div className="settings-field-box">
              <label className="settings-field-label">Auto-Review Window</label>
              <select 
                className="settings-select" 
                value={generalSettings.autoReviewWindow}
                onChange={(e) => setGeneralSettings({ ...generalSettings, autoReviewWindow: e.target.value })}
              >
                <option value="24">24 Hours</option>
                <option value="48">48 Hours (Recommended)</option>
                <option value="72">72 Hours</option>
                <option value="120">5 Days</option>
              </select>
              <span className="settings-field-help">Default SLA time for admin & QA approval after milestone submission</span>
            </div>

            <div className="settings-field-box">
              <label className="settings-field-label">Session Idle Timeout</label>
              <select 
                className="settings-select" 
                value={generalSettings.sessionTimeout}
                onChange={(e) => setGeneralSettings({ ...generalSettings, sessionTimeout: e.target.value })}
              >
                <option value="15">15 Minutes</option>
                <option value="30">30 Minutes (Recommended)</option>
                <option value="60">1 Hour</option>
                <option value="120">2 Hours</option>
              </select>
              <span className="settings-field-help">Auto logout threshold for idle admin sessions</span>
            </div>
          </div>

          <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="submit"
              className="btn btn-navy-action"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px' }}
            >
              <CheckCircle size={16} />
              <span>Save General Settings</span>
            </button>
          </div>
        </form>

        {/* Administrator Referral Authority Card */}
        <div className="trust-id-showcase-box" style={{ marginTop: '20px' }}>
          <div className="trust-id-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={18} color="#38BDF8" />
              <span style={{ fontSize: '0.9rem', fontWeight: '800', letterSpacing: '0.3px' }}>
                Your Reffer Trustable ID
              </span>
            </div>
            <span className="trust-id-badge" style={{ background: 'rgba(56, 189, 248, 0.15)', borderColor: 'rgba(56, 189, 248, 0.35)', color: '#38BDF8' }}>
              Master Authority Sponsor
            </span>
          </div>

          <div className="trust-id-value-card">
            <span className="trust-id-code">RFF-DahejSupport-269</span>
            <button
              type="button"
              className="btn-copy-trust-id"
              onClick={() => {
                try {
                  navigator.clipboard?.writeText('RFF-DahejSupport-269');
                } catch (e) {}
                setCopiedSettingsTrustId(true);
                showToast('Admin Referrer ID "RFF-DahejSupport-269" copied to clipboard!');
                setTimeout(() => setCopiedSettingsTrustId(false), 2500);
              }}
              title="Copy Admin Referrer ID to share with new applicants"
            >
              {copiedSettingsTrustId ? <Check size={14} color="#16A34A" /> : <Copy size={14} />}
              <span>{copiedSettingsTrustId ? 'Copied!' : 'Copy Referrer ID'}</span>
            </button>
          </div>

          <p className="trust-id-help-text">
            Give this ID and Reference Name (<strong>Dahej Support</strong> or <strong>Keval Patel</strong>) to candidates applying to the Developer or QA Tester Program. When they apply, an authorization OTP will be sent to your administrator email (<strong>dahejsupport@gmail.com</strong>) to approve their reference.
          </p>
        </div>
        </>
      )}

      {/* 2. LOGIN LOGS (NEW SECTION) */}
      {activeTab === 'login-logs' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Quick Metrics Bar */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            <div className="portal-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#EBF3FA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Activity size={22} color="#0A3D75" />
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Total Events</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0A3D75' }}>{logsList.length}</div>
              </div>
            </div>

            <div className="portal-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle size={22} color="#10B981" />
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Successful Logins</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#10B981' }}>{successCount}</div>
              </div>
            </div>

            <div className="portal-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertTriangle size={22} color="#DC2626" />
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Failed / Blocked</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#DC2626' }}>{failedCount}</div>
              </div>
            </div>
          </div>

          {/* Search, Filters, and Controls */}
          <div className="admin-projects-top-bar">
            <div className="admin-projects-search-row">
              <div className="search-input-box" style={{ maxWidth: '320px' }}>
                <Search size={16} className="search-input-icon" />
                <input
                  type="text"
                  placeholder="Search user, email, IP, coordinates..."
                  value={logSearch}
                  onChange={(e) => setLogSearch(e.target.value)}
                />
              </div>

              <div className="admin-filter-selects-row">
                <select
                  value={selectedRoleFilter}
                  onChange={(e) => setSelectedRoleFilter(e.target.value)}
                  className="sort-select"
                >
                  <option value="All">All Roles</option>
                  <option value="Master Admin">Master Admin</option>
                  <option value="Developer">Developer</option>
                  <option value="QA Tester">QA Tester</option>
                  <option value="Unknown">Unknown / Unauthorized</option>
                </select>

                <select
                  value={selectedStatusFilter}
                  onChange={(e) => setSelectedStatusFilter(e.target.value)}
                  className="sort-select"
                >
                  <option value="All">All Statuses</option>
                  <option value="Success">Success Only</option>
                  <option value="Failed">Failed Only</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className="btn btn-secondary-action"
                onClick={handleRefreshLogs}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px', fontSize: '0.82rem' }}
              >
                <RefreshCw size={14} />
                <span>Refresh</span>
              </button>

              <button
                type="button"
                className="btn btn-navy-action"
                onClick={handleExportLogs}
                title="Export Login Security Logs to Excel / CSV"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px', fontSize: '0.82rem' }}
              >
                <Download size={14} />
                <span>Export Excel</span>
              </button>
            </div>
          </div>

          {/* Login Logs Table */}
          {filteredLogs.length > 0 ? (
            <div className="portal-card" style={{ padding: 0, overflow: 'hidden' }}>
              <div className="portal-table-container">
                <table className="portal-table">
                  <thead>
                    <tr>
                      <th>User Account</th>
                      <th>Role</th>
                      <th>Auth Method</th>
                      <th>IP</th>
                      <th>Longitude</th>
                      <th>Latitude</th>
                      <th>Device / Client</th>
                      <th style={{ textAlign: 'right' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.map((log) => {
                      const isSuccess = log.status === 'Success';
                      return (
                        <tr key={log.id}>
                          <td>
                            <strong style={{ color: '#0F172A', display: 'block', fontSize: '0.88rem' }}>
                              {log.user}
                            </strong>
                            <div style={{ fontSize: '0.74rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                              <span>{log.email}</span>
                              <span>•</span>
                              <span style={{ fontFamily: 'monospace', color: '#0A3D75', fontWeight: 600 }}>{log.timestamp}</span>
                            </div>
                          </td>

                          <td>
                            <span style={{
                              display: 'inline-block',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              background: log.role === 'Master Admin' ? '#EBF3FA' : (log.role === 'QA Tester' ? '#FFF7ED' : (log.role === 'Developer' ? '#F1F5F9' : '#FEF2F2')),
                              color: log.role === 'Master Admin' ? '#0A3D75' : (log.role === 'QA Tester' ? '#C2410C' : (log.role === 'Developer' ? '#0284C7' : '#DC2626'))
                            }}>
                              {log.role}
                            </span>
                          </td>

                          <td>
                            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155' }}>
                              {log.authMethod}
                            </span>
                          </td>

                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#0A3D75', fontWeight: 700, fontSize: '0.82rem', fontFamily: 'monospace' }}>
                              <Globe size={13} color="#0A3D75" />
                              <span>{log.ipAddress}</span>
                            </div>
                          </td>

                          <td>
                            <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0F172A', fontSize: '0.82rem' }}>
                              {log.longitude}
                            </span>
                          </td>

                          <td>
                            <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0F172A', fontSize: '0.82rem' }}>
                              {log.latitude}
                            </span>
                          </td>

                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#334155' }}>
                              {log.deviceType === 'mobile' ? <Smartphone size={14} color="#64748B" /> : <Laptop size={14} color="#64748B" />}
                              <span>{log.device}</span>
                            </div>
                          </td>

                          <td style={{ textAlign: 'right' }}>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '3px 10px',
                              borderRadius: '9999px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              background: isSuccess ? '#DCFCE7' : '#FEE2E2',
                              color: isSuccess ? '#15803D' : '#DC2626',
                              border: `1px solid ${isSuccess ? '#BBF7D0' : '#FECACA'}`
                            }}>
                              {isSuccess ? <CheckCircle size={12} /> : <AlertTriangle size={12} />}
                              <span>{log.status}</span>
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="portal-card">
              <EmptyState
                icon={History}
                title="No login logs found"
                description="Try resetting your search query or filter selections to view recent authentication history."
                actionLabel="Reset Log Filters"
                onAction={() => {
                  setLogSearch('');
                  setSelectedRoleFilter('All');
                  setSelectedStatusFilter('All');
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* 3. NOTIFICATIONS / ALERT PREFERENCES */}
      {activeTab === 'notifications' && (
        <div className="portal-card">
          <div className="portal-card-header">
            <h2 className="portal-card-title">
              <Bell size={18} color="#0A3D75" />
              <span>Operations Alert Triggers</span>
            </h2>
          </div>

          <div className="toggle-list-wrapper">
            <div className="toggle-item-row">
              <div className="toggle-info">
                <h4 className="toggle-title">Project Submission Alerts</h4>
                <p className="toggle-desc">Instant notification when a developer marks all tasks complete and submits.</p>
              </div>
              <label className="switch-toggle">
                <input
                  type="checkbox"
                  checked={notifPrefs.submissionAlerts}
                  onChange={() => handleTogglePref('submissionAlerts', 'Project Submission Alerts')}
                />
                <span className="slider-round" />
              </label>
            </div>

            <div className="toggle-item-row">
              <div className="toggle-info">
                <h4 className="toggle-title">Deadline Approaching Reminders</h4>
                <p className="toggle-desc">Alerts for projects within 4 days of milestone delivery deadline.</p>
              </div>
              <label className="switch-toggle">
                <input
                  type="checkbox"
                  checked={notifPrefs.deadlineAlerts}
                  onChange={() => handleTogglePref('deadlineAlerts', 'Deadline Approaching Reminders')}
                />
                <span className="slider-round" />
              </label>
            </div>

            <div className="toggle-item-row">
              <div className="toggle-info">
                <h4 className="toggle-title">Weekly Payout Settlement Digest</h4>
                <p className="toggle-desc">Summary of approved and pending freelancer milestone disbursements.</p>
              </div>
              <label className="switch-toggle">
                <input
                  type="checkbox"
                  checked={notifPrefs.weeklyPayoutDigest}
                  onChange={() => handleTogglePref('weeklyPayoutDigest', 'Weekly Payout Settlement Digest')}
                />
                <span className="slider-round" />
              </label>
            </div>

            <div className="toggle-item-row">
              <div className="toggle-info">
                <h4 className="toggle-title">New Freelancer & Tester Onboarding</h4>
                <p className="toggle-desc">Receive instant notifications when new developers or testers submit applications.</p>
              </div>
              <label className="switch-toggle">
                <input
                  type="checkbox"
                  checked={notifPrefs.developerRegistration}
                  onChange={() => handleTogglePref('developerRegistration', 'Onboarding Alerts')}
                />
                <span className="slider-round" />
              </label>
            </div>

            <div className="toggle-item-row">
              <div className="toggle-info">
                <h4 className="toggle-title">Security & Failed Login Alerts</h4>
                <p className="toggle-desc">Real-time alert when an unknown device or invalid OTP attempt is detected.</p>
              </div>
              <label className="switch-toggle">
                <input
                  type="checkbox"
                  checked={notifPrefs.securityAlerts}
                  onChange={() => handleTogglePref('securityAlerts', 'Security Login Alerts')}
                />
                <span className="slider-round" />
              </label>
            </div>
          </div>

          <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={handleSaveAllAlerts}
              className="btn btn-navy-action"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px' }}
            >
              <CheckCircle size={16} />
              <span>Save Alert Preferences</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
