/**
 * Unified Backend Security & Data Isolation Service for the QA Tester Workspace
 * 
 * Strict Architectural Guarantees:
 * 1. Authenticated Tester Identity is the sole Source of Truth.
 * 2. Every query is filtered by assignedTesterId before reaching components.
 * 3. Response model sanitization (toTesterSafeProject) strictly strips client billing, 
 *    company margins, and developer confidential financial splits.
 * 4. Exact 6 Project / Dashboard Statuses:
 *    - All: Every project assigned to this Tester
 *    - Pending: Developer submitted + QA progress 0% + Tester not started
 *    - Under Review: QA progress > 0% (or in review) + not finalized (even if 100%)
 *    - Finalized: Tester explicitly finalized QA + Admin approval pending
 *    - Approved: Admin approved + Tester payment for this project not yet fully cleared
 *    - Completed: Admin approved + Tester payment for this specific project is 100% cleared
 */

import { calculateProjectProgressFromTasks } from '../utils/projectStatusUtils.js';

/**
 * Helper to get Tester Assigned Payout Amount for a specific project
 */
export function getTesterAssignedAmount(project) {
  if (!project) return 0;
  if (project.testerAssignedAmount !== undefined) return project.testerAssignedAmount;
  if (project.testerPaymentNum !== undefined) return project.testerPaymentNum;
  if (project.testerPayoutNum !== undefined) return project.testerPayoutNum;
  if (typeof project.testerPayment === 'string') {
    const num = parseInt(project.testerPayment.replace(/[^0-9]/g, ''), 10);
    return isNaN(num) ? 0 : num;
  }
  return 0;
}

/**
 * Helper to get Tester Paid Amount for a specific project
 */
export function getTesterPaidAmount(project) {
  if (!project) return 0;
  if (project.testerPaidAmount !== undefined) return project.testerPaidAmount;
  if (project.testerPaymentPaidNum !== undefined) return project.testerPaymentPaidNum;
  if (project.testerPaymentStatus === 'Paid') return getTesterAssignedAmount(project);
  if (typeof project.testerPaymentPaid === 'string') {
    const num = parseInt(project.testerPaymentPaid.replace(/[^0-9]/g, ''), 10);
    return isNaN(num) ? 0 : num;
  }
  return 0;
}

/**
 * Helper to get Tester Remaining Amount for a specific project
 */
export function getTesterRemainingAmount(project) {
  if (!project) return 0;
  if (project.testerRemainingAmount !== undefined) return project.testerRemainingAmount;
  if (project.testerPaymentRemainingNum !== undefined) return project.testerPaymentRemainingNum;
  const assigned = getTesterAssignedAmount(project);
  const paid = getTesterPaidAmount(project);
  return Math.max(0, assigned - paid);
}

/**
 * Checks if tester payout for this specific project is 100% fully cleared
 */
export function isTesterPaymentCompleted(project) {
  if (!project) return false;
  if (project.testerPaymentStatus === 'Paid') return true;
  const assigned = getTesterAssignedAmount(project);
  const paid = getTesterPaidAmount(project);
  const remaining = getTesterRemainingAmount(project);
  return remaining === 0 && (paid >= assigned || assigned === 0 || paid > 0);
}

/**
 * Evaluates the exact canonical Tester Status for an assigned project:
 * - 'Completed'
 * - 'Approved'
 * - 'Finalized'
 * - 'Under Review'
 * - 'Pending'
 * - 'Assigned' (if in development and not submitted yet)
 */
