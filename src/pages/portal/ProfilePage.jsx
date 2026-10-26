import React, { useState, useEffect, useRef } from 'react';
import { 
  User, 
  Briefcase, 
  ShieldCheck, 
  Calendar, 
  Edit3, 
  Save, 
  X, 
  Camera, 
  CheckCircle,
  UserCheck,
  Lock,
  Award,
  AlertCircle,
  Copy,
  Check
} from 'lucide-react';
import { initialProfile } from '../../data/mockData';
import { calculateCurrentExperience } from '../../utils/projectStatusUtils';
import { uploadAvatar } from '../../services/storageService.js';
import { getOrAssignReferralTrustId } from '../../utils/referralTrustUtils.js';
import './ProfilePage.css';

const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB

export default function ProfilePage({ 
  profile: propProfile, 
  onUpdateProfile 
}) {
  const currentProfile = propProfile || {};
  const fileInputRef = useRef(null);

  // Robust resolver that prioritizes real referral codes and completely rejects synthetic 'REF-00...' values
  const resolveRefCode = (profileObj, fallback = 'DS-REF-8902') => {
    if (!profileObj) return fallback;
    const candidates = [
      profileObj.referralCode,
      profileObj.referenceId
    ];
    for (const c of candidates) {
      if (c && typeof c === 'string' && c.trim() && !c.trim().toUpperCase().startsWith('REF-00')) {
        return c.trim();
      }
    }
    return fallback;
  };

  const initialRefCode = resolveRefCode(currentProfile, 'DS-REF-8902');

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: currentProfile.fullName || currentProfile.name || '',
    freelancerId: currentProfile.freelancerId || currentProfile.id || '',
    joiningDate: currentProfile.joiningDate || '',
    mobile: currentProfile.mobile || '',
    email: currentProfile.email || '',
    experienceAtJoining: currentProfile.experienceAtJoining || 0,
    experienceReferenceDate: currentProfile.experienceReferenceDate || currentProfile.joiningDate || '',
    referenceName: currentProfile.referenceName || 'Reference Verification',
    referenceId: initialRefCode,
    referralCode: initialRefCode,
    program: 'The HIT Support Developer Program',
    avatar: currentProfile.avatar || '',
    verified: currentProfile.verified !== false
  });

  const [toastMessage, setToastMessage] = useState(null);
  const [copiedTrustId, setCopiedTrustId] = useState(false);

  // Reffer Trustable ID for approved developer
  const myReferralTrustId = currentProfile.referralTrustId || getOrAssignReferralTrustId({
    ...currentProfile,
    status: currentProfile.status || 'Active',
    freelancerId: currentProfile.freelancerId || currentProfile.id || formData.freelancerId,
    name: formData.fullName || currentProfile.name || currentProfile.fullName,
    fullName: formData.fullName || currentProfile.name || currentProfile.fullName
  });

  const handleCopyTrustId = () => {
    if (!myReferralTrustId) return;
    try {
      navigator.clipboard?.writeText(myReferralTrustId);
    } catch (e) {}
    setCopiedTrustId(true);
    showToast(`Referrer Trust ID "${myReferralTrustId}" copied to clipboard!`);
    setTimeout(() => setCopiedTrustId(false), 2500);
  };

  useEffect(() => {
    if (propProfile) {
      const cleanRefCode = resolveRefCode(propProfile, resolveRefCode(formData, 'DS-REF-8902'));
      setFormData(prev => ({
        ...prev,
        fullName: propProfile.fullName || propProfile.name || prev.fullName,
        freelancerId: propProfile.freelancerId || propProfile.id || prev.freelancerId,
        joiningDate: propProfile.joiningDate || prev.joiningDate,
        mobile: propProfile.mobile || prev.mobile,
        email: propProfile.email || prev.email,
        experienceAtJoining: propProfile.experienceAtJoining || prev.experienceAtJoining,
        experienceReferenceDate: propProfile.experienceReferenceDate || propProfile.joiningDate || prev.experienceReferenceDate,
        referenceName: propProfile.referenceName || prev.referenceName || 'Reference Verification',
        referenceId: cleanRefCode,
        referralCode: cleanRefCode,
        program: 'The HIT Support Developer Program',
        avatar: propProfile.avatar || prev.avatar
      }));
    }
  }, [propProfile]);

  // Deterministically compute current experience from stored joining experience + complete years elapsed
  const computedExperience = calculateCurrentExperience(
    formData.experienceAtJoining, 
    formData.experienceReferenceDate
  );

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('⚠️ Please select a valid image file (PNG, JPG, or WebP).');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
      showToast(`⚠️ Photo size (${sizeMb} MB) exceeds 2 MB limit. Please select a photo under 2 MB.`);
      alert(`⚠️ File Size Exceeded (Max 2 MB)\n\nSelected file size is ${sizeMb} MB. Please upload a photo smaller than 2 MB.`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    showToast('Uploading profile photo to storage...');
    try {
      const { url } = await uploadAvatar(formData.referenceId || formData.id || 'freelancer', file);
      if (url) {
        setFormData(prev => ({
          ...prev,
          avatar: url
        }));
        showToast('✓ Profile photo saved successfully!');
        return;
      }
    } catch (err) {
      console.warn('Storage upload fallback:', err);
    }

    // Fallback to local DataURL
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      setFormData(prev => ({
        ...prev,
        avatar: uploadEvent.target.result
      }));
      showToast('✓ Profile photo loaded!');
    };
    reader.readAsDataURL(file);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Security check: only allow editing permitted fields
    if (name === 'fullName') {
      const sanitized = value.replace(/[^a-zA-Z\s.'-]/g, '').slice(0, 50);
      setFormData(prev => ({ ...prev, fullName: sanitized }));
    } else if (name === 'mobile') {
      const sanitized = value.replace(/\D/g, '').slice(0, 10);
      setFormData(prev => ({ ...prev, mobile: sanitized }));
    } else if (name === 'email') {
      setFormData(prev => ({ ...prev, email: value }));
    }
  };

  const handleSave = (e) => {
    if (e && e.preventDefault) e.preventDefault();

    // 1. Validation for Name
    const trimmedName = (formData.fullName || '').trim();
    if (!trimmedName || trimmedName.length < 3) {
      showToast('Developer Name must be at least 3 characters.');
      return;
    }
    if (!/^[a-zA-Z\s.'-]+$/.test(trimmedName)) {
      showToast('Developer Name can only contain letters and spaces.');
      return;
    }

    // 2. Validation for Email
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!formData.email || !emailRegex.test(formData.email.trim())) {
      showToast('Please enter a valid Email Address (e.g. name@domain.com).');
      return;
    }

    // 3. Validation for Mobile
    const phoneDigits = (formData.mobile || '').replace(/\D/g, '');
    if (phoneDigits.length !== 10) {
      showToast(`Mobile number must be exactly 10 digits (${phoneDigits.length}/10 entered).`);
      return;
    }
    if (!/^[6-9]\d{9}$/.test(phoneDigits)) {
      showToast('10-digit mobile number must start with 6, 7, 8, or 9.');
      return;
    }

    const updatedPayload = {
      fullName: trimmedName,
      name: trimmedName,
      mobile: formData.mobile.trim(),
      email: formData.email.trim(),
      avatar: formData.avatar
    };

    if (onUpdateProfile) {
      onUpdateProfile(updatedPayload);
    }

    setIsEditing(false);
    showToast('Profile updated and saved to database successfully!');
  };

  const handleCancel = () => {
    setFormData(prev => ({
      ...prev,
      fullName: currentProfile.fullName || currentProfile.name || prev.fullName,
      mobile: currentProfile.mobile || prev.mobile,
      email: currentProfile.email || prev.email,
      avatar: currentProfile.avatar || prev.avatar
    }));
    setIsEditing(false);
  };

  return (
    <div className="profile-page-container">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="profile-page-toast">
          <CheckCircle size={18} color="#10B981" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Profile Header Banner */}
      <div className="portal-card profile-banner-card">
        <div className="profile-banner-left">
          <div className="profile-avatar-container">
            <img 
              src={formData.avatar} 
              alt={formData.fullName} 
              className="profile-avatar-img"
            />
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarUpload}
              accept="image/png, image/jpeg, image/webp, image/gif"
              style={{ display: 'none' }}
            />
            {isEditing && (
              <button 
                type="button" 
                className="profile-avatar-camera-btn"
                title="Upload / Change Photo (Max 2 MB)"
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
              >
                <Camera size={14} />
              </button>
            )}
            <span className="profile-online-badge" />
          </div>

          <div className="profile-banner-info">
            <div className="profile-name-row">
              <h1 className="profile-full-name">{formData.fullName}</h1>
              {formData.verified && (
                <span className="profile-verified-badge" title="Verified Dahej Support Developer">
                  <ShieldCheck size={14} />
                  <span>Verified Developer</span>
                </span>
              )}
            </div>
            <p className="profile-headline">{computedExperience} Experience • The HIT Support Developer Program</p>
            <div className="profile-sub-meta">
              <span><Calendar size={13} style={{ marginRight: '4px' }} /> Joined {formData.joiningDate}</span>
              <span>•</span>
              <span className="profile-id-tag">ID: {formData.freelancerId}</span>
            </div>
          </div>
        </div>

        <div className="profile-banner-actions">
          {!isEditing ? (
            <button
              type="button"
              className="btn btn-navy-action"
              onClick={() => setIsEditing(true)}
            >
              <Edit3 size={15} />
              <span>Edit Profile</span>
            </button>
          ) : (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className="btn btn-navy-action"
                onClick={handleCancel}
                style={{ background: '#F1F5F9', color: '#475569', border: '1px solid #CBD5E1' }}
              >
                <X size={15} />
                <span>Cancel</span>
              </button>
              <button
                type="button"
                className="btn btn-orange-primary"
                onClick={handleSave}
              >
                <Save size={15} />
                <span>Save Changes</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Two Clean Logical Sections / Cards */}
      <div className="profile-details-grid">
        {/* CARD 1: PERSONAL INFORMATION */}
        <div className="portal-card">
          <div className="portal-card-header">
            <h2 className="portal-card-title">
              <User size={18} color="#0A3D75" />
              <span>Personal Information</span>
            </h2>
            {isEditing && <span className="editing-indicator">Editing Mode</span>}
          </div>

          <form onSubmit={handleSave} className="profile-form-fields">
            {/* 1. Freelancer Name & 2. Freelancer ID */}
            <div className="profile-form-row">
              <div className="profile-field-group">
                <label className="profile-field-label">Freelancer Name</label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={`profile-input ${!isEditing ? 'disabled' : ''}`}
                />
              </div>

              <div className="profile-field-group">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label className="profile-field-label">Freelancer ID</label>
                  <Lock size={12} color="#94A3B8" />
                </div>
                <input
                  type="text"
                  value={formData.freelancerId}
                  disabled
                  className="profile-input disabled"
                />
                <span className="field-hint">Permanent system ID (Locked)</span>
              </div>
            </div>

            {/* 3. Joining Date & 4. Mobile Number */}
            <div className="profile-form-row">
              <div className="profile-field-group">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label className="profile-field-label">Joining Date</label>
                  <Lock size={12} color="#94A3B8" />
                </div>
                <input
                  type="text"
                  value={formData.joiningDate}
                  disabled
                  className="profile-input disabled"
                />
                <span className="field-hint">Permanent registration date (Locked)</span>
              </div>

              <div className="profile-field-group">
                <label className="profile-field-label">Mobile Number</label>
                <input
                  type="tel"
                  name="mobile"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="e.g. 9876543210"
                  value={formData.mobile}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={`profile-input ${!isEditing ? 'disabled' : ''}`}
                />
                {isEditing && (
                  <span className="field-hint" style={{ color: '#64748B' }}>
                    Exactly 10 digits starting with 6, 7, 8, or 9 ({formData.mobile.length}/10)
                  </span>
                )}
              </div>
            </div>

            {/* 5. Email Address */}
            <div className="profile-form-row">
              <div className="profile-field-group" style={{ gridColumn: '1 / -1' }}>
                <label className="profile-field-label">Email ID</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={`profile-input ${!isEditing ? 'disabled' : ''}`}
                />
              </div>
            </div>
          </form>
        </div>

        {/* CARD 2: PROFESSIONAL & REFERENCE INFORMATION */}
        <div className="portal-card">
          <div className="portal-card-header">
            <h2 className="portal-card-title">
              <Briefcase size={18} color="#0A3D75" />
              <span>Professional & Reference Information</span>
            </h2>
            {isEditing && <span className="editing-indicator">Editing Mode</span>}
          </div>

          <form onSubmit={handleSave} className="profile-form-fields">
            {/* 1. Program / Role & 2. Experience */}
            <div className="profile-form-row">
              <div className="profile-field-group">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label className="profile-field-label">Program / Role</label>
                  <Lock size={12} color="#94A3B8" />
                </div>
                <input
                  type="text"
                  value="The HIT Support Developer Program"
                  disabled
                  className="profile-input disabled"
                />
                <span className="field-hint">System-managed program</span>
              </div>

              <div className="profile-field-group">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label className="profile-field-label">Experience</label>
                  <Lock size={12} color="#94A3B8" />
                </div>
                <input
                  type="text"
                  value={computedExperience}
                  disabled
                  className="profile-input disabled"
                />
                <span className="field-hint">Auto-calculated from joining data</span>
              </div>
            </div>

            {/* 3. Reference Name & 4. Reference ID */}
            <div className="profile-form-row">
              <div className="profile-field-group">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label className="profile-field-label">Reference Name</label>
                  <Lock size={12} color="#94A3B8" />
                </div>
                <input
                  type="text"
                  value={formData.referenceName}
                  disabled
                  className="profile-input disabled"
                />
                <span className="field-hint">Permanent referral sponsor</span>
              </div>

              <div className="profile-field-group">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label className="profile-field-label">Reference ID</label>
                  <Lock size={12} color="#94A3B8" />
                </div>
                <input
                  type="text"
                  value={resolveRefCode(formData, 'DS-REF-8902')}
                  disabled
                  className="profile-input disabled"
                />
                <span className="field-hint">Permanent referral sponsor ID</span>
              </div>
            </div>

            {/* Reference Verification Box */}
            <div className="reference-box" style={{ marginTop: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <UserCheck size={15} color="#0369A1" />
                <span className="reference-tag" style={{ margin: 0 }}>Verified Referral Sponsor</span>
              </div>
              <div className="reference-name-val">{formData.referenceName} ({resolveRefCode(formData, 'DS-REF-8902')})</div>
              <p className="reference-desc">
                This account was verified and registered under {formData.referenceName} ({resolveRefCode(formData, 'DS-REF-8902')}) for The HIT Support Developer Program.
              </p>
            </div>

            {/* Show personal Referrer Trust ID if approved/active */}
            {myReferralTrustId && (
              <div className="trust-id-showcase-box">
                <div className="trust-id-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ShieldCheck size={16} color="#38BDF8" />
                    <span style={{ fontSize: '0.85rem', fontWeight: '800', letterSpacing: '0.3px' }}>
                      Your Reffer Trustable ID
                    </span>
                  </div>
                  <span className="trust-id-badge">Approved Sponsor</span>
                </div>

                <div className="trust-id-value-card">
                  <span className="trust-id-code">{myReferralTrustId}</span>
                  <button
                    type="button"
                    className="btn-copy-trust-id"
                    onClick={handleCopyTrustId}
                    title="Copy Referrer ID to share with new applicants"
                  >
                    {copiedTrustId ? <Check size={14} color="#16A34A" /> : <Copy size={14} />}
                    <span>{copiedTrustId ? 'Copied!' : 'Copy Referrer ID'}</span>
                  </button>
                </div>

                <p className="trust-id-help-text">
                  Give this ID and your profile name (<strong>{formData.fullName}</strong>) to candidates applying to the Dahej Support Developer/Tester Program. When they apply, an authorization OTP will be sent to your email (<strong>{formData.email}</strong>) to approve their reference.
                </p>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
