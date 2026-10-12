import React, { useState, useRef } from 'react';
import { 
  ArrowLeft, 
  UserCheck, 
  Calendar, 
  Clock, 
  IndianRupee, 
  Send, 
  CheckCircle, 
  ShieldAlert, 
  FileText, 
  Key, 
  CheckSquare, 
  History, 
  Download, 
  Eye, 
  Plus, 
  User, 
  Layers, 
  Copy, 
  Check, 
  ShieldCheck,
  AlertCircle,
  AlertOctagon,
  RefreshCw,
  Sparkles,
  Trash2,
  ExternalLink,
  FolderKanban,
  UploadCloud,
  Globe
} from 'lucide-react';
import StatusBadge from '../../components/portal/StatusBadge';
import EmptyState from '../../components/portal/EmptyState';
import AssignmentModal from '../../components/admin/AssignmentModal';
import AssignTesterModal from '../../components/admin/AssignTesterModal';
import RevisionModal from '../../components/admin/RevisionModal';
import CredentialModal from '../../components/portal/CredentialModal';
import { initialDevelopers } from '../../data/adminMockData';
import { initialTesters } from '../../data/testerMockData';
import { downloadProjectDocument, getDocPreviewSource } from '../../utils/documentDownloadHelper';
import './AdminProjectDetailPage.css';