export function getTesterDashboardStatus(project) {
  if (!project) return 'Pending';

  const ts = (project.testingStatus || '').toLowerCase().trim();
  const s = (project.status || '').toLowerCase().trim();
  const qaProgress = project.testingProgress !== undefined ? project.testingProgress : 0;
  
  // 1. Check Admin Approval
  const isAdminApproved = Boolean(
    project.adminApproved === true || 
    s === 'approved' || 
    s === 'completed' || 
    s === 'paid' ||
    ts === 'approved'
  );

  // 2. Check Tester Payment Completion for this specific project
  const isFullyPaid = isTesterPaymentCompleted(project);

  // COMPLETED: Admin approved AND Tester payment for THIS project is 100% fully paid
  if (isAdminApproved && isFullyPaid) {
    return 'Completed';
  }

  // APPROVED: Admin approved (Tester payment is still pending or partial)
  if (isAdminApproved) {
    return 'Approved';
  }

  // 3. Check Tester Finalization (explicit tester action)
  const isFinalized = Boolean(
    project.testerFinalized === true ||
    project.qaFinalized === true ||
    ts === 'tester approved' || 
    ts === 'finalized' || 
    s === 'finalized'
  );

  // FINALIZED: Tester explicitly finalized QA + Admin approval pending
  if (isFinalized && !isAdminApproved) {
    return 'Finalized';
  }

  // 4. Check Developer Submission
  const isDeveloperSubmitted = Boolean(
    project.developerSubmitted === true ||
    project.freelancerSubmitted === true ||
    project.developerSubmission === 'Submitted' ||
    s === 'submitted' ||
    s === 'under review' ||
    s === 'revision required' ||
    ts === 'in testing' ||
    ts === 'testing' ||
    ts === 'under review' ||
    ts === 'changes requested' ||
    ts === 'awaiting testing' ||
    project.developerSubmittedAt ||
    project.freelancerSubmittedAt ||
    (project.submittedDate && project.submittedDate !== 'Pending' && project.submittedDate !== '—')
  );

  // If developer has NOT submitted yet, project is still in development -> not in QA lifecycle
  if (!isDeveloperSubmitted) {
    return 'Assigned';
  }

  // 5. UNDER REVIEW: Tester has started QA review (Progress > 0% or review underway, but NOT finalized)
  // Note: Even if testerProgress reaches 100%, without explicit finalization it remains Under Review!
  const isQAStarted = Boolean(
    (qaProgress > 0) ||
    project.qaStarted === true ||
    project.testerStarted === true ||
    ts === 'in testing' ||
    ts === 'testing' ||
    ts === 'in-testing' ||
    ts === 'changes requested' ||
    ts === 'changes assigned' ||
    ts === 'revision required' ||
    s === 'under review' ||
    s === 'revision required'
  );

  if (isQAStarted && !isFinalized) {
    return 'Under Review';
  }

  // 6. PENDING: Developer submitted to QA AND QA progress = 0% AND tester not started
  return 'Pending';
}

/**
 * Alias for canonical tester project status
 */
export const getTesterProjectStatus = getTesterDashboardStatus;

/**
 * Helper to get formatted Developer Submission Date for Tester table
 * Source of truth is developerSubmittedAt / freelancerSubmittedAt / submittedDate.
 * Shows formatted date (e.g. '15 Oct 2026') if developer submitted, or '—' if not submitted yet.
 */
export function getDeveloperSubmittedDate(project) {
  if (!project) return '—';

  // Check if developer submitted
  const isDevSubmitted = Boolean(
    project.developerSubmitted === true ||
    project.freelancerSubmitted === true ||
    project.developerSubmission === 'Submitted' ||
    project.status === 'Submitted' ||
    project.status === 'Finalized' ||
    project.status === 'Approved' ||
    project.status === 'Completed' ||
    project.status === 'Under Review' ||
    project.developerSubmittedAt ||
    project.freelancerSubmittedAt ||
    (project.submittedDate && project.submittedDate !== 'Pending' && project.submittedDate !== '—')
  );

  if (!isDevSubmitted) {
    return '—';
  }

  const raw = project.developerSubmittedAt || project.freelancerSubmittedAt || project.submittedDate;

  if (raw && raw !== 'Pending' && raw !== '—') {
    if (typeof raw === 'string' && /^\d{1,2}\s+[A-Za-z]{3}\s+\d{4}$/.test(raw.trim())) {
      return raw.trim();
    }
    try {
      const d = new Date(raw);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      }
    } catch (e) {}
    return String(raw);
  }

  // If marked submitted but timestamp is empty, show assigned date or recent
  return project.assignedDate || 'Recent';
}

/**
 * Checks whether a project has been explicitly approved by Admin
 */
export function isProjectAdminApproved(p) {
  if (!p) return false;
  const s = (p.status || '').toLowerCase().trim();
  const ts = (p.testingStatus || '').toLowerCase().trim();
  const testerPaid = getTesterPaidAmount(p);
  return Boolean(
    p.adminApproved === true ||
    s === 'approved' ||
    s === 'completed' ||
    s === 'paid' ||
    ts === 'approved' ||
    p.testerPaymentStatus === 'Paid' ||
    testerPaid > 0
  );
}

/**
 * Derives the exact 4 allowable statuses in Tester Earnings:
 * - 'Completed' (Admin approved + Tester payment 100% cleared)
 * - 'Approved' (Admin approved + Tester payment remaining > 0)
 * - 'Under Review' (Tester QA in progress or finalized, but Admin approval pending)
 * - 'Pending' (Developer submitted, QA progress 0%, tester not started)
 */
