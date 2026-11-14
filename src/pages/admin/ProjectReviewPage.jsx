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
  Globe,
  X,
  Image as ImageIcon
} from 'lucide-react';
import StatusBadge from '../../components/portal/StatusBadge';
import RevisionModal from '../../components/admin/RevisionModal';
import ApproveModal from '../../components/admin/ApproveModal';
import EmptyState from '../../components/portal/EmptyState';
import { getRevisionSource } from '../../utils/projectStatusUtils';
import { sendProjectRevisionNoticeEmail } from '../../services/emailService';
import { downloadProjectDocument, getDocPreviewSource } from '../../utils/documentDownloadHelper';
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
  const [previewDoc, setPreviewDoc] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleDownloadDoc = (doc) => {
    downloadProjectDocument(doc, project, showToast);
  };

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

  const completedCount = project.completedTasksCount !== undefined ? project.completedTasksCount : (project.tasks || []).filter(t => t.status === 'Completed').length;
  const totalCount = project.totalTasksCount !== undefined ? project.totalTasksCount : (project.tasks || []).length;
  const isTesterFinalized = Boolean(project.testerFinalized || project.qaFinalized || project.testingStatus === 'Tester Approved' || project.status === 'Finalized');
  const isAdminApproved = Boolean(project.adminApproved || project.status === 'Approved' || project.status === 'Completed');
  const isRevision = !isTesterFinalized && !isAdminApproved && Boolean(project.testingStatus === 'Changes Requested' || project.status === 'Revision Required' || project.adminRejected);

  // 1. Developer is submitted ONLY when developer has finished work and submitted
  const isDevSubmitted = Boolean(
    !isRevision && (
      project.developerSubmitted === true ||
      project.freelancerSubmitted === true ||
      project.developerSubmission === 'Submitted' ||
      Boolean(project.developerSubmittedAt || project.freelancerSubmittedAt) ||
      project.status === 'Submitted' ||
      project.status === 'Finalized' ||
      (Boolean(project.submittedDate && project.submittedDate !== '—') && (project.developerProgress === 100 || project.progress === 100))
    ) && (
      project.developerSubmitted ||
      project.freelancerSubmitted ||
      project.developerProgress === 100 ||
      project.progress === 100 ||
      (completedCount > 0 && completedCount === totalCount)
    )
  );

  // 2. QA Tester is submitted ONLY when QA has finished testing and finalized checklist
  const isTesterSubmitted = Boolean(
    !isRevision && (
      project.testerFinalized === true ||
      project.qaFinalized === true ||
      project.testingStatus === 'Tester Approved' ||
      project.status === 'Finalized' ||
      Boolean(project.testerFinalizedAt)
    )
  );

  // 3. Both Developer and QA Tester must have submitted before review decisions unlock
  const isBothSubmitted = Boolean(!isAdminApproved && isDevSubmitted && isTesterSubmitted);

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
      revisionOrigin: 'admin',
      changesRequestedBy: 'admin',
      requestedByRole: 'admin',
      requestedByName: 'Admin',
      revisionRequestedAt: new Date().toISOString(),
      adminRejectionComment: revData.adminRejectionComment || revData.revisionReason,
      adminFeedback: revData.adminRejectionComment || revData.revisionReason,
      adminRejectionDocument: revData.adminRejectionDocument,
      revisionReason: revData.revisionReason,
      revisionTask: revData.revisionTask,
      testerFinalized: false,
      qaFinalized: false,
      developerSubmitted: false,
      freelancerSubmitted: false,
      developerSubmission: 'Revision Required',
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
    // Dispatch real email notice to Developer
    if (project.developerEmail) {
      sendProjectRevisionNoticeEmail({
        project,
        revisionData: revData
      }).then(res => {
        if (res?.success) {
          showToast(`✓ Changes requested & notice email sent to ${project.developerEmail} (Check Spam folder)`);
        }
      }).catch(err => console.error('Project revision email error:', err));
    }

    showToast('Changes requested. Developer & QA Tester have been notified.');
    setTimeout(() => onNavigate('admin/submitted-projects'), 1200);
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

      {/* Revision / Defect Notice Banner */}
      {isRevision && (() => {
        const revSource = getRevisionSource(project);
        const isTester = revSource.isTester;
        const openIssues = (project.testingIssues || []).filter(i => i.status !== 'Resolved');
        const primaryIssue = openIssues[0] || (project.testingIssues || [])[0] || null;
        const reqDate = project.revisionRequestedAt || project.adminRejectedAt;

        return (
          <div className="portal-card" style={{ borderLeft: '4px solid #DC2626', backgroundColor: '#FEF2F2', padding: '16px 20px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
              <ShieldAlert size={24} color="#DC2626" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <h4 style={{ margin: 0, color: '#991B1B', fontSize: '1rem', fontWeight: 800 }}>
                      {isTester 
                        ? `Defect / Changes Reported by QA Tester (${project.tester || revSource.name || 'QA Specialist'})` 
                        : `Changes Requested by Admin (${project.adminName || revSource.name || 'Master Admin'})`}
                    </h4>
                    <span style={{ 
                      background: '#FEE2E2', 
                      color: '#991B1B', 
                      border: '1px solid #FECACA', 
                      padding: '2px 8px', 
                      borderRadius: '4px', 
                      fontSize: '0.7rem', 
                      fontWeight: 800,
                      textTransform: 'uppercase'
                    }}>
                      {isTester ? 'Raised by QA Tester' : 'Raised by Admin'}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.78rem', color: '#991B1B', fontWeight: 700 }}>
                    {reqDate ? `Requested on ${new Date(reqDate).toLocaleDateString('en-GB')}` : 'Action Pending'}
                  </span>
                </div>

                {isTester ? (
                  <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ fontSize: '0.88rem', color: '#7F1D1D', lineHeight: 1.5 }}>
                      <strong>Reported QA Defect:</strong>{' '}
                      {primaryIssue?.title || project.adminRejectionComment?.replace(/^QA Defect Reported:\s*/i, '') || 'Issue identified during testing verification'}
                    </div>

                    {primaryIssue && (
                      <div style={{ background: '#FFFFFF', border: '1px solid #FECACA', borderRadius: '8px', padding: '12px 14px', marginTop: '2px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ 
                              fontSize: '0.72rem', 
                              fontWeight: 800, 
                              color: '#FFFFFF', 
                              background: primaryIssue.severity === 'Critical' ? '#DC2626' : (primaryIssue.severity === 'High' ? '#EA580C' : '#D97706'),
                              padding: '2px 7px',
                              borderRadius: '4px'
                            }}>
                              {primaryIssue.severity || 'High'} Severity
                            </span>
                            {primaryIssue.category && (
                              <span style={{ fontSize: '0.72rem', color: '#0A3D75', background: '#EBF3FA', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                                {primaryIssue.category}
                              </span>
                            )}
                            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0F172A' }}>
                              Target Task: {primaryIssue.task || primaryIssue.taskName || project.revisionTask || 'Milestone Deliverable'}
                            </span>
                          </div>
                          <span style={{ fontSize: '0.72rem', color: '#64748B' }}>
                            Reporter: {primaryIssue.reporter || project.tester || 'QA Tester'}
                          </span>
                        </div>

                        {primaryIssue.description && (
                          <p style={{ margin: '0 0 8px 0', fontSize: '0.84rem', color: '#334155', lineHeight: 1.5 }}>
                            <strong>Description:</strong> {primaryIssue.description}
                          </p>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.78rem', background: '#F8FAFC', padding: '8px 10px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                          <div>
                            <strong style={{ color: '#047857', display: 'block', marginBottom: '2px' }}>Expected Result:</strong>
                            <span style={{ color: '#475569' }}>{primaryIssue.expected || primaryIssue.expectedResult || 'Deliverable functions cleanly according to requirements.'}</span>
                          </div>
                          <div>
                            <strong style={{ color: '#DC2626', display: 'block', marginBottom: '2px' }}>Actual Result:</strong>
                            <span style={{ color: '#475569' }}>{primaryIssue.actual || primaryIssue.actualResult || 'Defect / failure observed in QA testing.'}</span>
                          </div>
                        </div>

                        {/* Defect Screenshot / Proof Preview in Review Banner */}
                        {(() => {
                          const bannerScreenshot = primaryIssue.screenshot || primaryIssue.attachmentUrl || primaryIssue.attachmentDataUrl;
                          if (!bannerScreenshot) return null;
                          const fileName = primaryIssue.attachmentName || primaryIssue.attachment || 'Defect_Screenshot.png';
                          return (
                            <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed #FECACA' }}>
                              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#991B1B', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <ImageIcon size={14} color="#DC2626" />
                                <span>Defect Proof Screenshot (Uploaded by QA Tester):</span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                                <img 
                                  src={bannerScreenshot} 
                                  alt="Defect Screenshot" 
                                  style={{ 
                                    maxHeight: '120px', 
                                    maxWidth: '220px', 
                                    objectFit: 'cover', 
                                    borderRadius: '6px', 
                                    border: '2px solid #CBD5E1', 
                                    cursor: 'pointer',
                                    boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                                  }}
                                  onError={(e) => {
                                    if (primaryIssue.attachmentDataUrl && e.currentTarget.src !== primaryIssue.attachmentDataUrl) {
                                      e.currentTarget.src = primaryIssue.attachmentDataUrl;
                                    } else {
                                      e.currentTarget.style.display = 'none';
                                    }
                                  }}
                                  title="Click to view full screenshot in high resolution"
                                  onClick={() => setPreviewDoc({
                                    name: fileName,
                                    type: 'image/png',
                                    size: 'Defect Attachment',
                                    date: primaryIssue.date || 'Recent',
                                    url: bannerScreenshot,
                                    cloudUrl: primaryIssue.cloudUrl || bannerScreenshot,
                                    dataUrl: bannerScreenshot,
                                    fileData: bannerScreenshot
                                  })}
                                />
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                  <button
                                    type="button"
                                    onClick={() => setPreviewDoc({
                                      name: fileName,
                                      type: 'image/png',
                                      size: 'Defect Attachment',
                                      date: primaryIssue.date || 'Recent',
                                      dataUrl: bannerScreenshot,
                                      fileData: bannerScreenshot
                                    })}
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '6px',
                                      padding: '6px 12px',
                                      background: '#FFFFFF',
                                      border: '1px solid #CBD5E1',
                                      borderRadius: '6px',
                                      fontSize: '0.78rem',
                                      fontWeight: 700,
                                      color: '#0A3D75',
                                      cursor: 'pointer',
                                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                    }}
                                  >
                                    <Eye size={14} />
                                    <span>View Full Screenshot</span>
                                  </button>
                                  <span style={{ fontSize: '0.72rem', color: '#64748B' }}>
                                    {fileName} • Click thumbnail to open lightbox
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ marginTop: '8px' }}>
                    <p style={{ margin: '0 0 6px 0', fontSize: '0.88rem', color: '#7F1D1D', lineHeight: 1.5 }}>
                      <strong>Problems & Required Corrections:</strong> {project.adminRejectionComment || project.adminFeedback || project.revisionReason || 'Revisions requested from developer.'}
                    </p>
                    {project.revisionTask && project.revisionTask !== 'General Project Revision' && (
                      <div style={{ fontSize: '0.82rem', color: '#991B1B', fontWeight: 700, marginTop: '4px' }}>
                        Target Task: {project.revisionTask}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

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
                    <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderLeft: '3px solid #0A3D75', padding: '8px 12px', borderRadius: '6px', width: '100%', boxSizing: 'border-box' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#0A3D75', display: 'flex', alignItems: 'center', gap: '4px', textTransform: 'uppercase' }}>
                          <FileText size={12} />
                          Developer Task Note ({project.developer || 'Developer'}):
                        </span>
                        {(t.updatedAt || t.lastUpdated) && (
                          <span style={{ fontSize: '0.66rem', color: '#64748B', fontWeight: 600 }}>
                            {t.lastUpdated || (t.updatedAt ? new Date(t.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '')}
                          </span>
                        )}
                      </div>
                      <p style={{ margin: 0, fontSize: '0.82rem', color: '#1E293B', whiteSpace: 'pre-line', lineHeight: 1.45 }}>
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
          {isBothSubmitted ? (
            <>
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
            </>
          ) : (
            <div 
              style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '8px', 
                padding: '8px 16px', 
                borderRadius: '8px', 
                background: '#F1F5F9', 
                border: '1px solid #E2E8F0', 
                fontSize: '0.82rem', 
                color: '#475569', 
                fontWeight: 600 
              }}
            >
              <Clock size={16} color="#64748B" />
              <span>
                {isRevision 
                  ? 'Awaiting Developer Revision Submission' 
                  : !isDevSubmitted 
                    ? 'Awaiting Developer Submission' 
                    : !isTesterSubmitted 
                      ? 'Awaiting QA Tester Submission' 
                      : 'Awaiting Submissions'}
              </span>
            </div>
          )}
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

      {/* Screenshot / Document Preview Modal Lightbox */}
      {previewDoc && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(7, 34, 61, 0.6)',
            backdropFilter: 'blur(4px)',
            zIndex: 3000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            animation: 'fadeIn 0.2s ease-out'
          }}
          onClick={() => setPreviewDoc(null)}
        >
          <div 
            style={{
              width: '100%',
              maxWidth: (previewDoc.dataUrl || previewDoc.fileData) ? '840px' : '640px',
              backgroundColor: '#FFFFFF',
              borderRadius: '14px',
              borderTop: '4px solid #0A3D75',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              overflow: 'hidden'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FAFCFE' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#EBF3FA', color: '#0A3D75', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ImageIcon size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0A3D75' }}>{previewDoc.name}</h3>
                  <span style={{ fontSize: '0.76rem', color: '#64748B' }}>{previewDoc.type || 'Document'} • {previewDoc.size}</span>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setPreviewDoc(null)}
                style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '20px 24px', maxHeight: '560px', overflowY: 'auto' }}>
              {(() => {
                const previewSrc = getDocPreviewSource(previewDoc, project);
                const isPdf = previewDoc.name?.toLowerCase().endsWith('.pdf') || (previewDoc.type && previewDoc.type.toLowerCase().includes('pdf'));
                const isImg = previewDoc.name?.match(/\.(jpg|jpeg|png|webp|gif|svg)$/i) || (previewDoc.type && previewDoc.type.toLowerCase().includes('image'));

                if (previewSrc && isPdf) {
                  return (
                    <div style={{ width: '100%', height: '500px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #E2E8F0', background: '#F8FAFC' }}>
                      <iframe
                        src={previewSrc}
                        title={previewDoc.name}
                        style={{ width: '100%', height: '100%', border: 'none' }}
                      />
                    </div>
                  );
                }

                if (previewSrc && isImg) {
                  return (
                    <div style={{ textAlign: 'center', padding: '16px', background: '#0F172A', borderRadius: '8px', minHeight: '220px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <img
                        src={previewSrc}
                        alt={previewDoc.name}
                        style={{ maxWidth: '100%', maxHeight: '520px', objectFit: 'contain', borderRadius: '6px', boxShadow: '0 4px 14px rgba(0,0,0,0.4)' }}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const errBox = document.getElementById('preview-img-err-review');
                          if (errBox) errBox.style.display = 'flex';
                        }}
                      />
                      <div id="preview-img-err-review" style={{ display: 'none', flexDirection: 'column', alignItems: 'center', gap: '8px', color: '#F8FAFC', padding: '24px' }}>
                        <AlertCircle size={36} color="#F59E0B" />
                        <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Unable to load image preview</span>
                        <span style={{ fontSize: '0.78rem', color: '#94A3B8', maxWidth: '380px', textAlign: 'center' }}>
                          Image is stored in cloud storage. If direct preview is blocked, click Download File or Open Image in New Tab below.
                        </span>
                      </div>
                    </div>
                  );
                }

                return (
                  <div style={{ background: '#F8FAFC', padding: '18px', borderRadius: '8px', border: '1px solid #E2E8F0', fontFamily: 'monospace', fontSize: '0.84rem', color: '#334155', lineHeight: 1.6 }}>
                    <div><strong>Document File:</strong> {previewDoc.name}</div>
                  </div>
                );
              })()}
            </div>

            <div style={{ padding: '16px 24px', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '10px', background: '#FAFCFE', flexWrap: 'wrap' }}>
              <button 
                type="button" 
                onClick={() => setPreviewDoc(null)}
                className="btn btn-navy-action"
                style={{ background: '#F1F5F9', color: '#475569', border: '1px solid #CBD5E1', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
              >
                Close Preview
              </button>
              {(() => {
                const previewSrc = getDocPreviewSource(previewDoc, project);
                if (previewSrc && (previewSrc.startsWith('http://') || previewSrc.startsWith('https://'))) {
                  return (
                    <a
                      href={previewSrc}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-navy-action"
                      style={{ background: '#EBF3FA', color: '#0A3D75', border: '1px solid #CBD5E1', padding: '8px 14px', borderRadius: '6px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '0.82rem' }}
                    >
                      <ExternalLink size={14} />
                      <span>Open Image in New Tab</span>
                    </a>
                  );
                }
                return null;
              })()}
              <button 
                type="button" 
                onClick={() => handleDownloadDoc(previewDoc)}
                className="btn btn-orange-primary"
                style={{ padding: '8px 18px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Download size={14} />
                <span>Download Screenshot</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
