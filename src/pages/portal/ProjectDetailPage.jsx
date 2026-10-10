import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Calendar, 
  IndianRupee, 
  Clock, 
  CheckCircle, 
  FileText, 
  Download, 
  Eye, 
  Plus, 
  Copy, 
  Check, 
  Key, 
  ShieldAlert, 
  ExternalLink, 
  Send, 
  CheckSquare, 
  AlertCircle,
  FolderKanban,
  FileCheck,
  ChevronRight,
  Info,
  X,
  Link as LinkIcon,
  Trash2
} from 'lucide-react';
import StatusBadge from '../../components/portal/StatusBadge';
import TaskDrawer from '../../components/portal/TaskDrawer';
import CredentialModal from '../../components/portal/CredentialModal';
import SubmissionModal from '../../components/portal/SubmissionModal';
import EmptyState from '../../components/portal/EmptyState';
import { 
  getFreelancerProjectStatus, 
  getDevAmount, 
  getDevPaid, 
  getDevRemaining, 
  getDevProgress, 
  formatINR,
  calculateProjectProgressFromTasks,
  areAllTasksCompleted
} from '../../utils/projectStatusUtils';
import { downloadProjectDocument, getDocPreviewSource } from '../../utils/documentDownloadHelper';
import './ProjectDetailPage.css';