export function getTesterEarningsStatus(project) {
  if (!project) return 'Pending';

  const s = (project.status || '').toLowerCase().trim();
  const ts = (project.testingStatus || '').toLowerCase().trim();
  const isAdminApproved = isProjectAdminApproved(project);
  const isFullyPaid = isTesterPaymentCompleted(project);

  // 1. COMPLETED (if fully paid or tester payment marked paid)
  if (isFullyPaid || (isAdminApproved && isFullyPaid) || project.testerPaymentStatus === 'Paid') {
    return 'Completed';
  }

  // 2. APPROVED
  if (isAdminApproved) {
    return 'Approved';
  }

  // 3. UNDER REVIEW (includes finalized projects awaiting Admin approval in Earnings view)
  const qaProgress = project.testingProgress !== undefined ? project.testingProgress : 0;
  const isQAStartedOrFinalized = Boolean(
    qaProgress > 0 ||
    project.qaStarted === true ||
    project.testerStarted === true ||
    project.qaFinalized === true ||
    project.testerFinalized === true ||
    ts === 'in testing' ||
    ts === 'testing' ||
    ts === 'in-testing' ||
    ts === 'changes requested' ||
    ts === 'changes assigned' ||
    ts === 'revision required' ||
    ts === 'tester approved' ||
    ts === 'finalized' ||
    s === 'under review' ||
    s === 'revision required' ||
    s === 'finalized'
  );

  if (isQAStartedOrFinalized) {
    return 'Under Review';
  }

  // 4. PENDING
  return 'Pending';
}

/**
 * Returns formatted transaction ID for a project where tester payment has been recorded/cleared
 */
export function getTesterTransactionId(project) {
  if (!project) return '—';
  if (project.testerTransactionId && project.testerTransactionId !== '—' && project.testerTransactionId !== 'Pending') {
    return project.testerTransactionId;
  }
  if (project.transactionId && project.transactionId !== '—' && project.transactionId !== 'Pending') {
    return project.transactionId;
  }
  const paid = getTesterPaidAmount(project);
  if (paid > 0) {
    const cleanId = (project.id || '').replace(/[^0-9]/g, '') || '201';
    return `TXN-TST-${cleanId}`;
  }
  return '—';
}

/**
 * Computes the exact 3 Tester Earnings Statistics:
 * 1. Total Earnings = SUM(testerAssignedAmount) for Admin Approved projects
 * 2. Total Pending Amount = SUM(testerRemainingAmount) for Admin Approved projects
 * 3. Total Completed Checks = COUNT(Admin Approved projects where testerRemainingAmount === 0 && testerAssignedAmount > 0)
 */
export function computeTesterEarningsStats(assignedProjects) {
  const projects = Array.isArray(assignedProjects) ? assignedProjects : [];

  const approvedProjects = projects.filter(isProjectAdminApproved);

  const totalEarnings = approvedProjects.reduce((sum, p) => {
    return sum + getTesterAssignedAmount(p);
  }, 0);

  const totalPending = approvedProjects.reduce((sum, p) => {
    return sum + getTesterRemainingAmount(p);
  }, 0);

  const totalCompletedChecks = approvedProjects.filter(p => {
    const assigned = getTesterAssignedAmount(p);
    const remaining = getTesterRemainingAmount(p);
    return remaining === 0 && assigned > 0;
  }).length;

  return {
    totalEarnings,
    totalPending,
    totalCompletedChecks
  };
}

/**
 * Checks whether a project record is strictly assigned to the authenticated QA tester.
 * Ensures airtight multi-tenant account isolation:
 * - If project has a specific testerId assigned, authUser MUST match that exact testerId.
 * - If project has no testerId (or legacy string), authUser MUST match exact testerEmail or exact tester name.
 * - Under NO circumstance does another tester see an unassigned or foreign project.
 */
