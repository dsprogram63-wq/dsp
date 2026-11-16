import React, { useState } from 'react';
import { Trash2, AlertTriangle, X, Download, CheckCircle, ShieldAlert, FileText, UserCheck, CheckSquare, Layers } from 'lucide-react';
import StatusBadge from '../portal/StatusBadge';
import { exportFullProjectArchive } from '../../utils/exportUtils';
import './AdminModals.css';

export default function DeleteProjectModal({
  isOpen,
  project,
  onClose,
  onConfirm
}) {
  const [hasExported, setHasExported] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen || !project) return null;

  const handleExport = () => {
    const success = exportFullProjectArchive(project);
    if (success) {
      setHasExported(true);
    }
  };

  const handleDelete = () => {
    if (!isConfirmed) return;
    setIsDeleting(true);
    try {
      onConfirm(project.id);
    } finally {
      setIsDeleting(false);
    }
  };

  const clientName = project.clientName || project.client || 'N/A';
  const devName = project.developer || 'Unassigned';
  const testerName = project.tester || 'Unassigned';
  const clientPrice = project.totalClientPrice || project.totalAmount || (project.totalClientPriceNum ? `₹${project.totalClientPriceNum.toLocaleString('en-IN')}` : '₹0');
  const tasksCount = Array.isArray(project.tasks) ? project.tasks.length : (Array.isArray(project.milestones) ? project.milestones.length : 0);
  const issuesCount = Array.isArray(project.testingIssues) ? project.testingIssues.length : (Array.isArray(project.issues) ? project.issues.length : 0);

  return (
    <div 
      className="portal-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isDeleting) onClose();
      }}
    >
      <div className="portal-modal-card" style={{ maxWidth: '560px' }}>
        {/* Modal Header */}
        <div className="portal-modal-header" style={{ background: '#FFF5F5', borderBottom: '1px solid #FEE2E2', padding: '18px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ 
              width: '44px', 
              height: '44px', 
              background: '#FEE2E2', 
              borderRadius: '12px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              flexShrink: 0,
              border: '1px solid #FECACA'
            }}>
              <Trash2 size={22} color="#DC2626" />
            </div>
            <div>
              <h3 className="portal-modal-title" style={{ color: '#991B1B', margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>
                Delete Project Record
              </h3>
              <p style={{ margin: '3px 0 0 0', fontSize: '0.82rem', color: '#7F1D1D' }}>
                Permanently purge project data to free up database storage
              </p>
            </div>
          </div>

          <button 
            type="button" 
            onClick={onClose} 
            className="portal-modal-close" 
            title="Cancel"
            disabled={isDeleting}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="portal-modal-body" style={{ padding: '22px 24px' }}>
          {/* Project Details Card */}
          <div style={{
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '10px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{
                    fontFamily: 'monospace',
                    fontWeight: 800,
                    fontSize: '0.82rem',
                    color: '#0A3D75',
                    background: '#E8F2FC',
                    padding: '3px 8px',
                    borderRadius: '6px'
                  }}>
                    {project.id}
                  </span>
                  <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>
                    {project.projectType || 'Project'}
                  </span>
                </div>
                <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0F172A' }}>
                  {project.name}
                </h4>
              </div>
              <StatusBadge status={project.status || 'Active'} size="small" />
            </div>

            {/* Quick Metadata Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '8px 16px',
              paddingTop: '10px',
              borderTop: '1px solid #E2E8F0',
              fontSize: '0.82rem'
            }}>
              <div>
                <span style={{ color: '#64748B' }}>Client: </span>
                <strong style={{ color: '#0F172A' }}>{clientName}</strong>
              </div>
              <div>
                <span style={{ color: '#64748B' }}>Contract Price: </span>
                <strong style={{ color: '#16A34A' }}>{clientPrice}</strong>
              </div>
              <div>
                <span style={{ color: '#64748B' }}>Developer: </span>
                <strong style={{ color: '#0A3D75' }}>{devName}</strong>
              </div>
              <div>
                <span style={{ color: '#64748B' }}>QA Tester: </span>
                <strong style={{ color: '#C2410C' }}>{testerName}</strong>
              </div>
              <div>
                <span style={{ color: '#64748B' }}>Milestone Tasks: </span>
                <strong style={{ color: '#0F172A' }}>{tasksCount} tasks</strong>
              </div>
              <div>
                <span style={{ color: '#64748B' }}>Reported Defects: </span>
                <strong style={{ color: '#0F172A' }}>{issuesCount} issues</strong>
              </div>
            </div>
          </div>

          {/* Export Recommendation Box */}
          <div style={{
            background: hasExported ? '#F0FDF4' : '#EFF6FF',
            border: `1.5px solid ${hasExported ? '#86EFAC' : '#BFDBFE'}`,
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '16px',
            transition: 'all 0.2s ease'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: hasExported ? '#DCFCE7' : '#DBEAFE',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                {hasExported ? <CheckCircle size={20} color="#16A34A" /> : <Download size={20} color="#2563EB" />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: '0.92rem', color: hasExported ? '#166534' : '#1E40AF', marginBottom: '4px' }}>
                  {hasExported ? 'Project Archive Successfully Downloaded' : 'Step 1: Export Complete Project Archive (Excel CSV)'}
                </div>
                <p style={{ margin: '0 0 10px 0', fontSize: '0.8rem', color: hasExported ? '#15803D' : '#3B82F6', lineHeight: 1.45 }}>
                  {hasExported 
                    ? 'Your device now has the complete A-to-Z Excel archive of this project with all financial, team, task, and defect records.'
                    : 'Download full details (Project ID, Name, Client, Amount, Dev/Tester info, Task checklist, Defects & Timelines) before deleting so you never lose this record.'}
                </p>
                <button
                  type="button"
                  onClick={handleExport}
                  className="btn"
                  style={{
                    background: hasExported ? '#16A34A' : '#2563EB',
                    color: '#FFFFFF',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer'
                  }}
                >
                  <Download size={15} />
                  <span>{hasExported ? 'Download Archive Again' : 'Download Complete Archive (Excel CSV)'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Warning Notice */}
          <div style={{
            background: '#FEF2F2',
            border: '1px solid #FCA5A5',
            borderRadius: '10px',
            padding: '12px 14px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px'
          }}>
            <AlertTriangle size={18} color="#DC2626" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div style={{ fontSize: '0.8rem', color: '#991B1B', lineHeight: 1.45 }}>
              <strong>Permanent Action:</strong> Deleting this project permanently removes it from Supabase PostgreSQL tables and cloud storage. It cannot be recovered from the server once purged.
            </div>
          </div>

          {/* Confirmation Checkbox */}
          <label style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            cursor: 'pointer',
            fontSize: '0.84rem',
            color: '#1E293B',
            fontWeight: 600,
            userSelect: 'none',
            padding: '8px 4px'
          }}>
            <input
              type="checkbox"
              checked={isConfirmed}
              onChange={(e) => setIsConfirmed(e.target.checked)}
              style={{
                width: '18px',
                height: '18px',
                accentColor: '#DC2626',
                cursor: 'pointer',
                marginTop: '1px'
              }}
            />
            <span>
              I understand this action is permanent and want to delete project <strong>{project.id} ({project.name})</strong> to clean up space.
            </span>
          </label>
        </div>

        {/* Modal Footer */}
        <div className="portal-modal-footer" style={{
          padding: '16px 24px',
          background: '#F8FAFC',
          borderTop: '1px solid #E2E8F0',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px'
        }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={isDeleting}
            style={{ padding: '8px 18px', fontSize: '0.86rem' }}
          >
            Cancel
          </button>

          <button
            type="button"
            className="btn btn-danger"
            onClick={handleDelete}
            disabled={!isConfirmed || isDeleting}
            style={{
              padding: '8px 20px',
              fontSize: '0.86rem',
              fontWeight: 800,
              background: !isConfirmed || isDeleting ? '#FCA5A5' : '#DC2626',
              borderColor: !isConfirmed || isDeleting ? '#FCA5A5' : '#DC2626',
              color: '#FFFFFF',
              cursor: !isConfirmed || isDeleting ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Trash2 size={15} />
            <span>{isDeleting ? 'Deleting...' : 'Delete Project Permanently'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