export default function AdminProjectDetailPage({ 
  project, 
  developers = initialDevelopers,
  testers = initialTesters,
  onBack, 
  onUpdateProject, 
  onNavigate 
}) {
  const [activeTab, setActiveTab] = useState('overview');
  const [isAssignDevModalOpen, setIsAssignDevModalOpen] = useState(false);
  const [isAssignTesterModalOpen, setIsAssignTesterModalOpen] = useState(false);
  const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false);
  const [isCredModalOpen, setIsCredModalOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [revealedSecrets, setRevealedSecrets] = useState({});
  const [toastMessage, setToastMessage] = useState(null);
  const adminDocInputRef = useRef(null);

  if (!project) {
    return (
      <div className="portal-card">
        <EmptyState
          icon={Layers}
          title="Project Not Found"
          description="The requested project could not be found."
          actionLabel="Back to Projects"
          onAction={onBack}
        />
      </div>
    );
  }

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const toggleSecret = (id) => {
    setRevealedSecrets(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    showToast('Copied to clipboard');
  };

  const handleDownloadDoc = (doc) => {
    downloadProjectDocument(doc, project, showToast);
  };

  const handleAdminUploadDoc = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const existingDocs = Array.isArray(project.documents) ? project.documents : [];
    let addedCount = 0;

    files.forEach(file => {
      const sizeInMB = file.size / (1024 * 1024);
      if (sizeInMB > 15) {
        showToast(`File ${file.name} exceeds 15 MB limit`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target.result;
        const newDoc = {
          id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          name: file.name,
          type: file.type || (file.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'Specification Document'),
          size: sizeInMB < 0.1 ? `${(file.size / 1024).toFixed(1)} KB` : `${sizeInMB.toFixed(1)} MB`,
          dataUrl: dataUrl,
          fileData: dataUrl,
          url: dataUrl,
          date: new Date().toLocaleDateString('en-GB'),
          status: 'Uploaded'
        };
        const updated = [...(project.documents || []), newDoc];
        if (onUpdateProject) {
          onUpdateProject({
            ...project,
            documents: updated
          });
        }
        showToast(`✓ Uploaded ${file.name}`);
      };
      reader.readAsDataURL(file);
    });

    if (adminDocInputRef.current) adminDocInputRef.current.value = '';
  };

  const handleDeleteDoc = (docId) => {
    const existingDocs = Array.isArray(project.documents) ? project.documents : [];
    const updatedDocs = existingDocs.filter(d => d.id !== docId);
    if (onUpdateProject) {
      onUpdateProject({
        ...project,
        documents: updatedDocs
      });
    }
    showToast('Document removed from project');
  };

  const handleAddCredential = (newCred) => {
    const existingCreds = Array.isArray(project.credentials) ? project.credentials : [];
    const updatedCredentials = [...existingCreds, newCred];
    if (onUpdateProject) {
      onUpdateProject({
        ...project,
        credentials: updatedCredentials
      });
    }
    showToast('✓ Credential added successfully by Admin');
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

  // Find dynamic details for assigned developer
  const currentDevObj = (developers || []).find(
    d => d.id === project.developerId || d.name === project.developer
  ) || {
    id: project.developerId || '—',
    name: project.developer || 'Unassigned',
    primarySkill: project.developerSkill || 'Frontend Developer',
    avatar: project.developerAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=160',
    activeProjectsCount: 0,
    availability: 'Available'
  };

  const currentDevActiveCount = currentDevObj.activeProjectsCount !== undefined
    ? currentDevObj.activeProjectsCount
    : (Array.isArray(currentDevObj.currentProjects) ? currentDevObj.currentProjects.filter(p => p.status !== 'Completed').length : 0);
  const currentDevAvailability = currentDevObj.status === 'Active'
    ? (currentDevActiveCount > 0 ? 'Busy' : 'Available')
    : (currentDevObj.availability || 'Available');

  // Find dynamic details for assigned tester
  const currentTesterObj = (testers || []).find(
    t => t.id === project.testerId || t.name === project.tester
  ) || {
    id: project.testerId || '—',
    name: project.tester || 'Unassigned',
    specialization: project.testerSpecialization || 'Lead QA Engineer',
    avatar: project.testerAvatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=160',
    activeTestingProjects: 0,
    availability: 'Available'
  };

  const currentTesterActiveCount = currentTesterObj.activeTestingProjects !== undefined
    ? currentTesterObj.activeTestingProjects
    : (Array.isArray(currentTesterObj.currentProjects) ? currentTesterObj.currentProjects.filter(p => p.status !== 'Completed').length : 0);
  const currentTesterAvailability = currentTesterObj.status === 'Active'
    ? (currentTesterActiveCount > 0 ? 'Busy' : 'Available')
    : (currentTesterObj.availability || 'Available');

  const completedCount = project.completedTasksCount !== undefined ? project.completedTasksCount : (project.tasks || []).filter(t => t.status === 'Completed').length;
  const totalCount = project.totalTasksCount !== undefined ? project.totalTasksCount : (project.tasks || []).length;

  const isTesterFinalized = Boolean(project.testerFinalized || project.qaFinalized || project.testingStatus === 'Tester Approved' || project.testingStatus === 'Finalized' || project.status === 'Finalized');
  const isTesterApproved = Boolean(project.testingStatus === 'Tester Approved' || isTesterFinalized);
  const isAdminApproved = Boolean(project.adminApproved || project.status === 'Approved' || project.status === 'Completed');
  const isRevision = Boolean(project.testingStatus === 'Changes Requested' || project.status === 'Revision Required' || project.adminRejected);
  const isFinalizedOrLocked = Boolean(isTesterFinalized || isTesterApproved || isAdminApproved || project.status === 'Finalized' || project.status === 'Approved' || project.status === 'Completed');

  const handleAssignDeveloper = (assignData) => {
    if (isFinalizedOrLocked) {
      showToast('Cannot reassign developer: Project is already finalized or completed.');
      setIsAssignDevModalOpen(false);
      return;
    }

    const updatedHistory = [
      ...(project.assignmentHistory || []),
      { 
        developer: assignData.developer, 
        tester: project.tester || 'Unassigned', 
        assignedDate: assignData.assignedDate, 
        status: 'Developer Reassigned', 
        updated: assignData.note || `Developer changed to ${assignData.developer}` 
      }
    ];

    onUpdateProject({
      ...project,
      developer: assignData.developer,
      developerId: assignData.developerId,
      developerEmail: assignData.developerEmail || project.developerEmail || '',
      developerSkill: assignData.developerSkill,
      developerAvatar: assignData.developerAvatar,
      assignedDate: assignData.assignedDate,
      assignmentHistory: updatedHistory
    });
    showToast(`Developer changed to ${assignData.developer}`);
  };

  const handleAssignTester = (testerData) => {
    if (isFinalizedOrLocked) {
      showToast('Cannot change QA tester: Project is already finalized or completed.');
      setIsAssignTesterModalOpen(false);
      return;
    }

    const updatedHistory = [
      ...(project.assignmentHistory || []),
      { 
        developer: project.developer, 
        tester: testerData.tester, 
        assignedDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }), 
        status: 'QA Tester Reassigned', 
        updated: testerData.note || `QA Tester changed to ${testerData.tester}` 
      }
    ];

    onUpdateProject({
      ...project,
      tester: testerData.tester,
      testerId: testerData.testerId,
      testerEmail: testerData.testerEmail || project.testerEmail || '',
      testerSpecialization: testerData.testerSpecialization,
      testerAvatar: testerData.testerAvatar,
      assignmentHistory: updatedHistory
    });
    showToast(`QA Tester changed to ${testerData.tester}`);
  };

  // 1. Developer is submitted ONLY when developer has completed milestone work and formally submitted
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

  // 2. QA Tester is submitted ONLY when QA has finished testing and finalized / approved checklist
  const isTesterSubmitted = Boolean(
    !isRevision && (
      project.testerFinalized === true ||
      project.qaFinalized === true ||
      project.testingStatus === 'Tester Approved' ||
      project.status === 'Finalized' ||
      Boolean(project.testerFinalizedAt)
    )
  );

  // 3. Both Developer and QA Tester must have submitted before Admin approval / rejection buttons appear
  const isBothSubmitted = Boolean(!isAdminApproved && isDevSubmitted && isTesterSubmitted);

  const handleApproveProject = () => {
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
          event: `Project approved by Master Admin`,
          time: timeStr,
          by: 'Admin'
        }
      ]
    });
    showToast('🎉 Project successfully Approved! Project has entered the payment clearance phase.');
  };

  const handleSendRevision = (revData) => {
    const timeStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    
    // If revision document is attached, also add to project documents list for universal access
    let updatedDocs = Array.isArray(project.documents) ? [...project.documents] : [];
    if (revData.adminRejectionDocument) {
      updatedDocs = [
        ...updatedDocs,
        {
          id: `rev-doc-${Date.now()}`,
          name: revData.adminRejectionDocument.name,
          type: revData.adminRejectionDocument.type || 'Revision Document',
          size: revData.adminRejectionDocument.size || '1.0 MB',
          dataUrl: revData.adminRejectionDocument.dataUrl,
          fileData: revData.adminRejectionDocument.fileData || revData.adminRejectionDocument.dataUrl,
          url: revData.adminRejectionDocument.url || revData.adminRejectionDocument.dataUrl,
          date: timeStr,
          status: 'Revision Note'
        }
      ];
    }

    // If specific task is targeted, reset its status to Pending / Changes Requested
    let updatedTasks = Array.isArray(project.tasks) ? [...project.tasks] : [];
    if (revData.revisionTask && revData.revisionTask !== 'General Project Revision') {
      updatedTasks = updatedTasks.map(t => {
        const taskIdentifier = `${t.number} ${t.name}`;
        if (taskIdentifier === revData.revisionTask || t.name === revData.revisionTask || t.id === revData.revisionTask) {
          return {
            ...t,
            status: 'In Progress',
            qaStatus: 'Failed',
            progress: 50,
            qaNotes: `Admin requested changes: ${revData.adminRejectionComment || revData.revisionReason}`
          };
        }
        return t;
      });
    }

    const updatedProject = {
      ...project,
      adminRejected: true,
      adminRejectedAt: new Date().toISOString(),
      adminRejectionComment: revData.adminRejectionComment || revData.revisionReason,
      adminFeedback: revData.adminRejectionComment || revData.revisionReason,
      adminRejectionDocument: revData.adminRejectionDocument,
      revisionReason: revData.revisionReason,
      testerFinalized: false,
      qaFinalized: false,
      developerSubmitted: false,
      freelancerSubmitted: false,
      developerSubmission: 'Revision Required',
      status: 'Changes Requested',
      testingStatus: 'Changes Requested',
      documents: updatedDocs,
      tasks: updatedTasks,
      testingActivity: [
        ...(project.testingActivity || []),
        {
          event: `Admin rejected submission & requested changes: "${revData.adminRejectionComment || revData.revisionReason}"`,
          time: timeStr,
          by: 'Admin'
        }
      ]
    };

    if (onUpdateProject) {
      onUpdateProject(updatedProject);
    }
    showToast('✓ Changes requested! Developer & QA Tester have been notified.');
  };

  return (
    <div className="admin-project-detail-container">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="project-detail-toast">
          <CheckCircle size={18} color="#10B981" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Breadcrumb & Action Toolbar */}
      <div className="admin-detail-top-nav">
        <button type="button" onClick={onBack} className="btn-back-link">
          <ArrowLeft size={16} />
          <span>Back to Projects</span>
        </button>

        <div className="admin-detail-header-actions">
          {/* Reassign Developer & Change QA Tester: Available ONLY before project is finalized */}
          {!isFinalizedOrLocked && (
            <>
              <button
                type="button"
                className="btn btn-navy-action"
                onClick={() => setIsAssignDevModalOpen(true)}
              >
                <UserCheck size={15} />
                <span>Reassign Developer</span>
              </button>

              <button
                type="button"
                className="btn btn-navy-action"
                style={{ background: '#FFF7ED', color: '#C2410C', borderColor: '#FDBA74' }}
                onClick={() => setIsAssignTesterModalOpen(true)}
              >
                <ShieldCheck size={15} />
                <span>Change QA Tester</span>
              </button>
            </>
          )}

          {/* Action Buttons: Unlock ONLY when BOTH Developer AND QA Tester have submitted their sides */}
          {!isAdminApproved && isBothSubmitted && (
            <>
              <button
                type="button"
                className="btn btn-navy-action"
                style={{ background: '#FEF2F2', color: '#DC2626', borderColor: '#FCA5A5' }}
                onClick={() => setIsRevisionModalOpen(true)}
              >
                <ShieldAlert size={15} />
                <span>Reject & Request Changes</span>
              </button>

              <button
                type="button"
                className="btn btn-orange-primary"
                onClick={handleApproveProject}
                style={{ background: '#10B981', borderColor: '#10B981' }}
              >
                <CheckCircle size={15} />
                <span>Approve Project</span>
              </button>
            </>
          )}

          {/* Pending submission indicator when both have not yet submitted */}
          {!isAdminApproved && !isBothSubmitted && (
            <div 
              style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '7px', 
                padding: '6px 14px', 
                borderRadius: '8px', 
                background: '#F1F5F9', 
                border: '1px solid #E2E8F0', 
                fontSize: '0.8rem', 
                color: '#475569', 
                fontWeight: 600 
              }}
              title="Admin approval and change request options unlock only after both Developer and QA Tester have submitted their work."
            >
              <Clock size={14} color="#64748B" />
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

          {isAdminApproved && (
            <button
              type="button"
              className="btn btn-orange-primary"
              onClick={() => onNavigate && onNavigate('admin/earnings')}
              style={{ background: '#0A3D75' }}
            >
              <IndianRupee size={15} />
              <span>View Financial Settlements</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Project Hero Card */}
      <div className="project-hero-card admin-hero-card">
        <div className="project-hero-main">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span className="hero-category-badge">{project.projectType || 'Corporate Website'}</span>
            <span className="project-id-chip">{project.id}</span>
            <StatusBadge status={project.status} />
          </div>

          <h1 className="hero-project-title">{project.name}</h1>
          <p className="hero-project-client">
            {project.description || 'Industrial web application deliverable.'}
          </p>

          <div className="hero-meta-grid">
            <div className="hero-meta-item">
              <Calendar size={16} className="meta-icon" />
              <div>
                <span className="meta-lbl">Assigned Date</span>
                <span className="meta-val">{project.assignedDate}</span>
              </div>
            </div>

            <div className="hero-meta-item">
              <Clock size={16} className="meta-icon" />
              <div>
                <span className="meta-lbl">Deadline</span>
                <span className="meta-val" style={{ color: isRevision ? '#EF4444' : '#0A3D75', fontWeight: 800 }}>
                  {project.deadline || project.completedDate || 'Ongoing'}
                </span>
              </div>
            </div>

            <div className="hero-meta-item">
              <IndianRupee size={16} className="meta-icon" />
              <div>
                <span className="meta-lbl">Freelancer Payout</span>
                <span className="meta-val" style={{ color: '#0A3D75', fontWeight: 800 }}>
                  {project.freelancerPayout || project.developerPayment || '₹0'}
                </span>
              </div>
            </div>

            <div className="hero-meta-item">
              <IndianRupee size={16} className="meta-icon" style={{ color: '#F3821D', background: '#FFF7ED' }} />
              <div>
                <span className="meta-lbl">Tester Payout</span>
                <span className="meta-val" style={{ color: '#C2410C', fontWeight: 800 }}>
                  {project.testerPayout || project.testerPayment || (project.testerPayoutNum !== undefined ? `₹${Number(project.testerPayoutNum).toLocaleString('en-IN')}` : (project.testerPaymentNum !== undefined ? `₹${Number(project.testerPaymentNum).toLocaleString('en-IN')}` : '₹0'))}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Dual Progress Box for Admin */}
        <div className="project-hero-progress-box" style={{ minWidth: '280px' }}>
          {/* Progress 1: Dev Progress */}
          <div style={{ marginBottom: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 700, color: '#0A3D75', marginBottom: '4px' }}>
              <span>Developer Progress</span>
              <span>{project.developerProgress || project.progress || 0}%</span>
            </div>
            <div className="progress-bar-track">
              <div 
                className="progress-bar-fill" 
                style={{ 
                  width: `${project.developerProgress || project.progress || 0}%`,
                  backgroundColor: '#0A3D75'
                }} 
              />
            </div>
            <span style={{ fontSize: '0.7rem', color: '#64748B' }}>{completedCount} of {totalCount} Tasks Done</span>
          </div>

          {/* Progress 2: QA Testing Progress */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 700, color: '#C2410C', marginBottom: '4px' }}>
              <span>QA Testing Progress</span>
              <span>{project.testingProgress || 0}%</span>
            </div>
            <div className="progress-bar-track">
              <div 
                className="progress-bar-fill" 
                style={{ 
                  width: `${project.testingProgress || 0}%`,
                  backgroundColor: '#F3821D'
                }} 
              />
            </div>
            <span style={{ fontSize: '0.7rem', color: '#64748B' }}>Status: {project.testingStatus || 'Awaiting Testing'}</span>
          </div>
        </div>
      </div>

      {/* Changes Requested / Rejection Banner */}
      {isRevision && (
        <div className="portal-card" style={{ borderLeft: '4px solid #DC2626', backgroundColor: '#FEF2F2', padding: '16px 20px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
            <ShieldAlert size={24} color="#DC2626" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ margin: 0, color: '#991B1B', fontSize: '0.98rem', fontWeight: 800 }}>Changes Requested by Admin</h4>
                <span style={{ fontSize: '0.78rem', color: '#991B1B', fontWeight: 700 }}>
                  {project.adminRejectedAt ? `Requested on ${new Date(project.adminRejectedAt).toLocaleDateString('en-GB')}` : 'Action Pending'}
                </span>
              </div>
              <p style={{ margin: '6px 0 0 0', fontSize: '0.88rem', color: '#7F1D1D', lineHeight: 1.5 }}>
                <strong>Problems & Required Corrections:</strong> {project.adminRejectionComment || project.adminFeedback || project.revisionReason || 'Revisions requested from developer.'}
              </p>
              {project.revisionTask && project.revisionTask !== 'General Project Revision' && (
                <div style={{ fontSize: '0.82rem', color: '#991B1B', fontWeight: 700, marginTop: '4px' }}>
                  Target Task: {project.revisionTask}
                </div>
              )}
              {project.adminRejectionDocument && (
                <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={15} color="#DC2626" />
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#991B1B' }}>
                    {typeof project.adminRejectionDocument === 'string' ? project.adminRejectionDocument : (project.adminRejectionDocument.name || 'Revision_Guidelines.pdf')}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDownloadDoc(typeof project.adminRejectionDocument === 'object' ? project.adminRejectionDocument : { name: project.adminRejectionDocument, type: 'PDF', size: '1.5 MB', date: 'Revision' })}
                    style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', fontWeight: 800, textDecoration: 'underline' }}
                  >
                    <Download size={13} />
                    <span>Download Attached File</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= PROJECT TEAM SECTION ================= */}
      <div className="portal-card" style={{ padding: '1.25rem 1.5rem', background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#07223D' }}>Project Team</h3>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: '#64748B' }}>Assigned Developer and QA Specialist responsibilities</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          {/* Card 1: DEVELOPER */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '1.15rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#0A3D75', letterSpacing: '0.05em' }}>DEVELOPER (BUILDER)</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {(project.developerTransactionId || project.transactionId) && (
                  <span style={{ fontSize: '0.68rem', background: '#DCFCE7', color: '#15803D', padding: '1px 6px', borderRadius: '4px', fontFamily: 'monospace', fontWeight: 700 }}>
                    Txn: {project.developerTransactionId || project.transactionId}
                  </span>
                )}
                <span style={{ fontSize: '0.72rem', background: '#EFF6FF', color: '#1D4ED8', padding: '2px 8px', borderRadius: '9999px', fontWeight: 700 }}>
                  {project.developerProgress || project.progress || 0}% Progress
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <img 
                src={currentDevObj.avatar} 
                alt={currentDevObj.name} 
                style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #0A3D75' }}
              />
              <div>
                <strong style={{ fontSize: '0.95rem', color: '#07223D', display: 'block' }}>{currentDevObj.name}</strong>
                <span style={{ fontSize: '0.78rem', color: '#64748B' }}>{currentDevObj.primarySkill || 'Frontend Developer'} • {currentDevActiveCount} Active Projects</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem', borderTop: '1px solid #F1F5F9', fontSize: '0.75rem', color: '#64748B' }}>
              <span>Availability: <strong style={{ color: currentDevAvailability === 'Available' ? '#16A34A' : '#D97706' }}>{currentDevAvailability}</strong></span>
              {!isFinalizedOrLocked && (
                <button 
                  type="button" 
                  onClick={() => setIsAssignDevModalOpen(true)}
                  style={{ background: 'none', border: 'none', color: '#0A3D75', fontWeight: 700, cursor: 'pointer' }}
                >
                  Change Developer →
                </button>
              )}
            </div>
          </div>

          {/* Card 2: TESTER */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '1.15rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#C2410C', letterSpacing: '0.05em' }}>QA TESTER (INSPECTOR)</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {(project.testerTransactionId || project.testerPaymentTxnId) && (
                  <span style={{ fontSize: '0.68rem', background: '#F5F3FF', color: '#7C3AED', padding: '1px 6px', borderRadius: '4px', fontFamily: 'monospace', fontWeight: 700 }}>
                    Txn: {project.testerTransactionId || project.testerPaymentTxnId}
                  </span>
                )}
                <span className={`qa-table-badge ${
                  isTesterApproved ? 'badge-approved' :
                  isRevision ? 'badge-revision' :
                  project.testingStatus === 'In Testing' ? 'badge-testing' : 'badge-pending'
                }`}>
                  {project.testingStatus || 'Awaiting Testing'}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <img 
                src={currentTesterObj.avatar} 
                alt={currentTesterObj.name} 
                style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #F3821D' }}
              />
              <div>
                <strong style={{ fontSize: '0.95rem', color: '#07223D', display: 'block' }}>{currentTesterObj.name}</strong>
                <span style={{ fontSize: '0.78rem', color: '#64748B' }}>{currentTesterObj.specialization || currentTesterObj.role || 'Lead QA Engineer'} • {currentTesterActiveCount} Active QA Tasks</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem', borderTop: '1px solid #F1F5F9', fontSize: '0.75rem', color: '#64748B' }}>
              <span>QA Testing: <strong style={{ color: isTesterApproved ? '#16A34A' : '#C2410C' }}>{project.testingProgress || 0}% Verified</strong></span>
              {!isFinalizedOrLocked && (
                <button 
                  type="button" 
                  onClick={() => setIsAssignTesterModalOpen(true)}
                  style={{ background: 'none', border: 'none', color: '#F3821D', fontWeight: 700, cursor: 'pointer' }}
                >
                  Change Tester →
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="admin-project-tabs-bar">
        <button
          type="button"
          className={`admin-tab-pill ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <FileText size={15} />
          <span>Overview</span>
        </button>

        <button
          type="button"
          className={`admin-tab-pill ${activeTab === 'testing-qa' ? 'active' : ''}`}
          onClick={() => setActiveTab('testing-qa')}
        >
          <ShieldCheck size={15} />
          <span>Testing Status & QA Results</span>
          {isTesterApproved && <span style={{ fontSize: '0.65rem', background: '#DCFCE7', color: '#166534', padding: '1px 5px', borderRadius: '4px', fontWeight: 800 }}>Approved</span>}
        </button>

        <button
          type="button"
          className={`admin-tab-pill ${activeTab === 'tasks' ? 'active' : ''}`}
          onClick={() => setActiveTab('tasks')}
        >
          <CheckSquare size={15} />
          <span>Tasks ({totalCount})</span>
        </button>

        <button
          type="button"
          className={`admin-tab-pill ${activeTab === 'documents' ? 'active' : ''}`}
          onClick={() => setActiveTab('documents')}
        >
          <FileText size={15} />
          <span>Documents ({(project.documents || []).length})</span>
        </button>

        <button
          type="button"
          className={`admin-tab-pill ${activeTab === 'credentials' ? 'active' : ''}`}
          onClick={() => setActiveTab('credentials')}
        >
          <Key size={15} />
          <span>Credentials ({(project.credentials || []).length})</span>
        </button>

        <button
          type="button"
          className={`admin-tab-pill ${activeTab === 'submission' ? 'active' : ''}`}
          onClick={() => setActiveTab('submission')}
        >
          <Send size={15} />
          <span>Developer Submission</span>
        </button>

        <button
          type="button"
          className={`admin-tab-pill ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <History size={15} />
          <span>Assignment History</span>
        </button>
      </div>

      {/* TAB: TESTING STATUS & QA RESULTS (NEW FOR TESTER MONITORING) */}
      {activeTab === 'testing-qa' && (
        <div className="portal-card">
          <div className="portal-card-header">
            <div>
              <h2 className="portal-card-title">
                <ShieldCheck size={18} color="#F3821D" />
                <span>QA Testing Status & Audit Summary</span>
              </h2>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.84rem', color: '#64748B' }}>
                Admin monitoring hub for QA checklist verification, reported defects, and tester decision.
              </p>
            </div>
            <span className={`qa-table-badge ${isTesterApproved ? 'badge-approved' : isRevision ? 'badge-revision' : 'badge-testing'}`}>
              {project.testingStatus || 'In Testing'}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* QA Status Summary Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', background: '#F8FAFC', padding: '1rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <div>
                <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748B', display: 'block' }}>ASSIGNED QA TESTER</span>
                <strong style={{ fontSize: '0.92rem', color: '#07223D' }}>{project.tester || 'Unassigned'}</strong>
                <span style={{ fontSize: '0.72rem', color: '#F3821D', display: 'block' }}>Lead QA Specialist</span>
              </div>
              <div>
                <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748B', display: 'block' }}>QA TESTING PROGRESS</span>
                <strong style={{ fontSize: '0.92rem', color: '#0A3D75' }}>{project.testingProgress || 0}% Complete</strong>
                <span style={{ fontSize: '0.72rem', color: '#64748B', display: 'block' }}>14-Item Checklist</span>
              </div>
              <div>
                <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748B', display: 'block' }}>REPORTED DEFECTS</span>
                <strong style={{ fontSize: '0.92rem', color: isRevision ? '#DC2626' : '#16A34A' }}>
                  {project.testingIssues?.length || (isRevision ? 1 : 0)} Open Issues
                </strong>
                <span style={{ fontSize: '0.72rem', color: '#64748B', display: 'block' }}>QA Defect Tracker</span>
              </div>
              <div>
                <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748B', display: 'block' }}>TESTING DECISION</span>
                <strong style={{ fontSize: '0.92rem', color: isTesterApproved ? '#16A34A' : isRevision ? '#DC2626' : '#D97706' }}>
                  {isTesterApproved ? '✓ Tester Approved' : isRevision ? '⚠ Revision Required' : '⏳ In Progress'}
                </strong>
                <span style={{ fontSize: '0.72rem', color: '#64748B', display: 'block' }}>Tester Responsible</span>
              </div>
            </div>

            {/* Testing Notes */}
            {project.testingNotes && (
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '1rem' }}>
                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: '#07223D', fontWeight: 800 }}>QA Tester Notes</h4>
                <p style={{ margin: 0, fontSize: '0.84rem', color: '#334155', lineHeight: 1.5, whiteSpace: 'pre-line' }}>
                  {project.testingNotes}
                </p>
              </div>
            )}

            {/* Testing Activity Timeline */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '1rem' }}>
              <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.85rem', color: '#07223D', fontWeight: 800 }}>Testing Activity Timeline</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {(project.testingActivity || [
                  { event: 'Project submitted by Developer', time: project.submittedDate || '—', by: project.developer || 'Developer' },
                  { event: `QA Tester ${project.tester || 'Unassigned'} started testing`, time: project.submittedDate || '—', by: project.tester || 'QA Tester' }
                ]).map((act, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#F3821D', marginTop: '0.3rem', flexShrink: 0 }} />
                    <div>
                      <strong style={{ fontSize: '0.82rem', color: '#0F172A', display: 'block' }}>{act.event}</strong>
                      <span style={{ fontSize: '0.72rem', color: '#64748B' }}>{act.time} • Action by {act.by}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="portal-card">
          <div className="portal-card-header">
            <h2 className="portal-card-title">
              <Layers size={18} color="#0A3D75" />
              <span>Project Scope & Specifications</span>
            </h2>
          </div>

          <div className="requirements-content">
            {/* Developer Project Deliverables Quick Preview */}
            <div style={{ background: '#F0FDF4', border: '1.5px solid #86EFAC', borderRadius: '10px', padding: '16px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ExternalLink size={16} color="#16A34A" />
                  <strong style={{ color: '#166534', fontSize: '0.92rem' }}>Developer Deliverables & Links</strong>
                </div>
                <span style={{ fontSize: '0.72rem', background: '#DCFCE7', color: '#15803D', fontWeight: 700, padding: '2px 8px', borderRadius: '9999px' }}>
                  Live Links
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
                <div style={{ background: '#FFFFFF', padding: '10px 14px', borderRadius: '6px', border: '1px solid #BBF7D0' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#166534', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Globe size={12} color="#16A34A" />
                    Live Website URL
                  </span>
                  {(project.liveLink || project.liveProjectLink) ? (
                    <div style={{ marginTop: '4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                      <a href={project.liveLink || project.liveProjectLink} target="_blank" rel="noreferrer" style={{ color: '#0284C7', fontWeight: 700, fontSize: '0.84rem', textDecoration: 'underline', wordBreak: 'break-all' }}>
                        {project.liveLink || project.liveProjectLink}
                      </a>
                      <a href={project.liveLink || project.liveProjectLink} target="_blank" rel="noreferrer" className="btn btn-navy-action" style={{ padding: '4px 8px', fontSize: '0.72rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
                        <ExternalLink size={11} />
                        <span>Visit</span>
                      </a>
                    </div>
                  ) : (
                    <span style={{ fontSize: '0.78rem', color: '#94A3B8', fontStyle: 'italic', display: 'block', marginTop: '2px' }}>Not submitted yet</span>
                  )}
                </div>

                <div style={{ background: '#FFFFFF', padding: '10px 14px', borderRadius: '6px', border: '1px solid #BBF7D0' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#166534', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <FolderKanban size={12} color="#F3821D" />
                    Google Drive Source Code ZIP
                  </span>
                  {(project.driveLink || project.driveProjectLink) ? (
                    <div style={{ marginTop: '4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                      <a href={project.driveLink || project.driveProjectLink} target="_blank" rel="noreferrer" style={{ color: '#0A3D75', fontWeight: 700, fontSize: '0.84rem', textDecoration: 'underline', wordBreak: 'break-all' }}>
                        {project.driveLink || project.driveProjectLink}
                      </a>
                      <a href={project.driveLink || project.driveProjectLink} target="_blank" rel="noreferrer" className="btn btn-orange-primary" style={{ padding: '4px 8px', fontSize: '0.72rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
                        <FolderKanban size={11} />
                        <span>Drive</span>
                      </a>
                    </div>
                  ) : (
                    <span style={{ fontSize: '0.78rem', color: '#94A3B8', fontStyle: 'italic', display: 'block', marginTop: '2px' }}>Not submitted yet</span>
                  )}
                </div>
              </div>
            </div>

            <div className="req-block">
              <h4 className="req-subtitle">Project Description</h4>
              <p className="req-desc-p">{project.description || 'Corporate web development specifications.'}</p>
            </div>

            {project.requirements?.clientReqs && project.requirements.clientReqs.length > 0 && (
              <div className="req-block">
                <h4 className="req-subtitle">Client Requirements</h4>
                <ul className="req-list">
                  {project.requirements.clientReqs.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: TASKS */}
      {activeTab === 'tasks' && (
        <div className="portal-card">
          <div className="portal-card-header">
            <div>
              <h2 className="portal-card-title">
                <CheckSquare size={18} color="#0A3D75" />
                <span>Project Tasks Breakdown</span>
              </h2>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.84rem', color: '#64748B' }}>
                Real-time milestone progress reported by {project.developer}.
              </p>
            </div>
            <div className="tasks-summary-chip">{completedCount} / {totalCount} Completed</div>
          </div>

          <div className="tasks-numbered-list">
            {(project.tasks || []).map((t) => (
              <div key={t.id || t.number} className={`task-list-item ${t.status === 'Completed' ? 'task-done' : ''}`}>
                <div className="task-item-start">
                  <span className="task-num-index">{t.number}</span>
                  <div className={`task-check-circle ${t.status === 'Completed' ? 'checked' : ''}`}>
                    {t.status === 'Completed' && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
                  </div>
                </div>

                <div className="task-item-content">
                  <div className="task-item-title-row">
                    <h3 className="task-item-name">{t.name}</h3>
                    <StatusBadge status={t.status} size="small" />
                  </div>
                  <p className="task-item-desc">{t.desc}</p>

                  {/* Developer Notes Block */}
                  {(t.notes || t.developerNotes || t.freelancerNotes) ? (
                    <div style={{ marginTop: '10px', background: '#F8FAFC', border: '1px solid #CBD5E1', borderLeft: '3px solid #0A3D75', borderRadius: '6px', padding: '10px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#0A3D75', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <FileText size={13} />
                          Developer Notes ({project.developer || 'Assigned Developer'})
                        </span>
                        <span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 600 }}>
                          {t.lastUpdated ? `Last updated: ${t.lastUpdated}` : 'Recorded'}
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: '#1E293B', lineHeight: 1.5, whiteSpace: 'pre-line' }}>
                        {t.notes || t.developerNotes || t.freelancerNotes}
                      </p>
                    </div>
                  ) : (
                    <div style={{ marginTop: '6px', fontSize: '0.75rem', color: '#94A3B8', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <FileText size={12} />
                      <span>No task notes added by developer yet</span>
                    </div>
                  )}
                </div>

                <div className="task-item-end">
                  <div className="task-mini-progress">
                    <div className="mini-progress-bar">
                      <div className="mini-progress-fill" style={{ width: `${t.progress}%`, backgroundColor: t.status === 'Completed' ? '#10B981' : '#F3821D' }} />
                    </div>
                    <span className="mini-progress-text">{t.progress}%</span>
                  </div>
                  <StatusBadge status={t.status} size="small" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: DOCUMENTS */}
      {activeTab === 'documents' && (
        <div className="portal-card">
          <div className="portal-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 className="portal-card-title">
                <FileText size={18} color="#0A3D75" />
                <span>Project Documents & Reference Files</span>
              </h2>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.84rem', color: '#64748B' }}>
                Manage project specification files, architecture briefs, and asset archives.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className="docs-count-chip">{(project.documents || []).length} Files</span>
              <input
                type="file"
                ref={adminDocInputRef}
                onChange={handleAdminUploadDoc}
                multiple
                style={{ display: 'none' }}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,image/*"
              />
              <button
                type="button"
                className="btn btn-navy-action"
                onClick={() => adminDocInputRef.current && adminDocInputRef.current.click()}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Plus size={15} />
                <span>Upload Document</span>
              </button>
            </div>
          </div>

          <div className="documents-list">
            {(project.documents && project.documents.length > 0) ? (
              project.documents.map((doc) => (
                <div key={doc.id} className="document-card">
                  <div className="doc-icon-wrap">
                    <FileText size={22} color="#0A3D75" />
                  </div>
                  <div className="doc-info">
                    <div className="doc-name">{doc.name}</div>
                    <div className="doc-meta">
                      <span className="doc-type-badge">{doc.type}</span>
                      <span>{doc.size}</span>
                      {doc.date && <span>• {doc.date}</span>}
                    </div>
                  </div>
                  <div className="doc-actions" style={{ display: 'flex', gap: '6px' }}>
                    <button type="button" className="btn-doc-action" title="View Document" onClick={() => setPreviewDoc(doc)}>
                      <Eye size={14} />
                      <span>View</span>
                    </button>
                    <button type="button" className="btn-doc-action" title="Download Document" onClick={() => handleDownloadDoc(doc)}>
                      <Download size={14} />
                      <span>Download</span>
                    </button>
                    <button 
                      type="button" 
                      className="btn-doc-action" 
                      title="Delete Document" 
                      onClick={() => handleDeleteDoc(doc.id)}
                      style={{ color: '#EF4444', borderColor: '#FCA5A5' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: '24px 16px', textAlign: 'center', color: '#64748B', background: '#F8FAFC', borderRadius: '8px', border: '1px dashed #CBD5E1' }}>
                <FileText size={28} color="#94A3B8" style={{ margin: '0 auto 8px', display: 'block' }} />
                <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#475569' }}>No Specification Documents Attached</div>
                <div style={{ fontSize: '0.78rem', color: '#94A3B8', marginTop: '4px' }}>Upload a specification file (.pdf, .docx, .zip) to share with developer & tester.</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: CREDENTIALS */}
      {activeTab === 'credentials' && (
        <div className="portal-card">
          <div className="portal-card-header">
            <div>
              <h2 className="portal-card-title">
                <Key size={18} color="#0A3D75" />
                <span>Submitted Project Credentials</span>
              </h2>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.84rem', color: '#64748B' }}>
                Secure repository access, hosting logins, and API tokens. Admin has exclusive permission to manage & delete credentials.
              </p>
            </div>

            <button
              type="button"
              className="btn btn-navy-action"
              onClick={() => setIsCredModalOpen(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={15} />
              <span>Add Credential</span>
            </button>
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
                    <th>Status</th>
                    <th>Notes</th>
                    <th style={{ textAlign: 'right' }}>Admin Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {project.credentials.map((cred, idx) => {
                    const isRev = !!revealedSecrets[cred.id || idx];
                    return (
                      <tr key={cred.id || idx}>
                        <td style={{ color: '#94A3B8' }}>{idx + 1}</td>
                        <td style={{ fontWeight: 700, color: '#0A3D75' }}>{cred.platform || cred.service || cred.type}</td>
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
                          <span style={{ fontSize: '0.74rem', fontWeight: 700, background: '#DCFCE7', color: '#166534', padding: '2px 6px', borderRadius: '4px' }}>
                            {cred.status || 'Provided'}
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
                                if (window.confirm(`Are you sure you want to delete credential for ${cred.platform || cred.service || 'this service'}? (Admin Only)`)) {
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
            <div style={{ padding: '32px 16px', textAlign: 'center', background: '#F8FAFC', borderRadius: '8px', border: '1px dashed #CBD5E1' }}>
              <Key size={32} color="#94A3B8" style={{ marginBottom: '8px' }} />
              <p style={{ margin: '0 0 12px 0', color: '#64748B', fontSize: '0.9rem' }}>No credentials added for this project yet.</p>
              <button
                type="button"
                className="btn btn-navy-action"
                onClick={() => setIsCredModalOpen(true)}
              >
                <Plus size={14} />
                <span>Add First Credential</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: SUBMISSION */}
      {activeTab === 'submission' && (
        <div className="portal-card">
          <div className="portal-card-header">
            <h2 className="portal-card-title">
              <Send size={18} color="#0A3D75" />
              <span>Developer Submission & Testing Pipeline</span>
            </h2>
            <StatusBadge status={project.status} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Dedicated Developer Submission Links */}
            <div style={{ background: '#FFFFFF', border: '1.5px solid #0A3D75', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 12px rgba(10, 61, 117, 0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', borderBottom: '1px solid #E2E8F0', paddingBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ExternalLink size={18} color="#F3821D" />
                  <h4 style={{ margin: 0, fontSize: '0.98rem', color: '#0A3D75', fontWeight: 800 }}>
                    Developer Project Submission Deliverables & Links
                  </h4>
                </div>
                <span style={{ fontSize: '0.74rem', background: '#EFF6FF', color: '#1D4ED8', padding: '3px 10px', borderRadius: '9999px', fontWeight: 700 }}>
                  Submitted by {project.developer || 'Developer'}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                {/* 1. Live Project Deployment URL */}
                <div style={{ background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: '8px', padding: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#0A3D75', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Globe size={13} color="#16A34A" />
                      Live Hosted Website URL
                    </span>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: (project.liveLink || project.liveProjectLink) ? '#16A34A' : '#DC2626' }}>
                      {(project.liveLink || project.liveProjectLink) ? '✓ Attached' : 'Not Provided'}
                    </span>
                  </div>

                  {(project.liveLink || project.liveProjectLink) ? (
                    <div>
                      <a
                        href={project.liveLink || project.liveProjectLink}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: '#0284C7', fontWeight: 700, fontSize: '0.88rem', textDecoration: 'underline', wordBreak: 'break-all', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}
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
                          style={{ padding: '6px 12px', fontSize: '0.78rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                        >
                          <ExternalLink size={12} />
                          <span>Open Live Site</span>
                        </a>
                        <button
                          type="button"
                          className="btn btn-outline-action"
                          onClick={() => handleCopy(project.liveLink || project.liveProjectLink)}
                          style={{ padding: '6px 10px', fontSize: '0.78rem' }}
                        >
                          <Copy size={12} />
                          <span>Copy URL</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p style={{ margin: 0, fontSize: '0.82rem', color: '#94A3B8', fontStyle: 'italic' }}>
                      Developer has not submitted the live hosted link yet.
                    </p>
                  )}
                </div>

                {/* 2. Google Drive Project File Link */}
                <div style={{ background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: '8px', padding: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#0A3D75', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <FolderKanban size={13} color="#F3821D" />
                      Google Drive Source Code ZIP
                    </span>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: (project.driveLink || project.driveProjectLink) ? '#16A34A' : '#DC2626' }}>
                      {(project.driveLink || project.driveProjectLink) ? '✓ Attached' : 'Not Provided'}
                    </span>
                  </div>

                  {(project.driveLink || project.driveProjectLink) ? (
                    <div>
                      <a
                        href={project.driveLink || project.driveProjectLink}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: '#0A3D75', fontWeight: 700, fontSize: '0.88rem', textDecoration: 'underline', wordBreak: 'break-all', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}
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
                          style={{ padding: '6px 12px', fontSize: '0.78rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                        >
                          <FolderKanban size={12} />
                          <span>Open Google Drive</span>
                        </a>
                        <button
                          type="button"
                          className="btn btn-outline-action"
                          onClick={() => handleCopy(project.driveLink || project.driveProjectLink)}
                          style={{ padding: '6px 10px', fontSize: '0.78rem' }}
                        >
                          <Copy size={12} />
                          <span>Copy Drive Link</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p style={{ margin: 0, fontSize: '0.82rem', color: '#94A3B8', fontStyle: 'italic' }}>
                      Developer has not attached the Google Drive ZIP link yet.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '16px' }}>
              <h4 style={{ margin: '0 0 6px 0', fontSize: '0.9rem', color: '#0A3D75', fontWeight: 800 }}>Overall Developer Submission Notes</h4>
              <p style={{ margin: 0, fontSize: '0.88rem', color: '#334155', lineHeight: 1.5, whiteSpace: 'pre-line' }}>
                {project.submissionNotes || 'All milestone tasks completed and submitted for QA verification.'}
              </p>
            </div>

            {/* Task-by-Task Developer Notes Summary */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '16px' }}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', color: '#0A3D75', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FileText size={16} />
                <span>Developer Task-by-Task Milestone Notes</span>
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {(project.tasks || []).map((t, idx) => (
                  <div key={t.id || idx} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '12px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#0F172A' }}>
                        {t.number || (idx + 1 < 10 ? `0${idx + 1}` : idx + 1)}. {t.name}
                      </span>
                      <StatusBadge status={t.status} size="small" />
                    </div>
                    {(t.notes || t.developerNotes || t.freelancerNotes) ? (
                      <div style={{ background: '#FFFFFF', padding: '8px 12px', borderRadius: '4px', border: '1px solid #CBD5E1', borderLeft: '3px solid #0A3D75' }}>
                        <p style={{ margin: 0, fontSize: '0.825rem', color: '#1E293B', lineHeight: 1.45, whiteSpace: 'pre-line' }}>
                          {t.notes || t.developerNotes || t.freelancerNotes}
                        </p>
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.78rem', color: '#94A3B8', fontStyle: 'italic' }}>No notes recorded for this milestone task.</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: '10px', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <ShieldCheck size={18} color="#C2410C" />
                <h4 style={{ margin: 0, fontSize: '0.9rem', color: '#9A3412', fontWeight: 800 }}>
                  Assigned QA Tester: {project.tester || 'Unassigned'}
                </h4>
              </div>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#7C2D12' }}>
                Testing status is currently <strong>"{project.testingStatus || 'In Testing'}"</strong> with {project.testingProgress || 0}% QA checks verified. The testing approval decision is rendered directly by the assigned QA tester.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: ASSIGNMENT HISTORY */}
      {activeTab === 'history' && (
        <div className="portal-card">
          <div className="portal-card-header">
            <h2 className="portal-card-title">
              <History size={18} color="#0A3D75" />
              <span>Team Assignment History & Audit Trail</span>
            </h2>
          </div>

          <div className="assignment-timeline">
            {(project.assignmentHistory || [
              { developer: project.developer || 'Unassigned', tester: project.tester || 'Unassigned', assignedDate: project.assignedDate, status: 'Project Created & Assigned', updated: 'Initial assignment by Admin' }
            ]).map((h, i) => (
              <div key={i} className="timeline-entry">
                <div className="timeline-node" />
                <div className="timeline-body">
                  <div className="timeline-top">
                    <strong>Developer: {h.developer || 'Unassigned'} • QA Tester: {h.tester || 'Unassigned'}</strong>
                    <span className="timeline-date">{h.assignedDate}</span>
                  </div>
                  <div className="timeline-status-tag">{h.status}</div>
                  <p className="timeline-notes">{h.updated}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Document Viewer Modal */}
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
                  <FileText size={20} />
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
                    <div style={{ textAlign: 'center', padding: '16px', background: '#0F172A', borderRadius: '8px' }}>
                      <img
                        src={previewSrc}
                        alt={previewDoc.name}
                        style={{ maxWidth: '100%', maxHeight: '480px', objectFit: 'contain', borderRadius: '4px' }}
                      />
                    </div>
                  );
                }

                return (
                  <div style={{ background: '#F8FAFC', padding: '18px', borderRadius: '8px', border: '1px solid #E2E8F0', fontFamily: 'monospace', fontSize: '0.84rem', color: '#334155', lineHeight: 1.6 }}>
                    <div style={{ fontWeight: 800, color: '#0A3D75', marginBottom: '8px', fontSize: '0.9rem' }}>--- PROJECT SPECIFICATION DOCUMENT ---</div>
                    <div><strong>Project:</strong> {project.name} ({project.id})</div>
                    <div><strong>Document File:</strong> {previewDoc.name}</div>
                    <div><strong>Category:</strong> {project.category || project.projectType || 'Corporate Website'}</div>
                    <hr style={{ borderColor: '#E2E8F0', margin: '12px 0' }} />
                    <div style={{ fontWeight: 700, color: '#0F172A', marginBottom: '6px' }}>Scope & Technical Summary:</div>
                    <p style={{ margin: '0 0 12px 0' }}>{project.description || 'Verified project requirements and milestone roadmap specification.'}</p>
                    {project.clientRequirements && project.clientRequirements.length > 0 && (
                      <div style={{ marginBottom: '10px' }}>
                        <div style={{ fontWeight: 700, color: '#0F172A' }}>Requirements:</div>
                        <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                          {project.clientRequirements.map((r, i) => (
                            <li key={i}>{r}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            <div style={{ padding: '16px 24px', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', gap: '10px', background: '#FAFCFE' }}>
              <button 
                type="button" 
                onClick={() => setPreviewDoc(null)}
                className="btn btn-navy-action"
                style={{ background: '#F1F5F9', color: '#475569', border: '1px solid #CBD5E1', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
              >
                Close Preview
              </button>
              <button 
                type="button" 
                onClick={() => handleDownloadDoc(previewDoc)}
                className="btn btn-orange-primary"
                style={{ padding: '8px 18px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Download size={14} />
                <span>Download Document</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {!isFinalizedOrLocked && (
        <>
          <AssignmentModal
            isOpen={isAssignDevModalOpen}
            project={project}
            developers={developers}
            onClose={() => setIsAssignDevModalOpen(false)}
            onAssign={handleAssignDeveloper}
          />

          <AssignTesterModal
            isOpen={isAssignTesterModalOpen}
            project={project}
            testers={testers}
            onClose={() => setIsAssignTesterModalOpen(false)}
            onAssignTester={handleAssignTester}
          />
        </>
      )}

      <RevisionModal
        isOpen={isRevisionModalOpen}
        project={project}
        onClose={() => setIsRevisionModalOpen(false)}
        onRequestRevision={handleSendRevision}
      />

      <CredentialModal
        isOpen={isCredModalOpen}
        onClose={() => setIsCredModalOpen(false)}
        onAddCredential={handleAddCredential}
        onSave={handleAddCredential}
      />
    </div>
  );
}