export function isProjectAssignedToTester(project, authUser) {
  if (!project || !authUser) return false;

  const authId = String(authUser.id || authUser.testerId || '').toLowerCase().trim();
  const authEmail = String(authUser.email || '').toLowerCase().trim();
  const authName = String(authUser.name || authUser.fullName || '').toLowerCase().trim();

  const testerId = String(project.testerId || '').toLowerCase().trim();
  const testerEmail = String(project.testerEmail || '').toLowerCase().trim();
  const testerName = String(project.tester || project.testerName || '').toLowerCase().trim();

  // If the project tester is unassigned or empty, no tester owns it
  if ((!testerId || testerId === '—' || testerId === 'unassigned') && (!testerName || testerName === 'unassigned' || testerName === '—')) {
    return false;
  }

  // 1. Primary check: Specific testerId assigned to this project
  if (testerId && testerId !== '—' && testerId !== 'unassigned') {
    // If authUser has an assigned ID (not empty and not a generic guest token)
    if (authId && authId !== 'tst-demo') {
      return authId === testerId;
    }
    // If authUser has no ID or is resolving by email/name, verify exact match
    if (authEmail && testerEmail && authEmail === testerEmail) {
      return true;
    }
    if (authName && testerName && testerName !== 'unassigned' && testerName !== '—' && authName === testerName) {
      return true;
    }
    return false;
  }

  // 2. Fallback check: Project without explicit testerId (match by exact email or exact name)
  if (authEmail && testerEmail && authEmail === testerEmail) {
    return true;
  }
  if (authName && testerName && testerName !== 'unassigned' && testerName !== '—' && authName === testerName) {
    return true;
  }

  return false;
}

/**
 * Sanitizes raw project object into a Tester-Safe View Model.
 * Strips client confidential billing, total client pricing, company margins.
 */
