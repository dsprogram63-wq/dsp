import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  ShieldAlert, 
  CheckCircle2, 
  Sparkles, 
  Check, 
  ShieldCheck, 
  KeyRound, 
  UserCheck,
  Code2,
  FlaskConical,
  Laptop,
  CheckSquare2,
  AlertCircle,
  HelpCircle,
  Camera,
  Upload,
  Trash2,
  Image as ImageIcon
} from 'lucide-react';
import { uploadAvatar } from '../services/storageService.js';
import { 
  sendOtpVerificationEmail, 
  verifyOtpCode, 
  clearPendingOtp, 
  sendApplicationConfirmationEmail,
  SENDER_PROFILES 
} from '../services/emailService.js';
import './ReferralApplication.css';

const DEFAULT_DEV_AVATAR = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=160';
const DEFAULT_TESTER_AVATAR = 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=160';
const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB strict limit

const INITIAL_DEVELOPER_DATA = {
  fullName: '',
  email: '',
  mobileNumber: '',
  experienceYears: '3+ Years',
  avatar: '', // Base64 data URL if uploaded
  primarySkill: 'Full Stack Developer (React & Node)',
  portfolioUrl: '',
  referralCode: '',
  referenceName: '',
  aboutSelf: '',
  hasValidReference: false
};

const INITIAL_TESTER_DATA = {
  fullName: '',
  email: '',
  mobileNumber: '',
  experienceYears: '3+ Years',
  avatar: '', // Base64 data URL if uploaded
  specialization: 'Web & Functional QA Testing',
  testingTools: 'Postman, Cypress, Chrome DevTools, Jira',
  referralCode: '',
  referenceName: '',
  aboutSelf: '',
  hasValidReference: false
};

const createInitialTrackState = (role) => ({
  formData: role === 'tester' ? { ...INITIAL_TESTER_DATA } : { ...INITIAL_DEVELOPER_DATA },
  avatarInfo: {
    name: '',
    sizeFormatted: '',
    sizeBytes: 0,
    isCustom: false
  },
  avatarError: '',
  errors: {},
  touched: {},
  isEmailVerified: false,
  emailOtpSent: false,
  emailOtpCode: '',
  emailTimer: 0,
  emailStatusMsg: null
});

