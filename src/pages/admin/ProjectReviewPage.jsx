import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Send, 
  CheckCircle, 
  ShieldAlert, 
  ShieldCheck, 
  FileText, 
  Key, 
  Download, 
  Eye, 
  Copy, 
  Check, 
  User, 
  Clock, 
  IndianRupee, 
  Layers, 
  FolderKanban,
  FileCheck2,
  ExternalLink,
  Calendar,
  Trash2,
  Globe
} from 'lucide-react';
import StatusBadge from '../../components/portal/StatusBadge';
import RevisionModal from '../../components/admin/RevisionModal';
import ApproveModal from '../../components/admin/ApproveModal';
import EmptyState from '../../components/portal/EmptyState';
import './ProjectReviewPage.css';

export default function ProjectReviewPage({ 
  project, 
  onBack, 
  onUpdateProject, 
  onNavigate 
}) {
  const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [revealedSecrets, setRevealedSecrets] = useState({});
  const [toastMessage, setToastMessage] = useState(null);

  if (!project) {
    return (
      <div className="portal-card">
        <EmptyState
          icon={FolderKanban}
          title="Project Not Found"
          description="The requested project could not be found."
          actionLabel="Back to Submitted Projects"
          onAction={onBack}
        />
      </div>
    );
  }

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const toggleSecret = (id) => {
    setRevealedSecrets(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    showToast('Copied to clipboard');
  };

  const handleDeleteCredential = (credId) => {
    const existingCreds = Array.isArray(project.credentials) ? project.credentials : [];
    const updatedCredentials = existingCreds.filter(c => c.id !== credId);
    if (onUpdateProject) {
      onUpdateProject({
        ...project,
        credentials: updatedCredentials
      });
    }
    showToast('✓ Credential permanently deleted by Admin');
  };

  const handleSendRevision = (revData) => {
    const timeStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    onUpdateProject({
      ...project,
      adminRejected: true,
      adminRejectedAt: new Date().toISOString(),
      adminRejectionComment: revData.adminRejectionComment || revData.revisionReason,
      adminFeedback: revData.adminRejectionComment || revData.revisionReason,
      adminRejectionDocument: revData.adminRejectionDocument,
      revisionReason: revData.revisionReason,
      revisionTask: revData.revisionTask,
      testerFinalized: false,
      status: 'Changes Requested',
      testingStatus: 'Changes Requested',
      testingActivity: [
        ...(project.testingActivity || []),
        {
          event: `Admin rejected submission & requested changes: "${revData.adminRejectionComment || revData.revisionReason}"`,
          time: timeStr,
          by: 'Admin'
        }
      ]
    });
    showToast('Changes requested. Developer & QA Tester have been notified.');
    setTimeout(() => onNavigate('admin/submitted-projects'), 800);
  };

  const handleApproveProject = (projectId) => {
    const timeStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    onUpdateProject({
      ...project,
      adminApproved: true,
      adminApprovedAt: new Date().toISOString(),
      adminRejected: false,
      status: 'Approved',
      testingStatus: 'Tester Approved',
      approvedDate: timeStr,
      testingActivity: [
        ...(project.testingActivity || []),
        {
          event: `Project approved by Admin`,
          time: timeStr,
          by: 'Admin'
        }
      ]
    });
    showToast('🎉 Project approved by Admin! Project has entered the payment clearance phase.');
    setTimeout(() => onNavigate('admin/projects'), 800);
  };

  return (
    <div className="project-review-container">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="project-detail-toast">
          <CheckCircle size={18} color="#10B981" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Bar */}
      <div className="review-top-nav">
        <button type="button" onClick={onBack} className="btn-back-link">
          <ArrowLeft size={16} />
          <span>Back to Submissions</span>
        </button>

        <div className="review-top-tags">
          <span className="project-id-chip">{project.id}</span>
          <StatusBadge status={project.status} />
        </div>
      </div>

      {/* Review Header Card */}
      <div className="portal-card review-header-card">
        <div className="review-header-left">
          <span className="review-pill-tag">Submission Review Mode</span>
          <h1 className="review-project-title">{project.name}</h1>
          <p className="review-project-meta">
            Submitted by <strong>{project.developer}</strong> on <strong>{project.submittedDate || project.assignedDate}</strong>
          </p>

          <div className="review-meta-strip">
            <div className="review-meta-item">
              <Calendar size={15} />
              <span>Assigned: <strong>{project.assignedDate}</strong></span>
            </div>
            <div className="review-meta-item">
              <Clock size={15} />
              <span>Deadline: <strong>{project.deadline}</strong></span>
            </div>
            <div className="review-meta-item">
              <IndianRupee size={15} />
              <span>Freelancer Payout: <strong style={{ color: '#0A3D75' }}>{project.freelancerPayout || project.developerPayment || '₹0'}</strong></span>
            </div>
            <div className="review-meta-item">
              <IndianRupee size={15} style={{ color: '#C2410C' }} />
              <span>Tester Payout: <strong style={{ color: '#C2410C' }}>{project.testerPayout || project.testerPayment || (project.testerPayoutNum !== undefined ? `₹${Number(project.testerPayoutNum).toLocaleString('en-IN')}` : (project.testerPaymentNum !== undefined ? `₹${Number(project.testerPaymentNum).toLocaleString('en-IN')}` : '₹0'))}</strong></span>
            </div>
          </div>
        </div>

        <div className="review-header-status-box">
          <div className="review-prog-circle">
            <div className="review-prog-val">{project.progress}%</div>
            <span className="review-prog-lbl">Milestones Complete</span>
          </div>
          <div className="review-tasks-count">
            {project.completedTasksCount || (project.tasks || []).length} / {project.totalTasksCount || (project.tasks || []).length} Tasks Done
          </div>
        </div>
      </div>

      {/* DEVELOPER SUBMISSION DELIVERABLES (LIVE URL & GOOGLE DRIVE LINK) */}
      <div className="portal-card" style={{ border: '1.5px solid #0A3D75', boxShadow: '0 4px 14px rgba(10, 61, 117, 0.08)' }}>
        <div className="portal-card-header" style={{ paddingBottom: '12px', borderBottom: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ExternalLink size={20} color="#F3821D" />
            <div>
              <h2 className="portal-card-title" style={{ color: '#0A3D75' }}>Developer Submission Deliverables</h2>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.82rem', color: '#64748B' }}>
                Inspect live application deployment and review project archive repository uploaded by {project.developer || 'Developer'}.
              </p>
            </div>
          </div>
          <span style={{ fontSize: '0.74rem', background: '#EFF6FF', color: '#1D4ED8', padding: '4px 12px', borderRadius: '9999px', fontWeight: 700 }}>
            Mandatory Links
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px', marginTop: '16px' }}>
          {/* 1. Live Hosted URL */}
          <div style={{ background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: '8px', padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#0A3D75', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Globe size={14} color="#16A34A" />
                Live Hosted Website URL
              </span>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: (project.liveLink || project.liveProjectLink) ? '#16A34A' : '#DC2626' }}>
                {(project.liveLink || project.liveProjectLink) ? '✓ Attached' : 'Not Provided'}
              </span>
            </div>

            {(project.liveLink || project.liveProjectLink) ? (
              <div>
                <a
                  href={project.liveLink || project.liveProjectLink}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: '#0284C7', fontWeight: 700, fontSize: '0.9rem', textDecoration: 'underline', wordBreak: 'break-all', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}
                >
                  <span>{project.liveLink || project.liveProjectLink}</span>
                  <ExternalLink size={13} />
                </a>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <a
                    href={project.liveLink || project.liveProjectLink}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-navy-action"
                    style={{ padding: '7px 14px', fontSize: '0.8rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <ExternalLink size={13} />
                    <span>Open Live Website</span>
                  </a>
                  <button
                    type="button"
                    className="btn btn-outline-action"
                    onClick={() => handleCopy(project.liveLink || project.liveProjectLink)}
                    style={{ padding: '7px 12px', fontSize: '0.8rem' }}
                  >
                    <Copy size={13} />
                    <span>Copy URL</span>
                  </button>
                </div>
              </div>
            ) : (
              <p style={{ margin: 0, fontSize: '0.84rem', color: '#94A3B8', fontStyle: 'italic' }}>
                Developer has not submitted the live hosted link yet.
              </p>
            )}
          </div>

          {/* 2. Google Drive Project File Link */}
          <div style={{ background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: '8px', padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#0A3D75', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FolderKanban size={14} color="#F3821D" />
                Google Drive Source Code ZIP
              </span>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: (project.driveLink || project.driveProjectLink) ? '#16A34A' : '#DC2626' }}>
                {(project.driveLink || project.driveProjectLink) ? '✓ Attached' : 'Not Provided'}
              </span>
            </div>

            {(project.driveLink || project.driveProjectLink) ? (
              <div>
                <a
                  href={project.driveLink || project.driveProjectLink}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: '#0A3D75', fontWeight: 700, fontSize: '0.9rem', textDecoration: 'underline', wordBreak: 'break-all', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}
                >
                  <span>{project.driveLink || project.driveProjectLink}</span>
                  <ExternalLink size={13} />
                </a>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <a
                    href={project.driveLink || project.driveProjectLink}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-orange-primary"
                    style={{ padding: '7px 14px', fontSize: '0.8rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <FolderKanban size={13} />
                    <span>Open Google Drive</span>
                  </a>
                  <button
                    type="button"
                    className="btn btn-outline-action"
                    onClick={() => handleCopy(project.driveLink || project.driveProjectLink)}
                    style={{ padding: '7px 12px', fontSize: '0.8rem' }}
                  >
                    <Copy size={13} />
                    <span>Copy Drive Link</span>
                  </button>
                </div>
              </div>
            ) : (
              <p style={{ margin: 0, fontSize: '0.84rem', color: '#94A3B8', fontStyle: 'italic' }}>
                Developer has not attached the Google Drive ZIP link yet.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Two Column Review Section */}
      <div className="review-two-col-grid">
        {/* Left Column: Requirements & Submission Notes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Submission Notes */}
          <div className="portal-card">
            <div className="portal-card-header">
              <h2 className="portal-card-title">
                <FileText size={18} color="#0A3D75" />
                <span>Freelancer Submission Notes</span>
              </h2>
            </div>
            <div className="review-notes-box">
              <p className="review-notes-text">
                {project.submissionNotes || 'All project tasks, assets, and credentials have been verified and submitted for review.'}
              </p>
            </div>
          </div>

          {/* Project Requirements Verification */}
          <div className="portal-card">
            <div className="portal-card-header">
              <h2 className="portal-card-title">
                <Layers size={18} color="#0A3D75" />
                <span>Requirements Checklist</span>
              </h2>
            </div>

            <div className="review-reqs-checklist">
              <div className="review-check-item">
                <div className="check-bullet done"><Check size={14} /></div>
                <div>
                  <strong>Client Scope Delivered</strong>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748B' }}>Matches required industrial B2B catalog theme</p>
                </div>
              </div>

              <div className="review-check-item">
                <div className="check-bullet done"><Check size={14} /></div>
                <div>
                  <strong>Responsive Mobile Compatibility</strong>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748B' }}>Verified breakpoints for tablet and mobile screens</p>
                </div>
              </div>

              <div className="review-check-item">
                <div className="check-bullet done"><Check size={14} /></div>
                <div>
                  <strong>Form & Webhook Functionality</strong>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748B' }}>Inquiry leads properly dispatching to corporate endpoint</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Submitted Files & Tasks */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Submitted Files */}
          <div className="portal-card">
            <div className="portal-card-header">
              <h2 className="portal-card-title">
                <FileCheck2 size={18} color="#0A3D75" />
                <span>Submitted Files & Source Code</span>
              </h2>
            </div>

            <div className="submitted-files-list">
              {(project.submittedFiles && project.submittedFiles.length > 0) ? (
                project.submittedFiles.map((file) => (
                  <div key={file.id} className="submitted-file-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <FileText size={22} color="#0A3D75" />
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#0F172A' }}>{file.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{file.size} • Submitted {file.date}</div>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="btn-doc-action"
                      onClick={() => showToast(`Downloading ${file.name}`)}
                    >
                      <Download size={14} />
                      <span>Download</span>
                    </button>
                  </div>
                ))
              ) : (
                <div style={{ fontSize: '0.85rem', color: '#64748B', padding: '8px 0' }}>
                  Source code linked via Git Repository credentials below.
                </div>
              )}
            </div>
          </div>

          {/* Task Completion Review */}
          <div className="portal-card">
            <div className="portal-card-header">
              <h2 className="portal-card-title">
                <CheckCircle size={18} color="#0A3D75" />
                <span>Completed Milestone Tasks</span>
              </h2>
            </div>

            <div className="review-tasks-list">
              {(project.tasks || []).map((t) => (
                <div key={t.id || t.number} className="review-task-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '8px', padding: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div className="task-done-dot"><Check size={12} color="#FFFFFF" strokeWidth={3} /></div>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A' }}>{t.number} {t.name}</span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: t.status === 'Completed' ? '#166534' : '#0A3D75', background: t.status === 'Completed' ? '#DCFCE7' : '#EBF3FA', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                      {t.progress || (t.status === 'Completed' ? 100 : 0)}% Done
                    </span>
                  </div>
                  {(t.notes || t.developerNotes || t.freelancerNotes) && (
                    <div style={{ background: '#F8FAFC', borderLeft: '3px solid #0A3D75', padding: '8px 10px', borderRadius: '4px', width: '100%', boxSizing: 'border-box' }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#0A3D75', display: 'block', marginBottom: '3px', textTransform: 'uppercase' }}>
                        Developer Note:
                      </span>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: '#334155', whiteSpace: 'pre-line', lineHeight: 1.4 }}>
                        {t.notes || t.developerNotes || t.freelancerNotes}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Section: Project Credentials Review Table */}
      <div className="portal-card">
        <div className="portal-card-header">
          <div>
            <h2 className="portal-card-title">
              <Key size={18} color="#0A3D75" />
              <span>Project Credentials & Deployment Keys</span>
            </h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.84rem', color: '#64748B' }}>
              Inspect and verify hosting logins, repository tokens, and API credentials provided by the freelancer.
            </p>
          </div>
        </div>

        {(project.credentials && project.credentials.length > 0) ? (
          <div className="portal-table-container">
            <table className="portal-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Platform</th>
                  <th>Email / Username</th>
                  <th>Password / Secret Key</th>
                  <th>Type</th>
                  <th>Credential Review Status</th>
                  <th>Notes</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {project.credentials.map((cred, idx) => {
                  const isRev = !!revealedSecrets[cred.id || idx];
                  return (
                    <tr key={cred.id || idx}>
                      <td style={{ color: '#94A3B8' }}>{idx + 1}</td>
                      <td style={{ fontWeight: 800, color: '#0A3D75' }}>{cred.platform || cred.service || cred.type}</td>
                      <td style={{ fontFamily: 'monospace' }}>{cred.username || '—'}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <code style={{ fontFamily: 'monospace', background: '#F1F5F9', padding: '3px 6px', borderRadius: '4px' }}>
                            {isRev ? cred.secret : '••••••••••••••••'}
                          </code>
                          <button type="button" className="btn-icon-secret" onClick={() => toggleSecret(cred.id || idx)}>
                            <Eye size={14} color="#64748B" />
                          </button>
                        </div>
                      </td>
                      <td><span className="cred-type-chip">{cred.type}</span></td>
                      <td>
                        <span style={{ fontSize: '0.74rem', fontWeight: 800, background: '#DCFCE7', color: '#166534', padding: '3px 8px', borderRadius: '4px' }}>
                          ✓ Verified & Provided
                        </span>
                      </td>
                      <td style={{ color: '#64748B', fontSize: '0.82rem' }}>{cred.notes || '—'}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                          <button type="button" className="btn-copy-cred" onClick={() => handleCopy(cred.secret)} title="Copy Secret">
                            <Copy size={13} />
                            <span>Copy</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to permanently delete credential for ${cred.platform || cred.service || 'this service'}? (Admin Only)`)) {
                                handleDeleteCredential(cred.id);
                              }
                            }}
                            title="Delete Credential (Admin Only)"
                            style={{
                              background: '#FEE2E2',
                              border: '1px solid #FECACA',
                              color: '#DC2626',
                              borderRadius: '6px',
                              padding: '5px 8px',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.15s'
                            }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: '16px', color: '#64748B', fontSize: '0.88rem' }}>
            No credentials provided in submission.
          </div>
        )}
      </div>

      {/* BOTTOM REVIEW DECISION BAR */}
      <div className="portal-card review-decision-card">
        <div className="review-decision-left">
          <h3 className="decision-title">Review Decision & Quality Approval</h3>
          <p className="decision-subtitle">
            Confirm that all requirements are met to disburse the Freelancer Payout of <strong style={{ color: '#0A3D75' }}>{project.freelancerPayout}</strong>, or request specific revisions.
          </p>
        </div>

        <div className="review-decision-btns">
          <button
            type="button"
            className="btn btn-navy-action btn-request-revision"
            onClick={() => setIsRevisionModalOpen(true)}
          >
            <ShieldAlert size={16} />
            <span>Request Revision</span>
          </button>

          <button
            type="button"
            className="btn btn-orange-primary btn-approve-project"
            onClick={() => setIsApproveModalOpen(true)}
          >
            <ShieldCheck size={18} />
            <span>Approve Project</span>
          </button>
        </div>
      </div>

      {/* Revision Modal */}
      <RevisionModal
        isOpen={isRevisionModalOpen}
        project={project}
        onClose={() => setIsRevisionModalOpen(false)}
        onRequestRevision={handleSendRevision}
      />

      {/* Approve Modal */}
      <ApproveModal
        isOpen={isApproveModalOpen}
        project={project}
        onClose={() => setIsApproveModalOpen(false)}
        onApprove={handleApproveProject}
      />
    </div>
  );
}