export default function ProjectDetailPage({ 
  project, 
  onBack, 
  onUpdateProject, 
  onNavigate 
}) {
  const [activeTask, setActiveTask] = useState(null);
  const [isTaskDrawerOpen, setIsTaskDrawerOpen] = useState(false);
  const [isCredModalOpen, setIsCredModalOpen] = useState(false);
  const [isSubmissionModalOpen, setIsSubmissionModalOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);

  // Two dedicated project link states
  const [liveProjectLink, setLiveProjectLink] = useState(project?.liveLink || project?.liveProjectLink || '');
  const [driveProjectLink, setDriveProjectLink] = useState(project?.driveLink || project?.driveProjectLink || '');
  
  // Masked secret toggles (id -> boolean)
  const [revealedSecrets, setRevealedSecrets] = useState({});
  const [copiedKeyId, setCopiedKeyId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    if (project) {
      setLiveProjectLink(project.liveLink || project.liveProjectLink || '');
      setDriveProjectLink(project.driveLink || project.driveProjectLink || '');
    }
  }, [project?.id]);

  if (!project) {
    return (
      <div className="portal-card" style={{ textAlign: 'center', padding: '48px 24px' }}>
        <EmptyState
          icon={FolderKanban}
          title="Access Denied / Project Not Found"
          description="You do not have permission to view this project or it is not assigned to your freelancer account."
          actionLabel="Back to My Projects"
          onAction={onBack || (() => onNavigate && onNavigate('projects'))}
        />
      </div>
    );
  }

  // Derive exact single lifecycle state and financials
  const currentStatus = getFreelancerProjectStatus(project);
  const devTotal = getDevAmount(project);
  const devPaid = getDevPaid(project);
  const devRemaining = getDevRemaining(project);

  // Compute deterministic progress from tasks
  const devProg = calculateProjectProgressFromTasks(project.tasks || []);
  const allTasksDone = areAllTasksCompleted(project.tasks || []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const toggleSecretVisibility = (id) => {
    setRevealedSecrets(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleCopySecret = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedKeyId(id);
    showToast('Copied to clipboard!');
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  const handleOpenTask = (task) => {
    setActiveTask(task);
    setIsTaskDrawerOpen(true);
  };

  const handleStartProject = () => {
    onUpdateProject({
      ...project,
      developerStarted: true,
      developerStartedAt: new Date().toISOString(),
      status: 'Active',
      testingStatus: 'Pending',
      testingActivity: [
        ...(project.testingActivity || []),
        { 
          event: `Developer started project`, 
          time: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }), 
          by: project.developer || 'Developer' 
        }
      ]
    });
    showToast('🚀 Project started! You can now work on your milestone tasks.');
  };

  // Handle resolving a specific QA defect
  const handleResolveIssue = (issueId) => {
    const targetIssue = (project.testingIssues || []).find(i => i.id === issueId);
    
    const updatedIssues = (project.testingIssues || []).map(i => {
      if (i.id === issueId) {
        return {
          ...i,
          status: 'Resolved',
          resolvedAt: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          resolvedBy: project.developer || 'Developer'
        };
      }
      return i;
    });

    // Also mark the corresponding task as Completed
    const updatedTasks = (project.tasks || []).map(t => {
      const isMatch = 
        targetIssue && (
          t.id === targetIssue.taskId ||
          t.name === targetIssue.taskName ||
          (targetIssue.title && (targetIssue.title.toLowerCase().includes(t.name.toLowerCase()) || t.name.toLowerCase().includes(targetIssue.title.toLowerCase()))) ||
          ((t.status === 'Failed' || t.qaStatus === 'Failed') && (project.testingIssues || []).length === 1)
        );
      
      if (isMatch) {
        return {
          ...t,
          status: 'Completed',
          qaStatus: 'Pending',
          progress: 100,
          updatedAt: new Date().toISOString()
        };
      }
      return t;
    });

    const newProgress = calculateProjectProgressFromTasks(updatedTasks);

    onUpdateProject({
      ...project,
      tasks: updatedTasks,
      testingIssues: updatedIssues,
      issues: updatedIssues,
      progress: newProgress,
      freelancerProgress: newProgress,
      developerProgress: newProgress
    });

    showToast('✓ Issue marked as Resolved & corresponding task marked Completed!');
  };

  // Toggle task checkbox in list: Pending / Failed -> In Progress -> Completed
  const handleToggleTaskCheckbox = (taskId, e) => {
    e.stopPropagation();

    // If not started yet, automatically start on task progress
    if (!project.developerStarted) {
      handleStartProject();
    }

    const hasReworkRequested = 
      currentStatus === 'Revision Required' || 
      project.status === 'Revision Required' || 
      project.status === 'Changes Requested' || 
      project.testingStatus === 'Changes Requested' || 
      (project.testingIssues && project.testingIssues.some(i => i.status !== 'Resolved')) || 
      (project.tasks || []).some(t => t.status === 'Failed' || t.qaStatus === 'Failed');

    // Do not allow normal task edits once submitted unless rework / revision requested
    if (!hasReworkRequested && (currentStatus === 'Submitted' || currentStatus === 'Under Review' || currentStatus === 'Finalized' || currentStatus === 'Approved' || currentStatus === 'Completed')) {
      showToast('Project is locked for review.');
      return;
    }

    const targetTask = (project.tasks || []).find(t => t.id === taskId);
    const isNowCompleting = targetTask && targetTask.status !== 'Completed';

    const updatedTasks = (project.tasks || []).map(t => {
      if (t.id === taskId) {
        const nextStatus = t.status === 'Completed' ? 'In Progress' : 'Completed';
        const nextProg = nextStatus === 'Completed' ? 100 : 50;
        return { 
          ...t, 
          status: nextStatus, 
          qaStatus: nextStatus === 'Completed' ? 'Pending' : t.qaStatus,
          progress: nextProg, 
          updatedAt: new Date().toISOString() 
        };
      }
      return t;
    });

    // If task is completed, automatically resolve any matching tester issue
    let updatedIssues = project.testingIssues || [];
    if (isNowCompleting && targetTask && updatedIssues.length > 0) {
      updatedIssues = updatedIssues.map(issue => {
        const isMatch = 
          issue.taskId === targetTask.id ||
          issue.taskName === targetTask.name ||
          (issue.title && (issue.title.toLowerCase().includes(targetTask.name.toLowerCase()) || targetTask.name.toLowerCase().includes(issue.title.toLowerCase()))) ||
          (updatedIssues.filter(i => i.status !== 'Resolved').length === 1 && (targetTask.status === 'Failed' || targetTask.qaStatus === 'Failed'));
        
        if (isMatch) {
          return {
            ...issue,
            status: 'Resolved',
            resolvedAt: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
            resolvedBy: project.developer || 'Developer'
          };
        }
        return issue;
      });
    }

    const newProgress = calculateProjectProgressFromTasks(updatedTasks);

    onUpdateProject({
      ...project,
      tasks: updatedTasks,
      testingIssues: updatedIssues,
      issues: updatedIssues,
      progress: newProgress,
      freelancerProgress: newProgress,
      developerProgress: newProgress
    });
    showToast(`Task ${isNowCompleting ? 'marked Completed' : 'updated'}. Overall progress: ${newProgress}%`);
  };

  // Save task details from TaskDrawer modal
  const handleSaveTaskDetails = (updatedTask) => {
    const isNowCompleting = updatedTask.status === 'Completed';

    const updatedTasks = (project.tasks || []).map(t => 
      t.id === updatedTask.id ? {
        ...updatedTask,
        qaStatus: isNowCompleting ? 'Pending' : updatedTask.qaStatus
      } : t
    );

    // If task is completed, resolve matching tester issue
    let updatedIssues = project.testingIssues || [];
    if (isNowCompleting && updatedIssues.length > 0) {
      updatedIssues = updatedIssues.map(issue => {
        const isMatch = 
          issue.taskId === updatedTask.id ||
          issue.taskName === updatedTask.name ||
          (issue.title && (issue.title.toLowerCase().includes(updatedTask.name.toLowerCase()) || updatedTask.name.toLowerCase().includes(issue.title.toLowerCase()))) ||
          (updatedIssues.filter(i => i.status !== 'Resolved').length === 1);
        
        if (isMatch) {
          return {
            ...issue,
            status: 'Resolved',
            resolvedAt: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
            resolvedBy: project.developer || 'Developer'
          };
        }
        return issue;
      });
    }

    const newProgress = calculateProjectProgressFromTasks(updatedTasks);

    onUpdateProject({
      ...project,
      tasks: updatedTasks,
      testingIssues: updatedIssues,
      issues: updatedIssues,
      progress: newProgress,
      freelancerProgress: newProgress,
      developerProgress: newProgress
    });
    showToast('Task details saved successfully');
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

  // Handle document view
  // Handle document view
  const handleViewDoc = (doc) => {
    setPreviewDoc(doc);
  };

  // Handle document download (Strictly exact file name and valid binary format)
  const handleDownloadDoc = (doc) => {
    downloadProjectDocument(doc, project, showToast);
  };

  // Save links on change
  const handleSaveLinks = () => {
    onUpdateProject({
      ...project,
      liveLink: liveProjectLink.trim(),
      liveProjectLink: liveProjectLink.trim(),
      driveLink: driveProjectLink.trim(),
      driveProjectLink: driveProjectLink.trim()
    });
    showToast('Project links saved successfully.');
  };

  const completedTasksCount = (project.tasks || []).filter(t => t.status === 'Completed').length;
  const totalTasksCount = (project.tasks || []).length;
  const unresolvedIssuesCount = (project.testingIssues || []).filter(i => i.status !== 'Resolved').length;

  const hasLiveLink = Boolean(liveProjectLink && liveProjectLink.trim().length > 0);
  const hasDriveLink = Boolean(driveProjectLink && driveProjectLink.trim().length > 0);

  // Check if QA tester or Admin has requested changes / rework
  const hasReworkRequested = Boolean(
    project.adminRejected === true || 
    project.status === 'Revision Required' || 
    project.status === 'Changes Requested' || 
    project.testingStatus === 'Changes Requested' || 
    (project.testingIssues && project.testingIssues.some(i => i.status !== 'Resolved')) || 
    (project.tasks || []).some(t => t.status === 'Failed' || t.qaStatus === 'Failed' || t.qaStatus === 'Fail')
  );

  // Check if the project is currently in a submitted/review state without open rework
  const isAlreadySubmitted = Boolean(
    !hasReworkRequested && (
      project.developerSubmitted === true || 
      project.freelancerSubmitted === true || 
      project.developerSubmission === 'Submitted' || 
      currentStatus === 'Submitted' || 
      currentStatus === 'Under Review' || 
      currentStatus === 'Finalized' || 
      currentStatus === 'Approved' || 
      currentStatus === 'Completed' ||
      project.status === 'Submitted' || 
      project.status === 'Under Review' || 
      project.status === 'Finalized' || 
      project.status === 'Approved' || 
      project.status === 'Completed'
    )
  );

  // Strict submission rule:
  // 1. If already submitted (and no rework requested), submission is NEVER allowed (button locked/disabled).
  // 2. If rework requested, ALL tasks must be 100% completed, unresolved issues resolved, and both links provided.
  // 3. If active project, all tasks must be 100% completed and both links provided.
  const isSubmissionAllowed = !isAlreadySubmitted && devProg === 100 && allTasksDone && hasLiveLink && hasDriveLink && (!hasReworkRequested || unresolvedIssuesCount === 0);

  // Link inputs are locked while project is formally submitted/under review
  const isLinksLocked = isAlreadySubmitted;

  // Handle Project Submit (Resets previously failed QA tasks to Pending for re-testing)
  const handleProjectSubmit = (submissionData) => {
    if (isAlreadySubmitted) {
      showToast('🔒 Project is already submitted and locked for QA review.');
      return;
    }

    if (!allTasksDone || devProg < 100) {
      showToast('⚠️ All milestone tasks must be 100% completed before submission.');
      return;
    }

    if (!liveProjectLink || !liveProjectLink.trim()) {
      showToast('⚠️ Mandatory: Please provide a valid Live Project Link before submitting.');
      return;
    }

    if (!driveProjectLink || !driveProjectLink.trim()) {
      showToast('⚠️ Mandatory: Please provide a Google Drive Project File Link before submitting.');
      return;
    }

    const submissionDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    
    // On resubmission: Previously failed QA tasks return to Pending so Tester re-checks them; passed tasks remain Pass
    const updatedTasks = (project.tasks || []).map(t => {
      if (t.qaStatus === 'Fail' || t.status === 'Failed' || t.qaStatus === 'Failed') {
        return { ...t, qaStatus: 'Pending', status: 'Completed', progress: 100 };
      }
      return { ...t, status: 'Completed', progress: 100 };
    });

    // Mark all issues as resolved
    const resolvedIssues = (project.testingIssues || []).map(i => ({
      ...i,
      status: 'Resolved',
      resolvedAt: submissionDate,
      resolvedBy: project.developer || 'Developer'
    }));

    onUpdateProject({
      ...project,
      tasks: updatedTasks,
      testingIssues: resolvedIssues,
      issues: resolvedIssues,
      freelancerSubmitted: true,
      freelancerSubmittedAt: new Date().toISOString(),
      developerSubmitted: true,
      developerSubmittedAt: new Date().toISOString(),
      developerSubmission: 'Submitted',
      submittedDate: submissionDate,
      status: 'Submitted',
      testingStatus: 'Pending',
      testerStarted: false,
      testerFinalized: false,
      adminRejected: false,
      adminRejectedAt: null,
      adminRejectionComment: null,
      adminFeedback: null,
      freelancerProgress: 100,
      developerProgress: 100,
      progress: 100,
      liveLink: liveProjectLink.trim(),
      liveProjectLink: liveProjectLink.trim(),
      driveLink: driveProjectLink.trim(),
      driveProjectLink: driveProjectLink.trim(),
      submissionData: submissionData,
      testingActivity: [
        {
          event: hasReworkRequested ? `Project resubmitted by Developer for QA review (Defects resolved)` : `Project submitted by Developer for QA review`,
          time: submissionDate,
          by: project.developer || 'Developer'
        },
        ...(project.testingActivity || [])
      ]
    });
    setIsSubmissionModalOpen(false);
    showToast(hasReworkRequested ? '🎉 Project resubmitted successfully for QA testing!' : '🎉 Project submitted successfully! Submission is now locked for QA review.');
  };

  return (
    <div className="project-detail-container">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="project-detail-toast">
          <CheckCircle size={18} color="#10B981" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Breadcrumb & Actions */}
      <div className="detail-top-nav">
        <button 
          type="button" 
          onClick={onBack} 
          className="btn-back-link"
        >
          <ArrowLeft size={16} />
          <span>Back to Projects</span>
        </button>

        <div className="detail-top-actions">
          <span className="project-id-chip">{project.id}</span>
          <StatusBadge status={currentStatus} />
        </div>
      </div>

      {/* State-Based Information Banners */}
      {!project.developerStarted && (currentStatus === 'Pending' || project.status === 'Pending') && (
        <div className="portal-card" style={{ borderLeft: '4px solid #F3821D', marginBottom: '20px', backgroundColor: '#FFF7ED', padding: '18px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#FDBA74', color: '#9A3412', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Send size={22} />
              </div>
              <div>
                <h4 style={{ margin: 0, color: '#9A3412', fontSize: '1rem', fontWeight: 800 }}>Project Assigned — Ready to Begin</h4>
                <p style={{ margin: '3px 0 0 0', fontSize: '0.86rem', color: '#475569' }}>
                  Click <strong>"Start Project"</strong> to move this project into active development and begin marking tasks.
                </p>
              </div>
            </div>
            <button
              type="button"
              className="btn btn-orange-primary"
              onClick={handleStartProject}
              style={{ padding: '10px 22px', fontSize: '0.92rem', fontWeight: 800, cursor: 'pointer' }}
            >
              <span>🚀 Start Project</span>
            </button>
          </div>
        </div>
      )}

      {/* Rework / Revision Banner (When QA or Admin requested changes) */}
      {hasReworkRequested && (
        <div 
          className="revision-alert-card" 
          style={{ 
            marginBottom: '20px',
            backgroundColor: devProg === 100 && allTasksDone ? '#F0FDF4' : '#FFF5F5',
            borderColor: devProg === 100 && allTasksDone ? '#86EFAC' : '#FECACA'
          }}
        >
          <div className="revision-alert-icon">
            {devProg === 100 && allTasksDone ? (
              <CheckCircle size={28} color="#16A34A" />
            ) : (
              <ShieldAlert size={28} color="#DC2626" />
            )}
          </div>
          <div className="revision-alert-content">
            <div className="revision-alert-header">
              <span 
                className="revision-tag" 
                style={{ 
                  background: devProg === 100 && allTasksDone ? '#DCFCE7' : '#FEE2E2', 
                  color: devProg === 100 && allTasksDone ? '#166534' : '#B91C1C', 
                  fontWeight: 800 
                }}
              >
                {devProg === 100 && allTasksDone 
                  ? '✓ All QA Defects Resolved (100% Completed)' 
                  : `Action Required: QA Rework Needed (${unresolvedIssuesCount} Open Issues)`}
              </span>
              <span className="revision-date">Posted {project.adminRejectedAt ? new Date(project.adminRejectedAt).toLocaleDateString('en-GB') : 'Recently'}</span>
            </div>
            <p className="revision-feedback-text" style={{ fontSize: '0.9rem', color: '#1E293B', marginTop: '6px' }}>
              <strong>{devProg === 100 && allTasksDone ? 'Status:' : 'QA / Admin Instructions:'}</strong>{' '}
              {devProg === 100 && allTasksDone 
                ? 'All defect items have been addressed and all milestone tasks are marked completed. Click "Resubmit for QA Review" to proceed.' 
                : (project.adminRejectionComment || project.adminFeedback || project.testingNotes || 'Please resolve the reported defect items listed below, mark the tasks completed, and resubmit.')}
            </p>
            {project.revisionTask && project.revisionTask !== 'General Project Revision' && (
              <div style={{ fontSize: '0.82rem', color: '#991B1B', fontWeight: 700, marginTop: '4px' }}>
                Target Task: {project.revisionTask}
              </div>
            )}
            {project.adminRejectionDocument && (
              <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '8px', background: '#FFFFFF', padding: '8px 12px', borderRadius: '6px', border: '1px solid #FECACA', width: 'fit-content' }}>
                <FileText size={16} color="#DC2626" />
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#991B1B' }}>
                  {typeof project.adminRejectionDocument === 'string' ? project.adminRejectionDocument : (project.adminRejectionDocument.name || 'Revision_Guidelines.pdf')}
                </span>
                <button
                  type="button"
                  onClick={() => handleDownloadDoc(typeof project.adminRejectionDocument === 'object' ? project.adminRejectionDocument : { name: project.adminRejectionDocument, type: 'PDF', size: '1.5 MB', date: 'Revision' })}
                  style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', fontWeight: 800, marginLeft: '8px' }}
                >
                  <Download size={13} />
                  <span>Download Doc</span>
                </button>
              </div>
            )}
            <div className="revision-action-row" style={{ marginTop: '12px' }}>
              <button 
                type="button" 
                className="btn btn-navy-action"
                onClick={() => {
                  const tasksSection = document.getElementById('project-tasks-section');
                  if (tasksSection) tasksSection.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                View Tasks Checklist
              </button>
              <button 
                type="button" 
                className="btn btn-orange-primary"
                onClick={() => {
                  if (!isSubmissionAllowed) {
                    if (!allTasksDone || devProg < 100) {
                      const tasksSection = document.getElementById('project-tasks-section');
                      if (tasksSection) tasksSection.scrollIntoView({ behavior: 'smooth' });
                      showToast(`⚠️ You must resolve all issues and complete all milestone tasks (100%) to resubmit. Currently at ${devProg}%.`);
                    } else if (!hasLiveLink || !hasDriveLink) {
                      const linksSection = document.getElementById('project-submission-links-section');
                      if (linksSection) linksSection.scrollIntoView({ behavior: 'smooth' });
                      showToast('⚠️ Please enter both Live Project Link & Google Drive ZIP link to resubmit.');
                    }
                    return;
                  }
                  setIsSubmissionModalOpen(true);
                }}
                disabled={!isSubmissionAllowed}
                style={{ 
                  background: isSubmissionAllowed ? '#16A34A' : '#94A3B8', 
                  borderColor: isSubmissionAllowed ? '#16A34A' : '#94A3B8',
                  opacity: isSubmissionAllowed ? 1 : 0.65,
                  cursor: isSubmissionAllowed ? 'pointer' : 'not-allowed'
                }}
              >
                <span>
                  {isSubmissionAllowed 
                    ? 'Resubmit for QA Review 🚀' 
                    : (!allTasksDone || devProg < 100
                      ? `Complete All Tasks to Resubmit (${devProg}%)`
                      : (!hasLiveLink || !hasDriveLink 
                        ? 'Provide Links to Resubmit' 
                        : 'Complete All Tasks to Resubmit'))}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {currentStatus === 'Active' && devProg === 100 && !isAlreadySubmitted && !hasReworkRequested && (
        <div className="portal-card" style={{ borderLeft: '4px solid #F3821D', marginBottom: '20px', backgroundColor: '#FFF7ED', padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <CheckCircle size={22} color="#F3821D" />
              <div>
                <h4 style={{ margin: 0, color: '#9A3412', fontSize: '0.95rem', fontWeight: 800 }}>All Milestones Completed (100%)</h4>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.84rem', color: '#475569' }}>
                  {(!hasLiveLink || !hasDriveLink) 
                    ? 'All tasks are completed! Please provide your Live Project Link and Google Drive ZIP link below to enable project submission.'
                    : 'All tasks and links are verified. Click "Submit Project Now" to submit for QA testing.'}
                </p>
              </div>
            </div>
            <button
              type="button"
              className="btn btn-orange-primary"
              onClick={() => {
                if (!isSubmissionAllowed) {
                  const linksSection = document.getElementById('project-submission-links-section');
                  if (linksSection) linksSection.scrollIntoView({ behavior: 'smooth' });
                  showToast('⚠️ Please enter both Live Project Link & Google Drive ZIP link to submit.');
                  return;
                }
                setIsSubmissionModalOpen(true);
              }}
              disabled={!isSubmissionAllowed}
              style={{ 
                padding: '8px 18px', 
                fontSize: '0.85rem',
                opacity: isSubmissionAllowed ? 1 : 0.65,
                cursor: isSubmissionAllowed ? 'pointer' : 'not-allowed'
              }}
            >
              <Send size={15} />
              <span>{isSubmissionAllowed ? 'Submit Project Now' : 'Links Required to Submit'}</span>
            </button>
          </div>
        </div>
      )}

      {currentStatus === 'Submitted' && (
        <div className="portal-card" style={{ borderLeft: '4px solid #0284C7', marginBottom: '20px', backgroundColor: '#F0F9FF', padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <CheckSquare size={22} color="#0284C7" />
            <div>
              <h4 style={{ margin: 0, color: '#0369A1', fontSize: '0.95rem', fontWeight: 800 }}>Project Formally Submitted</h4>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.84rem', color: '#475569' }}>
                Your project was submitted on <strong>{project.submittedDate || 'recently'}</strong> and is queued for QA Tester assignment.
              </p>
            </div>
          </div>
        </div>
      )}

      {currentStatus === 'Under Review' && (
        <div className="portal-card" style={{ borderLeft: '4px solid #D97706', marginBottom: '20px', backgroundColor: '#FFFBEB', padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Clock size={22} color="#D97706" />
            <div>
              <h4 style={{ margin: 0, color: '#92400E', fontSize: '0.95rem', fontWeight: 800 }}>Project Under Review & QA Testing</h4>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.84rem', color: '#475569' }}>
                QA Tester is actively verifying functionality and test checklist ({project.testingProgress || 0}% QA Progress).
              </p>
            </div>
          </div>
        </div>
      )}

      {currentStatus === 'Finalized' && (
        <div className="portal-card" style={{ borderLeft: '4px solid #6366F1', marginBottom: '20px', backgroundColor: '#EEF2FF', padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <FileCheck size={22} color="#6366F1" />
            <div>
              <h4 style={{ margin: 0, color: '#4338CA', fontSize: '0.95rem', fontWeight: 800 }}>QA Testing Finalized — Pending Admin Approval</h4>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.84rem', color: '#475569' }}>
                QA Tester has passed and finalized the review. Waiting for final Admin approval.
              </p>
            </div>
          </div>
        </div>
      )}

      {currentStatus === 'Approved' && (
        <div className="portal-card" style={{ borderLeft: '4px solid #10B981', marginBottom: '20px', backgroundColor: '#ECFDF5', padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <CheckCircle size={22} color="#10B981" />
            <div>
              <h4 style={{ margin: 0, color: '#065F46', fontSize: '0.95rem', fontWeight: 800 }}>Project Approved — Developer Payout of {formatINR(devTotal)} Approved</h4>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.84rem', color: '#475569' }}>
                Admin has approved this project. Paid: <strong>{formatINR(devPaid)}</strong> | Remaining Balance: <strong>{formatINR(devRemaining)}</strong>.
              </p>
            </div>
          </div>
        </div>
      )}

      {currentStatus === 'Completed' && (
        <div className="portal-card" style={{ borderLeft: '4px solid #16A34A', marginBottom: '20px', backgroundColor: '#F0FDF4', padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <CheckCircle size={22} color="#16A34A" />
            <div>
              <h4 style={{ margin: 0, color: '#15803D', fontSize: '0.95rem', fontWeight: 800 }}>Project Completed & Payout 100% Cleared</h4>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.84rem', color: '#475569' }}>
                Total developer payout of <strong>{formatINR(devPaid)}</strong> has been settled in full. Remaining: <strong>₹0</strong>.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Top Project Hero Card (Strict Privacy: Client Name completely omitted) */}
      <div className="project-hero-card">
        <div className="project-hero-main">
          <div className="hero-category-badge">{project.category || project.projectType || 'Corporate Development'}</div>
          <h1 className="hero-project-title">{project.name}</h1>
          
          <div className="hero-meta-grid">
            <div className="hero-meta-item">
              <Calendar size={16} className="meta-icon" />
              <div>
                <span className="meta-lbl">Assigned Date</span>
                <span className="meta-val">{project.assignedDate || project.startDate || '—'}</span>
              </div>
            </div>

            <div className="hero-meta-item">
              <Clock size={16} className="meta-icon" />
              <div>
                <span className="meta-lbl">Deadline</span>
                <span className="meta-val" style={{ color: project.status === 'Revision Required' ? '#EF4444' : '#0A3D75', fontWeight: 800 }}>
                  {project.submissionDate || project.developerDeadline || project.deadline || project.completedDate || 'Ongoing'}
                </span>
              </div>
            </div>

            <div className="hero-meta-item">
              <IndianRupee size={16} className="meta-icon" />
              <div>
                <span className="meta-lbl">Developer Payout</span>
                <span className="meta-val" style={{ color: '#0A3D75', fontWeight: 800 }}>
                  {formatINR(devTotal)}
                </span>
              </div>
            </div>

            {(project.developerTransactionId || project.transactionId) && devPaid > 0 && (
              <div className="hero-meta-item">
                <CheckCircle size={16} className="meta-icon" style={{ color: '#16A34A', background: '#DCFCE7' }} />
                <div>
                  <span className="meta-lbl">Disbursal Ref / Txn ID</span>
                  <span className="meta-val" style={{ color: '#166534', fontFamily: 'monospace', fontWeight: 800 }}>
                    {project.developerTransactionId || project.transactionId}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Large Progress Indicator (Calculated from Admin Task Weights) */}
        <div className="project-hero-progress-box">
          <div className="progress-radial-wrap">
            <div className="progress-percent-val">{devProg}%</div>
            <div className="progress-status-caption">
              {devProg === 100 ? (currentStatus === 'Active' ? 'Ready for Review' : 'Work Complete') : 'Overall Progress'}
            </div>
          </div>

          <div className="progress-bar-track">
            <div 
              className="progress-bar-fill" 
              style={{ 
                width: `${devProg}%`,
                backgroundColor: currentStatus === 'Completed' || currentStatus === 'Approved' ? '#10B981' : project.status === 'Revision Required' ? '#EF4444' : '#F3821D'
              }} 
            />
          </div>
          <div className="progress-meta-counts">
            <span>{completedTasksCount} of {totalTasksCount} tasks completed</span>
            <span>{currentStatus}</span>
          </div>
        </div>
      </div>

      {/* Grid: Requirements & Documents */}
      <div className="project-detail-two-col">
        {/* Left: Project Requirements (Read-only) */}
        <div className="portal-card">
          <div className="portal-card-header">
            <h2 className="portal-card-title">
              <FileText size={18} color="#0A3D75" />
              <span>Project Requirements</span>
            </h2>
          </div>

          <div className="requirements-content">
            {/* Description */}
            <div className="req-block">
              <h4 className="req-subtitle">Project Description</h4>
              <p className="req-desc-p">
                {project.description || 'Complete development and deployment according to verified project specifications.'}
              </p>
            </div>

            {/* Client / Project Requirements */}
            {project.clientRequirements && project.clientRequirements.length > 0 && (
              <div className="req-block">
                <h4 className="req-subtitle">Project Requirements</h4>
                <ul className="req-list">
                  {project.clientRequirements.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Technical Requirements */}
            {project.technicalRequirements && project.technicalRequirements.length > 0 && (
              <div className="req-block">
                <h4 className="req-subtitle">Technical Requirements</h4>
                <ul className="req-list">
                  {project.technicalRequirements.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Delivery Requirements */}
            {project.deliveryRequirements && project.deliveryRequirements.length > 0 && (
              <div className="req-block">
                <h4 className="req-subtitle">Delivery Requirements</h4>
                <ul className="req-list">
                  {project.deliveryRequirements.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Right: Project Documents (With Clean Icon-based View & Download) */}
        <div className="portal-card">
          <div className="portal-card-header">
            <h2 className="portal-card-title">
              <FileCheck size={18} color="#0A3D75" />
              <span>Project Documents</span>
            </h2>
            <span className="docs-count-chip">{(project.documents || []).length} Files</span>
          </div>

          <p className="docs-note-p">
            Access project specification files, Figma assets, and reference guidelines.
          </p>

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
                      <span>• {doc.date}</span>
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
      </div>

      {/* Section: ISSUES RAISED BY TESTER */}
      {project.testingIssues && project.testingIssues.length > 0 && (
        <div 
          className="portal-card" 
          style={{ 
            borderLeft: unresolvedIssuesCount === 0 ? '4px solid #10B981' : '4px solid #DC2626', 
            marginBottom: '24px',
            background: unresolvedIssuesCount === 0 ? '#FAFCFA' : '#FFFFFF'
          }}
        >
          <div className="portal-card-header">
            <div>
              <h2 className="portal-card-title" style={{ color: unresolvedIssuesCount === 0 ? '#166534' : '#991B1B' }}>
                {unresolvedIssuesCount === 0 ? (
                  <CheckCircle size={18} color="#10B981" />
                ) : (
                  <ShieldAlert size={18} color="#DC2626" />
                )}
                <span>Issues Raised by QA Tester ({project.testingIssues.length})</span>
              </h2>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.84rem', color: '#64748B' }}>
                {unresolvedIssuesCount === 0 
                  ? 'All defects reported by QA have been addressed. You can now submit your project for re-testing.'
                  : 'Review the defects reported by the QA team for this project, fix the issues, and tick the task checkmark or click "Mark Resolved".'}
              </p>
            </div>
            <span 
              style={{ 
                background: unresolvedIssuesCount === 0 ? '#DCFCE7' : '#FEE2E2', 
                color: unresolvedIssuesCount === 0 ? '#166534' : '#B91C1C', 
                padding: '4px 12px', 
                borderRadius: '6px', 
                fontSize: '0.78rem', 
                fontWeight: 800 
              }}
            >
              {unresolvedIssuesCount === 0 
                ? '✓ All Issues Resolved' 
                : `${unresolvedIssuesCount} Unresolved Issues`}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {project.testingIssues.map((issue, idx) => {
              const isResolved = issue.status === 'Resolved';
              return (
                <div 
                  key={issue.id || idx} 
                  style={{ 
                    background: isResolved ? '#F0FDF4' : '#FFF5F5', 
                    border: isResolved ? '1px solid #BBF7D0' : '1px solid #FED7D7', 
                    borderRadius: '10px', 
                    padding: '16px' 
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span 
                        style={{ 
                          fontSize: '0.74rem', 
                          background: isResolved ? '#16A34A' : (issue.severity === 'Critical' ? '#DC2626' : '#EA580C'), 
                          color: '#FFFFFF', 
                          padding: '2px 8px', 
                          borderRadius: '4px', 
                          fontWeight: 800 
                        }}
                      >
                        {isResolved ? '✓ Resolved' : (issue.severity || 'High')}
                      </span>
                      <strong style={{ fontSize: '0.98rem', color: isResolved ? '#166534' : '#0F172A', textDecoration: isResolved ? 'line-through' : 'none' }}>
                        {issue.title}
                      </strong>
                    </div>
                    <span style={{ fontSize: '0.76rem', color: '#64748B' }}>
                      {isResolved 
                        ? `Fixed by Developer • ${issue.resolvedAt || 'Resolved'}` 
                        : `Reported by ${issue.reporter || project.tester || 'QA Tester'} • ${issue.date || 'Recent'}`}
                    </span>
                  </div>

                  <p style={{ margin: '0 0 10px 0', fontSize: '0.86rem', color: isResolved ? '#4B5563' : '#334155', lineHeight: 1.5 }}>
                    {issue.description}
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: '#FFFFFF', padding: '10px 12px', borderRadius: '6px', border: isResolved ? '1px solid #DCFCE7' : '1px solid #FEE2E2', fontSize: '0.8rem', marginBottom: '10px' }}>
                    <div>
                      <strong style={{ color: '#047857', display: 'block', marginBottom: '2px' }}>Expected Result:</strong>
                      <span style={{ color: '#475569' }}>{issue.expectedResult || 'Functionality operates normally without errors.'}</span>
                    </div>
                    <div>
                      <strong style={{ color: isResolved ? '#059669' : '#DC2626', display: 'block', marginBottom: '2px' }}>Actual Result:</strong>
                      <span style={{ color: '#475569' }}>{issue.actualResult || 'Error or defect observed.'}</span>
                    </div>
                  </div>

                  {issue.screenshot && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px', marginBottom: '10px' }}>
                      <img 
                        src={issue.screenshot} 
                        alt={issue.title} 
                        style={{ maxHeight: '120px', borderRadius: '6px', border: '1px solid #CBD5E1', objectFit: 'cover', cursor: 'pointer' }}
                        onClick={() => setPreviewDoc({ name: `Defect Screenshot: ${issue.title}`, type: 'Image', size: 'Defect Attachment', date: issue.date || 'Today' })}
                      />
                      <button
                        type="button"
                        className="btn-doc-action"
                        style={{ padding: '6px 12px', fontSize: '0.78rem', background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                        onClick={() => setPreviewDoc({ name: `Defect Screenshot: ${issue.title}`, type: 'Image', size: 'Defect Attachment', date: issue.date || 'Today' })}
                      >
                        <Eye size={14} />
                        <span>View Screenshot</span>
                      </button>
                    </div>
                  )}

                  {/* Resolve Action Button on Unresolved Defect Cards */}
                  {!isResolved && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px', paddingTop: '8px', borderTop: '1px solid #FED7D7' }}>
                      <button
                        type="button"
                        onClick={() => handleResolveIssue(issue.id || idx)}
                        className="btn btn-orange-primary"
                        style={{ 
                          padding: '6px 14px', 
                          fontSize: '0.82rem', 
                          background: '#10B981', 
                          borderColor: '#10B981',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          cursor: 'pointer'
                        }}
                      >
                        <Check size={14} strokeWidth={3} />
                        <span>Mark Issue Resolved & Complete Task</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Section 4: Project Tasks (Weight-Based Deterministic Progress) */}
      <div id="project-tasks-section" className="portal-card">
        <div className="portal-card-header">
          <div>
            <h2 className="portal-card-title">
              <CheckSquare size={18} color="#0A3D75" />
              <span>Project Tasks</span>
            </h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.84rem', color: '#64748B' }}>
              Click any task row to view details, notes, and requirements. Click checkbox to toggle status.
            </p>
          </div>

          <div className="tasks-summary-chip">
            {completedTasksCount} / {totalTasksCount} Completed ({devProg}%)
          </div>
        </div>

        <div className="tasks-numbered-list">
          {(project.tasks || []).map((task) => {
            const isCompleted = task.status === 'Completed';
            const isInProgress = task.status === 'In Progress';
            const taskWeight = task.weight !== undefined 
              ? task.weight 
              : (task.adminPercentage !== undefined 
                  ? task.adminPercentage 
                  : (task.percentage !== undefined ? task.percentage : Math.round(100 / (project.tasks?.length || 1))));

            return (
              <div 
                key={task.id} 
                className={`task-list-item ${isCompleted ? 'task-done' : ''}`}
                onClick={() => handleOpenTask(task)}
              >
                {/* Number & Checkbox */}
                <div className="task-item-start">
                  <span className="task-num-index">{task.number || '01'}</span>
                  <button
                    type="button"
                    className={`task-check-circle ${isCompleted ? 'checked' : ''}`}
                    onClick={(e) => handleToggleTaskCheckbox(task.id, e)}
                    title={isCompleted ? 'Mark In Progress' : 'Mark Completed'}
                  >
                    {isCompleted && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
                  </button>
                </div>

                {/* Task Name & Description */}
                <div className="task-item-content">
                  <div className="task-item-title-row">
                    <h3 className="task-item-name">{task.name}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#0A3D75', background: '#EBF3FA', padding: '2px 6px', borderRadius: '4px' }}>
                        Weight: {taskWeight}%
                      </span>
                      <StatusBadge status={task.status} size="small" />
                    </div>
                  </div>
                  <p className="task-item-desc">{task.desc}</p>
                </div>

                {/* Progress bar + Arrow */}
                <div className="task-item-end">
                  <div className="task-mini-progress">
                    <div className="mini-progress-bar">
                      <div 
                        className="mini-progress-fill" 
                        style={{ 
                          width: `${task.progress || (isCompleted ? 100 : isInProgress ? 50 : 0)}%`,
                          backgroundColor: isCompleted ? '#10B981' : isInProgress ? '#F3821D' : '#94A3B8'
                        }} 
                      />
                    </div>
                    <span className="mini-progress-text">{task.progress || (isCompleted ? 100 : isInProgress ? 50 : 0)}%</span>
                  </div>

                  <ChevronRight size={18} className="task-arrow-icon" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 5: Project Credentials */}
      <div className="portal-card">
        <div className="portal-card-header">
          <div>
            <h2 className="portal-card-title">
              <Key size={18} color="#0A3D75" />
              <span>Project Credentials</span>
            </h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.84rem', color: '#64748B' }}>
              Secure deployment credentials, repository tokens, hosting accounts, and staging logins for this project.
            </p>
          </div>

          <button
            type="button"
            className="btn btn-navy-action"
            onClick={() => setIsCredModalOpen(true)}
          >
            <Plus size={15} />
            <span>Add Credential</span>
          </button>
        </div>

        {/* Credentials Spreadsheet Table */}
        {(project.credentials && project.credentials.length > 0) ? (
          <div className="portal-table-container">
            <table className="portal-table credential-table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>#</th>
                  <th>Platform / Service</th>
                  <th>Email / Username</th>
                  <th>Password / Secret Key</th>
                  <th>Type</th>
                  <th>Notes</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {project.credentials.map((cred, idx) => {
                  const isRevealed = !!revealedSecrets[cred.id];
                  const isCopied = copiedKeyId === cred.id;

                  return (
                    <tr key={cred.id || idx}>
                      <td style={{ color: '#94A3B8', fontWeight: 600 }}>{idx + 1}</td>
                      <td>
                        <div style={{ fontWeight: 700, color: '#0A3D75' }}>{cred.service || cred.type}</div>
                      </td>
                      <td>
                        <span className="cred-username-val">{cred.username || '—'}</span>
                      </td>
                      <td>
                        <div className="cred-secret-cell">
                          <code className="cred-secret-code">
                            {isRevealed ? cred.secret : '••••••••••••••••'}
                          </code>
                          <button
                            type="button"
                            className="btn-icon-secret"
                            onClick={() => toggleSecretVisibility(cred.id)}
                            title={isRevealed ? 'Hide secret' : 'Show secret'}
                          >
                            <Eye size={14} color={isRevealed ? '#0A3D75' : '#94A3B8'} />
                          </button>
                        </div>
                      </td>
                      <td>
                        <span className="cred-type-chip">{cred.type}</span>
                      </td>
                      <td style={{ color: '#64748B', fontSize: '0.82rem' }}>
                        {cred.notes || '—'}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          className="btn-copy-cred"
                          onClick={() => handleCopySecret(cred.id, cred.secret)}
                          title="Copy Secret Key"
                        >
                          {isCopied ? (
                            <>
                              <Check size={13} color="#10B981" />
                              <span style={{ color: '#10B981' }}>Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy size={13} />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-credentials-box">
            <Key size={32} color="#94A3B8" />
            <p>No credentials added for this project yet.</p>
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

      {/* Section 6: Submission & Dedicated Project Links Section */}
      <div className="portal-card project-submission-card">
        <div className="submission-card-header">
          <div>
            <h2 className="portal-card-title" style={{ color: '#07223D' }}>
              <Send size={18} color="#F3821D" />
              <span>Submit Project for Review</span>
            </h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.88rem', color: '#475569' }}>
              Enter your live deployment URL and Google Drive project ZIP file link to submit for QA testing and admin approval.
            </p>
          </div>

          <div className="submission-status-pill">
            Status: <strong>{currentStatus}</strong>
          </div>
        </div>

        {/* TWO DEDICATED PROJECT LINKS (MANDATORY FOR SUBMISSION) */}
        <div id="project-submission-links-section" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '20px' }}>
          {/* 1. Live Project Link */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0A3D75', textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ExternalLink size={14} color="#F3821D" />
                <span>Live Project Link</span>
              </span>
              <span style={{ fontSize: '0.72rem', color: hasLiveLink ? '#16A34A' : '#DC2626', fontWeight: 700 }}>
                {hasLiveLink ? '✓ Attached' : '* Compulsory for QA'}
              </span>
            </label>
            <input
              type="url"
              value={liveProjectLink}
              onChange={(e) => {
                const val = e.target.value;
                setLiveProjectLink(val);
                if (onUpdateProject) {
                  onUpdateProject({ ...project, liveLink: val, liveProjectLink: val });
                }
              }}
              placeholder="https://your-app.vercel.app or live demo URL"
              className="profile-input"
              style={{ 
                padding: '10px 14px', 
                borderRadius: '8px', 
                border: hasLiveLink ? '1.5px solid #10B981' : (devProg === 100 ? '1.5px solid #F3821D' : '1.5px solid #CBD5E1'), 
                fontSize: '0.88rem', 
                background: isLinksLocked ? '#F8FAFC' : '#FFFFFF',
                boxShadow: !hasLiveLink && devProg === 100 ? '0 0 0 3px rgba(243, 130, 29, 0.15)' : 'none'
              }}
              disabled={isLinksLocked}
            />
            <span style={{ fontSize: '0.72rem', color: '#64748B' }}>Hosted production or staging website link for tester verification</span>
          </div>

          {/* 2. Google Drive Project File Link */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0A3D75', textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FolderKanban size={14} color="#0A3D75" />
                <span>Google Drive Project File</span>
              </span>
              <span style={{ fontSize: '0.72rem', color: hasDriveLink ? '#16A34A' : '#DC2626', fontWeight: 700 }}>
                {hasDriveLink ? '✓ Attached' : '* Compulsory for QA'}
              </span>
            </label>
            <input
              type="url"
              value={driveProjectLink}
              onChange={(e) => {
                const val = e.target.value;
                setDriveProjectLink(val);
                if (onUpdateProject) {
                  onUpdateProject({ ...project, driveLink: val, driveProjectLink: val });
                }
              }}
              placeholder="https://drive.google.com/drive/folders/..."
              className="profile-input"
              style={{ 
                padding: '10px 14px', 
                borderRadius: '8px', 
                border: hasDriveLink ? '1.5px solid #10B981' : (devProg === 100 ? '1.5px solid #F3821D' : '1.5px solid #CBD5E1'), 
                fontSize: '0.88rem', 
                background: isLinksLocked ? '#F8FAFC' : '#FFFFFF',
                boxShadow: !hasDriveLink && devProg === 100 ? '0 0 0 3px rgba(243, 130, 29, 0.15)' : 'none'
              }}
              disabled={isLinksLocked}
            />
            <span style={{ fontSize: '0.74rem', color: '#D97706', fontWeight: 700 }}>
              ⚠️ Make the Drive link viewable for all (ZIP source code / project assets).
            </span>
          </div>
        </div>

        {/* Pre-submission Checklist */}
        <div className="submission-checklist-grid">
          <div className={`checklist-item ${allTasksDone && devProg === 100 ? 'done' : ''}`}>
            <div className="checklist-bullet">
              {allTasksDone && devProg === 100 ? <Check size={14} /> : '1'}
            </div>
            <span>All Tasks Completed ({completedTasksCount}/{totalTasksCount})</span>
          </div>

          <div className="checklist-item done">
            <div className="checklist-bullet"><Check size={14} /></div>
            <span>Requirements & Specs Checked</span>
          </div>

          <div className={`checklist-item ${(project.credentials || []).length > 0 ? 'done' : ''}`}>
            <div className="checklist-bullet">
              {(project.credentials || []).length > 0 ? <Check size={14} /> : '3'}
            </div>
            <span>Project Credentials Added ({(project.credentials || []).length})</span>
          </div>

          <div className={`checklist-item ${hasLiveLink ? 'done' : (devProg === 100 ? 'required-missing' : '')}`}>
            <div className="checklist-bullet">
              {hasLiveLink ? <Check size={14} /> : '4'}
            </div>
            <span>Live Project Link {hasLiveLink ? 'Added' : '(Compulsory)'}</span>
          </div>

          <div className={`checklist-item ${hasDriveLink ? 'done' : (devProg === 100 ? 'required-missing' : '')}`}>
            <div className="checklist-bullet">
              {hasDriveLink ? <Check size={14} /> : '5'}
            </div>
            <span>Drive File ZIP {hasDriveLink ? 'Linked' : '(Compulsory)'}</span>
          </div>
        </div>

        {/* Large Submission CTA Button */}
        <div className="submission-footer-action">
          <div className="submission-info-note">
            <Info size={16} color={isAlreadySubmitted ? '#0284C7' : (!hasLiveLink || !hasDriveLink) && devProg === 100 ? '#D97706' : hasReworkRequested && devProg < 100 ? '#DC2626' : '#0A3D75'} />
            <span style={{ color: isAlreadySubmitted ? '#0369A1' : (!hasLiveLink || !hasDriveLink) && devProg === 100 ? '#B45309' : hasReworkRequested && devProg < 100 ? '#991B1B' : undefined, fontWeight: 600 }}>
              {isAlreadySubmitted ? (
                currentStatus === 'Submitted' 
                  ? '🔒 Submission locked. Project has been submitted and is queued for QA review. You cannot resubmit unless the tester files an issue.' 
                  : currentStatus === 'Under Review'
                    ? '🔒 Submission locked. QA testing is actively in progress. Resubmission is disabled unless changes are requested.'
                    : currentStatus === 'Finalized'
                      ? '🔒 Submission locked. QA review is finalized and waiting for Admin approval.'
                      : currentStatus === 'Approved' || currentStatus === 'Completed'
                        ? '🔒 Project is approved & verified. No further submissions required.'
                        : '🔒 Submission locked. Project is under review.'
              ) : hasReworkRequested ? (
                devProg < 100 || !allTasksDone
                  ? `⚠️ QA Rework Required: You must resolve all reported issues and mark all milestone tasks completed (100%) before resubmitting. Currently at ${devProg}%.`
                  : (!hasLiveLink || !hasDriveLink)
                    ? '⚠️ Mandatory: Live Project Link and Google Drive ZIP Link must both be provided before resubmitting.'
                    : '✓ All QA defects resolved and tasks completed. Click "Resubmit for QA Review" to proceed.'
              ) : (
                currentStatus === 'Active' && devProg < 100 
                  ? `Complete all milestone tasks (100%) above to unlock the Submit button. Currently at ${devProg}%.` 
                  : (!hasLiveLink || !hasDriveLink)
                    ? '⚠️ Mandatory: Live Project Link and Google Drive ZIP Link must both be provided before submitting.'
                    : 'Admin & QA review is typically completed within 24–48 hours upon submission.'
              )}
            </span>
          </div>

          <button
            type="button"
            className="btn btn-orange-primary btn-large-submit"
            onClick={() => {
              if (isAlreadySubmitted) {
                showToast('🔒 Project is already submitted and under review. You cannot resubmit unless changes are requested.');
                return;
              }
              if (!isSubmissionAllowed) {
                if (devProg < 100 || !allTasksDone) {
                  showToast(`⚠️ You must complete all milestone tasks (100%) before submitting. Currently at ${devProg}%.`);
                } else if (!hasLiveLink || !hasDriveLink) {
                  const linksSection = document.getElementById('project-submission-links-section');
                  if (linksSection) linksSection.scrollIntoView({ behavior: 'smooth' });
                  showToast('⚠️ Mandatory: Live Link & Google Drive ZIP link required before submitting.');
                }
                return;
              }
              setIsSubmissionModalOpen(true);
            }}
            disabled={!isSubmissionAllowed}
            style={{ 
              opacity: isSubmissionAllowed ? 1 : 0.65, 
              cursor: isSubmissionAllowed ? 'pointer' : 'not-allowed',
              background: isAlreadySubmitted 
                ? '#94A3B8' 
                : hasReworkRequested && isSubmissionAllowed 
                  ? '#16A34A' 
                  : isSubmissionAllowed 
                    ? '#F3821D' 
                    : '#CBD5E1',
              borderColor: isAlreadySubmitted 
                ? '#94A3B8' 
                : hasReworkRequested && isSubmissionAllowed 
                  ? '#16A34A' 
                  : isSubmissionAllowed 
                    ? '#F3821D' 
                    : '#CBD5E1',
              color: '#FFFFFF'
            }}
          >
            {isAlreadySubmitted ? (
              <CheckCircle size={18} />
            ) : (
              <Send size={18} />
            )}
            <span>
              {isAlreadySubmitted ? (
                currentStatus === 'Submitted'
                  ? 'Project Formally Submitted (Awaiting QA)'
                  : currentStatus === 'Under Review' 
                    ? 'Project Under QA Review (Locked)' 
                    : currentStatus === 'Finalized'
                      ? 'QA Finalized (Pending Admin Review)'
                      : currentStatus === 'Approved'
                        ? 'Project Approved (Payment Pending)'
                        : currentStatus === 'Completed'
                          ? 'Project Completed & Settled'
                          : 'Submission Locked (Under Review)'
              ) : hasReworkRequested ? (
                devProg < 100 || !allTasksDone
                  ? `Complete All Tasks to Resubmit (${devProg}%)`
                  : (!hasLiveLink || !hasDriveLink)
                    ? 'Provide Live & Drive Links to Resubmit'
                    : 'Resubmit for QA Review 🚀'
              ) : (
                devProg < 100 || !allTasksDone
                  ? `Complete All Tasks to Submit (${devProg}%)`
                  : (!hasLiveLink || !hasDriveLink)
                    ? 'Provide Live & Drive Links to Submit'
                    : 'Submit Project for Review'
              )}
            </span>
          </button>
        </div>
      </div>

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
                    <div><strong>Category:</strong> {project.category || 'Website Delivery'}</div>
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

      {/* Task Drawer */}
      <TaskDrawer
        isOpen={isTaskDrawerOpen}
        task={activeTask}
        project={project}
        onClose={() => setIsTaskDrawerOpen(false)}
        onSave={handleSaveTaskDetails}
      />

      {/* Add Credential Modal */}
      <CredentialModal
        isOpen={isCredModalOpen}
        onClose={() => setIsCredModalOpen(false)}
        onAddCredential={handleAddCredential}
        onSave={handleAddCredential}
      />

      {/* Submit Confirmation Modal */}
      <SubmissionModal
        isOpen={isSubmissionModalOpen}
        project={{
          ...project,
          liveLink: liveProjectLink,
          driveLink: driveProjectLink
        }}
        onClose={() => setIsSubmissionModalOpen(false)}
        onSubmitConfirm={handleProjectSubmit}
      />
    </div>
  );
}
