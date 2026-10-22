import React from 'react';
import { Trash2, AlertTriangle, X, User, ShieldCheck } from 'lucide-react';
import StatusBadge from '../portal/StatusBadge';
import './AdminModals.css';

export default function DeleteConfirmModal({
  isOpen,
  item,
  itemType = 'developer',
  assignedProjectsCount = 0,
  onClose,
  onConfirm
}) {
  if (!isOpen || !item) return null;

  const isDev = itemType === 'developer';
  const roleLabel = isDev ? 'Developer' : 'QA Tester';

  return (
    <div 
      className="portal-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="portal-modal-card" style={{ maxWidth: '500px' }}>
        {/* Modal Header */}
        <div className="portal-modal-header" style={{ background: '#FFF5F5', borderBottom: '1px solid #FEE2E2' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ 
              width: '42px', 
              height: '42px', 
              background: '#FEE2E2', 
              borderRadius: '10px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              flexShrink: 0,
              border: '1px solid #FECACA'
            }}>
              <Trash2 size={20} color="#DC2626" />
            </div>
            <div>
              <h3 className="portal-modal-title" style={{ color: '#991B1B' }}>
                Delete {roleLabel} Account
              </h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#7F1D1D' }}>
                Remove redundant record and purge account data
              </p>
            </div>
          </div>

          <button type="button" onClick={onClose} className="portal-modal-close" title="Cancel">
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="portal-modal-body">
          {/* Member Preview Card */}
          <div style={{
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '10px',
            padding: '14px 16px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px'
          }}>
            <img
              src={item.avatar || '/assets/logo-icon.png'}
              alt={item.name}
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
                <span style={{ fontWeight: 800, fontSize: '0.98rem', color: '#0F172A' }}>
                  {item.name}
                </span>
                <span style={{
                  fontFamily: 'monospace',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  color: '#0A3D75',
                  background: '#E8F2FC',
                  padding: '2px 6px',
                  borderRadius: '4px'
                }}>
                  {item.id}
                </span>
                <StatusBadge status={item.status || 'Pending'} size="small" />
              </div>
              <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '3px' }}>
                {item.email || 'No email provided'} • {item.mobile || 'No mobile'}
              </div>
            </div>
          </div>

          {/* Warning Message Box */}
          <div style={{
            background: '#FEF2F2',
            border: '1.5px solid #FECACA',
            borderRadius: '10px',
            padding: '14px 16px',
            marginBottom: '16px',
            display: 'flex',
            gap: '12px'
          }}>
            <AlertTriangle size={20} color="#DC2626" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div style={{ fontSize: '0.84rem', color: '#7F1D1D', lineHeight: '1.45' }}>
              <div style={{ fontWeight: 700, marginBottom: '4px' }}>
                Are you sure you want to permanently delete this {roleLabel.toLowerCase()}?
              </div>
              <div>
                This action is permanent and cannot be undone. All directory entries, cached profiles, and referral registry records associated with <strong>{item.name} ({item.id})</strong> will be removed.
              </div>
            </div>
          </div>

          {/* Assigned Projects Warning if any */}
          {assignedProjectsCount > 0 && (
            <div style={{
              background: '#FFFBEB',
              border: '1.5px solid #FCD34D',
              borderRadius: '10px',
              padding: '12px 16px',
              fontSize: '0.82rem',
              color: '#92400E',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <span style={{ fontSize: '1.1rem' }}>⚠️</span>
              <div>
                <strong>Active Workload Alert:</strong> This {roleLabel.toLowerCase()} currently has <strong>{assignedProjectsCount}</strong> assigned project(s). Deleting will safely unassign them so they can be assigned to other team members.
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="portal-modal-footer">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-navy-action"
            style={{ padding: '8px 18px', fontSize: '0.84rem', background: '#F8FAFC', color: '#475569' }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="btn btn-delete-action"
            style={{ 
              padding: '8px 20px', 
              fontSize: '0.84rem', 
              background: '#DC2626', 
              color: '#FFFFFF',
              borderColor: '#DC2626',
              boxShadow: '0 2px 6px rgba(220, 38, 38, 0.35)'
            }}
          >
            <Trash2 size={15} style={{ marginRight: '6px' }} />
            <span>Yes, Permanently Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
}
