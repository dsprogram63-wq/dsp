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
import './ReferralApplication.css';

const DEFAULT_DEV_AVATAR = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=160';
const DEFAULT_TESTER_AVATAR = 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=160';
const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB strict limit

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
  const [avatarError, setAvatarError] = useState('');
  const [avatarInfo, setAvatarInfo] = useState({
    name: '',
    sizeFormatted: '',
    sizeBytes: 0,
    isCustom: false
  });

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    mobileNumber: '',
    experienceYears: '3+ Years',
    avatar: '', // Base64 data URL if uploaded
    // Developer specific
    primarySkill: 'Full Stack Developer (React & Node)',
    portfolioUrl: '',
    // Tester specific
    specialization: 'Web & Functional QA Testing',
    testingTools: 'Postman, Cypress, Chrome DevTools, Jira',
    // Reference verification
    referralCode: '',
    referenceName: '',
    aboutSelf: '',
    hasValidReference: false
  });

  // Validation Errors & Touched States
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Email OTP Verification States
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailOtpCode, setEmailOtpCode] = useState('');
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [emailTimer, setEmailTimer] = useState(0);
  const [emailStatusMsg, setEmailStatusMsg] = useState(null);

  // Reference OTP Verification States
  const [refOtpSent, setRefOtpSent] = useState(false);
  const [refOtpCode, setRefOtpCode] = useState('');
  const [isRefVerified, setIsRefVerified] = useState(false);
  const [refTimer, setRefTimer] = useState(0);
  const [refStatusMsg, setRefStatusMsg] = useState(null);

  const [submitted, setSubmitted] = useState(false);
  const [assignedApplicantId, setAssignedApplicantId] = useState('');

  // When initialRole prop changes externally
  useEffect(() => {
    if (initialRole) {
      const track = (initialRole === 'tester' || initialRole === 'qa') ? 'tester' : 'developer';
      setSelectedRole(track);
    }
  }, [initialRole]);

  // Countdown timer for Email OTP
  useEffect(() => {
    let interval = null;
    if (emailTimer > 0) {
      interval = setInterval(() => {
        setEmailTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [emailTimer]);

  // Countdown timer for Reference OTP
  useEffect(() => {
    let interval = null;
    if (refTimer > 0) {
      interval = setInterval(() => {
        setRefTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [refTimer]);

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
    if (name === 'email' && isEmailVerified) {
      setIsEmailVerified(false);
      setEmailOtpSent(false);
      setEmailOtpCode('');
      setEmailStatusMsg(null);
    }
    if ((name === 'referralCode' || name === 'referenceName') && isRefVerified) {
      setIsRefVerified(false);
      setRefOtpSent(false);
      setRefOtpCode('');
      setRefStatusMsg(null);
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
    setSelectedRole(role);
    // Clear errors for fields specific to the other role
    setErrors(prev => {
      const copy = { ...prev };
      if (role === 'developer') {
        delete copy.specialization;
        delete copy.testingTools;
      } else {
        delete copy.primarySkill;
        delete copy.portfolioUrl;
      }
      return copy;
    });
  };

  // Email OTP Handlers with validation check
  const handleSendEmailOtp = () => {
    const emailErr = validateField('email', formData.email);
    if (emailErr) {
      setTouched(prev => ({ ...prev, email: true }));
      setErrors(prev => ({ ...prev, email: emailErr }));
      alert(emailErr);
      return;
    }
    setEmailOtpSent(true);
    setEmailTimer(30);
    setEmailOtpCode('123456'); // Pre-fill demo OTP for seamless instant verification
    setEmailStatusMsg({ type: 'info', text: `Verification OTP sent to ${formData.email} (Demo Code: 123456)` });
  };

  const handleVerifyEmailOtp = () => {
    if (!emailOtpCode || emailOtpCode.trim().length < 4) {
      setEmailStatusMsg({ type: 'error', text: 'Please enter the 6-digit OTP sent to your email.' });
      return;
    }
    setIsEmailVerified(true);
    setEmailStatusMsg({ type: 'success', text: '✓ Email verified successfully!' });
  };

  // Reference OTP Handlers with validation check
  const handleSendRefOtp = () => {
    const codeErr = validateField('referralCode', formData.referralCode);
    const nameErr = validateField('referenceName', formData.referenceName);

    if (codeErr || nameErr) {
      setTouched(prev => ({ ...prev, referralCode: true, referenceName: true }));
      setErrors(prev => ({ ...prev, referralCode: codeErr, referenceName: nameErr }));
      alert(codeErr || nameErr);
      return;
    }

    setRefOtpSent(true);
    setRefTimer(30);
    setRefOtpCode('123456'); // Pre-fill demo OTP
    setRefStatusMsg({ 
      type: 'info', 
      text: `Reference authorization OTP sent to ${formData.referenceName} for code ${formData.referralCode} (Demo Code: 123456)` 
    });
  };

  const handleVerifyRefOtp = () => {
    if (!refOtpCode || refOtpCode.trim().length < 4) {
      setRefStatusMsg({ type: 'error', text: 'Please enter the 6-digit authorization OTP from your reference.' });
      return;
    }
    setIsRefVerified(true);
    setRefStatusMsg({ type: 'success', text: '✓ Reference authorization verified successfully!' });
  };

  // Profile Photo Upload Handlers (Strict 2 MB Limit)
  const handleAvatarChange = (e) => {
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

  const handleSubmit = (e) => {
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

    // OTP verification checks
    if (!isEmailVerified) {
      alert('Please verify your Email Address with OTP first.');
      return;
    }
    if (!isRefVerified) {
      alert('Please verify your Referral Code & Reference Name with the Reference OTP first.');
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

    if (selectedRole === 'tester') {
      const generatedId = `TST-${Math.floor(100 + Math.random() * 900)}`;
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
      const generatedId = `DEV-${Math.floor(100 + Math.random() * 900)}`;
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

    setSubmitted(true);
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
            ⚡ <strong>Dual OTP Security Verification:</strong> Both your personal email and your authorized reference will be verified via OTP prior to review and Admin approval.
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
                  placeholder={selectedRole === 'tester' ? 'e.g. Sneha Reddy' : 'e.g. Rahul Patel'}
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
                      disabled={emailTimer > 0 || !formData.email || !!validateField('email', formData.email)}
                      className="btn-send-otp"
                      title={validateField('email', formData.email) ? 'Enter a valid email first' : 'Send OTP'}
                    >
                      {emailOtpSent ? (emailTimer > 0 ? `Resend (${emailTimer}s)` : 'Resend OTP') : 'Send OTP'}
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

                {/* Email OTP Input Expand Box */}
                {emailOtpSent && !isEmailVerified && (
                  <div className="otp-verification-box">
                    <div className="otp-box-header">
                      <span>Enter 6-digit code sent to your email:</span>
                      {emailTimer > 0 && <span>Expires in {emailTimer}s</span>}
                    </div>

                    <div className="otp-input-row">
                      <input
                        type="text"
                        maxLength={6}
                        placeholder="••••••"
                        value={emailOtpCode}
                        onChange={(e) => setEmailOtpCode(e.target.value.replace(/\D/g, ''))}
                        className="otp-code-input"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={handleVerifyEmailOtp}
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

            {/* Row 4: Reference Authorization Container with Dedicated OTP Verification */}
            <div className="reference-verification-container">
              <div className="ref-section-title-row">
                <span className="ref-section-title">
                  <KeyRound size={15} color="#0A3D75" />
                  <span>Referral & Reference Verification ({selectedRole === 'tester' ? 'QA Track' : 'Developer Track'})</span>
                </span>
                {isRefVerified && (
                  <span className="otp-verified-badge">
                    <ShieldCheck size={13} strokeWidth={2.5} />
                    <span>Reference Verified</span>
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
                    className={`form-input ${touched.referralCode && errors.referralCode ? 'is-invalid' : isRefVerified ? 'is-valid' : ''}`}
                    placeholder={selectedRole === 'tester' ? 'e.g. DS-TST-201' : 'e.g. DS-REF-8902'}
                    value={formData.referralCode}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    disabled={isRefVerified}
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
                    className={`form-input ${touched.referenceName && errors.referenceName ? 'is-invalid' : isRefVerified ? 'is-valid' : ''}`}
                    placeholder={selectedRole === 'tester' ? 'e.g. Sneha Reddy' : 'e.g. Amit Patel'}
                    value={formData.referenceName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    disabled={isRefVerified}
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

              {/* Action row to send reference authorization OTP */}
              {!isRefVerified && (
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={handleSendRefOtp}
                    disabled={
                      refTimer > 0 || 
                      !formData.referralCode || 
                      !formData.referenceName ||
                      !!validateField('referralCode', formData.referralCode) ||
                      !!validateField('referenceName', formData.referenceName)
                    }
                    className="btn-verify-ref-action"
                    title="Enter valid referral code and reference name to send OTP"
                  >
                    <UserCheck size={14} />
                    <span>{refOtpSent ? (refTimer > 0 ? `Resend Reference OTP (${refTimer}s)` : 'Resend Reference OTP') : 'Send Reference OTP'}</span>
                  </button>
                </div>
              )}

              {/* Reference OTP Expand Box */}
              {refOtpSent && !isRefVerified && (
                <div className="otp-verification-box">
                  <div className="otp-box-header">
                    <span>Enter authorization OTP provided by {formData.referenceName || 'your reference'}:</span>
                    {refTimer > 0 && <span>Expires in {refTimer}s</span>}
                  </div>

                  <div className="otp-input-row">
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="••••••"
                      value={refOtpCode}
                      onChange={(e) => setRefOtpCode(e.target.value.replace(/\D/g, ''))}
                      className="otp-code-input"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={handleVerifyRefOtp}
                      className="btn-verify-otp"
                    >
                      Verify Reference OTP
                    </button>
                  </div>

                  {refStatusMsg && (
                    <div style={{ fontSize: '0.78rem', color: refStatusMsg.type === 'error' ? '#DC2626' : '#0F3E6D', fontWeight: 600 }}>
                      {refStatusMsg.text}
                    </div>
                  )}
                </div>
              )}

              {isRefVerified && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.825rem', color: '#065F46', fontWeight: 600, backgroundColor: '#ECFDF5', padding: '8px 12px', borderRadius: '4px', border: '1px solid #A7F3D0' }}>
                  <span>✓ Referral Code ({formData.referralCode}) authorized by {formData.referenceName}</span>
                  <button
                    type="button"
                    onClick={() => setIsRefVerified(false)}
                    className="btn-resend-text"
                    style={{ fontSize: '0.78rem' }}
                  >
                    Edit Reference
                  </button>
                </div>
              )}
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
              <button type="submit" className="btn btn-submit-apply">
                <span>Submit {selectedRole === 'tester' ? 'QA Tester' : 'Developer'} Application</span>
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
              Thank you for applying to the <strong>{selectedRole === 'tester' ? 'QA Tester Program' : 'Developer Program'}</strong>, <strong>{formData.fullName}</strong>. Both your email and reference authorization from <strong>{formData.referenceName}</strong> have been verified.
            </p>

            <div className="modal-summary-box">
              <div className="modal-row">
                <span className="modal-row-label">Assigned ID:</span>
                <span className="modal-row-val" style={{ fontWeight: 800, color: '#0A3D75' }}>
                  {assignedApplicantId || (selectedRole === 'tester' ? 'TST-NEW' : 'DEV-NEW')}
                </span>
              </div>
              <div className="modal-row">
                <span className="modal-row-label">Track / Role:</span>
                <span className="modal-row-val">
                  {selectedRole === 'tester' ? 'QA / Software Tester' : 'Developer'}
                </span>
              </div>
              <div className="modal-row">
                <span className="modal-row-label">Specialization:</span>
                <span className="modal-row-val">
                  {selectedRole === 'tester' ? formData.specialization : formData.primarySkill}
                </span>
              </div>
              <div className="modal-row">
                <span className="modal-row-label">Verified Email:</span>
                <span className="modal-row-val">{formData.email}</span>
              </div>
              <div className="modal-row">
                <span className="modal-row-label">Mobile Number:</span>
                <span className="modal-row-val">{formData.mobileNumber}</span>
              </div>
              <div className="modal-row">
                <span className="modal-row-label">Referral Code:</span>
                <span className="modal-row-val">{formData.referralCode} ({formData.referenceName})</span>
              </div>
              <div className="modal-row">
                <span className="modal-row-label">Profile Photo:</span>
                <span className="modal-row-val" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  <img
                    src={activeAvatarUrl}
                    alt="Applicant Avatar"
                    style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', border: '1.5px solid #CBD5E1' }}
                  />
                  <span>{formData.avatar ? `Custom Photo (${avatarInfo.sizeFormatted || 'Saved'})` : 'Default Track Avatar'}</span>
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
                  if (selectedRole === 'tester') {
                    onNavigate('tester-login');
                  } else {
                    onNavigate('login');
                  }
                }}
              >
                <span>{selectedRole === 'tester' ? 'Go to QA Tester Login' : 'Go to Freelancer Login'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
