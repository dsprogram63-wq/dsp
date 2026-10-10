import React, { useState } from 'react';
import { X, Send, CheckSquare, ShieldCheck, AlertCircle, ExternalLink, FolderKanban, AlertTriangle } from 'lucide-react';

export default function SubmissionModal({ isOpen, project, onClose, onSubmit, onSubmitConfirm }) {
  if (!isOpen || !project) return null;

  const liveUrl = (project.liveLink || project.liveProjectLink || '').trim();
  const driveUrl = (project.driveLink || project.driveProjectLink || '').trim();
  const hasLive = Boolean(liveUrl);
  const hasDrive = Boolean(driveUrl);
  const hasMandatoryLinks = hasLive && hasDrive;

  const [checklist, setChecklist] = useState({
    tasks: true,
    liveLink: hasLive,
    driveLink: hasDrive,
    credentials: true,
    ready: true
  });

  const allChecked = Object.values(checklist).every(Boolean);
  const canConfirm = allChecked && hasMandatoryLinks;

  const toggleItem = (key) => {
    setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleConfirm = () => {
    if (!hasMandatoryLinks) {
      alert('⚠️ Mandatory Error: Live Project Link and Google Drive ZIP Link are both required before submitting for review.');
      return;
    }
    if (!allChecked) {
      alert('Please verify and check all items in the submission checklist.');
      return;
    }
    if (onSubmitConfirm) {
      onSubmitConfirm(project);
    } else if (onSubmit) {
      onSubmit(project);
    }
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
            <div style={{ width: '34px', height: '34px', borderRadius: '8px', backgroundColor: '#ECFDF5', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Send size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0A3D75', margin: 0 }}>
                Submit Project for Review?
              </h3>
              <span style={{ fontSize: '0.78rem', color: '#64748B' }}>
                {project.name} ({project.id})
              </span>
            </div>
          </div>

          <button 
            type="button" 
            onClick={onClose}
            style={{ padding: '6px', color: '#64748B', cursor: 'pointer', background: 'none', border: 'none' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ fontSize: '0.9rem', color: '#475569', lineHeight: 1.5, margin: 0 }}>
            Submitting this project sends your deliverables, live demo, and source files to the assigned QA Tester and Dahej Support Admin for verification.
          </p>

          {/* Mandatory QA Deliverables Box */}
          <div style={{ backgroundColor: '#F0F9FF', padding: '14px 16px', borderRadius: '10px', border: '1px solid #BAE6FD', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0369A1', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={14} color="#0284C7" />
              <span>Deliverables for QA Tester</span>
            </span>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.84rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#FFFFFF', padding: '8px 12px', borderRadius: '6px', border: '1px solid #E0F2FE' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#07223D', fontWeight: 600 }}>
                  <ExternalLink size={14} color="#F3821D" />
                  <span>Live Project Link:</span>
                </span>
                {hasLive ? (
                  <span style={{ color: '#0284C7', fontFamily: 'monospace', fontSize: '0.8rem', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {liveUrl}
                  </span>
                ) : (
                  <span style={{ color: '#DC2626', fontWeight: 700, fontSize: '0.78rem' }}>⚠️ Missing (Required)</span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#FFFFFF', padding: '8px 12px', borderRadius: '6px', border: '1px solid #E0F2FE' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#07223D', fontWeight: 600 }}>
                  <FolderKanban size={14} color="#0A3D75" />
                  <span>Google Drive ZIP:</span>
                </span>
                {hasDrive ? (
                  <span style={{ color: '#0284C7', fontFamily: 'monospace', fontSize: '0.8rem', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {driveUrl}
                  </span>
                ) : (
                  <span style={{ color: '#DC2626', fontWeight: 700, fontSize: '0.78rem' }}>⚠️ Missing (Required)</span>
                )}
              </div>
            </div>
          </div>

          {!hasMandatoryLinks && (
            <div style={{ padding: '10px 14px', backgroundColor: '#FEF2F2', borderRadius: '8px', border: '1px solid #FECACA', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: '#991B1B' }}>
              <AlertTriangle size={16} color="#DC2626" />
              <span><strong>Action Required:</strong> Please enter both Live Project Link and Google Drive ZIP link on the project page before submitting.</span>
            </div>
          )}

          {/* Submission Checklist */}
          <div style={{ backgroundColor: '#F8FAFC', padding: '16px', borderRadius: '8px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0A3D75', textTransform: 'uppercase' }}>
              Pre-Submission Checklist
            </span>

            {[
              { key: 'tasks', label: 'All milestone tasks completed (100%)' },
              { key: 'liveLink', label: 'Live deployment URL verified & working' },
              { key: 'driveLink', label: 'Google Drive ZIP / source code files attached' },
              { key: 'credentials', label: 'Required hosting & environment credentials provided' },
              { key: 'ready', label: 'Ready for QA Tester and Admin verification' }
            ].map((item) => (
              <label 
                key={item.key} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '10px', 
                  fontSize: '0.86rem', 
                  color: '#17212B', 
                  cursor: 'pointer',
                  fontWeight: 500
                }}
              >
                <input
                  type="checkbox"
                  checked={checklist[item.key]}
                  onChange={() => toggleItem(item.key)}
                  style={{ width: '16px', height: '16px', accentColor: '#0A3D75' }}
                />
                <span>{item.label}</span>
              </label>
            ))}
          </div>

          {/* Alert Notice */}
          <div style={{ padding: '10px 14px', backgroundColor: '#FEF3C7', borderRadius: '6px', border: '1px solid #FDE68A', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#92400E' }}>
            <AlertCircle size={15} />
            <span>Once submitted, status changes to <strong>Under Review</strong> until QA testing is completed.</span>
          </div>

          {/* Footer Actions */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '4px' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline-action"
              style={{ padding: '9px 18px' }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!canConfirm}
              className="btn btn-orange-primary"
              style={{ 
                padding: '9px 24px',
                opacity: canConfirm ? 1 : 0.6,
                cursor: canConfirm ? 'pointer' : 'not-allowed'
              }}
            >
              {hasMandatoryLinks ? 'Submit Project Now' : 'Links Required to Submit'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
