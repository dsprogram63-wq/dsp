import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  X, 
  KeyRound, 
  Eye, 
  EyeOff, 
  Mail, 
  ExternalLink, 
  Sparkles,
  RefreshCw,
  ShieldCheck,
  User,
  AlertCircle
} from 'lucide-react';
import StatusBadge from '../portal/StatusBadge';
import './AdminModals.css';

// Helper to generate a friendly, secure default password
function generateSecurePassword(name = '') {
  const cleanName = (name || 'Member').trim().replace(/[^a-zA-Z]/g, '');
  const prefix = cleanName.length >= 3 ? (cleanName.charAt(0).toUpperCase() + cleanName.slice(1, 4).toLowerCase()) : 'Dahej';
  const symbols = ['#', '@', '$', '!'];
  const symbol = symbols[Math.floor(Math.random() * symbols.length)];
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}${symbol}${num}`;
}

export default function ApproveMemberModal({
  isOpen,
  member,
  role = 'developer',
  onClose,
  onConfirm
}) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(true);
  const [sendWelcomeEmail, setSendWelcomeEmail] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState('');

  const isTester = (role === 'tester' || role === 'qa');
  const roleLabel = isTester ? 'QA Tester' : 'Developer';

  useEffect(() => {
    if (isOpen && member) {
      setPassword(generateSecurePassword(member.name || member.fullName));
      setShowPassword(true);
      setSendWelcomeEmail(true);
      setValidationError('');
      setIsSubmitting(false);
    }
  }, [isOpen, member]);

  if (!isOpen || !member) return null;

  const handleGenerateNew = () => {
    setPassword(generateSecurePassword(member.name || member.fullName));
    setValidationError('');
  };

  const handleApproveSubmit = async (e) => {
    if (e) e.preventDefault();
    const cleanPass = password.trim();
    if (!cleanPass || cleanPass.length < 4) {
      setValidationError('Please enter a valid password (minimum 4 characters).');
      return;
    }

    setIsSubmitting(true);
    setValidationError('');
    try {
      await onConfirm({
        password: cleanPass,
        sendEmail: sendWelcomeEmail
      });
    } catch (err) {
      console.error('Error during approval confirmation:', err);
      setValidationError(err.message || 'Failed to complete approval. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="portal-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div className="portal-modal-card" style={{ maxWidth: '540px' }}>
        {/* Header */}
        <div className="portal-modal-header" style={{ background: '#F0FDF4', borderBottom: '1px solid #BBF7D0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ 
              width: '42px', 
              height: '42px', 
              background: '#DCFCE7', 
              borderRadius: '10px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              flexShrink: 0,
              border: '1.5px solid #86EFAC'
            }}>
              <CheckCircle2 size={22} color="#16A34A" />
            </div>
            <div>
              <h3 className="portal-modal-title" style={{ color: '#14532D' }}>
                Approve {roleLabel} Application
              </h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#166534' }}>
                Set member login password and dispatch welcome credentials
              </p>
            </div>
          </div>

          <button 
            type="button" 
            onClick={onClose} 
            disabled={isSubmitting}
            className="portal-modal-close" 
            title="Cancel"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleApproveSubmit} style={{ margin: 0, display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div className="portal-modal-body">
            
            {/* Applicant Summary Strip */}
            <div style={{
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '10px',
              padding: '14px 16px',
              marginBottom: '18px',
              display: 'flex',
              alignItems: 'center',
              gap: '14px'
            }}>
              <img
                src={member.avatar || '/assets/logo-icon.png'}
                alt={member.name}
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '2px solid #CBD5E1',
                  flexShrink: 0
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 800, fontSize: '1rem', color: '#0F172A' }}>
                    {member.name || member.fullName}
                  </span>
                  <span style={{
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    fontSize: '0.78rem',
                    color: '#0A3D75',
                    background: '#E8F2FC',
                    padding: '2px 7px',
                    borderRadius: '4px'
                  }}>
                    {member.id}
                  </span>
                  <StatusBadge status="Pending" size="small" />
                </div>
                <div style={{ fontSize: '0.82rem', color: '#475569', marginTop: '4px' }}>
                  <strong>Email:</strong> {member.email} {member.mobile && `• ${member.mobile}`}
                </div>
                {member.referenceName && (
                  <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px' }}>
                    Referred by: <strong>{member.referenceName}</strong> ({member.referralCode || 'DS-REF'})
                  </div>
                )}
              </div>
            </div>

            {/* Password Field Section */}
            <div style={{
              background: '#FFFFFF',
              border: '1.5px solid #CBD5E1',
              borderRadius: '12px',
              padding: '18px',
              marginBottom: '18px',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.03)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <label style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '6px', 
                  fontSize: '0.86rem', 
                  fontWeight: 800, 
                  color: '#0A3D75' 
                }}>
                  <KeyRound size={16} color="#0A3D75" />
                  <span>Set Login Password for Member *</span>
                </label>

                <button
                  type="button"
                  onClick={handleGenerateNew}
                  style={{
                    background: '#F1F5F9',
                    border: '1px solid #CBD5E1',
                    borderRadius: '6px',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    color: '#0A3D75',
                    padding: '3px 8px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                  title="Generate another secure password"
                >
                  <RefreshCw size={11} />
                  <span>Generate New</span>
                </button>
              </div>

              {/* Password Input Box */}
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (validationError) setValidationError('');
                  }}
                  placeholder="Enter login password (e.g. Dahej#2026!)"
                  style={{
                    width: '100%',
                    padding: '10px 42px 10px 14px',
                    fontSize: '0.96rem',
                    fontFamily: showPassword ? "'SFMono-Regular', Consolas, monospace" : 'inherit',
                    fontWeight: 700,
                    color: '#0F172A',
                    background: '#F8FAFC',
                    border: validationError ? '2px solid #EF4444' : '1.5px solid #94A3B8',
                    borderRadius: '8px',
                    outline: 'none',
                    letterSpacing: showPassword ? '0.5px' : 'normal',
                    boxSizing: 'border-box'
                  }}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    background: 'transparent',
                    border: 'none',
                    color: '#64748B',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {validationError && (
                <div style={{ color: '#DC2626', fontSize: '0.78rem', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <AlertCircle size={13} />
                  <span>{validationError}</span>
                </div>
              )}

              <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '8px', lineHeight: '1.45' }}>
                Candidate will use this password along with their registered email (<strong>{member.email}</strong>) to log in.
              </div>
            </div>

            {/* Email Dispatch Checkbox & Login URL Preview */}
            <div style={{
              background: '#F0F9FF',
              border: '1.5px solid #BAE6FD',
              borderRadius: '10px',
              padding: '14px 16px'
            }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', userSelect: 'none' }}>
                <input
                  type="checkbox"
                  checked={sendWelcomeEmail}
                  onChange={(e) => setSendWelcomeEmail(e.target.checked)}
                  style={{ width: '16px', height: '16px', marginTop: '2px', accentColor: '#0284C7', cursor: 'pointer' }}
                />
                <div style={{ fontSize: '0.84rem', color: '#0369A1', lineHeight: '1.45' }}>
                  <strong style={{ color: '#0C4A6E' }}>Send Approval Welcome Email with Login Credentials</strong>
                  <div style={{ fontSize: '0.76rem', color: '#0284C7', marginTop: '4px' }}>
                    Automatically emails <strong>{member.email}</strong> with their assigned password and direct login link:
                  </div>
                  <div style={{ 
                    marginTop: '4px', 
                    fontSize: '0.76rem', 
                    fontWeight: 700, 
                    color: '#0369A1',
                    background: '#E0F2FE',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <ExternalLink size={12} />
                    <span>https://www.dsprogram.space/freelancer-login</span>
                  </div>
                </div>
              </label>
            </div>

          </div>

          {/* Modal Footer */}
          <div className="portal-modal-footer">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="btn btn-navy-action"
              style={{ padding: '8px 18px', fontSize: '0.84rem', background: '#F8FAFC', color: '#475569' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-orange-primary"
              style={{ 
                padding: '8px 22px', 
                fontSize: '0.85rem', 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '8px',
                background: isSubmitting ? '#94A3B8' : 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                borderColor: '#059669',
                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.35)'
              }}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw size={14} className="spin-icon" />
                  <span>Approving & Sending Email...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  <span>Confirm & Approve {roleLabel}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
