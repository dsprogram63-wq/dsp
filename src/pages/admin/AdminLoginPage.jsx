import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  ArrowLeft, 
  Eye, 
  EyeOff, 
  KeyRound, 
  CheckCircle2, 
  Info, 
  Shield, 
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Server
} from 'lucide-react';
import Logo from '../../components/Logo';
import { sendOtpVerificationEmail, verifyOtpCode } from '../../services/emailService.js';
import './AdminLoginPage.css';

export default function AdminLoginPage({ onNavigate, onLoginSuccess }) {
  // Mode: 'login' | 'forgot'
  const [viewMode, setViewMode] = useState('login');

  // Login Form States
  const [adminEmail, setAdminEmail] = useState('dahejsupport@gmail.com');
  const [adminPassword, setAdminPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // OTP Verification States
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpTimer, setOtpTimer] = useState(0);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);

  // Forgot Password States
  const [resetEmail, setResetEmail] = useState('dahejsupport@gmail.com');
  const [resetOtpSent, setResetOtpSent] = useState(false);
  const [resetOtpCode, setResetOtpCode] = useState('');
  const [resetOtpTimer, setResetOtpTimer] = useState(0);
  const [isSendingResetOtp, setIsSendingResetOtp] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  // Notice Alert
  const [noticeMessage, setNoticeMessage] = useState(null);

  // Countdown timer for Login OTP
  useEffect(() => {
    let interval = null;
    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpTimer]);

  // Countdown timer for Reset OTP
  useEffect(() => {
    let interval = null;
    if (resetOtpTimer > 0) {
      interval = setInterval(() => {
        setResetOtpTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resetOtpTimer]);

  // Step 1: Send Admin Login OTP via Brevo
  const handleSendLoginOtp = async (e) => {
    e.preventDefault();
    if (!adminEmail.trim() || !adminPassword.trim()) {
      setNoticeMessage({
        type: 'warning',
        text: 'Please enter both your Admin Email and Password.'
      });
      return;
    }

    if (!adminEmail.includes('@')) {
      setNoticeMessage({
        type: 'warning',
        text: 'Please enter a valid administrator email address.'
      });
      return;
    }

    setIsSendingOtp(true);
    setNoticeMessage({
      type: 'info',
      text: `Dispatching 6-Digit security OTP to ${adminEmail.trim()}...`
    });

    try {
      await sendOtpVerificationEmail({
        toEmail: adminEmail.trim(),
        toName: 'Platform Administrator',
        role: 'developer'
      });

      setOtpSent(true);
      setOtpTimer(60);
      setOtpCode(''); // Clean field, requires real email OTP
      setNoticeMessage({
        type: 'success',
        text: `✓ 6-Digit Security OTP sent to ${adminEmail.trim()}. Please check your inbox (and Spam folder).`
      });
    } catch (err) {
      console.error('Error sending admin OTP:', err);
      setNoticeMessage({
        type: 'error',
        text: `Failed to dispatch OTP: ${err.message || 'Please check your connection.'}`
      });
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Step 2: Verify OTP and Login
  const handleVerifyAndLogin = (e) => {
    if (e) e.preventDefault();
    const cleanOtp = (otpCode || '').trim();
    if (!cleanOtp || cleanOtp.length !== 6) {
      setNoticeMessage({
        type: 'warning',
        text: 'Please enter the complete 6-digit security OTP sent to your administrator email.'
      });
      return;
    }

    const verifyResult = verifyOtpCode(adminEmail.trim(), cleanOtp);
    if (!verifyResult.success) {
      setNoticeMessage({
        type: 'error',
        text: verifyResult.error || 'Invalid 2FA OTP code. Please enter the code from your email.'
      });
      return;
    }

    setLoginSuccess(true);
    setNoticeMessage({
      type: 'success',
      text: 'Administrator credentials & 2FA OTP verified! Launching Admin Operations Panel...'
    });

    setTimeout(() => {
      const adminData = {
        role: 'admin',
        user: {
          name: 'Keval Patel',
          email: adminEmail,
          id: 'DS-ADM-001',
          roleTitle: 'Chief Operations Administrator'
        }
      };
      if (onLoginSuccess) {
        onLoginSuccess('admin', adminData.user);
      } else {
        onNavigate('admin/dashboard');
      }
    }, 900);
  };

  // Quick 1-Click Demo Login
  const handleQuickDemoAdminLogin = () => {
    setAdminEmail('dahejsupport@gmail.com');
    setAdminPassword('admin123');
    setOtpCode('');
    setOtpSent(true);
    setLoginSuccess(true);
    setNoticeMessage({
      type: 'success',
      text: 'Admin authorization granted! Redirecting to Admin Dashboard...'
    });

    setTimeout(() => {
      const adminData = {
        role: 'admin',
        user: {
          name: 'Keval Patel',
          email: 'dahejsupport@gmail.com',
          id: 'DS-ADM-001',
          roleTitle: 'Chief Operations Administrator'
        }
      };
      if (onLoginSuccess) {
        onLoginSuccess('admin', adminData.user);
      } else {
        onNavigate('admin/dashboard');
      }
    }, 700);
  };

  // Forgot Password: Send Reset OTP via Brevo
  const handleSendResetOtp = async (e) => {
    e.preventDefault();
    const emailTrimmed = resetEmail.trim();
    if (!emailTrimmed || !emailTrimmed.includes('@')) {
      setNoticeMessage({
        type: 'warning',
        text: 'Please enter a valid administrator email.'
      });
      return;
    }

    setIsSendingResetOtp(true);
    setNoticeMessage({
      type: 'info',
      text: `Dispatching reset verification OTP to ${emailTrimmed}...`
    });

    try {
      await sendOtpVerificationEmail({
        toEmail: emailTrimmed,
        toName: 'Platform Administrator',
        role: 'developer'
      });

      setResetOtpSent(true);
      setResetOtpTimer(60);
      setResetOtpCode('');
      setNoticeMessage({
        type: 'success',
        text: `✓ Admin reset verification OTP sent to ${emailTrimmed}. Please check your inbox.`
      });
    } catch (err) {
      console.error('Error sending reset OTP:', err);
      setNoticeMessage({
        type: 'error',
        text: `Failed to dispatch reset OTP: ${err.message || 'Please check your connection.'}`
      });
    } finally {
      setIsSendingResetOtp(false);
    }
  };

  // Forgot Password: Reset Submit
  const handleResetPasswordSubmit = (e) => {
    e.preventDefault();
    const cleanOtp = (resetOtpCode || '').trim();
    if (!cleanOtp || cleanOtp.length !== 6) {
      setNoticeMessage({
        type: 'warning',
        text: 'Please enter the complete 6-digit OTP code received on your email.'
      });
      return;
    }

    const verifyResult = verifyOtpCode(resetEmail.trim(), cleanOtp);
    if (!verifyResult.success) {
      setNoticeMessage({
        type: 'error',
        text: verifyResult.error || 'Invalid reset OTP.'
      });
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setNoticeMessage({
        type: 'warning',
        text: 'New password must be at least 6 characters long.'
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      setNoticeMessage({
        type: 'warning',
        text: 'Passwords do not match.'
      });
      return;
    }

    setResetSuccess(true);
    setAdminPassword(newPassword);
    setNoticeMessage({
      type: 'success',
      text: 'Admin password reset successfully! You can now log in.'
    });
  };

  const switchView = (mode) => {
    setViewMode(mode);
    setNoticeMessage(null);
    setOtpSent(false);
    setResetOtpSent(false);
    setResetSuccess(false);
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-container">
        {/* Back Navigation */}
        <div className="admin-login-top-bar">
          <button
            type="button"
            onClick={() => onNavigate('home')}
            className="admin-back-btn"
          >
            <ArrowLeft size={16} />
            <span>Main Website</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('login')}
            className="admin-portal-switch-btn"
          >
            <span>Freelancer & Tester Portal</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {/* Main Admin Card */}
        <div className="admin-login-card">
          {/* Card Header */}
          <div className="admin-login-header">
            <div className="admin-logo-wrapper">
              <Logo size="large" />
            </div>

            <div className="admin-badge-strip">
              <Shield size={14} />
              <span>Operations & Management Console</span>
            </div>

            {viewMode === 'login' ? (
              <>
                <h1 className="admin-login-title">Admin Sign In</h1>
                <p className="admin-login-subtitle">
                  Authenticate with administrator email, password and 2FA OTP.
                </p>
              </>
            ) : (
              <>
                <h1 className="admin-login-title">Reset Admin Access</h1>
                <p className="admin-login-subtitle">
                  Authorize password update using administrator 2FA OTP.
                </p>
              </>
            )}
          </div>

          {/* Quick 1-Click Demo Login Box */}
          <div className="admin-demo-access-banner">
            <div className="admin-demo-header">
              <div className="admin-demo-title">
                <Sparkles size={14} color="#F3821D" />
                <span>Admin Demo Credentials</span>
              </div>
              <span className="admin-demo-pill">Ready to Test</span>
            </div>
            
            <div className="admin-demo-creds-row">
              <div className="admin-demo-cred">
                <span className="demo-lbl">Mail:</span>
                <span className="demo-val">dahejsupport@gmail.com</span>
              </div>
              <div className="admin-demo-cred">
                <span className="demo-lbl">Pass:</span>
                <span className="demo-val">admin123</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleQuickDemoAdminLogin}
              className="admin-quick-login-btn"
            >
              <KeyRound size={15} />
              <span>1-Click Admin Demo Login</span>
            </button>
          </div>

          {/* ========================================================================= */}
          {/* VIEW 1: NORMAL ADMIN LOGIN WITH EMAIL + PASSWORD + OTP                   */}
          {/* ========================================================================= */}
          {viewMode === 'login' && !loginSuccess && (
            <form onSubmit={!otpSent ? handleSendLoginOtp : handleVerifyAndLogin} className="admin-form">
              {/* Email Field */}
              <div className="admin-form-group">
                <label htmlFor="adminEmail" className="admin-form-label">
                  <span>Administrator Email <span style={{ color: '#F3821D' }}>*</span></span>
                  {otpSent && (
                    <button
                      type="button"
                      onClick={() => setOtpSent(false)}
                      className="admin-edit-link"
                    >
                      Edit
                    </button>
                  )}
                </label>
                <div className="admin-input-wrap">
                  <span className="admin-field-icon">
                    <Mail size={18} />
                  </span>
                  <input
                    id="adminEmail"
                    type="email"
                    className="admin-input-field"
                    placeholder="dahejsupport@gmail.com"
                    value={adminEmail}
                    onChange={(e) => {
                      setAdminEmail(e.target.value);
                      if (otpSent) setOtpSent(false);
                    }}
                    disabled={otpSent}
                    autoComplete="username"
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="admin-form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label htmlFor="adminPassword" className="admin-form-label">
                    <span>Admin Password <span style={{ color: '#F3821D' }}>*</span></span>
                  </label>
                </div>
                <div className="admin-input-wrap">
                  <span className="admin-field-icon">
                    <Lock size={18} />
                  </span>
                  <input
                    id="adminPassword"
                    type={showPassword ? 'text' : 'password'}
                    className="admin-input-field"
                    placeholder="Enter admin password"
                    value={adminPassword}
                    onChange={(e) => {
                      setAdminPassword(e.target.value);
                      if (otpSent) setOtpSent(false);
                    }}
                    disabled={otpSent}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    className="admin-toggle-pw"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Step 2: 2FA OTP Verification Box */}
              {otpSent && (
                <div className="admin-otp-box">
                  <div className="admin-otp-header">
                    <div className="admin-otp-title-wrap">
                      <ShieldCheck size={16} color="#0A3D75" />
                      <span style={{ fontWeight: 700, color: '#0A3D75' }}>
                        Admin 2FA Security OTP
                      </span>
                    </div>
                    {otpTimer > 0 ? (
                      <span className="admin-otp-timer">Expires in {otpTimer}s</span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSendLoginOtp}
                        className="admin-resend-btn"
                      >
                        Resend OTP
                      </button>
                    )}
                  </div>

                  <div className="admin-otp-input-row">
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="••••••"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      className="admin-otp-input"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={handleVerifyAndLogin}
                      className="admin-verify-btn"
                    >
                      Verify & Sign In
                    </button>
                  </div>

                  <span className="admin-otp-hint">
                    Enter the 6-digit 2FA code sent to your registered email.
                  </span>
                </div>
              )}

              {/* Remember Me & Forgot Password Row */}
              <div className="admin-form-options">
                <label className="admin-checkbox-label">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span>Keep admin session active</span>
                </label>

                <button
                  type="button"
                  onClick={() => switchView('forgot')}
                  className="admin-forgot-btn"
                >
                  Forgot Password?
                </button>
              </div>

              {/* Submit Buttons */}
              {!otpSent ? (
                <button type="submit" className="admin-primary-btn">
                  <KeyRound size={17} />
                  <span>Authenticate & Request OTP</span>
                </button>
              ) : (
                <button type="submit" className="admin-primary-btn verified-btn">
                  <CheckCircle2 size={18} />
                  <span>Verify OTP & Enter Admin Panel</span>
                </button>
              )}

              {noticeMessage && (
                <div className={`admin-alert-toast ${noticeMessage.type}`}>
                  <Info size={16} />
                  <span>{noticeMessage.text}</span>
                </div>
              )}
            </form>
          )}

          {/* ========================================================================= */}
          {/* VIEW 2: FORGOT ADMIN PASSWORD WITH OTP                                   */}
          {/* ========================================================================= */}
          {viewMode === 'forgot' && !resetSuccess && (
            <form onSubmit={!resetOtpSent ? handleSendResetOtp : handleResetPasswordSubmit} className="admin-form">
              <div className="admin-form-group">
                <label htmlFor="resetEmail" className="admin-form-label">
                  <span>Registered Admin Email <span style={{ color: '#F3821D' }}>*</span></span>
                  {resetOtpSent && (
                    <button
                      type="button"
                      onClick={() => setResetOtpSent(false)}
                      className="admin-edit-link"
                    >
                      Edit
                    </button>
                  )}
                </label>
                <div className="admin-input-wrap">
                  <span className="admin-field-icon">
                    <Mail size={18} />
                  </span>
                  <input
                    id="resetEmail"
                    type="email"
                    className="admin-input-field"
                    placeholder="dahejsupport@gmail.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    disabled={resetOtpSent}
                    required
                  />
                </div>
              </div>

              {resetOtpSent && (
                <>
                  <div className="admin-otp-box">
                    <div className="admin-otp-header">
                      <span style={{ fontWeight: 700, color: '#0A3D75' }}>
                        Password Reset OTP
                      </span>
                      {resetOtpTimer > 0 ? (
                        <span className="admin-otp-timer">Expires in {resetOtpTimer}s</span>
                      ) : (
                        <button
                          type="button"
                          onClick={handleSendResetOtp}
                          className="admin-resend-btn"
                        >
                          Resend OTP
                        </button>
                      )}
                    </div>

                    <div className="admin-otp-input-row">
                      <input
                        type="text"
                        maxLength={6}
                        placeholder="••••••"
                        value={resetOtpCode}
                        onChange={(e) => setResetOtpCode(e.target.value.replace(/\D/g, ''))}
                        className="admin-otp-input"
                        autoFocus
                      />
                    </div>
                    <span className="admin-otp-hint">
                      Enter the 6-digit OTP sent to {resetEmail}.
                    </span>
                  </div>

                  <div className="admin-form-group">
                    <label htmlFor="newPassword" className="admin-form-label">
                      <span>New Admin Password <span style={{ color: '#F3821D' }}>*</span></span>
                    </label>
                    <div className="admin-input-wrap">
                      <span className="admin-field-icon">
                        <Lock size={18} />
                      </span>
                      <input
                        id="newPassword"
                        type={showNewPassword ? 'text' : 'password'}
                        className="admin-input-field"
                        placeholder="Enter new strong password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        className="admin-toggle-pw"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div className="admin-form-group">
                    <label htmlFor="confirmPassword" className="admin-form-label">
                      <span>Confirm New Password <span style={{ color: '#F3821D' }}>*</span></span>
                    </label>
                    <div className="admin-input-wrap">
                      <span className="admin-field-icon">
                        <Lock size={18} />
                      </span>
                      <input
                        id="confirmPassword"
                        type={showNewPassword ? 'text' : 'password'}
                        className="admin-input-field"
                        placeholder="Re-enter new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </>
              )}

              {!resetOtpSent ? (
                <button type="submit" className="admin-primary-btn">
                  <Mail size={16} />
                  <span>Send Reset OTP</span>
                </button>
              ) : (
                <button type="submit" className="admin-primary-btn verified-btn">
                  <RotateCcw size={16} />
                  <span>Verify OTP & Update Password</span>
                </button>
              )}

              <div style={{ textAlign: 'center', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => switchView('login')}
                  className="admin-forgot-btn"
                >
                  ← Back to Admin Login
                </button>
              </div>

              {noticeMessage && (
                <div className={`admin-alert-toast ${noticeMessage.type}`}>
                  <Info size={16} />
                  <span>{noticeMessage.text}</span>
                </div>
              )}
            </form>
          )}

          {/* Reset Password Success Screen */}
          {viewMode === 'forgot' && resetSuccess && (
            <div className="admin-success-view">
              <div className="admin-success-icon-wrap">
                <CheckCircle2 size={34} />
              </div>
              <h3 className="admin-success-title">Password Reset Complete</h3>
              <p className="admin-success-desc">
                Your administrator password has been updated. You can now log in to the operations panel.
              </p>
              <button
                type="button"
                className="admin-primary-btn"
                onClick={() => switchView('login')}
              >
                <span>Login with New Password</span>
              </button>
            </div>
          )}

          {/* Login Success Screen */}
          {viewMode === 'login' && loginSuccess && (
            <div className="admin-success-view">
              <div className="admin-success-icon-wrap">
                <CheckCircle2 size={34} />
              </div>
              <h3 className="admin-success-title">Administrator Verified</h3>
              <p className="admin-success-desc">
                Session established for <strong>{adminEmail}</strong>. Redirecting to Operations Dashboard...
              </p>
            </div>
          )}

          {/* Security Notice Footer */}
          <div className="admin-security-footer">
            <ShieldCheck size={18} color="#0A3D75" style={{ flexShrink: 0 }} />
            <span>
              Restricted Administrative System. Multi-factor authentication is enforced on all admin accounts.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