export function toTesterSafeProject(rawProject) {
  if (!rawProject) return null;

  const {
    clientPhone,
    clientAddress,
    clientBilling,
    clientTotalAmount,
    clientPaidAmount,
    clientRemainingAmount,
    totalAmount,
    totalAmountNum,
    totalClientPrice,
    totalClientPriceNum,
    collectedClientAmount,
    collectedClientAmountNum,
    remainingClientAmount,
    remainingClientAmountNum,
    developerPayment,
    developerPaymentNum,
    developerAssignedAmount,
    developerPaidAmount,
    developerRemainingAmount,
    freelancerPayout,
    freelancerPayoutNum,
    companyRevenue,
    internalAdminNotes,
    internalNotes,
    // Real client / final delivery deadlines stripped from tester
    finalDeliveryDate,
    finalDeliveryDateIso,
    deadlineDate,
    deadlineDateIso,
    ...safeFields
  } = rawProject;

  const testerAssigned = getTesterAssignedAmount(rawProject);
  const testerPaid = getTesterPaidAmount(rawProject);
  const testerRemaining = getTesterRemainingAmount(rawProject);

  const formattedSubmittedDate = getDeveloperSubmittedDate(rawProject);
  const isDevSubmitted = Boolean(
    rawProject.developerSubmitted === true ||
    rawProject.freelancerSubmitted === true ||
    rawProject.developerSubmission === 'Submitted' ||
    rawProject.status === 'Submitted' ||
    rawProject.status === 'Finalized' ||
    rawProject.status === 'Approved' ||
    rawProject.status === 'Completed' ||
    rawProject.status === 'Under Review' ||
    rawProject.developerSubmittedAt ||
    rawProject.freelancerSubmittedAt ||
    (formattedSubmittedDate !== '—')
  );

  const isFinalized = Boolean(
    rawProject.testerFinalized === true ||
    rawProject.qaFinalized === true ||
    rawProject.testingStatus === 'Tester Approved' ||
    rawProject.testingStatus === 'Finalized' ||
    rawProject.status === 'Finalized'
  );

  const isAdminApproved = Boolean(
    rawProject.adminApproved === true ||
    rawProject.status === 'Approved' ||
    rawProject.status === 'Completed' ||
    rawProject.testingStatus === 'Approved'
  );

  // Strict Source of Truth for QA Tester Deadline: Admin-set Testing Submission Deadline
  const testerDeadline = rawProject.testingSubmissionDate || rawProject.qaDeadline || rawProject.testerDeadline || rawProject.testingSubmissionDateIso || rawProject.deadline || 'Ongoing';

  // Calculate Developer Progress & Completed Tasks Count
  const devProgress = calculateProjectProgressFromTasks(rawProject.tasks || []);
  const devCompletedCount = (rawProject.tasks || []).filter(t => t.status === 'Completed' || t.status === 'Done' || t.progress === 100).length;
  const totalTasksCount = (rawProject.tasks || []).length;

  return {
    ...safeFields,
    id: rawProject.id,
    name: rawProject.name,
    category: rawProject.category || rawProject.projectType || 'Web Application',
    projectType: rawProject.projectType || rawProject.category || 'Web Application',
    developer: rawProject.developer || rawProject.developerName || 'Unassigned',
    developerId: rawProject.developerId || '—',
    assignedDate: rawProject.assignedDate || '—',
    submittedDate: formattedSubmittedDate,
    developerSubmitted: isDevSubmitted,
    developerSubmission: rawProject.developerSubmission || (isDevSubmitted ? 'Submitted' : 'Draft'),
    developerSubmittedAt: rawProject.developerSubmittedAt || rawProject.freelancerSubmittedAt || (formattedSubmittedDate !== '—' ? formattedSubmittedDate : null),
    freelancerSubmitted: isDevSubmitted,
    freelancerSubmittedAt: rawProject.freelancerSubmittedAt || rawProject.developerSubmittedAt || (formattedSubmittedDate !== '—' ? formattedSubmittedDate : null),
    deadline: testerDeadline,
    testingSubmissionDate: testerDeadline,
    testerDeadline: testerDeadline,
    status: rawProject.status || 'Active',
    priority: rawProject.priority || 'Medium',
    
    // Developer Progress & Completion details for Tester Visibility
    progress: devProgress,
    developerProgress: devProgress,
    freelancerProgress: devProgress,
    completedTasksCount: devCompletedCount,
    totalTasksCount: totalTasksCount,
    
    // Tester specific financials ONLY (Strict isolation)
    testerPayment: rawProject.testerPayment || `₹${testerAssigned.toLocaleString('en-IN')}`,
    testerPaymentNum: testerAssigned,
    testerAssignedAmount: testerAssigned,
    testerPaidAmount: testerPaid,
    testerRemainingAmount: testerRemaining,
    testerPaymentPaid: rawProject.testerPaymentPaid || `₹${testerPaid.toLocaleString('en-IN')}`,
    testerPaymentPaidNum: testerPaid,
    testerPaymentRemaining: rawProject.testerPaymentRemaining || `₹${testerRemaining.toLocaleString('en-IN')}`,
    testerPaymentRemainingNum: testerRemaining,
    testerPaymentStatus: rawProject.testerPaymentStatus || (testerRemaining === 0 && testerAssigned > 0 ? 'Paid' : testerPaid > 0 ? 'Partial' : 'Pending'),
    testerTransactionId: rawProject.testerTransactionId || rawProject.testerPaymentTxnId || rawProject.testerTxnId || rawProject.transactionId || (testerPaid > 0 ? `TXN-TST-${(rawProject.id || '').replace(/[^0-9]/g, '') || '201'}` : '—'),
    transactionId: rawProject.testerTransactionId || rawProject.testerPaymentTxnId || rawProject.testerTxnId || rawProject.transactionId || (testerPaid > 0 ? `TXN-TST-${(rawProject.id || '').replace(/[^0-9]/g, '') || '201'}` : '—'),
    testerPaymentMode: rawProject.testerPaymentMode || 'UPI / Bank Transfer',
    testerPaymentDate: rawProject.testerPaymentDate || null,

    // Admin-created developer tasks mapped for QA checklist
    tasks: (rawProject.tasks || []).map((t, idx) => ({
      id: t.id || `tsk-${rawProject.id}-${idx + 1}`,
      number: t.number || (idx + 1 < 10 ? `0${idx + 1}` : `${idx + 1}`),
      name: t.name,
      title: t.name,
      desc: t.desc || t.description || 'Milestone deliverable specification',
      status: t.status || 'Pending',
      qaStatus: t.qaStatus || (t.status === 'Completed' ? 'Passed' : 'Pending'),
      qaNotes: t.qaNotes || '',
      weight: t.weight !== undefined ? t.weight : (t.adminPercentage !== undefined ? t.adminPercentage : (t.percentage !== undefined ? t.percentage : Math.round(100 / (rawProject.tasks?.length || 1)))),
      adminPercentage: t.weight !== undefined ? t.weight : (t.adminPercentage !== undefined ? t.adminPercentage : (t.percentage !== undefined ? t.percentage : Math.round(100 / (rawProject.tasks?.length || 1)))),
      deadline: t.deadline || testerDeadline,
      notes: t.notes || t.developerNotes || t.freelancerNotes || '',
      developerNotes: t.notes || t.developerNotes || t.freelancerNotes || '',
      freelancerNotes: t.notes || t.developerNotes || t.freelancerNotes || ''
    })),

    // Developer Credentials & Links (visible to tester for QA)
    credentials: (rawProject.credentials || []).map(c => ({
      id: c.id,
      service: c.service || c.platform || c.type,
      platform: c.platform || c.service || c.type,
      type: c.type || 'Platform',
      username: c.username,
      secret: c.secret,
      notes: c.notes
    })),
    liveLink: rawProject.liveLink || rawProject.liveProjectLink || '',
    liveProjectLink: rawProject.liveLink || rawProject.liveProjectLink || '',
    driveLink: rawProject.driveLink || rawProject.driveProjectLink || '',
    documents: (rawProject.documents || []).map(doc => ({
      ...doc,
      id: doc.id,
      name: doc.name,
      type: doc.type || 'Specification Document',
      size: doc.size || '1.5 MB',
      date: doc.date || rawProject.assignedDate || 'Recent',
      dataUrl: doc.dataUrl || doc.fileData || doc.url,
      fileData: doc.fileData || doc.dataUrl || doc.url
    })),

    // QA & Testing workflow state
    testerStarted: Boolean(rawProject.testerStarted || rawProject.qaStarted),
    testerStartedAt: rawProject.testerStartedAt || rawProject.qaStartedAt || null,
    testingProgress: rawProject.testingProgress !== undefined ? rawProject.testingProgress : 0,
    testingStatus: rawProject.testingStatus || (isFinalized ? 'Tester Approved' : isDevSubmitted ? 'In Testing' : 'Pending'),
    testingChecklist: rawProject.testingChecklist || rawProject.tasks || [],
    testingIssues: rawProject.testingIssues || rawProject.issues || [],
    issues: rawProject.testingIssues || rawProject.issues || [],
    testingNotes: rawProject.testingNotes || '',
    testingDocuments: rawProject.testingDocuments || [],
    testingActivity: rawProject.testingActivity || [],
    submissionNotes: rawProject.submissionNotes || '',
    
    // Admin Review & Rejection Workflow
    adminApproved: isAdminApproved,
    adminApprovedAt: rawProject.adminApprovedAt || null,
    adminRejected: Boolean(rawProject.adminRejected),
    adminRejectedAt: rawProject.adminRejectedAt || null,
    adminRejectionComment: rawProject.adminRejectionComment || rawProject.adminFeedback || rawProject.revisionReason || null,
    adminRejectionDocument: rawProject.adminRejectionDocument || null,
    
    qaFinalized: isFinalized,
    testerFinalized: isFinalized,
    testerFinalizedAt: rawProject.testerFinalizedAt || null
  };
}

