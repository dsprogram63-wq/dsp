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
import { 
  sendOtpVerificationEmail, 
  verifyOtpCode, 
  getMemberPassword,
  saveMemberPassword,
  SENDER_PROFILES 
} from '../services/emailService.js';
import { getOrAssignReferralTrustId } from '../utils/referralTrustUtils.js';
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

  // Fresh helpers to query developers and testers from storage
  const getFreshDevelopers = () => {
    try {
      const s = localStorage.getItem('dahej_real_v2_developers') || localStorage.getItem('dahej_developers');
      if (s) {
        const parsed = JSON.parse(s);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return initialDevelopers || [];
  };

  const getFreshTesters = () => {
    try {
      const s = localStorage.getItem('dahej_real_v2_testers') || localStorage.getItem('dahej_testers');
      if (s) {
        const parsed = JSON.parse(s);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return initialTesters || [];
  };

  const allStoredDevs = getFreshDevelopers();
  const allStoredTesters = getFreshTesters();

  const demoAccounts = {
    freelancer: {
      email: 'developer@hit-support.com',
      password: 'dev123',
      name: 'Developer Demo',
      id: 'DEV-DEMO',
      roleTitle: 'The HIT Support Developer Program',
      dashboardRoute: 'portal/dashboard'
    },
    tester: {
      email: 'tester@hit-support.com',
      password: 'tester123',
      name: 'QA Tester Demo',
      id: 'TST-DEMO',
      roleTitle: 'The HIT Support Tester Program',
      dashboardRoute: 'tester/dashboard'
    }
  };

  // Login Form States (Clean empty defaults - requires actual user credentials)
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // OTP Verification States
  const [loginOtpSent, setLoginOtpSent] = useState(false);
  const [loginOtpCode, setLoginOtpCode] = useState('');
  const [loginOtpTimer, setLoginOtpTimer] = useState(0);
  const [isSendingLoginOtp, setIsSendingLoginOtp] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);

  // Forgot Password States
  const [resetEmail, setResetEmail] = useState('');
  const [resetOtpSent, setResetOtpSent] = useState(false);
  const [resetOtpCode, setResetOtpCode] = useState('');
  const [resetOtpTimer, setResetOtpTimer] = useState(0);
  const [isSendingResetOtp, setIsSendingResetOtp] = useState(false);
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
      setIdentifier('');
      setPassword('');
      setLoginOtpSent(false);
      setLoginOtpCode('');
      setNoticeMessage(null);
    }
  }, [defaultRole]);

  // Handle switching role tabs (Option 1: Freelancer vs Option 2: Tester)
  const handleRoleChange = (role) => {
    setSelectedRole(role);
    setIdentifier('');
    setPassword('');
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

  // Step 1: Handle Login Send OTP via Brevo Mailer
  const handleSendLoginOtp = async (e) => {
    if (e) e.preventDefault();
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

    if (!passTrimmed) {
      setNoticeMessage({
        type: 'warning',
        text: 'Please enter your password.'
      });
      return;
    }

    const idLower = idTrimmed.toLowerCase();
    const currentDevs = getFreshDevelopers();
    const currentTesters = getFreshTesters();

    // Search across developers and testers lists
    const matchedDev = currentDevs.find(d => 
      (d.email && d.email.toLowerCase().trim() === idLower) || 
      (d.id && d.id.toLowerCase().trim() === idLower) || 
      (d.developerId && d.developerId.toLowerCase().trim() === idLower) ||
      (d.freelancerId && d.freelancerId.toLowerCase().trim() === idLower) ||
      (d.name && d.name.toLowerCase().trim() === idLower) ||
      (d.fullName && d.fullName.toLowerCase().trim() === idLower)
    );

    const matchedTester = currentTesters.find(t => 
      (t.email && t.email.toLowerCase().trim() === idLower) || 
      (t.id && t.id.toLowerCase().trim() === idLower) || 
      (t.testerId && t.testerId.toLowerCase().trim() === idLower) ||
      (t.name && t.name.toLowerCase().trim() === idLower) ||
      (t.fullName && t.fullName.toLowerCase().trim() === idLower)
    );

    // Determine candidate member and correct role tab
    let member = null;
    let actualRole = selectedRole;

    if (selectedRole === 'freelancer') {
      if (matchedDev) {
        member = matchedDev;
        actualRole = 'freelancer';
      } else if (matchedTester) {
        // User is a registered QA Tester who entered email on freelancer tab: auto switch
        setSelectedRole('tester');
        member = matchedTester;
        actualRole = 'tester';
      }
    } else {
      if (matchedTester) {
        member = matchedTester;
        actualRole = 'tester';
      } else if (matchedDev) {
        // User is a registered Developer who entered email on tester tab: auto switch
        setSelectedRole('freelancer');
        member = matchedDev;
        actualRole = 'freelancer';
      }
    }

    // If not found in either active database, check if it's the demo baseline account
    if (!member) {
      if (idLower === 'developer@hit-support.com') {
        member = {
          id: 'DEV-DEMO',
          name: 'Developer Demo',
          fullName: 'Developer Demo',
          email: 'developer@hit-support.com',
          status: 'Active',
          isDemo: true
        };
        actualRole = 'freelancer';
      } else if (idLower === 'tester@hit-support.com') {
        member = {
          id: 'TST-DEMO',
          name: 'QA Tester Demo',
          fullName: 'QA Tester Demo',
          email: 'tester@hit-support.com',
          status: 'Active',
          isDemo: true
        };
        actualRole = 'tester';
      } else {
        setNoticeMessage({
          type: 'error',
          text: 'Account not found. Please check your registered email or ID.'
        });
        return;
      }
    }

    // Check account status
    if (member.status === 'Pending') {
      setNoticeMessage({
        type: 'warning',
        text: `Access Denied: Account "${member.fullName || member.name}" (${member.id || member.testerId}) is PENDING Admin approval. Once approved, your login password will be sent to ${member.email}.`
      });
      return;
    }

    if (member.status === 'Deactivated' || member.status === 'Rejected') {
      setNoticeMessage({
        type: 'warning',
        text: `Access Denied: This account is currently ${member.status}. Please contact platform administration.`
      });
      return;
    }

    // STRICT ADMIN PASSWORD VALIDATION:
    // Only the password assigned by Admin upon approval is permitted!
    // NO random text, and NO fallback generic passwords (dev123/tester123) for real approved accounts.
    const memberId = member.id || member.testerId || member.developerId || member.freelancerId;
    const memberEmail = (member.email || '').toLowerCase().trim();

    const adminAssignedPassword = 
      getMemberPassword(memberId) || 
      getMemberPassword(memberEmail) || 
      member.password || 
      null;

    const isSeedDemoAccount = member.isDemo || (
      !adminAssignedPassword && (
        memberEmail === 'developer@hit-support.com' ||
        memberEmail === 'tester@hit-support.com' ||
        memberId === 'DEV-452' ||
        memberId === 'DEV-892' ||
        memberId === 'TST-781'
      )
    );

    const expectedPassword = adminAssignedPassword || (isSeedDemoAccount ? (actualRole === 'tester' ? 'tester123' : 'dev123') : null);

    if (!expectedPassword || passTrimmed !== expectedPassword) {
      setNoticeMessage({
        type: 'error',
        text: 'Incorrect password.'
      });
      return;
    }

    // Dispatch verification OTP to registered email
    const targetEmail = member.email || idTrimmed;
    const targetName = member.fullName || member.name || (actualRole === 'tester' ? 'QA Tester' : 'Developer');

    setIsSendingLoginOtp(true);
    setNoticeMessage({
      type: 'info',
      text: `Dispatching 6-Digit security OTP to ${targetEmail}...`
    });

    try {
      await sendOtpVerificationEmail({
        toEmail: targetEmail,
        toName: targetName,
        role: actualRole === 'tester' ? 'tester' : 'developer',
        senderProfile: actualRole === 'tester' ? SENDER_PROFILES.QA_DESK : SENDER_PROFILES.DEVELOPER_DESK
      });

      setLoginOtpSent(true);
      setLoginOtpTimer(60);
      setLoginOtpCode(''); // Clean empty field, real OTP required from email
      setNoticeMessage({
        type: 'success',
        text: `✓ 6-Digit Security verification OTP sent to ${targetEmail}. Please check your inbox (and Spam folder).`
      });
    } catch (err) {
      console.error('Error sending login OTP:', err);
      setNoticeMessage({
        type: 'error',
        text: `Failed to send verification OTP: ${err.message || 'Please check your connection.'}`
      });
    } finally {
      setIsSendingLoginOtp(false);
    }
  };

  // Step 2: Handle Login Verify OTP & Complete
  const handleVerifyAndLogin = (e) => {
    if (e) e.preventDefault();
    const trimmedOtp = (loginOtpCode || '').trim();
    if (!trimmedOtp || trimmedOtp.length !== 6) {
      setNoticeMessage({
        type: 'warning',
        text: 'Please enter the complete 6-digit security OTP sent to your email.'
      });
      return;
    }

    const idLower = (identifier || '').toLowerCase().trim();
    const currentDevs = getFreshDevelopers();
    const currentTesters = getFreshTesters();

    const matchedDev = currentDevs.find(d => 
      (d.email && d.email.toLowerCase().trim() === idLower) || 
      (d.id && d.id.toLowerCase().trim() === idLower) || 
      (d.developerId && d.developerId.toLowerCase().trim() === idLower) ||
      (d.freelancerId && d.freelancerId.toLowerCase().trim() === idLower) ||
      (d.name && d.name.toLowerCase().trim() === idLower) ||
      (d.fullName && d.fullName.toLowerCase().trim() === idLower)
    );

    const matchedTester = currentTesters.find(t => 
      (t.email && t.email.toLowerCase().trim() === idLower) || 
      (t.id && t.id.toLowerCase().trim() === idLower) || 
      (t.testerId && t.testerId.toLowerCase().trim() === idLower) || 
      (t.name && t.name.toLowerCase().trim() === idLower) ||
      (t.fullName && t.fullName.toLowerCase().trim() === idLower)
    );

    let member = (selectedRole === 'freelancer' ? matchedDev : matchedTester) || matchedDev || matchedTester;
    let actualRole = matchedTester && !matchedDev ? 'tester' : (matchedDev ? 'freelancer' : selectedRole);
    const targetEmail = (member && member.email) ? member.email.toLowerCase().trim() : idLower;

    const verifyResult = verifyOtpCode(targetEmail, trimmedOtp);
    if (!verifyResult.success) {
      setNoticeMessage({
        type: 'error',
        text: verifyResult.error || 'Invalid OTP. Please check the code in your email.'
      });
      return;
    }

    setLoginSuccess(true);
    let matchedUser = null;

    if (actualRole === 'freelancer' && member) {
      let devCustom = null;
      try {
        const cust = localStorage.getItem(`dahej_profile_${member.id}`);
        if (cust) devCustom = JSON.parse(cust);
      } catch (e) {}

      const devRefCode = (member.referralCode && !member.referralCode.startsWith('REF-00') ? member.referralCode : null) ||
        (member.referenceId && !member.referenceId.startsWith('REF-00') ? member.referenceId : null) ||
        (devCustom && devCustom.referralCode && !devCustom.referralCode.startsWith('REF-00') ? devCustom.referralCode : null) ||
        'DS-REF-8902';
      const devRefName = member.referenceName || (devCustom && devCustom.referenceName) || 'Reference Verification';

      matchedUser = {
        name: (devCustom && (devCustom.name || devCustom.fullName)) || member.fullName || member.name,
        email: (devCustom && devCustom.email) || member.email,
        id: member.id || member.developerId || member.freelancerId,
        roleTitle: member.primarySkill || 'Full Stack Developer',
        avatar: (devCustom && devCustom.avatar) || member.avatar,
        referralCode: devRefCode,
        referenceId: devRefCode,
        referenceName: devRefName
      };
    } else if (actualRole === 'tester' && member) {
      let testerCustom = null;
      try {
        const cust = localStorage.getItem(`dahej_tester_profile_${member.id || member.testerId}`);
        if (cust) testerCustom = JSON.parse(cust);
      } catch (e) {}

      const testerRefCode = (member.referralCode && !member.referralCode.startsWith('REF-00') ? member.referralCode : null) ||
        (member.referenceId && !member.referenceId.startsWith('REF-00') ? member.referenceId : null) ||
        (testerCustom && testerCustom.referralCode && !testerCustom.referralCode.startsWith('REF-00') ? testerCustom.referralCode : null) ||
        'DS-TST-201';
      const testerRefName = member.referenceName || (testerCustom && testerCustom.referenceName) || 'Reference Verification';

      const testerTrustId = member.referralTrustId ||
        (testerCustom && testerCustom.referralTrustId) ||
        getOrAssignReferralTrustId({
          id: member.id || member.testerId,
          testerId: member.testerId || member.id,
          name: member.name || member.fullName,
          status: member.status || 'Active'
        }, allStoredTesters);

      matchedUser = {
        name: (testerCustom && (testerCustom.name || testerCustom.fullName)) || member.fullName || member.name,
        email: (testerCustom && testerCustom.email) || member.email,
        id: member.id || member.testerId,
        testerId: member.testerId || member.id,
        roleTitle: member.specialization || member.role || 'QA Specialist',
        avatar: (testerCustom && testerCustom.avatar) || member.avatar,
        status: member.status || 'Active',
        referralTrustId: testerTrustId,
        referralCode: testerRefCode,
        referenceId: testerRefCode,
        referenceName: testerRefName
      };
    } else {
      const isTester = actualRole === 'tester';
      matchedUser = {
        name: demoAccounts[actualRole].name,
        email: targetEmail,
        id: demoAccounts[actualRole].id,
        testerId: isTester ? demoAccounts[actualRole].id : undefined,
        freelancerId: !isTester ? demoAccounts[actualRole].id : undefined,
        roleTitle: demoAccounts[actualRole].roleTitle,
        status: 'Active',
        referralTrustId: isTester ? 'RFF-TesterDemo-901' : 'RFF-DeveloperDemo-892',
        referralCode: isTester ? 'DS-TST-201' : 'DS-REF-8902',
        referenceId: isTester ? 'DS-TST-201' : 'DS-REF-8902',
        referenceName: 'Reference Verification'
      };
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

  // Quick Select specific account from directory pills
  const handleSelectSpecificUser = (role, userObj) => {
    if (userObj.status === 'Pending') {
      setNoticeMessage({
        type: 'warning',
        text: `Cannot Login: "${userObj.name}" (${userObj.id}) is PENDING Admin verification. Please approve this profile in the Admin Directory first.`
      });
      return;
    }
    setSelectedRole(role);
    setIdentifier(userObj.email || userObj.id);
    setPassword(''); // Never auto-fill password; user must enter their admin password
    setLoginOtpSent(false);
    setLoginOtpCode('');
    setNoticeMessage({
      type: 'info',
      text: `Selected "${userObj.name}". Please enter the password assigned by Admin upon approval.`
    });
  };

  // 1-Click Quick Demo Login for the default demo accounts
  const handleQuickDemoLogin = (role) => {
    const targetRole = role || selectedRole;
    const account = demoAccounts[targetRole];
    setSelectedRole(targetRole);
    setIdentifier(account.email);
    setPassword(account.password);
    setLoginOtpSent(false);
    setLoginOtpCode('');
    setNoticeMessage({
      type: 'info',
      text: `Demo credentials auto-filled for ${targetRole === 'tester' ? 'QA Tester' : 'Freelancer'}. Click "Continue with OTP Verification" to proceed.`
    });
  };

  // Handle Forgot Password Send OTP via Brevo
  const handleSendResetOtp = async (e) => {
    e.preventDefault();
    const emailTrimmed = resetEmail.trim();
    if (!emailTrimmed || !emailTrimmed.includes('@')) {
      setNoticeMessage({
        type: 'warning',
        text: 'Please enter a valid registered email address.'
      });
      return;
    }

    setIsSendingResetOtp(true);
    setNoticeMessage({
      type: 'info',
      text: `Dispatching password reset OTP to ${emailTrimmed}...`
    });

    try {
      await sendOtpVerificationEmail({
        toEmail: emailTrimmed,
        toName: 'Account Owner',
        role: selectedRole === 'tester' ? 'tester' : 'developer',
        senderProfile: selectedRole === 'tester' ? SENDER_PROFILES.QA_DESK : SENDER_PROFILES.DEVELOPER_DESK
      });

      setResetOtpSent(true);
      setResetOtpTimer(60);
      setResetOtpCode('');
      setNoticeMessage({
        type: 'success',
        text: `✓ Password reset OTP has been sent to ${emailTrimmed}. Please check your inbox.`
      });
    } catch (err) {
      console.error('Error sending reset OTP:', err);
      setNoticeMessage({
        type: 'error',
        text: `Failed to send reset OTP: ${err.message || 'Please check your connection.'}`
      });
    } finally {
      setIsSendingResetOtp(false);
    }
  };

  // Handle Forgot Password Verify OTP & Update Password
  const handleResetPasswordSubmit = (e) => {
    e.preventDefault();
    const trimmedOtp = (resetOtpCode || '').trim();
    if (!trimmedOtp || trimmedOtp.length !== 6) {
      setNoticeMessage({
        type: 'warning',
        text: 'Please enter the complete 6-digit OTP code sent to your email.'
      });
      return;
    }

    const verifyResult = verifyOtpCode(resetEmail.trim(), trimmedOtp);
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
        text: 'New Password and Confirm Password do not match.'
      });
      return;
    }

    // Save the new password to dahej_member_passwords
    saveMemberPassword(null, resetEmail.trim(), newPassword);

    // Also update any matching dev or tester in localStorage
    try {
      const eLower = resetEmail.trim().toLowerCase();
      const rawDevs = localStorage.getItem('dahej_real_v2_developers');
      if (rawDevs) {
        const devs = JSON.parse(rawDevs);
        const idx = devs.findIndex(d => d.email && d.email.toLowerCase() === eLower);
        if (idx !== -1) {
          devs[idx].password = newPassword;
          localStorage.setItem('dahej_real_v2_developers', JSON.stringify(devs));
          saveMemberPassword(devs[idx].id, devs[idx].email, newPassword);
        }
      }
      const rawTesters = localStorage.getItem('dahej_real_v2_testers');
      if (rawTesters) {
        const testers = JSON.parse(rawTesters);
        const idx = testers.findIndex(t => t.email && t.email.toLowerCase() === eLower);
        if (idx !== -1) {
          testers[idx].password = newPassword;
          localStorage.setItem('dahej_real_v2_testers', JSON.stringify(testers));
          saveMemberPassword(testers[idx].id || testers[idx].testerId, testers[idx].email, newPassword);
        }
      }
    } catch (e) {}

    setResetSuccess(true);
    setNoticeMessage({
      type: 'success',
      text: 'Your password has been reset successfully! You can now login with your new password.'
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
                    allStoredDevs.filter(d => d.status === 'Active' || d.status === 'Approved').length > 0 ? (
                      allStoredDevs.filter(d => d.status === 'Active' || d.status === 'Approved').slice(0, 4).map(d => (
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
                      <span style={{ fontSize: '0.74rem', color: '#64748B', fontStyle: 'italic' }}>
                        No approved developers yet. (Approve registered developers in Developer Directory)
                      </span>
                    )
                  ) : (
                    allStoredTesters.filter(t => t.status === 'Active' || t.status === 'Approved').length > 0 ? (
                      allStoredTesters.filter(t => t.status === 'Active' || t.status === 'Approved').slice(0, 4).map(t => (
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
                    ) : (
                      <span style={{ fontSize: '0.74rem', color: '#64748B', fontStyle: 'italic' }}>
                        No approved testers yet. (Approve registered testers in QA Tester Directory)
                      </span>
                    )
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
                    placeholder={isFreelancer ? "e.g. developer@dahejsupport.com" : "e.g. tester@dahejsupport.com"}
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
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (loginOtpCode.trim().length === 6) {
                            handleVerifyAndLogin();
                          }
                        }
                      }}
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
                    Enter the 6-digit security OTP sent to {identifier}.
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
                  disabled={isSendingLoginOtp}
                  className={`btn btn-submit-login ${selectedRole === 'tester' ? 'btn-tester-theme' : ''}`}
                >
                  <KeyRound size={16} />
                  <span>{isSendingLoginOtp ? 'Dispatching OTP Code...' : 'Continue with OTP Verification'}</span>
                </button>
              ) : (
                <button type="submit" className="btn btn-submit-login btn-otp-verify">
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
                      Enter the 6-digit verification OTP sent to {resetEmail}.
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
                <button type="submit" disabled={isSendingResetOtp} className="btn btn-submit-reset">
                  <Mail size={16} />
                  <span>{isSendingResetOtp ? 'Dispatching Reset OTP...' : 'Send Reset OTP'}</span>
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
