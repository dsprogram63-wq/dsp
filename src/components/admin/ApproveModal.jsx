import React from 'react';
import { X, CheckCircle2, IndianRupee, User, ShieldCheck } from 'lucide-react';
import './AdminModals.css';

export default function ApproveModal({ 
  isOpen, 
  project, 
  onClose, 
  onApprove 
}) {
  if (!isOpen || !project) return null;

  return (
    <div 
      className="portal-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="portal-modal-card" style={{ maxWidth: '520px' }}>
        {/* Header */}
        <div className="portal-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', background: '#DCFCE7', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <CheckCircle2 size={22} color="#16A34A" />
            </div>
            <div>
              <h3 className="portal-modal-title" style={{ color: '#166534' }}>Approve Project Delivery</h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748B' }}>
                Verify final completion and schedule milestone payout
              </p>
            </div>
          </div>

          <button type="button" onClick={onClose} className="portal-modal-close">
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="portal-modal-body">
          {/* Project Summary Box */}
          <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '10px', padding: '16px', marginBottom: '16px' }}>
            <div style={{ fontWeight: 800, color: '#14532D', fontSize: '1rem', marginBottom: '4px' }}>
              {project.name}
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#166534', fontWeight: 700, marginBottom: '12px' }}>
              Project ID: {project.id}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.85rem' }}>
              <div>
                <span style={{ color: '#64748B', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 700 }}>Assigned Developer</span>
                <strong style={{ color: '#0F172A' }}>{project.developer}</strong>
              </div>

              <div>
                <span style={{ color: '#64748B', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 700 }}>Freelancer Payout</span>
                <strong style={{ color: '#16A34A', fontSize: '1.05rem' }}>{project.freelancerPayout || project.developerPayment || '₹0'}</strong>
              </div>
            </div>
          </div>

          <div style={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.5 }}>
            By approving this project, the status will transition to <strong>Completed</strong>, project completion will be marked as <strong>100%</strong>, and the Freelancer Payout will be scheduled for disbursement.
          </div>
        </div>

        {/* Actions Footer */}
        <div className="portal-modal-footer">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-navy-action"
            style={{ background: '#F1F5F9', color: '#475569', border: '1px solid #CBD5E1', cursor: 'pointer', padding: '8px 18px' }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onApprove(project.id);
              onClose();
            }}
            className="btn btn-navy-action"
            style={{ background: '#16A34A', color: '#FFFFFF', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 20px', fontWeight: 700 }}
          >
            <ShieldCheck size={16} />
            <span>Approve & Release Payout</span>
          </button>
        </div>
      </div>
    </div>
  );
}