/**
 * Queries and returns all projects strictly assigned to the authenticated tester.
 */
export function getAuthenticatedTesterProjects(authUser, allProjects) {
  if (!authUser || !Array.isArray(allProjects)) return [];

  return allProjects
    .filter(p => isProjectAssignedToTester(p, authUser))
    .map(toTesterSafeProject);
}

/**
 * Queries a single project by ID with strict tester authorization.
 */
export function getAuthenticatedTesterProjectById(authUser, allProjects, projectId) {
  if (!authUser || !projectId || !Array.isArray(allProjects)) {
    return { error: 'Project not available.', project: null };
  }

  const rawProject = allProjects.find(p => p.id && p.id.toLowerCase() === projectId.toLowerCase());
  if (!rawProject) {
    return { error: 'Project not available.', project: null };
  }

  if (!isProjectAssignedToTester(rawProject, authUser)) {
    return { error: 'Access denied: Project not available.', project: null };
  }

  return { error: null, project: toTesterSafeProject(rawProject) };
}

/**
 * Computes the exact 6 Tester Dashboard Statistics:
 * 1. Total Projects
 * 2. Pending Projects
 * 3. Under Review Projects
 * 4. Finalized Projects
 * 5. Approved Projects
 * 6. Completed Projects
 */
export function computeTesterDashboardStats(assignedProjects) {
  const projects = Array.isArray(assignedProjects) ? assignedProjects : [];

  const totalProjectsCount = projects.length;
  const pendingProjectsCount = projects.filter(p => getTesterDashboardStatus(p) === 'Pending').length;
  const underReviewProjectsCount = projects.filter(p => getTesterDashboardStatus(p) === 'Under Review').length;
  const finalizedProjectsCount = projects.filter(p => getTesterDashboardStatus(p) === 'Finalized').length;
  const approvedProjectsCount = projects.filter(p => getTesterDashboardStatus(p) === 'Approved').length;
  const completedProjectsCount = projects.filter(p => getTesterDashboardStatus(p) === 'Completed').length;

  return {
    totalProjectsCount,
    pendingProjectsCount,
    underReviewProjectsCount,
    finalizedProjectsCount,
    approvedProjectsCount,
    completedProjectsCount
  };
}
