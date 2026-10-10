import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  CheckCircle2, 
  Clock, 
  AlertOctagon, 
  AlertCircle, 
  FileText, 
  FileCheck,
  Download, 
  Eye, 
  User, 
  Calendar, 
  ShieldCheck, 
  ExternalLink, 
  Plus, 
  Check, 
  X, 
  FileCode, 
  Send, 
  Layers, 
  KeyRound, 
  Key,
  FolderKanban,
  UploadCloud,
  Sparkles, 
  IndianRupee,
  Play,
  CheckSquare
} from 'lucide-react';
import StatusBadge from '../../components/portal/StatusBadge';
import IssueModal from '../../components/tester/IssueModal';
import RequestChangesModal from '../../components/tester/RequestChangesModal';
import ApproveTestingModal from '../../components/tester/ApproveTestingModal';
import CredentialModal from '../../components/portal/CredentialModal';
import { 
  getTesterAmount, 
  getTesterPaid, 
  getTesterRemaining, 
  formatINR,
  getTesterDashboardStatus,
  calculateQAProgressFromTasks,
  areAllQATasksPassed,
  calculateProjectProgressFromTasks
} from '../../utils/projectStatusUtils';
import { downloadProjectDocument, getDocPreviewSource } from '../../utils/documentDownloadHelper';
import '../../components/tester/TesterModals.css';
import './TesterProjectWorkspace.css';

