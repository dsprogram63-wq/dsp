import React, { useState } from 'react';
import { X, KeyRound, Lock, Plus, Shield } from 'lucide-react';

export default function CredentialModal({ isOpen, onClose, onAddCredential, onSave }) {
  if (!isOpen) return null;

  const typeOptions = [
    'Email Account',
    'Vercel',
    'GitHub',
    'Hosting',
    'Domain',
    'Database',
    'API',
    'CMS',
    'Cloud Service',
    'Other'
  ];

  const [formData, setFormData] = useState({
    type: 'Vercel',
    service: '',
    username: '',
    secret: '',
    apiKey: '',
    notes: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.service.trim() || (!formData.secret.trim() && !formData.apiKey.trim())) {
      alert('Please provide the Platform/Service Name and Password or API Key.');
      return;
    }

    const newCred = {
      id: `cred-${Date.now()}`,
      type: formData.type || 'Vercel',
      service: formData.service.trim(),
      platform: formData.service.trim(),
      username: formData.username.trim() || 'N/A',
      secret: formData.secret.trim() || formData.apiKey.trim(),
      notes: formData.notes.trim() || 'Added by developer'
    };

    if (onAddCredential) {
      onAddCredential(newCred);
    } else if (onSave) {
      onSave(newCred);
    }

    setFormData({
      type: 'Vercel',
      service: '',
      username: '',
      secret: '',
      apiKey: '',
      notes: ''
    });

    onClose();
  };

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(7, 34, 61, 0.6)',
        backdropFilter: 'blur(4px)',
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={onClose}
    >
      <div 
        style={{
          width: '100%',
          maxWidth: '560px',
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          borderTop: '4px solid #F3821D',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FAFCFE' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#EBF3FA', color: '#0A3D75', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <KeyRound size={17} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0A3D75', margin: 0 }}>
                Add Project Credential
              </h3>
              <span style={{ fontSize: '0.78rem', color: '#64748B' }}>
                Securely log deployment or API keys for project review
              </span>
            </div>
          </div>

          <button 
            type="button" 
            onClick={onClose}
            style={{ padding: '6px', color: '#64748B', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Row 1: Type & Service */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '14px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.825rem', fontWeight: 700, color: '#17212B' }}>
                Credential Type *
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                style={{
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: '1.5px solid #CBD5E1',
                  fontSize: '0.9rem',
                  outline: 'none',
                  backgroundColor: '#FFFFFF'
                }}
              >
                {typeOptions.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.825rem', fontWeight: 700, color: '#17212B' }}>
                Platform / Service Name *
              </label>
              <input
                type="text"
                name="service"
                placeholder="e.g. Vercel Production, Hostinger"
                value={formData.service}
                onChange={handleChange}
                required
                style={{
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: '1.5px solid #CBD5E1',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          {/* Row 2: Email / Username */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.825rem', fontWeight: 700, color: '#17212B' }}>
              Email / Username / Identifier
            </label>
            <input
              type="text"
              name="username"
              placeholder="e.g. deploy-bot@dahejsupport.com or admin"
              value={formData.username}
              onChange={handleChange}
              style={{
                padding: '10px 12px',
                borderRadius: '6px',
                border: '1.5px solid #CBD5E1',
                fontSize: '0.9rem',
                outline: 'none'
              }}
            />
          </div>

          {/* Row 3: Password / Secret Key */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.825rem', fontWeight: 700, color: '#17212B' }}>
              Password / Secret Key *
            </label>
            <input
              type="password"
              name="secret"
              placeholder="Enter password or secret token (will be visually masked)"
              value={formData.secret}
              onChange={handleChange}
              required
              style={{
                padding: '10px 12px',
                borderRadius: '6px',
                border: '1.5px solid #CBD5E1',
                fontSize: '0.9rem',
                outline: 'none'
              }}
            />
          </div>

          {/* Row 4: API Key / Token (Optional) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.825rem', fontWeight: 700, color: '#17212B' }}>
              API Key / Access Token (Optional)
            </label>
            <input
              type="text"
              name="apiKey"
              placeholder="e.g. ghp_xxxx or vcl_xxxx"
              value={formData.apiKey}
              onChange={handleChange}
              style={{
                padding: '10px 12px',
                borderRadius: '6px',
                border: '1.5px solid #CBD5E1',
                fontSize: '0.9rem',
                outline: 'none'
              }}
            />
          </div>

          {/* Row 5: Notes */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.825rem', fontWeight: 700, color: '#17212B' }}>
              Notes / Additional Instructions
            </label>
            <textarea
              name="notes"
              rows={2}
              placeholder="e.g. Linked to staging branch with auto-deploy webhook enabled"
              value={formData.notes}
              onChange={handleChange}
              style={{
                padding: '10px 12px',
                borderRadius: '6px',
                border: '1.5px solid #CBD5E1',
                fontSize: '0.88rem',
                outline: 'none',
                resize: 'vertical'
              }}
            />
          </div>

          <div style={{ padding: '10px 14px', backgroundColor: '#F8FAFC', borderRadius: '6px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: '#0A3D75' }}>
            <Shield size={14} color="#F3821D" />
            <span>Credentials are masked and encrypted for internal Dahej Support review only.</span>
          </div>

          {/* Footer Actions */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '6px' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline-action"
              style={{ padding: '9px 18px' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-orange-primary"
              style={{ padding: '9px 22px' }}
            >
              Save Credential
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