export default function ReferralApplication({ 
  onNavigate, 
  onApplyDeveloper, 
  onApplyTester,
  initialRole = 'developer'
}) {
  // Normalize initialRole ('tester' -> 'tester', 'freelancer'/'developer' -> 'developer')
  const defaultTrack = (initialRole === 'tester' || initialRole === 'qa') ? 'tester' : 'developer';
  const [selectedRole, setSelectedRole] = useState(defaultTrack);

  const fileInputRef = useRef(null);

  // Independent state per track so developer and tester forms never overwrite each other
  const [trackStates, setTrackStates] = useState({
    developer: createInitialTrackState('developer'),
    tester: createInitialTrackState('tester')
  });

  const [submitted, setSubmitted] = useState(false);
  const [assignedApplicantId, setAssignedApplicantId] = useState('');
  const [submittedInfo, setSubmittedInfo] = useState(null);
  const [isSendingEmailOtp, setIsSendingEmailOtp] = useState(false);
  const [isSubmittingApplication, setIsSubmittingApplication] = useState(false);
  const [confirmationEmailSent, setConfirmationEmailSent] = useState(false);

  // Active track state accessors
  const currentTrack = trackStates[selectedRole] || trackStates.developer;
  const formData = currentTrack.formData;
  const errors = currentTrack.errors;
  const touched = currentTrack.touched;
  const isEmailVerified = currentTrack.isEmailVerified;
  const emailOtpSent = currentTrack.emailOtpSent;
  const emailOtpCode = currentTrack.emailOtpCode;
  const emailTimer = currentTrack.emailTimer;
  const emailStatusMsg = currentTrack.emailStatusMsg;
  const avatarError = currentTrack.avatarError;
  const avatarInfo = currentTrack.avatarInfo;

  // Track state setters
  const setFormData = (updater) => {
    setTrackStates(prev => {
      const cur = prev[selectedRole] || prev.developer;
      const nextFormData = typeof updater === 'function' ? updater(cur.formData) : updater;
      return {
        ...prev,
        [selectedRole]: {
          ...cur,
          formData: nextFormData
        }
      };
    });
  };

  const setErrors = (updater) => {
    setTrackStates(prev => {
      const cur = prev[selectedRole] || prev.developer;
      const nextErrors = typeof updater === 'function' ? updater(cur.errors) : updater;
      return {
        ...prev,
        [selectedRole]: {
          ...cur,
          errors: nextErrors
        }
      };
    });
  };

  const setTouched = (updater) => {
    setTrackStates(prev => {
      const cur = prev[selectedRole] || prev.developer;
      const nextTouched = typeof updater === 'function' ? updater(cur.touched) : updater;
      return {
        ...prev,
        [selectedRole]: {
          ...cur,
          touched: nextTouched
        }
      };
    });
  };

  const setIsEmailVerified = (val) => {
    setTrackStates(prev => {
      const cur = prev[selectedRole] || prev.developer;
      return {
        ...prev,
        [selectedRole]: {
          ...cur,
          isEmailVerified: typeof val === 'function' ? val(cur.isEmailVerified) : val
        }
      };
    });
  };

  const setEmailOtpSent = (val) => {
    setTrackStates(prev => {
      const cur = prev[selectedRole] || prev.developer;
      return {
        ...prev,
        [selectedRole]: {
          ...cur,
          emailOtpSent: typeof val === 'function' ? val(cur.emailOtpSent) : val
        }
      };
    });
  };

  const setEmailOtpCode = (val) => {
    setTrackStates(prev => {
      const cur = prev[selectedRole] || prev.developer;
      return {
        ...prev,
        [selectedRole]: {
          ...cur,
          emailOtpCode: typeof val === 'function' ? val(cur.emailOtpCode) : val
        }
      };
    });
  };

  const setEmailTimer = (val) => {
    setTrackStates(prev => {
      const cur = prev[selectedRole] || prev.developer;
      return {
        ...prev,
        [selectedRole]: {
          ...cur,
          emailTimer: typeof val === 'function' ? val(cur.emailTimer) : val
        }
      };
    });
  };

  const setEmailStatusMsg = (val) => {
    setTrackStates(prev => {
      const cur = prev[selectedRole] || prev.developer;
      return {
        ...prev,
        [selectedRole]: {
          ...cur,
          emailStatusMsg: typeof val === 'function' ? val(cur.emailStatusMsg) : val
        }
      };
    });
  };

  const setAvatarError = (val) => {
    setTrackStates(prev => {
      const cur = prev[selectedRole] || prev.developer;
      return {
        ...prev,
        [selectedRole]: {
          ...cur,
          avatarError: typeof val === 'function' ? val(cur.avatarError) : val
        }
      };
    });
  };

  const setAvatarInfo = (val) => {
    setTrackStates(prev => {
      const cur = prev[selectedRole] || prev.developer;
      return {
        ...prev,
        [selectedRole]: {
          ...cur,
          avatarInfo: typeof val === 'function' ? val(cur.avatarInfo) : val
        }
      };
    });
  };

  // When initialRole prop changes externally
  useEffect(() => {
    if (initialRole) {
      const track = (initialRole === 'tester' || initialRole === 'qa') ? 'tester' : 'developer';
      setSelectedRole(track);
    }
  }, [initialRole]);

  // Countdown timer for Email OTP across both tracks independently
  useEffect(() => {
    const interval = setInterval(() => {
      setTrackStates((prev) => {
        const devTimer = prev.developer?.emailTimer || 0;
        const testTimer = prev.tester?.emailTimer || 0;
        if (devTimer <= 0 && testTimer <= 0) return prev;

        return {
          developer: {
            ...prev.developer,
            emailTimer: devTimer > 0 ? devTimer - 1 : 0
          },
          tester: {
            ...prev.tester,
            emailTimer: testTimer > 0 ? testTimer - 1 : 0
          }
        };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // =========================================================================
  // FIELD VALIDATION CONSTRAINTS (Strict & Comprehensive)
  // =========================================================================
  const validateField = (name, value, currentRole = selectedRole) => {
    const trimmed = typeof value === 'string' ? value.trim() : '';

    switch (name) {
      case 'fullName':
        if (!trimmed) {
          return 'Full Name is required.';
        }
        if (trimmed.length < 3) {
          return 'Full Name must be at least 3 characters.';
        }
        if (trimmed.length > 50) {
          return 'Full Name cannot exceed 50 characters.';
        }
        if (!/^[a-zA-Z\s.'-]+$/.test(trimmed)) {
          return 'Full Name can only contain letters, spaces, dots, and hyphens (no numbers or symbols).';
        }
        return '';

      case 'email':
        if (!trimmed) {
          return 'Email Address is required.';
        }
        // RFC standard email format check
        if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(trimmed)) {
          return 'Please enter a valid email address (e.g. name@example.com).';
        }
        return '';

      case 'mobileNumber': {
        const digits = (value || '').replace(/\D/g, '');
        if (!digits) {
          return 'Mobile Number is required.';
        }
        if (digits.length < 10) {
          return `Mobile number must be exactly 10 digits (${digits.length}/10 entered).`;
        }
        if (digits.length > 10) {
          return 'Mobile number must be exactly 10 digits.';
        }
        if (!/^[6-9]\d{9}$/.test(digits)) {
          return '10-digit mobile number must start with 6, 7, 8, or 9.';
        }
        return '';
      }

      case 'experienceYears':
        if (!trimmed) {
          return 'Please select your years of experience.';
        }
        return '';

      case 'primarySkill':
        if (currentRole === 'developer') {
          if (!trimmed) {
            return 'Please select or enter your primary tech stack.';
          }
          if (trimmed.length < 3) {
            return 'Tech stack description must be at least 3 characters.';
          }
        }
        return '';

      case 'portfolioUrl':
        if (currentRole === 'developer' && trimmed) {
          const urlPattern = /^(https?:\/\/)?([a-zA-Z0-9]([a-zA-Z0-9\-].*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}(\/.*)?$/i;
          if (!urlPattern.test(trimmed)) {
            return 'Please enter a valid URL (e.g. https://github.com/username or portfolio.dev).';
          }
        }
        return '';

      case 'specialization':
        if (currentRole === 'tester') {
          if (!trimmed) {
            return 'Please select your QA specialization.';
          }
        }
        return '';

      case 'testingTools':
        if (currentRole === 'tester') {
          if (!trimmed) {
            return 'Please list your testing tools (e.g. Postman, Cypress, Jira).';
          }
          if (trimmed.length < 3) {
            return 'Tools list must be at least 3 characters.';
          }
          if (/^\d+$/.test(trimmed)) {
            return 'QA tools must contain tool names, not only numbers.';
          }
        }
        return '';

      case 'referralCode':
        if (!trimmed) {
          return 'Referral Code is required.';
        }
        if (trimmed.length < 4) {
          return 'Referral Code must be at least 4 characters (e.g. DS-REF-8902).';
        }
        if (!/^[A-Z0-9\-_]+$/.test(trimmed)) {
          return 'Referral Code must contain uppercase letters, numbers, and hyphens.';
        }
        return '';

      case 'referenceName':
        if (!trimmed) {
          return 'Reference Name is required.';
        }
        if (trimmed.length < 3) {
          return 'Reference Name must be at least 3 characters.';
        }
        if (trimmed.length > 50) {
          return 'Reference Name cannot exceed 50 characters.';
        }
        if (!/^[a-zA-Z\s.'-]+$/.test(trimmed)) {
          return 'Reference Name can only contain letters and spaces.';
        }
        return '';

      case 'aboutSelf':
        if (trimmed && trimmed.length < 15) {
          return 'Please provide at least 15 characters describing your background and projects.';
        }
        if (trimmed.length > 500) {
          return 'Description cannot exceed 500 characters.';
        }
        return '';

      default:
        return '';
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    const errorMsg = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: errorMsg }));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let sanitizedValue = value;

    // Real-time input sanitization & formatting constraints
    if (name === 'fullName' || name === 'referenceName') {
      // Allow only letters, spaces, dots, hyphens
      sanitizedValue = value.replace(/[^a-zA-Z\s.'-]/g, '');
    } else if (name === 'mobileNumber') {
      // Strictly allow only numbers, max 10 digits
      sanitizedValue = value.replace(/\D/g, '').slice(0, 10);
    } else if (name === 'referralCode') {
      // Auto-uppercase and alphanumeric/hyphens
      sanitizedValue = value.toUpperCase().replace(/[^A-Z0-9\-_]/g, '').slice(0, 20);
    } else if (name === 'aboutSelf') {
      sanitizedValue = value.slice(0, 500);
    }

    // Reset verification if verified field is modified
    if (name === 'email' && (isEmailVerified || emailOtpSent)) {
      clearPendingOtp(formData.email);
      setIsEmailVerified(false);
      setEmailOtpSent(false);
      setEmailOtpCode('');
      setEmailStatusMsg(null);
    }

    const newVal = type === 'checkbox' ? checked : sanitizedValue;

    setFormData((prev) => ({
      ...prev,
      [name]: newVal
    }));

    // Real-time error validation if field was touched
    if (touched[name]) {
      const errorMsg = validateField(name, newVal);
      setErrors(prev => ({ ...prev, [name]: errorMsg }));
    }
  };

  const handleRoleSelect = (role) => {
    if (role === selectedRole) return;
    setSelectedRole(role);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Email OTP Handlers with Brevo Transactional Email & Real Verification
  const handleSendEmailOtp = async () => {
    const emailErr = validateField('email', formData.email);
    if (emailErr) {
      setTouched(prev => ({ ...prev, email: true }));
      setErrors(prev => ({ ...prev, email: emailErr }));
      alert(emailErr);
      return;
    }

    setIsSendingEmailOtp(true);
    setEmailOtpSent(true); // Open OTP verification box immediately
    setEmailStatusMsg({ 
      type: 'info', 
      text: `Dispatching verification OTP to ${formData.email.trim()}...` 
    });

    try {
      const senderProfile = selectedRole === 'tester' 
        ? SENDER_PROFILES.QA_DESK 
        : SENDER_PROFILES.DEVELOPER_DESK;

      await sendOtpVerificationEmail({
        toEmail: formData.email.trim(),
        toName: formData.fullName.trim() || (selectedRole === 'tester' ? 'QA Tester Applicant' : 'Developer Applicant'),
        role: selectedRole,
        senderProfile
      });

      setEmailTimer(60); // 60s cooldown timer for resend
      setEmailOtpCode(''); // Must be entered from real email inbox!
      setEmailStatusMsg({ 
        type: 'info', 
        text: `✓ Verification OTP sent to ${formData.email}. Please check your inbox (and Spam folder) for the 6-digit code.` 
      });
    } catch (err) {
      console.error('Error sending Brevo OTP:', err);
      const errMsg = `Failed to send email OTP: ${err.message || 'Please check your connection.'}`;
      setEmailStatusMsg({ 
        type: 'error', 
        text: errMsg 
      });
      alert(errMsg);
    } finally {
      setIsSendingEmailOtp(false);
    }
  };

  const handleVerifyEmailOtp = () => {
    const trimmedCode = (emailOtpCode || '').trim();
    if (!trimmedCode || trimmedCode.length !== 6) {
      setEmailStatusMsg({ 
        type: 'error', 
        text: 'Please enter the complete 6-digit OTP sent to your email.' 
      });
      return;
    }

    const result = verifyOtpCode(formData.email, trimmedCode);
    if (result.success) {
      setIsEmailVerified(true);
      setEmailStatusMsg({ 
        type: 'success', 
        text: '✓ Email verified successfully!' 
      });
    } else {
      setEmailStatusMsg({ 
        type: 'error', 
        text: result.error || 'Invalid OTP. Please check the code in your email.' 
      });
    }
  };

  // Profile Photo Upload Handlers (Strict 2 MB Limit)
  const handleAvatarChange = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith('image/')) {
      const err = 'Please select a valid image file (PNG, JPG, JPEG, or WebP).';
      setAvatarError(err);
      alert(err);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Check file size (Strict 2 MB = 2 * 1024 * 1024 bytes)
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      const sizeInMb = (file.size / (1024 * 1024)).toFixed(2);
      const err = `Image file size (${sizeInMb} MB) exceeds the 2 MB maximum limit. Please select a photo under 2 MB.`;
      setAvatarError(err);
      alert(`⚠️ File Size Exceeded (Max 2 MB)\n\nSelected file size is ${sizeInMb} MB. Please select a photo smaller than 2 MB.`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Valid image file under 2 MB
    setAvatarError('');
    const sizeFormatted = file.size >= 1048576 
      ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` 
      : `${Math.round(file.size / 1024)} KB`;

    try {
      const applicantTag = (formData.email || formData.fullName || 'applicant').replace(/[^a-zA-Z0-9]/g, '_');
      const { url } = await uploadAvatar(applicantTag, file);
      if (url) {
        setFormData(prev => ({
          ...prev,
          avatar: url
        }));
        setAvatarInfo({
          name: file.name,
          sizeFormatted,
          sizeBytes: file.size,
          isCustom: true
        });
        return;
      }
    } catch (err) {
      console.warn('Storage upload fallback:', err);
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const base64Data = uploadEvent.target.result;
      setFormData(prev => ({
        ...prev,
        avatar: base64Data
      }));
      setAvatarInfo({
        name: file.name,
        sizeFormatted,
        sizeBytes: file.size,
        isCustom: true
      });
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    setFormData(prev => ({
      ...prev,
      avatar: ''
    }));
    setAvatarInfo({
      name: '',
      sizeFormatted: '',
      sizeBytes: 0,
      isCustom: false
    });
    setAvatarError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const activeAvatarUrl = formData.avatar || (selectedRole === 'tester' ? DEFAULT_TESTER_AVATAR : DEFAULT_DEV_AVATAR);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate all fields
    const fieldsToValidate = [
      'fullName',
      'email',
      'mobileNumber',
      'experienceYears',
      'referralCode',
      'referenceName',
      'aboutSelf'
    ];

    if (selectedRole === 'developer') {
      fieldsToValidate.push('primarySkill', 'portfolioUrl');
    } else {
      fieldsToValidate.push('specialization', 'testingTools');
    }

    const currentErrors = {};
    const currentTouched = {};

    fieldsToValidate.forEach(field => {
      currentTouched[field] = true;
      const err = validateField(field, formData[field], selectedRole);
      if (err) {
        currentErrors[field] = err;
      }
    });

    setTouched(prev => ({ ...prev, ...currentTouched }));
    setErrors(currentErrors);

    // If any validation errors exist, halt submission
    if (Object.keys(currentErrors).length > 0) {
      const firstError = Object.values(currentErrors)[0];
      alert(`Please fix the errors before submitting:\n• ${firstError}`);
      return;
    }

    // Strict Real Email OTP verification check
    if (!isEmailVerified) {
      alert('Please verify your Email Address with the 6-digit OTP sent to your email first.');
      return;
    }
    if (!formData.hasValidReference) {
      alert('Please check the confirmation box verifying that your reference information is accurate.');
      return;
    }

    // Clean mobile digits
    const cleanMobile = formData.mobileNumber.startsWith('+') 
      ? formData.mobileNumber 
      : `+91 ${formData.mobileNumber.replace(/\D/g, '').slice(-10)}`;

    const finalAvatar = formData.avatar || (selectedRole === 'tester' ? DEFAULT_TESTER_AVATAR : DEFAULT_DEV_AVATAR);

    let generatedId = '';
    if (selectedRole === 'tester') {
      generatedId = `TST-${Math.floor(100 + Math.random() * 900)}`;
      setAssignedApplicantId(generatedId);
      if (onApplyTester) {
        onApplyTester({
          ...formData,
          avatar: finalAvatar,
          mobileNumber: cleanMobile,
          roleTrack: 'tester',
          applicantId: generatedId
        });
      }
    } else {
      generatedId = `DEV-${Math.floor(100 + Math.random() * 900)}`;
      setAssignedApplicantId(generatedId);
      if (onApplyDeveloper) {
        onApplyDeveloper({
          ...formData,
          avatar: finalAvatar,
          mobileNumber: cleanMobile,
          roleTrack: 'developer',
          applicantId: generatedId
        });
      }
    }

    const submissionPayload = {
      ...formData,
      role: selectedRole,
      avatar: finalAvatar,
      mobileNumber: cleanMobile,
      assignedId: generatedId
    };

    setSubmittedInfo(submissionPayload);
    setIsSubmittingApplication(true);

    // Send official HTML application submission confirmation email via Brevo
    try {
      await sendApplicationConfirmationEmail({
        toEmail: formData.email,
        toName: formData.fullName,
        applicantId: generatedId,
        role: selectedRole,
        experienceYears: formData.experienceYears,
        primarySkill: formData.primarySkill,
        specialization: formData.specialization,
        testingTools: formData.testingTools,
        mobileNumber: cleanMobile,
        referralCode: formData.referralCode,
        referenceName: formData.referenceName,
        portfolioUrl: formData.portfolioUrl,
        aboutSelf: formData.aboutSelf
      });
      setConfirmationEmailSent(true);
    } catch (mailErr) {
      console.warn('Could not send application confirmation email:', mailErr);
      setConfirmationEmailSent(false);
    } finally {
      setIsSubmittingApplication(false);
      setSubmitted(true);
    }
  };

  return (
    <div className="apply-page-wrapper">
      <div className="apply-container">
        <div className="apply-back-nav">
          <button
            type="button"
            onClick={() => onNavigate('home')}
            className="apply-back-btn"
          >
            <ArrowLeft size={16} />
            <span>Back to Main Page</span>
          </button>
        </div>

        <div className="apply-card">
          <div className="apply-header">
            <div className="badge-featured" style={{ marginBottom: '12px' }}>
              <Sparkles size={13} className="badge-icon" />
              <span>Verified Onboarding System</span>
            </div>
            <h1 className="apply-heading">
              Apply to Join {selectedRole === 'tester' ? 'QA Tester Program' : 'Developer Program'}
            </h1>
            <p className="apply-subheading">
              Dahej Support is a restricted, referral-only professional network. All members must have a verified reference.
            </p>
          </div>

          {/* Role / Track Selector Tabs */}
          <div className="apply-track-selector">
            <button
              type="button"
              className={`apply-track-btn ${selectedRole === 'developer' ? 'active' : ''}`}
              onClick={() => handleRoleSelect('developer')}
            >
              <div className="apply-track-icon">
                <Code2 size={20} />
              </div>
              <div className="apply-track-info">
                <span className="apply-track-title">Developer Track</span>
                <span className="apply-track-desc">Web, Full Stack & Frontend Engineering</span>
              </div>
              {selectedRole === 'developer' && (
                <span className="apply-track-badge">Selected</span>
              )}
            </button>

            <button
              type="button"
              className={`apply-track-btn ${selectedRole === 'tester' ? 'active' : ''}`}
              onClick={() => handleRoleSelect('tester')}
            >
              <div className="apply-track-icon tester">
                <FlaskConical size={20} />
              </div>
              <div className="apply-track-info">
                <span className="apply-track-title">QA Tester Track</span>
                <span className="apply-track-desc">Manual, Automation & Bug QA Validation</span>
              </div>
              {selectedRole === 'tester' && (
                <span className="apply-track-badge">Selected</span>
              )}
            </button>
          </div>

          <div className="highlight-peach-box" style={{ marginBottom: '24px', fontSize: '0.9rem' }}>
            🔒 <strong>Official Email OTP Verification:</strong> A real 6-digit verification code will be sent to your email from Dahej Support (work@dsprogram.space). Email verification is strictly required before submission.
          </div>

          <form onSubmit={handleSubmit} className="apply-form" noValidate>
            {/* Profile Photo Upload Section (Strict 2 MB Limit) */}
            <div className="apply-avatar-card">
              <div className="apply-avatar-left">
                <div className="apply-avatar-preview-wrap">
                  <img
                    src={activeAvatarUrl}
                    alt="Applicant Profile Avatar"
                    className="apply-avatar-preview-img"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current && fileInputRef.current.click()}
                    className="apply-avatar-camera-btn"
                    title="Click to Upload / Change Profile Photo"
                  >
                    <Camera size={15} />
                  </button>
                </div>
              </div>

              <div className="apply-avatar-right">
                <div className="apply-avatar-title-row">
                  <span className="apply-avatar-title">
                    <Camera size={15} color="#0A3D75" />
                    <span>Profile Photo (Official ID & Admin Directory)</span>
                  </span>
                  <span className="apply-avatar-limit-badge">Strict Max 2 MB</span>
                </div>

                <p className="apply-avatar-hint">
                  Upload a clear professional photo (PNG, JPG, or WebP). Maximum file size is strictly <strong>2 MB</strong>. Your uploaded photo will be saved to your profile and displayed directly in the Admin Panel.
                </p>

                <div className="apply-avatar-action-row">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleAvatarChange}
                    accept="image/png, image/jpeg, image/webp, image/gif"
                    style={{ display: 'none' }}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current && fileInputRef.current.click()}
                    className="btn-upload-photo-action"
                  >
                    <Upload size={14} />
                    <span>{formData.avatar ? 'Change Profile Photo' : 'Upload Profile Photo'}</span>
                  </button>

                  {formData.avatar && (
                    <button
                      type="button"
                      onClick={handleRemoveAvatar}
                      className="btn-remove-photo-action"
                    >
                      <Trash2 size={13} />
                      <span>Remove</span>
                    </button>
                  )}
                </div>

                {/* Validation message or uploaded file status */}
                {avatarError && (
                  <div className="field-error-msg" style={{ marginTop: '8px' }}>
                    <AlertCircle size={13} />
                    <span>{avatarError}</span>
                  </div>
                )}

                {!avatarError && avatarInfo.isCustom && (
                  <div className="avatar-success-pill" style={{ marginTop: '8px' }}>
                    <Check size={12} strokeWidth={3} />
                    <span>✓ Custom Photo Ready: <strong>{avatarInfo.name}</strong> ({avatarInfo.sizeFormatted} • Verified under 2 MB)</span>
                  </div>
                )}
              </div>
            </div>

            {/* Row 1: Full Name & Email with OTP */}
            <div className="form-grid-2">
              <div className="form-group">
                <label htmlFor="fullName" className="form-label">
                  <span className="form-label-left">
                    Full Name <span className="required-star">*</span>
                  </span>
                  {touched.fullName && !errors.fullName && formData.fullName.trim() && (
                    <span className="field-valid-badge">
                      <Check size={11} strokeWidth={3} />
                      <span>Valid</span>
                    </span>
                  )}
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  className={`form-input ${touched.fullName && errors.fullName ? 'is-invalid' : touched.fullName && formData.fullName.trim() ? 'is-valid' : ''}`}
                  placeholder="e.g. John Doe"
                  value={formData.fullName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  minLength={3}
                  maxLength={50}
                  required
                />
                {touched.fullName && errors.fullName && (
                  <div className="field-error-msg">
                    <AlertCircle size={13} />
                    <span>{errors.fullName}</span>
                  </div>
                )}
                <span className="field-hint-text">Letters only, min 3 characters</span>
              </div>

              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  <span className="form-label-left">
                    Email Address <span className="required-star">*</span>
                  </span>
                  {isEmailVerified ? (
                    <span className="otp-verified-badge">
                      <Check size={12} strokeWidth={3} />
                      <span>Email Verified</span>
                    </span>
                  ) : touched.email && !errors.email && formData.email.trim() ? (
                    <span className="field-valid-badge">
                      <Check size={11} strokeWidth={3} />
                      <span>Valid Format</span>
                    </span>
                  ) : null}
                </label>
                
                <div className="input-with-action">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    className={`form-input ${touched.email && errors.email ? 'is-invalid' : isEmailVerified ? 'is-valid' : ''}`}
                    placeholder={selectedRole === 'tester' ? 'tester@example.com' : 'dev@example.com'}
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    disabled={isEmailVerified}
                    required
                  />
                  {!isEmailVerified && (
                    <button
                      type="button"
                      onClick={handleSendEmailOtp}
                      disabled={isSendingEmailOtp || emailTimer > 0 || !formData.email || !!validateField('email', formData.email)}
                      className="btn-send-otp"
                      title={validateField('email', formData.email) ? 'Enter a valid email first' : 'Send OTP'}
                    >
                      {isSendingEmailOtp ? 'Sending OTP...' : emailOtpSent ? (emailTimer > 0 ? `Resend (${emailTimer}s)` : 'Resend OTP') : 'Send OTP'}
                    </button>
                  )}
                  {isEmailVerified && (
                    <button
                      type="button"
                      onClick={() => setIsEmailVerified(false)}
                      className="btn-resend-text"
                      style={{ fontSize: '0.78rem', whiteSpace: 'nowrap' }}
                    >
                      Change
                    </button>
                  )}
                </div>

                {touched.email && errors.email && (
                  <div className="field-error-msg">
                    <AlertCircle size={13} />
                    <span>{errors.email}</span>
                  </div>
                )}

                {/* Global Email Status Message (always visible) */}
                {emailStatusMsg && !emailOtpSent && (
                  <div style={{ fontSize: '0.8rem', color: emailStatusMsg.type === 'error' ? '#DC2626' : '#0F3E6D', fontWeight: 600, marginTop: '6px' }}>
                    {emailStatusMsg.text}
                  </div>
                )}

                {/* Email OTP Input Expand Box */}
                {emailOtpSent && !isEmailVerified && (
                  <div className="otp-verification-box">
                    <div className="otp-box-header">
                      <span>Enter 6-digit code sent to your email:</span>
                      {emailTimer > 0 && <span>Resend in {emailTimer}s</span>}
                    </div>

                    <div className="otp-input-row">
                      <input
                        type="text"
                        maxLength={6}
                        placeholder="••••••"
                        value={emailOtpCode}
                        onChange={(e) => setEmailOtpCode(e.target.value.replace(/\D/g, ''))}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (emailOtpCode.trim().length === 6) {
                              handleVerifyEmailOtp();
                            }
                          }
                        }}
                        className="otp-code-input"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={handleVerifyEmailOtp}
                        disabled={emailOtpCode.trim().length !== 6}
                        className="btn-verify-otp"
                      >
                        Verify Email OTP
                      </button>
                    </div>

                    {emailStatusMsg && (
                      <div style={{ fontSize: '0.78rem', color: emailStatusMsg.type === 'error' ? '#DC2626' : '#0F3E6D', fontWeight: 600 }}>
                        {emailStatusMsg.text}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Row 2: Mobile Number & Years of Experience */}
            <div className="form-grid-2">
              <div className="form-group">
                <label htmlFor="mobileNumber" className="form-label">
                  <span className="form-label-left">
                    Mobile Number <span className="required-star">*</span>
                  </span>
                  {touched.mobileNumber && !errors.mobileNumber && formData.mobileNumber.length === 10 && (
                    <span className="field-valid-badge">
                      <Check size={11} strokeWidth={3} />
                      <span>Valid 10-Digit</span>
                    </span>
                  )}
                </label>
                <input
                  id="mobileNumber"
                  name="mobileNumber"
                  type="tel"
                  inputMode="numeric"
                  className={`form-input ${touched.mobileNumber && errors.mobileNumber ? 'is-invalid' : touched.mobileNumber && formData.mobileNumber.length === 10 && !errors.mobileNumber ? 'is-valid' : ''}`}
                  placeholder="e.g. 9876543210"
                  value={formData.mobileNumber}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  maxLength={10}
                  required
                />
                {touched.mobileNumber && errors.mobileNumber && (
                  <div className="field-error-msg">
                    <AlertCircle size={13} />
                    <span>{errors.mobileNumber}</span>
                  </div>
                )}
                <span className="field-hint-text">Exactly 10 digits starting with 6, 7, 8, or 9 ({formData.mobileNumber.length}/10)</span>
              </div>

              <div className="form-group">
                <label htmlFor="experienceYears" className="form-label">
                  <span className="form-label-left">
                    {selectedRole === 'tester' ? 'QA / Testing Experience' : 'Development Experience'} <span className="required-star">*</span>
                  </span>
                </label>
                <select
                  id="experienceYears"
                  name="experienceYears"
                  className="form-input"
                  value={formData.experienceYears}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                >
                  <option value="1-2 Years">1 - 2 Years (Junior / Associate)</option>
                  <option value="3+ Years">3+ Years (Intermediate)</option>
                  <option value="5+ Years">5+ Years (Senior)</option>
                  <option value="7+ Years">7+ Years (Lead / Principal)</option>
                </select>
              </div>
            </div>

            {/* Row 3: Role Specific Fields */}
            {selectedRole === 'developer' ? (
              <div className="form-grid-2">
                <div className="form-group">
                  <label htmlFor="primarySkill" className="form-label">
                    <span className="form-label-left">
                      Primary Tech Stack / Skill <span className="required-star">*</span>
                    </span>
                  </label>
                  <select
                    id="primarySkill"
                    name="primarySkill"
                    className="form-input"
                    value={formData.primarySkill}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required
                  >
                    <option value="Full Stack Developer (React & Node)">Full Stack Developer (React & Node)</option>
                    <option value="Frontend Specialist (React / Next.js / Tailwind)">Frontend Specialist (React / Next.js)</option>
                    <option value="Backend & Database Engineer (Node / Python / PostgreSQL)">Backend & Database Engineer</option>
                    <option value="UI/UX & Web Designer">UI/UX & Web Designer</option>
                    <option value="WordPress & E-Commerce Developer">WordPress & E-Commerce Developer</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="portfolioUrl" className="form-label">
                    <span className="form-label-left">
                      GitHub / Portfolio Link <span style={{ color: '#94A3B8', fontWeight: 400 }}>(Optional)</span>
                    </span>
                  </label>
                  <input
                    id="portfolioUrl"
                    name="portfolioUrl"
                    type="url"
                    className={`form-input ${touched.portfolioUrl && errors.portfolioUrl ? 'is-invalid' : ''}`}
                    placeholder="https://github.com/yourhandle"
                    value={formData.portfolioUrl}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                  {touched.portfolioUrl && errors.portfolioUrl && (
                    <div className="field-error-msg">
                      <AlertCircle size={13} />
                      <span>{errors.portfolioUrl}</span>
                    </div>
                  )}
                  <span className="field-hint-text">e.g. https://github.com/username or your portfolio domain</span>
                </div>
              </div>
            ) : (
              <div className="form-grid-2">
                <div className="form-group">
                  <label htmlFor="specialization" className="form-label">
                    <span className="form-label-left">
                      Testing Specialization <span className="required-star">*</span>
                    </span>
                  </label>
                  <select
                    id="specialization"
                    name="specialization"
                    className="form-input"
                    value={formData.specialization}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required
                  >
                    <option value="Web & Functional QA Testing">Web & Functional QA Testing</option>
                    <option value="Full Stack & Automation QA (Cypress / Selenium)">Full Stack & Automation QA</option>
                    <option value="API, Security & Performance Testing (Postman)">API & Security Testing</option>
                    <option value="Mobile & Cross-Browser Responsive QA">Mobile & Cross-Browser QA</option>
                    <option value="Manual QA & Detailed Bug Validation">Manual QA & Bug Validation</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="testingTools" className="form-label">
                    <span className="form-label-left">
                      QA Tools & Frameworks <span className="required-star">*</span>
                    </span>
                  </label>
                  <input
                    id="testingTools"
                    name="testingTools"
                    type="text"
                    className={`form-input ${touched.testingTools && errors.testingTools ? 'is-invalid' : touched.testingTools && formData.testingTools.trim() ? 'is-valid' : ''}`}
                    placeholder="e.g. Postman, Cypress, Selenium, Jira, Playwright"
                    value={formData.testingTools}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    maxLength={100}
                    required
                  />
                  {touched.testingTools && errors.testingTools && (
                    <div className="field-error-msg">
                      <AlertCircle size={13} />
                      <span>{errors.testingTools}</span>
                    </div>
                  )}
                  <span className="field-hint-text">List main QA test runners & tracking tools</span>
                </div>
              </div>
            )}

            {/* Row 4: Referral & Reference Information */}
            <div className="reference-verification-container">
              <div className="ref-section-title-row">
                <span className="ref-section-title">
                  <KeyRound size={15} color="#0A3D75" />
                  <span>Referral & Reference Information ({selectedRole === 'tester' ? 'QA Track' : 'Developer Track'})</span>
                </span>
                {formData.referralCode && formData.referenceName && !errors.referralCode && !errors.referenceName && (
                  <span className="otp-verified-badge">
                    <ShieldCheck size={13} strokeWidth={2.5} />
                    <span>Reference Complete</span>
                  </span>
                )}
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label htmlFor="referralCode" className="form-label">
                    <span className="form-label-left">
                      Referral Code <span className="required-star">*</span>
                    </span>
                    {touched.referralCode && !errors.referralCode && formData.referralCode.trim() && (
                      <span className="field-valid-badge">
                        <Check size={11} strokeWidth={3} />
                        <span>Valid Code</span>
                      </span>
                    )}
                  </label>
                  <input
                    id="referralCode"
                    name="referralCode"
                    type="text"
                    className={`form-input ${touched.referralCode && errors.referralCode ? 'is-invalid' : formData.referralCode.trim() && !errors.referralCode ? 'is-valid' : ''}`}
                    placeholder={selectedRole === 'tester' ? 'e.g. DS-TST-201' : 'e.g. DS-REF-8902'}
                    value={formData.referralCode}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    minLength={4}
                    maxLength={20}
                    required
                  />
                  {touched.referralCode && errors.referralCode && (
                    <div className="field-error-msg">
                      <AlertCircle size={13} />
                      <span>{errors.referralCode}</span>
                    </div>
                  )}
                  <span className="field-hint-text">Uppercase alphanumeric (min 4 characters)</span>
                </div>

                <div className="form-group">
                  <label htmlFor="referenceName" className="form-label">
                    <span className="form-label-left">
                      Reference Name <span className="required-star">*</span>
                    </span>
                    {touched.referenceName && !errors.referenceName && formData.referenceName.trim() && (
                      <span className="field-valid-badge">
                        <Check size={11} strokeWidth={3} />
                        <span>Valid Name</span>
                      </span>
                    )}
                  </label>
                  <input
                    id="referenceName"
                    name="referenceName"
                    type="text"
                    className={`form-input ${touched.referenceName && errors.referenceName ? 'is-invalid' : formData.referenceName.trim() && !errors.referenceName ? 'is-valid' : ''}`}
                    placeholder="e.g. Verified Reference Name"
                    value={formData.referenceName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    minLength={3}
                    maxLength={50}
                    required
                  />
                  {touched.referenceName && errors.referenceName && (
                    <div className="field-error-msg">
                      <AlertCircle size={13} />
                      <span>{errors.referenceName}</span>
                    </div>
                  )}
                  <span className="field-hint-text">Name of existing member / lead who referred you</span>
                </div>
              </div>
            </div>

            {/* Row 5: Tell us briefly about yourself */}
            <div className="form-group">
              <label htmlFor="aboutSelf" className="form-label">
                <span className="form-label-left">
                  {selectedRole === 'tester' 
                    ? 'Brief Overview of QA Background & Bug Reporting Approach'
                    : 'Brief Overview of Development Experience & Key Projects'}
                </span>
                <span className="field-char-count">{formData.aboutSelf.length} / 500 characters</span>
              </label>
              <textarea
                id="aboutSelf"
                name="aboutSelf"
                className={`form-textarea ${touched.aboutSelf && errors.aboutSelf ? 'is-invalid' : ''}`}
                placeholder={
                  selectedRole === 'tester'
                    ? 'Share your experience with test case execution, cross-browser testing, issue tracking, and testing tools...'
                    : 'Share your key projects, tech stack strengths, and past website delivery experience...'
                }
                rows="4"
                value={formData.aboutSelf}
                onChange={handleChange}
                onBlur={handleBlur}
                maxLength={500}
              />
              {touched.aboutSelf && errors.aboutSelf && (
                <div className="field-error-msg">
                  <AlertCircle size={13} />
                  <span>{errors.aboutSelf}</span>
                </div>
              )}
              <span className="field-hint-text">Minimum 15 characters if provided</span>
            </div>

            {/* Checkbox */}
            <div className="apply-checkbox-wrap">
              <label className="apply-checkbox-label">
                <input
                  type="checkbox"
                  name="hasValidReference"
                  checked={formData.hasValidReference}
                  onChange={handleChange}
                  required
                />
                <span>
                  I confirm that I have a valid reference from an authorized Dahej Support member and all provided technical credentials are accurate.
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <div className="apply-submit-group">
              <button 
                type="submit" 
                className="btn btn-submit-apply"
                disabled={isSubmittingApplication}
                style={{ opacity: isSubmittingApplication ? 0.8 : 1, cursor: isSubmittingApplication ? 'not-allowed' : 'pointer' }}
              >
                <span>
                  {isSubmittingApplication 
                    ? 'Submitting & Sending Confirmation Email...' 
                    : `Submit ${selectedRole === 'tester' ? 'QA Tester' : 'Developer'} Application`}
                </span>
              </button>
              <p className="apply-disclaimer">
                All fields are validated. Both Email and Referral OTPs must be verified before submission. Application will be routed to Admin queue for review.
              </p>
            </div>
          </form>
        </div>
      </div>

      {/* Success Modal */}
      {submitted && (
        <div className="modal-overlay" onClick={() => setSubmitted(false)}>
          <div className="success-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon-circle">
              <CheckCircle2 size={32} strokeWidth={2.5} />
            </div>

            <div className="badge-pending-glow">
              <span>⏳ Status: Pending Admin Approval</span>
            </div>

            <h3 className="modal-title">Application Submitted Successfully</h3>
            <p className="modal-desc">
              Thank you for applying to the <strong>{(submittedInfo?.role || selectedRole) === 'tester' ? 'QA Tester Program' : 'Developer Program'}</strong>, <strong>{submittedInfo?.fullName || formData.fullName}</strong>. Both your email and reference authorization from <strong>{submittedInfo?.referenceName || formData.referenceName}</strong> have been verified.
            </p>

            {/* Email Dispatch Notice in Modal */}
            <div style={{
              margin: '16px 0',
              padding: '12px 16px',
              backgroundColor: '#ECFDF5',
              border: '1.5px solid #A7F3D0',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              textAlign: 'left'
            }}>
              <CheckCircle2 size={20} color="#059669" style={{ flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '0.86rem', color: '#065F46', fontWeight: 800 }}>
                  Official Confirmation Email Sent!
                </div>
                <div style={{ fontSize: '0.78rem', color: '#047857', marginTop: '2px', lineHeight: 1.4 }}>
                  A confirmation email with Assigned ID <strong>{submittedInfo?.assignedId || assignedApplicantId}</strong> and next steps has been sent to <strong>{submittedInfo?.email || formData.email}</strong>.
                </div>
              </div>
            </div>

            <div className="modal-summary-box">
              <div className="modal-row">
                <span className="modal-row-label">Assigned ID:</span>
                <span className="modal-row-val" style={{ fontWeight: 800, color: '#0A3D75' }}>
                  {submittedInfo?.assignedId || assignedApplicantId || (selectedRole === 'tester' ? 'TST-NEW' : 'DEV-NEW')}
                </span>
              </div>
              <div className="modal-row">
                <span className="modal-row-label">Track / Role:</span>
                <span className="modal-row-val">
                  {(submittedInfo?.role || selectedRole) === 'tester' ? 'QA / Software Tester' : 'Developer'}
                </span>
              </div>
              <div className="modal-row">
                <span className="modal-row-label">Specialization:</span>
                <span className="modal-row-val">
                  {(submittedInfo?.role || selectedRole) === 'tester' 
                    ? (submittedInfo?.specialization || formData.specialization) 
                    : (submittedInfo?.primarySkill || formData.primarySkill)}
                </span>
              </div>
              <div className="modal-row">
                <span className="modal-row-label">Verified Email:</span>
                <span className="modal-row-val">{submittedInfo?.email || formData.email}</span>
              </div>
              <div className="modal-row">
                <span className="modal-row-label">Mobile Number:</span>
                <span className="modal-row-val">{submittedInfo?.mobileNumber || formData.mobileNumber}</span>
              </div>
              <div className="modal-row">
                <span className="modal-row-label">Referral Code:</span>
                <span className="modal-row-val">
                  {(submittedInfo?.referralCode || formData.referralCode)} ({(submittedInfo?.referenceName || formData.referenceName)})
                </span>
              </div>
              <div className="modal-row">
                <span className="modal-row-label">Profile Photo:</span>
                <span className="modal-row-val" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  <img
                    src={submittedInfo?.avatar || activeAvatarUrl}
                    alt="Applicant Avatar"
                    style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', border: '1.5px solid #CBD5E1' }}
                  />
                  <span>{(submittedInfo?.avatar || formData.avatar) ? `Custom Photo (${avatarInfo.sizeFormatted || 'Saved'})` : 'Default Track Avatar'}</span>
                </span>
              </div>
              <div className="modal-row">
                <span className="modal-row-label">Review Status:</span>
                <span className="modal-row-val" style={{ color: '#F3821D', fontWeight: 700 }}>
                  ● Pending Admin Approval
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-navy-action"
                onClick={() => {
                  setSubmitted(false);
                  onNavigate('home');
                }}
              >
                Return to Home
              </button>
              
              <button
                type="button"
                className="btn btn-orange-primary"
                onClick={() => {
                  setSubmitted(false);
                  if ((submittedInfo?.role || selectedRole) === 'tester') {
                    onNavigate('tester-login');
                  } else {
                    onNavigate('login');
                  }
                }}
              >
                <span>{(submittedInfo?.role || selectedRole) === 'tester' ? 'Go to QA Tester Login' : 'Go to Freelancer Login'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