export default function TesterProjectWorkspace({ 
  project, 
  onBack, 
  onUpdateProject,
  onNavigate 
}) {
  const [activeTab, setActiveTab] = useState('checklist');
  
  // Local project testing state - synchronized with project.tasks
  const [tasks, setTasks] = useState(project?.tasks || []);
  const [issues, setIssues] = useState(project?.testingIssues || project?.issues || []);
  
  // Modals state
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [activeTaskForIssue, setActiveTaskForIssue] = useState(null);
  const [showRequestChangesModal, setShowRequestChangesModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [isCredModalOpen, setIsCredModalOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Admin Project Documents (Strictly match whatever documents were actually uploaded for this project)
  const baseDocs = Array.isArray(project?.documents) 
    ? project.documents 
    : (Array.isArray(project?.specificationDocuments) ? project.specificationDocuments : []);

  const projectDocs = [...baseDocs];
  if (project?.adminRejectionDocument) {
    const revDocObj = typeof project.adminRejectionDocument === 'object' 
      ? project.adminRejectionDocument 
      : { name: project.adminRejectionDocument, type: 'Revision Guideline', size: '1.5 MB', date: 'Revision' };
    
    if (!projectDocs.some(d => d.name === revDocObj.name || (revDocObj.id && d.id === revDocObj.id))) {
      projectDocs.unshift({
        id: revDocObj.id || 'doc-admin-rev',
        name: revDocObj.name || 'Revision_Guidelines.pdf',
        type: revDocObj.type || 'Admin Revision Document',
        size: revDocObj.size || '1.0 MB',
        dataUrl: revDocObj.dataUrl,
        fileData: revDocObj.fileData || revDocObj.dataUrl,
        url: revDocObj.url || revDocObj.dataUrl,
        date: revDocObj.date || (project.adminRejectedAt ? new Date(project.adminRejectedAt).toLocaleDateString('en-GB') : 'Revision'),
        status: 'Admin Feedback'
      });
    }
  }

  const handleViewDoc = (doc) => {
    setPreviewDoc(doc);
  };

  const handleDownloadDoc = (doc) => {
    downloadProjectDocument(doc, project, showToast);
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
    showToast('✓ New credential added successfully and saved to project!');
  };

  useEffect(() => {
    if (project) {
      setTasks(project.tasks || []);
      setIssues(project.testingIssues || project.issues || []);
    }
  }, [project?.id, project?.status, project?.testingStatus, project?.tasks, project?.testingIssues, project?.submittedDate]);

  if (!project) return null;

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Tester Financials (Strictly Isolated)
  const testerAssigned = getTesterAmount(project);
  const testerPaid = getTesterPaid(project);
  const testerRemaining = getTesterRemaining(project);

  // Derive exact single lifecycle state
  const currentStatus = getTesterDashboardStatus(project);
  const isFinalized = Boolean(project.testerFinalized || project.qaFinalized || project.testingStatus === 'Tester Approved' || project.status === 'Finalized');
  const isAdminApproved = Boolean(project.adminApproved || project.status === 'Approved' || project.status === 'Completed');
  const isRevision = Boolean(project.adminRejected || project.status === 'Changes Requested' || project.testingStatus === 'Changes Requested' || currentStatus === 'Revision Required');
  const isDevSubmitted = Boolean(project.developerSubmitted || project.freelancerSubmitted || project.status === 'Submitted' || project.status === 'Under Review' || isFinalized || isAdminApproved);
  const isQAStarted = Boolean(project.testerStarted || project.qaStarted || project.testingProgress > 0 || project.status === 'Under Review');

  // Calculate QA Testing Progress from Admin-created task weights
  const qaProgressPercent = calculateQAProgressFromTasks(tasks);
  const passedTasksCount = tasks.filter(t => t.qaStatus === 'Passed' || t.qaStatus === 'Pass' || t.status === 'Passed' || t.status === 'Pass').length;
  const failedTasksCount = tasks.filter(t => t.qaStatus === 'Failed' || t.qaStatus === 'Fail').length;
  const totalTasksCount = tasks.length;
  const allTasksPassed = areAllQATasksPassed(tasks) && totalTasksCount > 0 && failedTasksCount === 0;
  const canFinalize = isDevSubmitted && isQAStarted && allTasksPassed && qaProgressPercent === 100 && !isFinalized;

  // Calculate Developer Progress & Milestone Tasks Completed Count
  const devProgPercent = calculateProjectProgressFromTasks(tasks);
  const devCompletedCount = tasks.filter(t => t.status === 'Completed' || t.status === 'Done' || t.progress === 100).length;

  // Handle Start QA action
  const handleStartQA = () => {
    const updated = {
      ...project,
      testerStarted: true,
      testerStartedAt: new Date().toISOString(),
      qaStarted: true,
      qaStartedAt: new Date().toISOString(),
      status: 'Under Review',
      testingStatus: 'In Testing',
      testingActivity: [
        { event: `QA Testing Started by ${project.tester || 'QA Tester'}`, time: 'Just now', by: project.tester || 'QA Tester' },
        ...(project.testingActivity || [])
      ]
    };
    if (onUpdateProject) {
      onUpdateProject(updated);
    }
    showToast('QA Testing started! Project status moved to Under Review.');
  };

  // Handle Checklist Status Toggle (3 states: Pending, Pass, Fail)
  const handleTaskStatusChange = (taskId, newStatus) => {
    if (!isQAStarted && newStatus !== 'Pending') {
      showToast('Please click "Start QA Testing" first before changing test states.');
      return;
    }

    if (isFinalized) {
      showToast('QA has already been finalized for this review cycle.');
      return;
    }

    // When marking Fail, open defect modal without mutating status immediately (transactional)
    if (newStatus === 'Failed' || newStatus === 'Fail') {
      const target = tasks.find(t => t.id === taskId);
      setActiveTaskForIssue(target);
      setShowIssueModal(true);
      return;
    }

    // When marking Pass or Pending
    const updatedTasks = tasks.map(t => {
      if (t.id === taskId) {
        return { 
          ...t, 
          qaStatus: newStatus === 'Passed' || newStatus === 'Pass' ? 'Passed' : 'Pending',
          testingStatus: newStatus === 'Passed' || newStatus === 'Pass' ? 'Passed' : 'Pending'
        };
      }
      return t;
    });

    setTasks(updatedTasks);
    const newQAProgress = calculateQAProgressFromTasks(updatedTasks);

    if (onUpdateProject) {
      onUpdateProject({
        ...project,
        tasks: updatedTasks,
        testingChecklist: updatedTasks,
        testingProgress: newQAProgress,
        testingStatus: 'In Testing'
      });
    }
    showToast(`Task ${newStatus === 'Passed' ? 'Passed' : 'set to Pending'}. QA Progress: ${newQAProgress}%`);
  };

  // Handle saving defect from IssueModal
  const handleAddIssue = (newIssue) => {
    const targetTaskId = activeTaskForIssue?.id || newIssue.taskId;

    // 1. Mark corresponding QA task as Failed
    // 2. Automatically reset Developer's corresponding task to 'Failed' / 'Rework Required' (progress: 0)
    const updatedTasks = tasks.map(t => {
      if (t.id === targetTaskId || (activeTaskForIssue && t.name === activeTaskForIssue.name)) {
        return {
          ...t,
          qaStatus: 'Failed',
          testingStatus: 'Failed',
          status: 'Failed',
          progress: 0,
          qaNotes: newIssue.title
        };
      }
      return t;
    });

    const updatedIssues = [newIssue, ...issues];
    setTasks(updatedTasks);
    setIssues(updatedIssues);
    setShowIssueModal(false);
    setActiveTaskForIssue(null);

    const newQAProgress = calculateQAProgressFromTasks(updatedTasks);

    if (onUpdateProject) {
      onUpdateProject({
        ...project,
        tasks: updatedTasks,
        testingChecklist: updatedTasks,
        testingIssues: updatedIssues,
        issues: updatedIssues,
        testingProgress: newQAProgress,
        status: 'Revision Required',
        testingStatus: 'Changes Requested',
        adminRejected: true,
        adminRejectedAt: new Date().toISOString(),
        adminRejectionComment: `QA Defect Reported: ${newIssue.title}`,
        adminFeedback: newIssue.description,
        testingActivity: [
          { event: `Defect Reported by QA: ${newIssue.title}`, time: 'Just now', by: project.tester || 'QA Tester' },
          ...(project.testingActivity || [])
        ]
      });
    }

    showToast(`Defect reported and task marked as Failed. Developer notified for rework.`);
  };

  // Handle formal Request Changes from RequestChangesModal
  const handleRequestChanges = (changeData) => {
    const timeStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    
    // If a related task is named, mark it Failed
    let updatedTasks = tasks;
    if (changeData.task) {
      updatedTasks = tasks.map(t => {
        if (t.name.toLowerCase().includes(changeData.task.toLowerCase()) || changeData.task.toLowerCase().includes(t.name.toLowerCase())) {
          return {
            ...t,
            qaStatus: 'Failed',
            testingStatus: 'Failed',
            status: 'Failed',
            progress: 0,
            qaNotes: changeData.reason
          };
        }
        return t;
      });
      setTasks(updatedTasks);
    }

    const newIssue = {
      id: `iss-qa-${Date.now()}`,
      title: changeData.reason,
      description: changeData.detailedNotes || changeData.requiredChanges,
      severity: changeData.severity || 'High',
      task: changeData.task || 'General Deliverable',
      status: 'Open',
      date: timeStr,
      reporter: project.tester || 'QA Tester',
      expected: 'All features and responsive requirements must function cleanly according to specification.',
      actual: changeData.requiredChanges
    };

    const updatedIssues = [newIssue, ...issues];
    setIssues(updatedIssues);

    const updated = {
      ...project,
      status: 'Revision Required',
      testingStatus: 'Changes Requested',
      adminRejected: true,
      adminRejectedAt: new Date().toISOString(),
      adminRejectionComment: changeData.reason + (changeData.requiredChanges ? `\nRequired Changes: ${changeData.requiredChanges}` : ''),
      adminFeedback: changeData.detailedNotes || changeData.reason,
      adminRejectionDocument: changeData.documentName ? { name: changeData.documentName, type: 'PDF', size: '1.8 MB', date: timeStr } : null,
      tasks: updatedTasks,
      testingIssues: updatedIssues,
      issues: updatedIssues,
      testingActivity: [
        { event: `QA Tester requested changes: "${changeData.reason}"`, time: timeStr, by: project.tester || 'QA Tester' },
        ...(project.testingActivity || [])
      ]
    };

    if (onUpdateProject) {
      onUpdateProject(updated);
    }
    setShowRequestChangesModal(false);
    showToast('Changes requested. Project returned to Developer for rework.');
  };

  // Finalize Project Action
  const handleFinalizeProject = () => {
    if (!canFinalize) {
      showToast('All checklist tasks must be 100% Passed with 0 failed items to finalize.');
      return;
    }

    const updated = {
      ...project,
      status: 'Finalized',
      testingStatus: 'Tester Approved',
      testingProgress: 100,
      qaFinalized: true,
      testerFinalized: true,
      testerFinalizedAt: new Date().toISOString(),
      adminApproved: false,
      testingActivity: [
        { event: `QA Testing Finalized by ${project.tester || 'QA Tester'} — Sent to Admin for Final Review`, time: 'Just now', by: project.tester || 'QA Tester' },
        ...(project.testingActivity || [])
      ]
    };

    if (onUpdateProject) {
      onUpdateProject(updated);
    }
    setShowApproveModal(false);
    showToast('🎉 Project testing finalized! Dispatched to Admin for final approval.');
  };

  return (
    <div className="admin-project-detail-container">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="project-detail-toast">
          <CheckCircle2 size={18} color="#10B981" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Nav & Action Controls */}
      <div className="admin-detail-top-nav">
        <button type="button" onClick={onBack} className="btn-back-link">
          <ArrowLeft size={16} />
          <span>Back to Testing Queue</span>
        </button>

        <div className="admin-detail-header-actions" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {!isQAStarted && isDevSubmitted && !isFinalized && (
            <button 
              type="button"
              className="btn btn-orange-primary"
              onClick={handleStartQA}
              style={{ background: '#0A3D75', borderColor: '#0A3D75', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Play size={15} fill="#FFFFFF" />
              <span>Start QA Testing</span>
            </button>
          )}

          {isQAStarted && !isFinalized && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button 
                type="button"
                className="btn btn-navy-action"
                style={{ background: '#FEE2E2', color: '#DC2626', borderColor: '#FCA5A5', display: 'flex', alignItems: 'center', gap: '6px' }}
                onClick={() => setShowRequestChangesModal(true)}
              >
                <AlertOctagon size={15} />
                <span>Request Changes</span>
              </button>

              <button 
                type="button"
                className="btn btn-orange-primary"
                style={{ 
                  background: canFinalize ? '#16A34A' : '#94A3B8', 
                  borderColor: canFinalize ? '#16A34A' : '#94A3B8', 
                  cursor: canFinalize ? 'pointer' : 'not-allowed',
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px' 
                }}
                onClick={() => {
                  if (canFinalize) {
                    setShowApproveModal(true);
                  } else {
                    showToast(`Cannot finalize: ${passedTasksCount}/${totalTasksCount} tasks passed. QA progress must be 100%.`);
                  }
                }}
              >
                <CheckCircle2 size={15} />
                <span>Finalize Project</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* State-Based Information Banners */}
      {isRevision && (
        <div className="portal-card" style={{ borderLeft: '5px solid #DC2626', backgroundColor: '#FEF2F2', padding: '18px 22px', marginBottom: '20px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(220, 38, 38, 0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#FEE2E2', border: '1px solid #FECACA', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <AlertOctagon size={24} color="#DC2626" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h4 style={{ margin: 0, color: '#991B1B', fontSize: '1.02rem', fontWeight: 800 }}>
                    🚨 Master Admin Requested Changes & Required Fixes
                  </h4>
                  <span style={{ fontSize: '0.7rem', background: '#DC2626', color: '#FFFFFF', padding: '2px 8px', borderRadius: '9999px', fontWeight: 800, textTransform: 'uppercase' }}>
                    Action Required
                  </span>
                </div>
                <span style={{ fontSize: '0.78rem', color: '#991B1B', fontWeight: 700 }}>
                  {project.adminRejectedAt ? `Requested on ${new Date(project.adminRejectedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}` : 'Action Pending'}
                </span>
              </div>

              {/* What Admin Said / Required Changes */}
              <div style={{ background: '#FFFFFF', border: '1px solid #FECACA', borderRadius: '8px', padding: '12px 14px', marginTop: '10px' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#991B1B', textTransform: 'uppercase', marginBottom: '4px' }}>
                  What needs to be corrected:
                </div>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#1E293B', lineHeight: 1.55, whiteSpace: 'pre-line' }}>
                  {project.adminRejectionComment || project.adminFeedback || project.revisionReason || 'Admin has requested corrections from developer.'}
                </p>
              </div>

              {/* Specific Milestone Task Targeted */}
              {project.revisionTask && project.revisionTask !== 'General Project Revision' && (
                <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#7F1D1D' }}>Targeted Milestone Task:</span>
                  <span style={{ fontSize: '0.8rem', background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#991B1B', padding: '2px 10px', borderRadius: '6px', fontWeight: 700 }}>
                    🎯 {project.revisionTask}
                  </span>
                </div>
              )}

              {/* Admin Revision Guideline Document */}
              {project.adminRejectionDocument && (
                <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#FFFFFF', border: '1px solid #FECACA', padding: '10px 14px', borderRadius: '8px', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileText size={18} color="#DC2626" />
                    <div>
                      <strong style={{ fontSize: '0.86rem', color: '#991B1B', display: 'block' }}>
                        {typeof project.adminRejectionDocument === 'string' ? project.adminRejectionDocument : (project.adminRejectionDocument.name || 'Revision_Guidelines.pdf')}
                      </strong>
                      <span style={{ fontSize: '0.72rem', color: '#64748B' }}>
                        Admin Revision Guideline Document • {typeof project.adminRejectionDocument === 'object' ? (project.adminRejectionDocument.size || '1.5 MB') : '1.5 MB'}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => handleViewDoc(typeof project.adminRejectionDocument === 'object' ? project.adminRejectionDocument : { name: project.adminRejectionDocument, type: 'PDF', size: '1.5 MB', date: 'Revision' })}
                      className="btn btn-navy-action"
                      style={{ padding: '6px 12px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Eye size={13} />
                      <span>Preview Doc</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDownloadDoc(typeof project.adminRejectionDocument === 'object' ? project.adminRejectionDocument : { name: project.adminRejectionDocument, type: 'PDF', size: '1.5 MB', date: 'Revision' })}
                      className="btn btn-orange-primary"
                      style={{ padding: '6px 14px', fontSize: '0.78rem', background: '#DC2626', borderColor: '#DC2626', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Download size={13} />
                      <span>Download File</span>
                    </button>
                  </div>
                </div>
              )}

              <div style={{ marginTop: '10px', fontSize: '0.8rem', color: '#991B1B', background: '#FEE2E2', padding: '6px 12px', borderRadius: '6px' }}>
                ℹ️ <strong>Tester Note:</strong> Developer is currently working to resolve these items. Once resubmitted by developer, please verify these specific changes.
              </div>
            </div>
          </div>
        </div>
      )}

      {!isDevSubmitted && !isRevision && (
        <div className="portal-card" style={{ borderLeft: '4px solid #64748B', marginBottom: '20px', backgroundColor: '#F8FAFC', padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Clock size={22} color="#64748B" />
            <div>
              <h4 style={{ margin: 0, color: '#334155', fontSize: '0.95rem', fontWeight: 800 }}>Developer Working on Deliverables</h4>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.84rem', color: '#64748B' }}>
                The developer is currently completing milestone deliverables. QA testing will unlock once the developer formally submits the project.
              </p>
            </div>
          </div>
        </div>
      )}

      {isDevSubmitted && !isQAStarted && (
        <div className="portal-card" style={{ borderLeft: '4px solid #F3821D', marginBottom: '20px', backgroundColor: '#FFF7ED', padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Sparkles size={22} color="#F3821D" />
              <div>
                <h4 style={{ margin: 0, color: '#9A3412', fontSize: '0.95rem', fontWeight: 800 }}>Developer Submitted Work — Ready for QA</h4>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.84rem', color: '#475569' }}>
                  Project was submitted on <strong>{project.submittedDate || 'recently'}</strong>. Click "Start QA Testing" to begin verifying the checklist.
                </p>
              </div>
            </div>
            <button
              type="button"
              className="btn btn-orange-primary"
              onClick={handleStartQA}
              style={{ padding: '8px 18px', fontSize: '0.85rem' }}
            >
              <Play size={14} fill="#FFFFFF" />
              <span>Start QA Testing</span>
            </button>
          </div>
        </div>
      )}

      {isFinalized && !isAdminApproved && (
        <div className="portal-card" style={{ borderLeft: '4px solid #6366F1', marginBottom: '20px', backgroundColor: '#EEF2FF', padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <CheckCircle2 size={22} color="#6366F1" />
            <div>
              <h4 style={{ margin: 0, color: '#4338CA', fontSize: '0.95rem', fontWeight: 800 }}>QA Finalized — Awaiting Admin Review & Approval</h4>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.84rem', color: '#475569' }}>
                You have passed all verification tasks and finalized this review. The project is pending Admin final review.
              </p>
            </div>
          </div>
        </div>
      )}

      {isAdminApproved && (
        <div className="portal-card" style={{ borderLeft: '4px solid #10B981', marginBottom: '20px', backgroundColor: '#ECFDF5', padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <CheckCircle2 size={22} color="#10B981" />
            <div>
              <h4 style={{ margin: 0, color: '#065F46', fontSize: '0.95rem', fontWeight: 800 }}>Project Approved by Admin</h4>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.84rem', color: '#475569' }}>
                Admin has approved this project. QA Payout: <strong>{formatINR(testerAssigned)}</strong> | Paid: <strong>{formatINR(testerPaid)}</strong> | Remaining: <strong>{formatINR(testerRemaining)}</strong>.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Hero Card (Strict Financial Privacy: Developer payout and Client Total omitted) */}
      <div className="project-hero-card admin-hero-card">
        <div className="project-hero-main">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span className="hero-category-badge">{project.projectType || 'Corporate Website'}</span>
            <span className="project-id-chip">{project.id}</span>
            <StatusBadge status={currentStatus} />
          </div>

          <h1 className="hero-project-title">{project.name}</h1>
          <p className="hero-project-client">
            Assigned Developer: <strong style={{ color: '#0A3D75' }}>{project.developer}</strong> • Lead QA: <strong style={{ color: '#F3821D' }}>{project.tester || 'Sneha Reddy'}</strong>
          </p>

          <div className="hero-meta-grid">
            <div className="hero-meta-item">
              <Calendar size={16} className="meta-icon" />
              <div>
                <span className="meta-lbl">Submission Date</span>
                <span className="meta-val">{project.submittedDate || 'Pending Submission'}</span>
              </div>
            </div>

            <div className="hero-meta-item">
              <CheckSquare size={16} className="meta-icon" style={{ color: '#0A3D75', background: '#EBF3FA' }} />
              <div>
                <span className="meta-lbl">Developer Completion</span>
                <span className="meta-val" style={{ color: devProgPercent === 100 ? '#10B981' : '#0A3D75', fontWeight: 800 }}>
                  {devProgPercent}% ({devCompletedCount}/{totalTasksCount} Tasks)
                </span>
              </div>
            </div>

            <div className="hero-meta-item">
              <Clock size={16} className="meta-icon" />
              <div>
                <span className="meta-lbl">QA Deadline</span>
                <span className="meta-val" style={{ color: '#0A3D75', fontWeight: 800 }}>
                  {project.deadline || 'Ongoing'}
                </span>
              </div>
            </div>

            <div className="hero-meta-item">
              <IndianRupee size={16} className="meta-icon" />
              <div>
                <span className="meta-lbl">Tester Payout</span>
                <span className="meta-val" style={{ color: '#0A3D75', fontWeight: 800 }}>
                  {formatINR(testerAssigned)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Dual Progress Box */}
        <div className="project-hero-progress-box" style={{ minWidth: '280px' }}>
          <div style={{ marginBottom: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 700, color: '#0A3D75', marginBottom: '4px' }}>
              <span>Developer Progress</span>
              <span style={{ fontWeight: 800 }}>{devProgPercent}%</span>
            </div>
            <div className="progress-bar-track">
              <div 
                className="progress-bar-fill" 
                style={{ 
                  width: `${devProgPercent}%`, 
                  backgroundColor: devProgPercent === 100 ? '#10B981' : '#0A3D75' 
                }} 
              />
            </div>
            <span style={{ fontSize: '0.7rem', color: '#64748B', display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
              <span>{devCompletedCount} of {totalTasksCount} tasks done</span>
              <strong style={{ color: devProgPercent === 100 ? '#10B981' : '#D97706' }}>
                {devProgPercent === 100 ? '✓ Ready for QA' : `${devProgPercent}% In Progress`}
              </strong>
            </span>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 700, color: '#C2410C', marginBottom: '4px' }}>
              <span>QA Testing Progress</span>
              <span>{qaProgressPercent}%</span>
            </div>
            <div className="progress-bar-track">
              <div 
                className="progress-bar-fill" 
                style={{ 
                  width: `${qaProgressPercent}%`, 
                  backgroundColor: qaProgressPercent === 100 ? '#10B981' : '#F3821D' 
                }} 
              />
            </div>
            <span style={{ fontSize: '0.7rem', color: '#64748B' }}>{passedTasksCount} of {totalTasksCount} tasks passed</span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="admin-project-tabs-bar">
        <button 
          type="button"
          className={`admin-tab-pill ${activeTab === 'checklist' ? 'active' : ''}`}
          onClick={() => setActiveTab('checklist')}
        >
          <CheckCircle2 size={15} />
          <span>QA Checklist ({passedTasksCount}/{totalTasksCount})</span>
        </button>

        <button 
          type="button"
          className={`admin-tab-pill ${activeTab === 'issues' ? 'active' : ''}`}
          onClick={() => setActiveTab('issues')}
        >
          <AlertCircle size={15} />
          <span>Reported Defects ({issues.length})</span>
        </button>

        <button 
          type="button"
          className={`admin-tab-pill ${activeTab === 'submission' ? 'active' : ''}`}
          onClick={() => setActiveTab('submission')}
        >
          <FileCode size={15} />
          <span>Developer Links & Credentials</span>
        </button>

        <button 
          type="button"
          className={`admin-tab-pill ${activeTab === 'requirements' ? 'active' : ''}`}
          onClick={() => setActiveTab('requirements')}
        >
          <FileText size={15} />
          <span>Project Requirements</span>
        </button>

        <button 
          type="button"
          className={`admin-tab-pill ${activeTab === 'documents' ? 'active' : ''}`}
          onClick={() => setActiveTab('documents')}
        >
          <FileCheck size={15} />
          <span>Project Documents ({projectDocs.length})</span>
        </button>
      </div>

      {/* ================= TAB 1: EXACT ADMIN-CREATED QA CHECKLIST ================= */}
      {activeTab === 'checklist' && (
        <div className="portal-card">
          <div className="portal-card-header">
            <div>
              <h2 className="portal-card-title">
                <CheckCircle2 size={18} color="#0A3D75" />
                <span>QA Verification Checklist ({totalTasksCount} Admin Milestone Tasks)</span>
              </h2>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.84rem', color: '#64748B' }}>
                Verify each Admin-defined project deliverable. Exactly 3 statuses: <strong>Pending (0%)</strong>, <strong>Pass (Weight %)</strong>, and <strong>Fail (0%)</strong>.
              </p>
            </div>

            <button 
              type="button" 
              className="btn btn-navy-action"
              style={{ padding: '6px 14px', fontSize: '0.78rem', background: '#FEE2E2', color: '#DC2626', borderColor: '#FCA5A5' }}
              onClick={() => {
                setActiveTaskForIssue(null);
                setShowIssueModal(true);
              }}
            >
              <Plus size={13} />
              <span>Log General Defect</span>
            </button>
          </div>

          {/* Admin Revision Callout in Checklist Tab */}
          {isRevision && (
            <div style={{ background: '#FEF2F2', border: '1.5px solid #FECACA', borderRadius: '10px', padding: '14px 16px', marginBottom: '18px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <AlertOctagon size={20} color="#DC2626" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <strong style={{ fontSize: '0.9rem', color: '#991B1B' }}>Admin Revision Request Details</strong>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#991B1B' }}>
                    {project.adminRejectedAt ? `Requested on ${new Date(project.adminRejectedAt).toLocaleDateString('en-GB')}` : 'Action Pending'}
                  </span>
                </div>
                <p style={{ margin: '0 0 6px 0', fontSize: '0.85rem', color: '#7F1D1D', lineHeight: 1.5 }}>
                  <strong>Required Fixes:</strong> {project.adminRejectionComment || project.adminFeedback || project.revisionReason}
                </p>
                {project.revisionTask && project.revisionTask !== 'General Project Revision' && (
                  <span style={{ display: 'inline-block', fontSize: '0.78rem', background: '#FEE2E2', color: '#991B1B', padding: '2px 8px', borderRadius: '4px', fontWeight: 700, border: '1px solid #FCA5A5' }}>
                    🎯 Targeted Milestone: {project.revisionTask}
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="portal-table-container">
            <table className="portal-table">
              <thead>
                <tr>
                  <th style={{ width: '45px' }}>#</th>
                  <th>Task & Deliverable</th>
                  <th style={{ width: '145px' }}>Developer Status</th>
                  <th style={{ width: '85px' }}>Weight</th>
                  <th style={{ width: '200px' }}>QA Status Toggle</th>
                  <th style={{ width: '220px' }}>Verification Notes / Issues</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task, idx) => {
                  const taskWeight = task.weight !== undefined 
                    ? task.weight 
                    : (task.adminPercentage !== undefined 
                        ? task.adminPercentage 
                        : (task.percentage !== undefined ? task.percentage : Math.round(100 / (tasks.length || 1))));

                  const isPassed = task.qaStatus === 'Passed' || task.qaStatus === 'Pass';
                  const isFailed = task.qaStatus === 'Failed' || task.qaStatus === 'Fail';
                  const isPending = !isPassed && !isFailed;
                  const devTaskProg = task.progress !== undefined ? task.progress : (task.status === 'Completed' || task.status === 'Done' ? 100 : task.status === 'In Progress' ? 50 : 0);
                  
                  const isTargetedRevision = Boolean(
                    project.revisionTask && (
                      project.revisionTask === `${task.number} ${task.name}` || 
                      project.revisionTask === task.name || 
                      project.revisionTask === task.id ||
                      (task.qaNotes && task.qaNotes.toLowerCase().includes('admin'))
                    )
                  );

                  return (
                    <tr key={task.id || idx} className={`checklist-row ${isPassed ? 'passed' : isFailed ? 'failed' : 'pending'}`} style={isTargetedRevision ? { backgroundColor: '#FFF5F5' } : {}}>
                      <td>
                        <span className="chk-num">{task.number || (idx + 1 < 10 ? `0${idx + 1}` : `${idx + 1}`)}</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <strong className="chk-title">{task.name}</strong>
                          {isTargetedRevision && (
                            <span style={{ fontSize: '0.68rem', fontWeight: 800, background: '#DC2626', color: '#FFFFFF', padding: '1px 6px', borderRadius: '4px' }}>
                              Admin Flagged
                            </span>
                          )}
                        </div>
                        <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: '#64748B' }}>
                          {task.desc || task.description || 'Milestone deliverable specification'}
                        </p>
                        {isTargetedRevision && (
                          <div style={{ marginTop: '6px', background: '#FEF2F2', borderLeft: '3px solid #DC2626', padding: '6px 8px', borderRadius: '4px' }}>
                            <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#DC2626', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                              <AlertOctagon size={11} />
                              <span>Flagged by Admin for Rework:</span>
                            </span>
                            <span style={{ fontSize: '0.78rem', color: '#7F1D1D', whiteSpace: 'pre-line', fontWeight: 600 }}>
                              {project.adminRejectionComment || project.adminFeedback || task.qaNotes}
                            </span>
                          </div>
                        )}
                        {(task.notes || task.developerNotes || task.freelancerNotes) && (
                          <div style={{ marginTop: '6px', background: '#F8FAFC', borderLeft: '3px solid #0A3D75', padding: '6px 8px', borderRadius: '4px' }}>
                            <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#0A3D75', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>
                              Developer Note:
                            </span>
                            <span style={{ fontSize: '0.78rem', color: '#334155', whiteSpace: 'pre-line' }}>
                              {task.notes || task.developerNotes || task.freelancerNotes}
                            </span>
                          </div>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <StatusBadge status={task.status || 'Pending'} size="small" />
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{ width: '50px', height: '4px', background: '#E2E8F0', borderRadius: '2px', overflow: 'hidden' }}>
                              <div 
                                style={{ 
                                  width: `${devTaskProg}%`, 
                                  height: '100%', 
                                  backgroundColor: devTaskProg === 100 ? '#10B981' : devTaskProg > 0 ? '#F3821D' : '#94A3B8' 
                                }} 
                              />
                            </div>
                            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569' }}>
                              {devTaskProg}%
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0A3D75', background: '#EBF3FA', padding: '3px 8px', borderRadius: '4px' }}>
                          {taskWeight}%
                        </span>
                      </td>
                      <td>
                        <div className="qa-status-toggle-group">
                          <button
                            type="button"
                            className={`status-chip passed ${isPassed ? 'active' : ''}`}
                            onClick={() => handleTaskStatusChange(task.id, isPassed ? 'Pending' : 'Passed')}
                            title="Mark Test Passed"
                            disabled={isFinalized}
                          >
                            <Check size={13} />
                            <span>Pass</span>
                          </button>

                          <button
                            type="button"
                            className={`status-chip failed ${isFailed ? 'active' : ''}`}
                            onClick={() => handleTaskStatusChange(task.id, 'Failed')}
                            title="Mark Test Failed & Log Defect Modal"
                            disabled={isFinalized}
                          >
                            <X size={13} />
                            <span>Fail</span>
                          </button>
                        </div>
                      </td>
                      <td>
                        {isFailed ? (
                          <span style={{ color: '#DC2626', fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <AlertCircle size={13} />
                            <span>Failed: {task.qaNotes || 'Defect logged'}</span>
                          </span>
                        ) : isPassed ? (
                          <span style={{ color: '#16A34A', fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle2 size={13} />
                            <span>Passed verification</span>
                          </span>
                        ) : (
                          <span style={{ color: '#94A3B8', fontSize: '0.8rem' }}>Pending verification</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= TAB 2: REPORTED DEFECTS ================= */}
      {activeTab === 'issues' && (
        <div className="portal-card">
          <div className="portal-card-header">
            <div>
              <h2 className="portal-card-title">
                <AlertCircle size={18} color="#DC2626" />
                <span>Reported QA Defects ({issues.length})</span>
              </h2>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.84rem', color: '#64748B' }}>
                Defects logged during verification are shared with the Developer for rework and bug resolution.
              </p>
            </div>

            <button 
              type="button" 
              className="btn btn-navy-action"
              style={{ padding: '6px 14px', fontSize: '0.78rem' }}
              onClick={() => {
                setActiveTaskForIssue(null);
                setShowIssueModal(true);
              }}
            >
              <Plus size={13} />
              <span>Report New Defect</span>
            </button>
          </div>

          {/* Admin Change Request Escalation Card */}
          {isRevision && (
            <div className="qa-defect-card severity-high" style={{ borderLeft: '5px solid #DC2626', background: '#FEF2F2', borderColor: '#FECACA', marginBottom: '16px' }}>
              <div className="qa-defect-card-header">
                <div className="qa-defect-tags-row">
                  <span className="qa-severity-badge severity-high" style={{ background: '#DC2626', color: '#FFFFFF' }}>
                    <AlertOctagon size={13} />
                    <span>Admin Rejection Escalation</span>
                  </span>
                  <span className="qa-task-badge">
                    <span>📌 {project.revisionTask || 'General Project Scope'}</span>
                  </span>
                  <span className="qa-defect-status-chip open">
                    <AlertCircle size={13} color="#DC2626" />
                    <span>Open Admin Feedback • Developer Rework</span>
                  </span>
                </div>
                <div className="qa-defect-date">
                  <Calendar size={13} />
                  <span>{project.adminRejectedAt ? new Date(project.adminRejectedAt).toLocaleDateString('en-GB') : 'Recent'}</span>
                </div>
              </div>
              <div className="qa-defect-body">
                <h3 className="qa-defect-title" style={{ color: '#991B1B' }}>
                  Problems & Required Changes Specified by Master Admin
                </h3>
                <p className="qa-defect-desc" style={{ color: '#7F1D1D', fontSize: '0.88rem', lineHeight: 1.5, whiteSpace: 'pre-line' }}>
                  {project.adminRejectionComment || project.adminFeedback || project.revisionReason}
                </p>
              </div>
              {project.adminRejectionDocument && (
                <div className="qa-defect-footer" style={{ borderTop: '1px solid #FECACA', paddingTop: '10px' }}>
                  <div className="qa-attachment-box" style={{ background: '#FFFFFF', border: '1px solid #FECACA', width: '100%', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FileText size={16} color="#DC2626" />
                      <span className="attachment-name" style={{ color: '#991B1B', fontWeight: 700 }}>
                        {typeof project.adminRejectionDocument === 'string' ? project.adminRejectionDocument : (project.adminRejectionDocument.name || 'Revision_Guidelines.pdf')}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDownloadDoc(typeof project.adminRejectionDocument === 'object' ? project.adminRejectionDocument : { name: project.adminRejectionDocument, type: 'PDF', size: '1.5 MB', date: 'Revision' })}
                      style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', fontWeight: 800, textDecoration: 'underline' }}
                    >
                      <Download size={13} />
                      <span>Download Guideline Doc</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {issues.length > 0 ? (
            <div className="issues-list-qa-grid">
              {issues.map((iss, i) => {
                const isResolved = iss.status === 'Resolved';
                const severity = (iss.severity || 'High').toLowerCase();
                const taskName = iss.task || iss.taskName || 'General Milestone Task';

                return (
                  <div key={iss.id || i} className={`qa-defect-card severity-${severity} ${isResolved ? 'is-resolved' : ''}`}>
                    {/* Header Row */}
                    <div className="qa-defect-card-header">
                      <div className="qa-defect-tags-row">
                        <span className={`qa-severity-badge severity-${severity}`}>
                          <AlertCircle size={13} />
                          <span>{iss.severity || 'High'} Severity</span>
                        </span>
                        
                        <span className="qa-category-badge">
                          <Layers size={13} />
                          <span>{iss.category || 'Functionality'}</span>
                        </span>

                        <span className="qa-task-badge">
                          <span>📌 {taskName}</span>
                        </span>

                        <span className={`qa-defect-status-chip ${isResolved ? 'resolved' : 'open'}`}>
                          {isResolved ? (
                            <>
                              <CheckCircle2 size={13} color="#16A34A" />
                              <span>Resolved by Developer</span>
                            </>
                          ) : (
                            <>
                              <AlertOctagon size={13} color="#DC2626" />
                              <span>Open Defect • Rework Required</span>
                            </>
                          )}
                        </span>
                      </div>

                      <div className="qa-defect-date">
                        <Calendar size={13} />
                        <span>{iss.date || iss.loggedAt || '08 Oct 2026'}</span>
                      </div>
                    </div>

                    {/* Title & Description */}
                    <div className="qa-defect-body">
                      <h3 className="qa-defect-title">{iss.title}</h3>
                      {iss.description && (
                        <p className="qa-defect-desc">{iss.description}</p>
                      )}
                    </div>

                    {/* Side-by-Side Diff Box: Expected vs Observed */}
                    {(iss.expected || iss.actual) && (
                      <div className="qa-defect-diff-grid">
                        {iss.expected && (
                          <div className="qa-diff-box expected">
                            <div className="diff-box-label">
                              <Check size={13} color="#16A34A" />
                              <span>EXPECTED BEHAVIOR</span>
                            </div>
                            <p className="diff-box-content">{iss.expected}</p>
                          </div>
                        )}

                        {iss.actual && (
                          <div className="qa-diff-box observed">
                            <div className="diff-box-label">
                              <X size={13} color="#DC2626" />
                              <span>OBSERVED BUG</span>
                            </div>
                            <p className="diff-box-content">{iss.actual}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Attachment / Footer Row */}
                    {iss.attachment && (
                      <div className="qa-defect-footer">
                        <div className="qa-attachment-box">
                          <FileText size={14} color="#0A3D75" />
                          <span className="attachment-name">{iss.attachment}</span>
                          <span className="attachment-badge">Attached Screenshot / Proof</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-qa-state">
              <CheckCircle2 size={40} color="#10B981" />
              <h4>No Defects Reported</h4>
              <p>All tested deliverables have passed QA criteria and meet specifications.</p>
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 3: DEVELOPER SUBMISSION & CREDENTIALS ================= */}
      {activeTab === 'submission' && (
        <div className="portal-card">
          <div className="portal-card-header">
            <h2 className="portal-card-title">
              <FileCode size={18} color="#0A3D75" />
              <span>Developer Submission Links & Credentials</span>
            </h2>
            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: devProgPercent === 100 ? '#166534' : '#0A3D75', background: devProgPercent === 100 ? '#DCFCE7' : '#EBF3FA', padding: '4px 10px', borderRadius: '6px' }}>
              Developer Work: {devProgPercent}% Complete ({devCompletedCount}/{totalTasksCount} Tasks)
            </span>
          </div>

          {/* Developer Progress & Submission Notes Banner */}
          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '16px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div>
                <strong style={{ fontSize: '0.9rem', color: '#0F172A' }}>Developer Implementation Progress</strong>
                <span style={{ fontSize: '0.78rem', color: '#64748B', display: 'block' }}>Reported by {project.developer || 'Developer'} ({devCompletedCount} of {totalTasksCount} milestone deliverables completed)</span>
              </div>
              <strong style={{ fontSize: '0.95rem', color: devProgPercent === 100 ? '#10B981' : '#0A3D75' }}>
                {devProgPercent}%
              </strong>
            </div>
            <div className="progress-bar-track" style={{ height: '7px', marginBottom: '8px' }}>
              <div 
                className="progress-bar-fill" 
                style={{ width: `${devProgPercent}%`, backgroundColor: devProgPercent === 100 ? '#10B981' : '#0A3D75' }} 
              />
            </div>
            {project.submissionNotes && (
              <div style={{ marginTop: '10px', padding: '10px 12px', background: '#FFFFFF', borderRadius: '6px', border: '1px solid #E2E8F0', fontSize: '0.84rem', color: '#334155' }}>
                <strong style={{ color: '#0A3D75' }}>Submission Note:</strong> {project.submissionNotes}
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
            <div style={{ padding: '16px', background: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0A3D75', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ExternalLink size={14} color="#F3821D" />
                <span>Live Project Demo Link</span>
              </span>
              <div style={{ marginTop: '8px' }}>
                {project.liveLink || project.liveProjectLink ? (
                  <a 
                    href={project.liveLink || project.liveProjectLink} 
                    target="_blank" 
                    rel="noreferrer"
                    style={{ color: '#0A3D75', fontWeight: 700, fontSize: '0.9rem', wordBreak: 'break-all', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <span>{project.liveLink || project.liveProjectLink}</span>
                    <ExternalLink size={14} />
                  </a>
                ) : (
                  <span style={{ color: '#94A3B8', fontSize: '0.85rem' }}>Not provided by developer yet</span>
                )}
              </div>
            </div>

            <div style={{ padding: '16px', background: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0A3D75', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <UploadCloud size={14} color="#0A3D75" />
                <span>Google Drive Project Build ZIP</span>
              </span>
              <div style={{ marginTop: '8px' }}>
                {project.driveLink || project.driveProjectLink ? (
                  <a 
                    href={project.driveLink || project.driveProjectLink} 
                    target="_blank" 
                    rel="noreferrer"
                    style={{ color: '#0A3D75', fontWeight: 700, fontSize: '0.9rem', wordBreak: 'break-all', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <span>{project.driveLink || project.driveProjectLink}</span>
                    <ExternalLink size={14} />
                  </a>
                ) : (
                  <span style={{ color: '#94A3B8', fontSize: '0.85rem' }}>Not provided by developer yet</span>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '0.95rem', color: '#0A3D75', fontWeight: 800, margin: 0 }}>
              Project Access Credentials ({(project.credentials || []).length})
            </h3>
            <button
              type="button"
              className="btn btn-navy-action"
              onClick={() => setIsCredModalOpen(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', fontSize: '0.8rem', borderRadius: '6px' }}
            >
              <Plus size={14} />
              <span>Add Credential</span>
            </button>
          </div>

          {(project.credentials && project.credentials.length > 0) ? (
            <div className="portal-table-container">
              <table className="portal-table">
                <thead>
                  <tr>
                    <th>Service / Platform</th>
                    <th>Email / Username</th>
                    <th>Password / Secret</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {project.credentials.map((c, idx) => (
                    <tr key={c.id || idx}>
                      <td><strong>{c.service || c.platform || c.type}</strong></td>
                      <td><code>{c.username || '—'}</code></td>
                      <td><code style={{ background: '#F1F5F9', padding: '2px 6px', borderRadius: '4px' }}>{c.secret || '••••••••'}</code></td>
                      <td>{c.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ padding: '24px 16px', textAlign: 'center', background: '#F8FAFC', borderRadius: '8px', border: '1px dashed #CBD5E1' }}>
              <KeyRound size={28} color="#94A3B8" style={{ marginBottom: '6px' }} />
              <p style={{ color: '#64748B', fontSize: '0.85rem', margin: '0 0 10px 0' }}>No credentials added for this project yet.</p>
              <button
                type="button"
                className="btn btn-navy-action"
                onClick={() => setIsCredModalOpen(true)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: '0.8rem' }}
              >
                <Plus size={14} />
                <span>Add First Credential</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 4: PROJECT REQUIREMENTS ================= */}
      {activeTab === 'requirements' && (
        <div className="portal-card">
          <div className="portal-card-header">
            <h2 className="portal-card-title">
              <FileText size={18} color="#0A3D75" />
              <span>Project Requirements & Specifications</span>
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <h4 style={{ margin: '0 0 6px 0', color: '#0A3D75', fontSize: '0.9rem' }}>Project Scope</h4>
              <p style={{ margin: 0, fontSize: '0.88rem', color: '#475569', lineHeight: 1.6 }}>
                {project.description || 'Complete development and QA verification according to specifications.'}
              </p>
            </div>

            {project.clientRequirements && project.clientRequirements.length > 0 && (
              <div>
                <h4 style={{ margin: '0 0 6px 0', color: '#0A3D75', fontSize: '0.9rem' }}>Client Requirements</h4>
                <ul style={{ margin: 0, paddingLeft: '20px', color: '#475569', fontSize: '0.88rem' }}>
                  {project.clientRequirements.map((r, i) => <li key={i}>{r}</li>)}
                </ul>
              </div>
            )}

            {project.technicalRequirements && project.technicalRequirements.length > 0 && (
              <div>
                <h4 style={{ margin: '0 0 6px 0', color: '#0A3D75', fontSize: '0.9rem' }}>Technical Specifications</h4>
                <ul style={{ margin: 0, paddingLeft: '20px', color: '#475569', fontSize: '0.88rem' }}>
                  {project.technicalRequirements.map((r, i) => <li key={i}>{r}</li>)}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= TAB 5: ADMIN PROJECT DOCUMENTS ================= */}
      {activeTab === 'documents' && (
        <div className="portal-card">
          <div className="portal-card-header">
            <div>
              <h2 className="portal-card-title">
                <FileCheck size={18} color="#0A3D75" />
                <span>Admin Project Documents & Reference Specifications</span>
              </h2>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.84rem', color: '#64748B' }}>
                Access project specification files, Figma assets, and reference guidelines provided by Admin for this project.
              </p>
            </div>
            <span className="docs-count-chip">{projectDocs.length} Files</span>
          </div>

          <div className="documents-list">
            {projectDocs.length > 0 ? (
              projectDocs.map((doc) => (
                <div key={doc.id} className="document-card">
                  <div className="doc-icon-wrap">
                    <FileText size={22} color="#0A3D75" />
                  </div>
                  <div className="doc-info">
                    <div className="doc-name">{doc.name}</div>
                    <div className="doc-meta">
                      <span className="doc-type-badge">{doc.type || 'Document'}</span>
                      <span>{doc.size || '1.5 MB'}</span>
                      {doc.date && <span>• {doc.date}</span>}
                    </div>
                  </div>
                  <div className="doc-actions" style={{ display: 'flex', gap: '6px' }}>
                    <button 
                      type="button" 
                      className="btn-doc-action"
                      title="View Document"
                      onClick={() => handleViewDoc(doc)}
                      style={{ padding: '7px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#0A3D75', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Eye size={16} />
                    </button>
                    <button 
                      type="button" 
                      className="btn-doc-action"
                      title="Download Document"
                      onClick={() => handleDownloadDoc(doc)}
                      style={{ padding: '7px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#F3821D', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Download size={16} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: '24px 16px', textAlign: 'center', color: '#64748B', background: '#F8FAFC', borderRadius: '8px', border: '1px dashed #CBD5E1' }}>
                <FileText size={28} color="#94A3B8" style={{ margin: '0 auto 8px', display: 'block' }} />
                <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#475569' }}>No Specification Documents Attached</div>
                <div style={{ fontSize: '0.78rem', color: '#94A3B8', marginTop: '4px' }}>Admin has not attached any external specification files for this project.</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Issue Modal (Transactional for Defect Logging) */}
      <IssueModal
        isOpen={showIssueModal}
        checklistTitle={activeTaskForIssue?.name || ''}
        relatedTaskDefault={activeTaskForIssue?.name || ''}
        relatedTaskId={activeTaskForIssue?.id || null}
        onClose={() => {
          setShowIssueModal(false);
          setActiveTaskForIssue(null);
        }}
        onAddIssue={handleAddIssue}
      />

      {/* Request Changes Modal */}
      <RequestChangesModal
        isOpen={showRequestChangesModal}
        projectName={project.name}
        developerName={project.developer}
        onClose={() => setShowRequestChangesModal(false)}
        onRequestChanges={handleRequestChanges}
      />

      {/* Approve / Finalize Modal */}
      <ApproveTestingModal
        isOpen={showApproveModal}
        project={project}
        checklistCount={totalTasksCount}
        onClose={() => setShowApproveModal(false)}
        onConfirmApprove={handleFinalizeProject}
      />

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
                  <span style={{ fontSize: '0.76rem', color: '#64748B' }}>{previewDoc.type || 'Document'} • {previewDoc.size} • Uploaded {previewDoc.date || 'Recent'}</span>
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

                    {project.technicalRequirements && project.technicalRequirements.length > 0 && (
                      <div>
                        <div style={{ fontWeight: 700, color: '#0F172A' }}>Technical Notes:</div>
                        <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                          {project.technicalRequirements.map((r, i) => (
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

      {/* Credential Modal for Tester */}
      <CredentialModal
        isOpen={isCredModalOpen}
        onClose={() => setIsCredModalOpen(false)}
        onAddCredential={handleAddCredential}
        onSave={handleAddCredential}
      />
    </div>
  );
}
