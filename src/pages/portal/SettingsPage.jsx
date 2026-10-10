import React, { useState } from 'react';
import { 
  Settings, 
  Shield, 
  Bell, 
  Key, 
  Laptop, 
  Smartphone, 
  CheckCircle, 
  Lock, 
  Eye, 
  EyeOff, 
  Save, 
  LogOut, 
  ShieldCheck,
  AlertTriangle,
  Mail
} from 'lucide-react';
import './SettingsPage.css';

export default function SettingsPage() {
  const [authEmail] = useState(() => {
    try {
      const sess = JSON.parse(localStorage.getItem('dahej_auth_session') || '{}');
      return sess.email || 'your registered email';
    } catch {
      return 'your registered email';
    }
  });
  const [activeTab, setActiveTab] = useState('account');
  const [toastMessage, setToastMessage] = useState(null);

  // Password fields
  const [showPassword, setShowPassword] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isOtpStep, setIsOtpStep] = useState(false);
  const [otpCode, setOtpCode] = useState('');

  // Notification toggles
  const [notifPreferences, setNotifPreferences] = useState({
    newProjectsEmail: true,
    deadlineRemindersSms: true,
    payoutApprovedEmail: true,
    revisionAlertsEmail: true,
    dailyDigest: false
  });

  // Account Preferences
  const [accountPrefs, setAccountPrefs] = useState({
    timezone: 'Asia/Kolkata (IST +5:30)',
    language: 'English (US)',
    autoLockTimer: '30 Minutes'
  });

  // Active Sessions
  const [sessions, setSessions] = useState([
    {
      id: 'sess-1',
      device: 'Windows PC • Chrome 129.0',
      location: 'Bharuch, Gujarat, India',
      ip: '103.152.22.45',
      current: true,
      lastActive: 'Active Now',
      icon: Laptop
    },
    {
      id: 'sess-2',
      device: 'iPhone 15 Pro • Safari Mobile',
      location: 'Surat, Gujarat, India',
      ip: '49.36.18.112',
      current: false,
      lastActive: 'Yesterday at 9:40 PM',
      icon: Smartphone
    }
  ]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleToggleNotif = (key) => {
    setNotifPreferences(prev => {
      const next = { ...prev, [key]: !prev[key] };
      showToast('Notification preferences updated');
      return next;
    });
  };

  const handleChangePasswordSubmit = (e) => {
    e.preventDefault();
    if (!oldPassword || !newPassword || !confirmPassword) {
      showToast('Please fill in all password fields.');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match.');
      return;
    }
    setIsOtpStep(true);
  };

  const handleVerifyPasswordOtp = (e) => {
    e.preventDefault();
    if (otpCode.length < 4) {
      showToast('Please enter the 6-digit OTP sent to your email.');
      return;
    }
    setIsOtpStep(false);
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setOtpCode('');
    showToast('Password updated successfully!');
  };

  const handleRevokeSession = (sessionId) => {
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    showToast('Session revoked successfully.');
  };

  return (
    <div className="settings-page-container">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="settings-page-toast">
          <CheckCircle size={18} color="#10B981" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="settings-tabs-bar">
        <button
          type="button"
          className={`settings-tab-btn ${activeTab === 'account' ? 'active' : ''}`}
          onClick={() => setActiveTab('account')}
        >
          <Settings size={16} />
          <span>Account Settings</span>
        </button>

        <button
          type="button"
          className={`settings-tab-btn ${activeTab === 'security' ? 'active' : ''}`}
          onClick={() => setActiveTab('security')}
        >
          <Shield size={16} />
          <span>Security & Passwords</span>
        </button>

        <button
          type="button"
          className={`settings-tab-btn ${activeTab === 'notifications' ? 'active' : ''}`}
          onClick={() => setActiveTab('notifications')}
        >
          <Bell size={16} />
          <span>Notification Preferences</span>
        </button>
      </div>

      {/* Account Settings Tab */}
      {activeTab === 'account' && (
        <div className="portal-card">
          <div className="portal-card-header">
            <div>
              <h2 className="portal-card-title">
                <Settings size={18} color="#0A3D75" />
                <span>Account Preferences</span>
              </h2>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.84rem', color: '#64748B' }}>
                Manage localization, timezone, and portal display defaults.
              </p>
            </div>
          </div>

          <div className="settings-form-grid">
            <div className="settings-field-box">
              <label className="settings-field-label">Timezone</label>
              <select
                value={accountPrefs.timezone}
                onChange={(e) => setAccountPrefs({ ...accountPrefs, timezone: e.target.value })}
                className="settings-select"
              >
                <option>Asia/Kolkata (IST +5:30)</option>
                <option>UTC (+0:00)</option>
                <option>America/New_York (EST -5:00)</option>
              </select>
              <span className="settings-field-help">Used for milestone countdowns and deadline alerts</span>
            </div>

            <div className="settings-field-box">
              <label className="settings-field-label">Portal Language</label>
              <select
                value={accountPrefs.language}
                onChange={(e) => setAccountPrefs({ ...accountPrefs, language: e.target.value })}
                className="settings-select"
              >
                <option>English (US)</option>
                <option>Hindi (हिंदी)</option>
                <option>Gujarati (ગુજરાતી)</option>
              </select>
            </div>

            <div className="settings-field-box">
              <label className="settings-field-label">Auto-Lock Inactivity Timer</label>
              <select
                value={accountPrefs.autoLockTimer}
                onChange={(e) => setAccountPrefs({ ...accountPrefs, autoLockTimer: e.target.value })}
                className="settings-select"
              >
                <option>15 Minutes</option>
                <option>30 Minutes</option>
                <option>1 Hour</option>
                <option>Never</option>
              </select>
              <span className="settings-field-help">Automatically secures session when idle</span>
            </div>
          </div>

          <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="btn btn-orange-primary"
              onClick={() => showToast('Account preferences saved!')}
            >
              <Save size={15} />
              <span>Save Preferences</span>
            </button>
          </div>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Change Password Card */}
          <div className="portal-card">
            <div className="portal-card-header">
              <div>
                <h2 className="portal-card-title">
                  <Key size={18} color="#0A3D75" />
                  <span>Change Password</span>
                </h2>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.84rem', color: '#64748B' }}>
                  For maximum security, updating your password requires email OTP verification.
                </p>
              </div>
            </div>

            {!isOtpStep ? (
              <form onSubmit={handleChangePasswordSubmit} className="security-form-fields">
                <div className="settings-field-box">
                  <label className="settings-field-label">Current Password</label>
                  <div className="pwd-input-wrap">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      placeholder="Enter your current password"
                      className="settings-input"
                    />
                    <button
                      type="button"
                      className="btn-pwd-eye"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="pwd-two-col">
                  <div className="settings-field-box">
                    <label className="settings-field-label">New Password</label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 8 characters"
                      className="settings-input"
                    />
                  </div>

                  <div className="settings-field-box">
                    <label className="settings-field-label">Confirm New Password</label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className="settings-input"
                    />
                  </div>
                </div>

                <div className="pwd-submit-row">
                  <button type="submit" className="btn btn-navy-action">
                    <span>Send Verification OTP</span>
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleVerifyPasswordOtp} className="otp-verification-box">
                <div className="otp-banner">
                  <Mail size={20} color="#0A3D75" />
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.94rem', color: '#07223D' }}>
                      Security OTP Sent to {authEmail}
                    </h4>
                    <p style={{ margin: '2px 0 0 0', fontSize: '0.82rem', color: '#64748B' }}>
                      Enter the 6-digit confirmation code to confirm password update.
                    </p>
                  </div>
                </div>

                <div style={{ maxWidth: '280px', marginTop: '16px' }}>
                  <label className="settings-field-label">Enter 6-Digit OTP</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="123456"
                    className="settings-input"
                    style={{ letterSpacing: '4px', fontSize: '1.2rem', textAlign: 'center', fontWeight: 800 }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                  <button
                    type="button"
                    className="btn btn-navy-action"
                    onClick={() => setIsOtpStep(false)}
                    style={{ background: '#F1F5F9', color: '#475569', border: '1px solid #CBD5E1' }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-orange-primary">
                    <CheckCircle size={15} />
                    <span>Confirm & Change Password</span>
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Session Management Card */}
          <div className="portal-card">
            <div className="portal-card-header">
              <div>
                <h2 className="portal-card-title">
                  <Laptop size={18} color="#0A3D75" />
                  <span>Active Login Sessions</span>
                </h2>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.84rem', color: '#64748B' }}>
                  Devices currently authenticated with your Freelancer ID.
                </p>
              </div>
            </div>

            <div className="sessions-list">
              {sessions.map((sess) => {
                const Icon = sess.icon;
                return (
                  <div key={sess.id} className="session-item-row">
                    <div className="session-icon-box">
                      <Icon size={20} color="#0A3D75" />
                    </div>

                    <div className="session-info-body">
                      <div className="session-title-row">
                        <span className="session-device-name">{sess.device}</span>
                        {sess.current && <span className="session-current-tag">This Device</span>}
                      </div>
                      <div className="session-sub-info">
                        <span>{sess.location}</span>
                        <span>• IP: {sess.ip}</span>
                        <span>• {sess.lastActive}</span>
                      </div>
                    </div>

                    {!sess.current && (
                      <button
                        type="button"
                        className="btn-revoke-session"
                        onClick={() => handleRevokeSession(sess.id)}
                      >
                        <LogOut size={14} />
                        <span>Revoke</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="portal-card">
          <div className="portal-card-header">
            <div>
              <h2 className="portal-card-title">
                <Bell size={18} color="#0A3D75" />
                <span>Notification Preferences</span>
              </h2>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.84rem', color: '#64748B' }}>
                Choose what alerts and digest summaries you receive via Email and SMS.
              </p>
            </div>
          </div>

          <div className="toggle-list-wrapper">
            <div className="toggle-item-row">
              <div className="toggle-info">
                <h4 className="toggle-title">New Project Assignment Alerts</h4>
                <p className="toggle-desc">Receive instant email when a new project is assigned to your account.</p>
              </div>
              <label className="switch-toggle">
                <input
                  type="checkbox"
                  checked={notifPreferences.newProjectsEmail}
                  onChange={() => handleToggleNotif('newProjectsEmail')}
                />
                <span className="slider-round" />
              </label>
            </div>

            <div className="toggle-item-row">
              <div className="toggle-info">
                <h4 className="toggle-title">Milestone Deadline Reminders</h4>
                <p className="toggle-desc">Get SMS & email reminders 48 hours prior to milestone due dates.</p>
              </div>
              <label className="switch-toggle">
                <input
                  type="checkbox"
                  checked={notifPreferences.deadlineRemindersSms}
                  onChange={() => handleToggleNotif('deadlineRemindersSms')}
                />
                <span className="slider-round" />
              </label>
            </div>

            <div className="toggle-item-row">
              <div className="toggle-info">
                <h4 className="toggle-title">Payout & Earnings Approvals</h4>
                <p className="toggle-desc">Notifications when client review is completed and funds are scheduled.</p>
              </div>
              <label className="switch-toggle">
                <input
                  type="checkbox"
                  checked={notifPreferences.payoutApprovedEmail}
                  onChange={() => handleToggleNotif('payoutApprovedEmail')}
                />
                <span className="slider-round" />
              </label>
            </div>

            <div className="toggle-item-row">
              <div className="toggle-info">
                <h4 className="toggle-title">Admin Revision Feedback Alerts</h4>
                <p className="toggle-desc">Urgent notification if changes or fixes are required on a submitted project.</p>
              </div>
              <label className="switch-toggle">
                <input
                  type="checkbox"
                  checked={notifPreferences.revisionAlertsEmail}
                  onChange={() => handleToggleNotif('revisionAlertsEmail')}
                />
                <span className="slider-round" />
              </label>
            </div>

            <div className="toggle-item-row">
              <div className="toggle-info">
                <h4 className="toggle-title">Weekly Activity Digest</h4>
                <p className="toggle-desc">Summary of active milestones, completed deliveries, and team announcements.</p>
              </div>
              <label className="switch-toggle">
                <input
                  type="checkbox"
                  checked={notifPreferences.dailyDigest}
                  onChange={() => handleToggleNotif('dailyDigest')}
                />
                <span className="slider-round" />
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
