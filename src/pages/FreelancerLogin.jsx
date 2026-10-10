import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  Mail, 
  ArrowLeft, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  Info,
  CheckCircle2,
  KeyRound,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Code2,
  FlaskConical,
  ShieldAlert
} from 'lucide-react';
import Logo from '../components/Logo';
import { initialDevelopers } from '../data/adminMockData';
import { initialTesters } from '../data/testerMockData';
import './FreelancerLogin.css';

export default function FreelancerLogin({ 
  onNavigate, 
  defaultRole = 'freelancer',
  onLoginSuccess 
}) {
  // Selected Role: 'freelancer' | 'tester'
  const [selectedRole, setSelectedRole] = useState(defaultRole);

  // View Mode: 'login' | 'forgot'
  const [viewMode, setViewMode] = useState('login');

  // Role-specific default credentials
  const savedDev = (() => {
    try {
      const s = localStorage.getItem('dahej_freelancer_profile');
      if (s) return JSON.parse(s);
    } catch (e) {}
    return null;
  })();

  const savedTester = (() => {
    try {
      const s = localStorage.getItem('dahej_tester_profile');
      if (s) return JSON.parse(s);
    } catch (e) {}
    return null;
  })();

  const demoAccounts = {
    freelancer: {
      email: savedDev?.email || 'rahul.patel@dahejsupport.com',
      password: 'dev123',
      name: savedDev?.fullName || savedDev?.name || 'Rahul Patel',
      id: savedDev?.freelancerId || savedDev?.id || 'DEV-101',
      roleTitle: 'The HIT Support Developer Program',
      dashboardRoute: 'portal/dashboard'
    },
    tester: {
      email: savedTester?.email || 'sneha.qa@dahejsupport.com',
      password: 'tester123',
      name: savedTester?.fullName || savedTester?.name || 'Sneha Reddy',
      id: savedTester?.testerId || savedTester?.id || 'TST-201',
      roleTitle: 'The HIT Support Tester Program',
      dashboardRoute: 'tester/dashboard'
    }
  };

  // Login Form States
  const [identifier, setIdentifier] = useState(demoAccounts[defaultRole]?.email || 'rahul.patel@dahejsupport.com');
  const [password, setPassword] = useState(demoAccounts[defaultRole]?.password || 'dev123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // OTP Verification States
  const [loginOtpSent, setLoginOtpSent] = useState(false);
  const [loginOtpCode, setLoginOtpCode] = useState('');
  const [loginOtpTimer, setLoginOtpTimer] = useState(0);
  const [loginSuccess, setLoginSuccess] = useState(false);

  // Forgot Password States
  const [resetEmail, setResetEmail] = useState('');
  const [resetOtpSent, setResetOtpSent] = useState(false);
  const [resetOtpCode, setResetOtpCode] = useState('');
  const [resetOtpTimer, setResetOtpTimer] = useState(0);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  // Status message
  const [noticeMessage, setNoticeMessage] = useState(null);

  // When defaultRole prop changes, update selectedRole
  useEffect(() => {
    if (defaultRole) {
      setSelectedRole(defaultRole);
      setIdentifier(demoAccounts[defaultRole]?.email || '');
      setPassword(demoAccounts[defaultRole]?.password || '');
    }
  }, [defaultRole]);

  // Handle switching role tabs (Option 1: Freelancer vs Option 2: Tester)
  const handleRoleChange = (role) => {
    setSelectedRole(role);
    setIdentifier(demoAccounts[role].email);
    setPassword(demoAccounts[role].password);
    setLoginOtpSent(false);
    setLoginOtpCode('');
    setNoticeMessage(null);
  };

  // Timer for Login OTP
  useEffect(() => {
    let interval = null;
    if (loginOtpTimer > 0) {
      interval = setInterval(() => {
        setLoginOtpTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [loginOtpTimer]);

  // Timer for Reset OTP
  useEffect(() => {
    let interval = null;
    if (resetOtpTimer > 0) {
      interval = setInterval(() => {
        setResetOtpTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resetOtpTimer]);

  // Step 1: Handle Login Send OTP
  const handleSendLoginOtp = (e) => {
    e.preventDefault();
    const idTrimmed = identifier.trim();
    const passTrimmed = password.trim();

    if (!idTrimmed) {
      setNoticeMessage({
        type: 'warning',
        text: 'Please enter your registered Email Address or ID.'
      });
      return;
    }

    if (idTrimmed.includes('@') && !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(idTrimmed)) {
      setNoticeMessage({
        type: 'warning',
        text: 'Please enter a valid email address format (e.g. user@domain.com).'
      });
      return;
    }

    if (!passTrimmed || passTrimmed.length < 4) {
      setNoticeMessage({
        type: 'warning',
        text: 'Password must be at least 4 characters.'
      });
      return;
    }

    setLoginOtpSent(true);
    setLoginOtpTimer(30);
    setLoginOtpCode('123456'); // Pre-fill demo OTP
    setNoticeMessage({
      type: 'info',
      text: `6-Digit Security verification OTP sent to ${idTrimmed}. (Demo OTP: 123456)`
    });
  };

  // Step 2: Handle Login Verify OTP & Complete
  const handleVerifyAndLogin = (e) => {
    if (e) e.preventDefault();
    if (!loginOtpCode || loginOtpCode.trim().length < 4) {
      setNoticeMessage({
        type: 'warning',
        text: 'Please enter the 6-digit security OTP sent to your email.'
      });
      return;
    }

    setLoginSuccess(true);
    const idLower = (identifier || '').toLowerCase().trim();

    let matchedUser = null;
    let actualRole = selectedRole;

    // Load active pool of developers & testers from localStorage
    const allStoredDevs = (() => {
      try {
        const s = localStorage.getItem('dahej_developers');
        if (s) return JSON.parse(s);
      } catch (e) {}
      return initialDevelopers;
    })();

    const allStoredTesters = (() => {
      try {
        const s = localStorage.getItem('dahej_testers');
        if (s) return JSON.parse(s);
      } catch (e) {}
      return initialTesters;
    })();

    if (selectedRole === 'freelancer') {
      if (savedDev && (
        (savedDev.email && savedDev.email.toLowerCase() === idLower) ||
        (savedDev.freelancerId && savedDev.freelancerId.toLowerCase() === idLower) ||
        (savedDev.id && savedDev.id.toLowerCase() === idLower) ||
        (savedDev.fullName && savedDev.fullName.toLowerCase() === idLower) ||
        (savedDev.name && savedDev.name.toLowerCase() === idLower)
      )) {
        matchedUser = {
          name: savedDev.fullName || savedDev.name,
          email: savedDev.email,
          id: savedDev.freelancerId || savedDev.id || 'DEV-101',
          roleTitle: savedDev.program || 'The HIT Support Developer Program',
          avatar: savedDev.avatar
        };
      } else {
        const dev = allStoredDevs.find(d => 
          (d.email && d.email.toLowerCase() === idLower) || 
          (d.id && d.id.toLowerCase() === idLower) || 
          (d.name && d.name.toLowerCase() === idLower)
        );
        if (dev) {
          matchedUser = {
            name: dev.name,
            email: dev.email,
            id: dev.id,
            roleTitle: dev.primarySkill || 'Full Stack Developer',
            avatar: dev.avatar
          };
        } else {
          matchedUser = {
            name: demoAccounts.freelancer.name,
            email: identifier,
            id: demoAccounts.freelancer.id,
            roleTitle: demoAccounts.freelancer.roleTitle
          };
        }
      }
    } else {
      if (savedTester && (
        (savedTester.email && savedTester.email.toLowerCase() === idLower) ||
        (savedTester.testerId && savedTester.testerId.toLowerCase() === idLower) ||
        (savedTester.id && savedTester.id.toLowerCase() === idLower) ||
        (savedTester.fullName && savedTester.fullName.toLowerCase() === idLower) ||
        (savedTester.name && savedTester.name.toLowerCase() === idLower)
      )) {
        matchedUser = {
          name: savedTester.fullName || savedTester.name,
          email: savedTester.email,
          id: savedTester.testerId || savedTester.id || 'TST-201',
          roleTitle: savedTester.program || 'The HIT Support Tester Program',
          avatar: savedTester.avatar
        };
      } else {
        let foundCustom = null;
        for (const t of allStoredTesters) {
          try {
            const cust = localStorage.getItem(`dahej_tester_profile_${t.id}`);
            if (cust) {
              const parsed = JSON.parse(cust);
              if (
                (parsed.email && parsed.email.toLowerCase() === idLower) ||
                (parsed.testerId && parsed.testerId.toLowerCase() === idLower) ||
                (parsed.id && parsed.id.toLowerCase() === idLower) ||
                (parsed.name && parsed.name.toLowerCase() === idLower) ||
                (parsed.fullName && parsed.fullName.toLowerCase() === idLower)
              ) {
                foundCustom = {
                  name: parsed.fullName || parsed.name,
                  email: parsed.email,
                  id: parsed.testerId || parsed.id || t.id,
                  roleTitle: parsed.program || t.specialization || t.role,
                  avatar: parsed.avatar || t.avatar
                };
                break;
              }
            }
          } catch (err) {}
        }

        if (foundCustom) {
          matchedUser = foundCustom;
        } else {
          const tester = allStoredTesters.find(t => 
            (t.email && t.email.toLowerCase() === idLower) || 
            (t.id && t.id.toLowerCase() === idLower) || 
            (t.name && t.name.toLowerCase() === idLower)
          );
          if (tester) {
            matchedUser = {
              name: tester.name,
              email: tester.email,
              id: tester.id,
              roleTitle: tester.specialization || tester.role,
              avatar: tester.avatar
            };
          } else {
            matchedUser = {
              name: demoAccounts.tester.name,
              email: identifier,
              id: demoAccounts.tester.id,
              roleTitle: demoAccounts.tester.roleTitle
            };
          }
        }
      }
    }

    setNoticeMessage({
      type: 'success',
      text: `Authentication successful as ${matchedUser.name}! Launching ${actualRole === 'tester' ? 'QA Tester' : 'Freelancer'} Workspace...`
    });

    setTimeout(() => {
      if (onLoginSuccess) {
        onLoginSuccess(actualRole, matchedUser);
      } else {
        onNavigate(actualRole === 'tester' ? 'tester/dashboard' : 'portal/dashboard');
      }
    }, 750);
  };

  // 1-Click Quick Demo Login for a specific developer or tester
  const handleSelectSpecificUser = (role, userObj) => {
    setSelectedRole(role);
    setIdentifier(userObj.email);
    setPassword('dev123');
    setLoginOtpCode('123456');
    setLoginOtpSent(true);
    setLoginSuccess(true);

    const userPayload = {
      name: userObj.name,
      email: userObj.email,
      id: userObj.id,
      roleTitle: userObj.primarySkill || userObj.specialization || userObj.role || 'Member',
      avatar: userObj.avatar
    };

    setNoticeMessage({
      type: 'success',
      text: `Verified as ${userObj.name} (${userObj.id}). Redirecting...`
    });

    setTimeout(() => {
      if (onLoginSuccess) {
        onLoginSuccess(role, userPayload);
      } else {
        onNavigate(role === 'tester' ? 'tester/dashboard' : 'portal/dashboard');
      }
    }, 600);
  };

  // 1-Click Quick Demo Login for the default role
  const handleQuickDemoLogin = (role) => {
    const targetRole = role || selectedRole;
    const account = demoAccounts[targetRole];
    handleSelectSpecificUser(targetRole, account);
  };

  // Handle Forgot Password Send OTP
  const handleSendResetOtp = (e) => {
    e.preventDefault();
    if (!resetEmail.trim() || !resetEmail.includes('@')) {
      setNoticeMessage({
        type: 'warning',
        text: 'Please enter a valid registered email address.'
      });
      return;
    }

    setResetOtpSent(true);
    setResetOtpTimer(30);
    setResetOtpCode('123456');
    setNoticeMessage({
      type: 'info',
      text: `Password reset OTP has been sent to ${resetEmail}. (Demo OTP: 123456)`
    });
  };

  // Handle Forgot Password Verify OTP & Update Password
  const handleResetPasswordSubmit = (e) => {
    e.preventDefault();
    if (!resetOtpCode || resetOtpCode.trim().length < 4) {
      setNoticeMessage({
        type: 'warning',
        text: 'Please enter the 6-digit OTP sent to your email.'
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
        text: 'New Password and Confirm Password do not match.'
      });
      return;
    }

    setResetSuccess(true);
    setNoticeMessage({
      type: 'success',
      text: 'Your password has been reset successfully! You can now login.'
    });
  };

  const switchView = (mode) => {
    setViewMode(mode);
    setNoticeMessage(null);
    setLoginOtpSent(false);
    setResetOtpSent(false);
    setResetSuccess(false);
  };

  const isFreelancer = selectedRole === 'freelancer';

  return (
    <div className="login-page-wrapper">
      <div className="login-container">
        {/* Top Back Navigation Bar */}
        <div className="login-back-nav">
          <button
            type="button"
            onClick={() => onNavigate('home')}
            className="login-back-btn"
          >
            <ArrowLeft size={16} />
            <span>Back to Main Page</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('admin-login')}
            className="admin-switch-badge-btn"
            title="Go to Admin Login Page"
          >
            <ShieldAlert size={14} />
            <span>Admin Portal Login</span>
          </button>
        </div>

        {/* Main Card */}
        <div className="login-card">
          <div className="login-header">
            <div className="login-logo-wrap">
              <Logo size="large" />
            </div>
            
            {viewMode === 'login' ? (
              <>
                <h1 className="login-heading">
                  {isFreelancer ? 'Developer Portal' : 'QA Tester Portal'}
                </h1>
                <p className="login-subheading">
                  {isFreelancer 
                    ? 'Sign in to access assigned projects, milestones, and earnings.'
                    : 'Sign in to access QA review queue, bug tracking, and QA approvals.'}
                </p>
              </>
            ) : (
              <>
                <h1 className="login-heading">Reset Password</h1>
                <p className="login-subheading">
                  Verify your email with OTP to set a new workspace password.
                </p>
              </>
            )}
          </div>

          {/* ========================================================================= */}
          {/* USER BASE / ROLE SELECTOR TABS (OPTION 1: FREELANCER vs OPTION 2: TESTER) */}
          {/* ========================================================================= */}
          {viewMode === 'login' && !loginSuccess && (
            <div className="role-selector-wrapper">
              <div className="role-selector-label">Select Workspace Role:</div>
              <div className="role-tabs-grid">
                {/* Option 1: Freelancer / Developer */}
                <button
                  type="button"
                  className={`role-tab-card ${selectedRole === 'freelancer' ? 'active-freelancer' : ''}`}
                  onClick={() => handleRoleChange('freelancer')}
                >
                  <div className="role-tab-icon-wrap dev">
                    <Code2 size={18} />
                  </div>
                  <div className="role-tab-content">
                    <span className="role-tab-title">Option 1: Freelancer</span>
                    <span className="role-tab-desc">Developer & Projects</span>
                  </div>
                  {selectedRole === 'freelancer' && (
                    <div className="role-tab-check">
                      <CheckCircle2 size={15} />
                    </div>
                  )}
                </button>

                {/* Option 2: Tester */}
                <button
                  type="button"
                  className={`role-tab-card ${selectedRole === 'tester' ? 'active-tester' : ''}`}
                  onClick={() => handleRoleChange('tester')}
                >
                  <div className="role-tab-icon-wrap tester">
                    <FlaskConical size={18} />
                  </div>
                  <div className="role-tab-content">
                    <span className="role-tab-title">Option 2: Tester</span>
                    <span className="role-tab-desc">QA & Bug Testing</span>
                  </div>
                  {selectedRole === 'tester' && (
                    <div className="role-tab-check">
                      <CheckCircle2 size={15} />
                    </div>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Quick 1-Click Demo Login Box */}
          {viewMode === 'login' && !loginSuccess && (
            <div className={`demo-creds-box ${selectedRole}`}>
              <div className="demo-creds-header">
                <div className="demo-creds-title">
                  <Sparkles size={13} color="#F3821D" />
                  <span>Demo Credentials ({isFreelancer ? 'Freelancer' : 'QA Tester'})</span>
                </div>
                <span className="demo-badge">1-Click Auto Fill</span>
              </div>

              <div className="demo-info-pills">
                <div className="demo-pill">
                  <span className="p-lbl">Mail:</span>
                  <span className="p-val">{demoAccounts[selectedRole].email}</span>
                </div>
                <div className="demo-pill">
                  <span className="p-lbl">Pass:</span>
                  <span className="p-val">{demoAccounts[selectedRole].password}</span>
                </div>
                <div className="demo-pill">
                  <span className="p-lbl">OTP:</span>
                  <span className="p-val">123456</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin(selectedRole)}
                className={`btn-quick-role-login ${selectedRole}`}
              >
                <KeyRound size={14} />
                <span>1-Click {isFreelancer ? 'Freelancer' : 'Tester'} Demo Login</span>
              </button>

              {/* Quick Select specific accounts */}
              <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px dashed #CBD5E1' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748B', marginBottom: '6px' }}>
                  Quick Switch {isFreelancer ? 'Developer' : 'QA Tester'} Account:
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {isFreelancer ? (
                    initialDevelopers.slice(0, 4).map(d => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => handleSelectSpecificUser('freelancer', d)}
                        style={{
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          padding: '4px 8px',
                          borderRadius: '6px',
                          border: identifier === d.email ? '1.5px solid #0A3D75' : '1px solid #CBD5E1',
                          background: identifier === d.email ? '#EBF3FA' : '#FFFFFF',
                          color: '#0A3D75',
                          cursor: 'pointer'
                        }}
                      >
                        {d.name} ({d.id})
                      </button>
                    ))
                  ) : (
                    initialTesters.slice(0, 4).map(t => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => handleSelectSpecificUser('tester', t)}
                        style={{
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          padding: '4px 8px',
                          borderRadius: '6px',
                          border: identifier === t.email ? '1.5px solid #F3821D' : '1px solid #CBD5E1',
                          background: identifier === t.email ? '#FFF7ED' : '#FFFFFF',
                          color: '#C2410C',
                          cursor: 'pointer'
                        }}
                      >
                        {t.name} ({t.id})
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* VIEW 1: NORMAL LOGIN WITH EMAIL, PASSWORD & OTP                          */}
          {/* ========================================================================= */}
          {viewMode === 'login' && !loginSuccess && (
            <form onSubmit={!loginOtpSent ? handleSendLoginOtp : handleVerifyAndLogin} className="login-form">
              {/* Email / Username Field */}
              <div className="login-form-group">
                <label htmlFor="identifier" className="login-form-label">
                  <span>{isFreelancer ? 'Freelancer' : 'Tester'} Email <span style={{ color: '#F3821D' }}>*</span></span>
                  {loginOtpSent && (
                    <button
                      type="button"
                      onClick={() => setLoginOtpSent(false)}
                      className="btn-resend-text"
                      style={{ fontSize: '0.78rem' }}
                    >
                      Edit
                    </button>
                  )}
                </label>
                <div className="login-input-wrap">
                  <span className="login-field-icon">
                    <Mail size={18} />
                  </span>
                  <input
                    id="identifier"
                    type="email"
                    className="login-input-field"
                    placeholder={isFreelancer ? "rahul.patel@dahejsupport.com" : "sneha.qa@dahejsupport.com"}
                    value={identifier}
                    onChange={(e) => {
                      setIdentifier(e.target.value);
                      if (loginOtpSent) setLoginOtpSent(false);
                    }}
                    disabled={loginOtpSent}
                    autoComplete="username"
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="login-form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label htmlFor="password" className="login-form-label">
                    <span>Password <span style={{ color: '#F3821D' }}>*</span></span>
                  </label>
                </div>
                <div className="login-input-wrap">
                  <span className="login-field-icon">
                    <Lock size={18} />
                  </span>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    className="login-input-field"
                    placeholder={`Enter your ${isFreelancer ? 'freelancer' : 'tester'} password`}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (loginOtpSent) setLoginOtpSent(false);
                    }}
                    disabled={loginOtpSent}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    className="login-toggle-pw"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Step 2: Login OTP Verification Box */}
              {loginOtpSent && (
                <div className="login-otp-box">
                  <div className="login-otp-header">
                    <span style={{ fontWeight: 700, color: '#0A3D75' }}>
                      Security Verification OTP
                    </span>
                    {loginOtpTimer > 0 ? (
                      <span className="otp-countdown-text">Expires in {loginOtpTimer}s</span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSendLoginOtp}
                        className="btn-resend-text"
                      >
                        Resend OTP
                      </button>
                    )}
                  </div>

                  <div className="login-otp-input-row">
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="••••••"
                      value={loginOtpCode}
                      onChange={(e) => setLoginOtpCode(e.target.value.replace(/\D/g, ''))}
                      className="login-otp-code-input"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={handleVerifyAndLogin}
                      className="btn-verify-login-otp"
                    >
                      Verify & Sign In
                    </button>
                  </div>

                  <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                    Enter the 6-digit OTP sent to {identifier} (Demo OTP: <strong>123456</strong>).
                  </span>
                </div>
              )}

              {/* Remember Me & Forgot Password Links */}
              <div className="form-options-row">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span>Remember me</span>
                </label>

                <button
                  type="button"
                  onClick={() => switchView('forgot')}
                  className="forgot-password-link"
                >
                  Forgot Password?
                </button>
              </div>

              {/* Action Button */}
              {!loginOtpSent ? (
                <button 
                  type="submit" 
                  className={`btn btn-submit-login ${selectedRole === 'tester' ? 'btn-tester-theme' : ''}`}
                >
                  <KeyRound size={16} />
                  <span>Continue with OTP Verification</span>
                </button>
              ) : (
                <button type="submit" className="btn btn-submit-login" style={{ backgroundColor: '#F3821D' }}>
                  <CheckCircle2 size={17} />
                  <span>Login to {isFreelancer ? 'Freelancer' : 'Tester'} Workspace</span>
                </button>
              )}

              {noticeMessage && (
                <div className={`login-alert-toast ${noticeMessage.type}`}>
                  <Info size={15} />
                  <span>{noticeMessage.text}</span>
                </div>
              )}
            </form>
          )}

          {/* ========================================================================= */}
          {/* VIEW 2: FORGOT / RESET PASSWORD WITH EMAIL OTP                           */}
          {/* ========================================================================= */}
          {viewMode === 'forgot' && !resetSuccess && (
            <form onSubmit={!resetOtpSent ? handleSendResetOtp : handleResetPasswordSubmit} className="login-form">
              {/* Registered Email */}
              <div className="login-form-group">
                <label htmlFor="resetEmail" className="login-form-label">
                  <span>Registered Email Address <span style={{ color: '#F3821D' }}>*</span></span>
                  {resetOtpSent && (
                    <button
                      type="button"
                      onClick={() => setResetOtpSent(false)}
                      className="btn-resend-text"
                      style={{ fontSize: '0.78rem' }}
                    >
                      Change Email
                    </button>
                  )}
                </label>
                <div className="login-input-wrap">
                  <span className="login-field-icon">
                    <Mail size={18} />
                  </span>
                  <input
                    id="resetEmail"
                    type="email"
                    className="login-input-field"
                    placeholder="name@example.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    disabled={resetOtpSent}
                    required
                  />
                </div>
              </div>

              {/* Reset OTP & New Password Fields */}
              {resetOtpSent && (
                <>
                  <div className="login-otp-box">
                    <div className="login-otp-header">
                      <span style={{ fontWeight: 700, color: '#0A3D75' }}>
                        Password Reset OTP
                      </span>
                      {resetOtpTimer > 0 ? (
                        <span className="otp-countdown-text">Expires in {resetOtpTimer}s</span>
                      ) : (
                        <button
                          type="button"
                          onClick={handleSendResetOtp}
                          className="btn-resend-text"
                        >
                          Resend OTP
                        </button>
                      )}
                    </div>

                    <div className="login-otp-input-row">
                      <input
                        type="text"
                        maxLength={6}
                        placeholder="••••••"
                        value={resetOtpCode}
                        onChange={(e) => setResetOtpCode(e.target.value.replace(/\D/g, ''))}
                        className="login-otp-code-input"
                        autoFocus
                      />
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                      Enter the 6-digit OTP sent to {resetEmail} (Demo: 123456).
                    </span>
                  </div>

                  <div className="login-form-group">
                    <label htmlFor="newPassword" className="login-form-label">
                      <span>New Password <span style={{ color: '#F3821D' }}>*</span></span>
                    </label>
                    <div className="login-input-wrap">
                      <span className="login-field-icon">
                        <Lock size={18} />
                      </span>
                      <input
                        id="newPassword"
                        type={showNewPassword ? 'text' : 'password'}
                        className="login-input-field"
                        placeholder="Create new password (min. 6 characters)"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        className="login-toggle-pw"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div className="login-form-group">
                    <label htmlFor="confirmPassword" className="login-form-label">
                      <span>Confirm New Password <span style={{ color: '#F3821D' }}>*</span></span>
                    </label>
                    <div className="login-input-wrap">
                      <span className="login-field-icon">
                        <Lock size={18} />
                      </span>
                      <input
                        id="confirmPassword"
                        type={showNewPassword ? 'text' : 'password'}
                        className="login-input-field"
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
                <button type="submit" className="btn btn-submit-reset">
                  <Mail size={16} />
                  <span>Send Reset OTP</span>
                </button>
              ) : (
                <button type="submit" className="btn btn-submit-reset">
                  <RotateCcw size={16} />
                  <span>Verify OTP & Update Password</span>
                </button>
              )}

              <div style={{ textAlign: 'center', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => switchView('login')}
                  className="forgot-password-link"
                >
                  ← Remember your password? Back to Login
                </button>
              </div>

              {noticeMessage && (
                <div className={`login-alert-toast ${noticeMessage.type}`}>
                  <Info size={15} />
                  <span>{noticeMessage.text}</span>
                </div>
              )}
            </form>
          )}

          {/* Reset Password Success Screen */}
          {viewMode === 'forgot' && resetSuccess && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#ECFDF5', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto', border: '1px solid #A7F3D0' }}>
                <CheckCircle2 size={32} strokeWidth={2.5} />
              </div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#111827', marginBottom: '8px' }}>
                Password Updated Successfully
              </h3>
              <p style={{ fontSize: '0.9rem', color: '#5F6B76', marginBottom: '20px' }}>
                Your workspace password has been updated via OTP verification. You can now log in.
              </p>
              <button
                type="button"
                className="btn btn-submit-login"
                onClick={() => switchView('login')}
              >
                <span>Login with New Password</span>
              </button>
            </div>
          )}

          {/* Login Success Screen */}
          {viewMode === 'login' && loginSuccess && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#ECFDF5', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto', border: '1px solid #A7F3D0' }}>
                <CheckCircle2 size={32} strokeWidth={2.5} />
              </div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#111827', marginBottom: '8px' }}>
                {isFreelancer ? 'Developer' : 'Tester'} Verified Successfully
              </h3>
              <p style={{ fontSize: '0.9rem', color: '#5F6B76', marginBottom: '20px' }}>
                Welcome, <strong>{identifier}</strong>. Redirecting to your {isFreelancer ? 'Freelancer' : 'QA Tester'} Workspace...
              </p>
            </div>
          )}

          {/* Admin Switch Banner */}
          <div className="admin-portal-footer-link">
            <div className="admin-footer-text">
              <span>Are you an Administrator?</span>
              <button
                type="button"
                onClick={() => onNavigate('admin-login')}
                className="btn-admin-direct-link"
              >
                <span>Access Admin Operations Login</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>

          <div className="login-divider">
            <span>Or</span>
          </div>

          <div className="login-footer-action">
            <span>Don't have an account?</span>
            <button
              type="button"
              onClick={() => onNavigate(selectedRole === 'tester' ? 'apply-tester' : 'apply')}
              className="btn-link-apply"
            >
              Apply with Referral
            </button>
          </div>

          {/* Small Trust Message */}
          <div className="login-trust-notice">
            <ShieldCheck size={18} color="#0A3D75" style={{ flexShrink: 0 }} />
            <span>
              Workspace access is restricted to verified Developers and QA Testers.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
