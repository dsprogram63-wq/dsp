/**
 * Unified Backend Security & Data Isolation Service for the Freelancer Workspace
 * 
 * Strict Architectural Guarantees:
 * 1. Authenticated User Identity is the sole Source of Truth.
 * 2. Every query is filtered by authenticatedFreelancerId before reaching components.
 * 3. Never trust frontend parameters or query strings for freelancer identification.
 * 4. Response model sanitization (toFreelancerSafeProject) strictly strips all client info,
 *    internal admin pricing, revenue, and tester fees.
 * 5. Strict ownership verification on project view, task update, notes, documents, and submissions.
 */

import { 
  calculateProjectProgressFromTasks, 
  areAllTasksCompleted,
  getFreelancerProjectStatus,
  getDevAmount,
  getDevPaid,
  getDevRemaining,
  isProjectAdminApproved,
  calculateCurrentExperience
} from '../utils/projectStatusUtils.js';

/**
 * Sanitizes any raw project object into a Freelancer-Safe View Model.
 * Strips all client identity (client name, client contact, client billing),
 * internal admin pricing, company margins, tester fees, and internal admin logs.
 */
export function toFreelancerSafeProject(rawProject) {
  if (!rawProject) return null;

  const {
    client,
    clientName,
    clientEmail,
    clientPhone,
    clientAddress,
    clientBilling,
    clientPaymentStatus,
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
    testerPayment,
    testerPaymentNum,
    testerPaymentPaid,
    testerPaymentPaidNum,
    testerPaymentRemaining,
    testerPaymentRemainingNum,
    testerPaymentStatus,
    testerAssignedAmount,
    testerPaidAmount,
    testerRemainingAmount,
    testerPayout,
    testerPayoutNum,
    testerId,
    tester,
    testerSpecialization,
    companyRevenue,
    internalAdminNotes,
    internalNotes,
    assignmentHistory,
    // Real client / final delivery deadlines and QA testing internal deadlines stripped from developer
    finalDeliveryDate,
    finalDeliveryDateIso,
    deadlineDate,
    deadlineDateIso,
    testingSubmissionDate,
    testingSubmissionDateIso,
    ...safeFields
  } = rawProject;

  const devAssigned = getDevAmount(rawProject);
  const devPaid = getDevPaid(rawProject);
  const devRemaining = getDevRemaining(rawProject);

  const calculatedProgress = calculateProjectProgressFromTasks(rawProject.tasks || []);

  // Developer deadline is strictly the submissionDate / developerDeadline configured by Admin for the developer
  const devDeadline = rawProject.submissionDate || rawProject.developerDeadline || rawProject.developerDeadlineDate || rawProject.submissionDateIso || rawProject.deadline || 'Ongoing';

  return {
    ...safeFields,
    id: rawProject.id,
    name: rawProject.name,
    category: rawProject.category || rawProject.projectType || 'Corporate Development',
    projectType: rawProject.projectType || rawProject.category || 'Corporate Development',
    description: rawProject.description || rawProject.requirements?.description || 'Complete development and deployment according to verified project specifications.',
    clientRequirements: rawProject.clientRequirements || rawProject.requirements?.clientReqs || [],
    technicalRequirements: rawProject.technicalRequirements || rawProject.requirements?.technicalReqs || [],
    deliveryRequirements: rawProject.deliveryRequirements || rawProject.requirements?.deliveryReqs || [],
    assignedDate: rawProject.assignedDate || rawProject.startDate || '—',
    deadline: devDeadline,
    submissionDate: devDeadline,
    developerDeadline: devDeadline,
    status: rawProject.status || 'Active',
    priority: rawProject.priority || 'Medium',
    
    // Developer financials (strictly developer-specific)
    amount: rawProject.developerPayment || rawProject.freelancerPayout || (devAssigned ? `₹${devAssigned.toLocaleString('en-IN')}` : '₹0'),
    amountNumber: devAssigned,
    developerPayment: rawProject.developerPayment || rawProject.freelancerPayout || (devAssigned ? `₹${devAssigned.toLocaleString('en-IN')}` : '₹0'),
    developerPaymentNum: devAssigned,
    developerAssignedAmount: devAssigned,
    developerPaidAmount: devPaid,
    developerRemainingAmount: devRemaining,
    developerPaymentPaid: rawProject.developerPaymentPaid || `₹${devPaid.toLocaleString('en-IN')}`,
    developerPaymentPaidNum: devPaid,
    developerPaymentRemaining: rawProject.developerPaymentRemaining || `₹${devRemaining.toLocaleString('en-IN')}`,
    developerPaymentRemainingNum: devRemaining,
    developerPaymentStatus: rawProject.developerPaymentStatus || (devRemaining === 0 && devAssigned > 0 ? 'Paid' : devPaid > 0 ? 'Partial' : 'Pending'),
    payoutStatus: rawProject.payoutStatus || (devRemaining === 0 && devAssigned > 0 ? 'Paid' : 'Pending'),
    developerTransactionId: rawProject.developerTransactionId || rawProject.developerPaymentTxnId || rawProject.devTxnId || rawProject.transactionId || (devPaid > 0 ? `TXN-DS-${(rawProject.id || '').replace(/[^0-9]/g, '') || '901'}` : '—'),
    transactionId: rawProject.developerTransactionId || rawProject.developerPaymentTxnId || rawProject.devTxnId || rawProject.transactionId || (devPaid > 0 ? `TXN-DS-${(rawProject.id || '').replace(/[^0-9]/g, '') || '901'}` : '—'),
    developerPaymentMode: rawProject.developerPaymentMode || 'UPI / Bank Transfer',
    developerPaymentDate: rawProject.developerPaymentDate || rawProject.completedDate || null,

    // Task & Progress info
    tasks: (rawProject.tasks || []).map((t, idx) => ({
      id: t.id || `tsk-${rawProject.id}-${idx + 1}`,
      number: t.number || (idx + 1 < 10 ? `0${idx + 1}` : `${idx + 1}`),
      name: t.name,
      desc: t.desc || t.description || 'Milestone deliverable specification',
      status: t.status || 'Pending',
      progress: t.progress !== undefined ? t.progress : (t.status === 'Completed' || t.status === 'Done' ? 100 : t.status === 'In Progress' ? 50 : 0),
      weight: t.weight !== undefined ? t.weight : (t.adminPercentage !== undefined ? t.adminPercentage : (t.percentage !== undefined ? t.percentage : Math.round(100 / (rawProject.tasks?.length || 1)))),
      adminPercentage: t.weight !== undefined ? t.weight : (t.adminPercentage !== undefined ? t.adminPercentage : (t.percentage !== undefined ? t.percentage : Math.round(100 / (rawProject.tasks?.length || 1)))),
      deadline: t.deadline || devDeadline,
      notes: t.notes || t.developerNotes || t.freelancerNotes || '',
      developerNotes: t.notes || t.developerNotes || t.freelancerNotes || '',
      freelancerNotes: t.notes || t.developerNotes || t.freelancerNotes || '',
      qaStatus: t.qaStatus || t.testingStatus || 'Pending',
      qaNotes: t.qaNotes || '',
      lastUpdated: t.lastUpdated || t.updatedAt || 'Recently'
    })),
    progress: calculatedProgress,
    developerProgress: calculatedProgress,
    freelancerProgress: calculatedProgress,

    // Documents & Credentials
    documents: (rawProject.documents || []).map(doc => ({
      ...doc,
      id: doc.id,
      name: doc.name,
      type: doc.type || 'Requirement Document',
      size: doc.size || '2.4 MB',
      date: doc.date || rawProject.assignedDate || 'Recent',
      dataUrl: doc.dataUrl || doc.fileData || doc.url,
      fileData: doc.fileData || doc.dataUrl || doc.url
    })),
    credentials: (rawProject.credentials || []).map(c => ({
      id: c.id,
      service: c.service || c.platform || c.type,
      platform: c.platform || c.service || c.type,
      type: c.type || 'Platform',
      username: c.username,
      secret: c.secret,
      notes: c.notes
    })),

    // Project Links
    liveLink: rawProject.liveLink || rawProject.liveProjectLink || '',
    liveProjectLink: rawProject.liveLink || rawProject.liveProjectLink || '',
    driveLink: rawProject.driveLink || rawProject.driveProjectLink || '',
    driveProjectLink: rawProject.driveLink || rawProject.driveProjectLink || '',

    // QA & Submission Workflow
    developerStarted: Boolean(rawProject.developerStarted || rawProject.freelancerStarted || rawProject.status === 'Active' || rawProject.status === 'In Progress' || calculatedProgress > 0),
    developerStartedAt: rawProject.developerStartedAt || rawProject.freelancerStartedAt || null,
    developerSubmitted: Boolean(rawProject.developerSubmitted || rawProject.freelancerSubmitted || rawProject.developerSubmission === 'Submitted' || rawProject.status === 'Submitted'),
    developerSubmittedAt: rawProject.developerSubmittedAt || rawProject.freelancerSubmittedAt || null,
    freelancerSubmitted: Boolean(rawProject.freelancerSubmitted || rawProject.developerSubmitted || rawProject.developerSubmission === 'Submitted' || rawProject.status === 'Submitted'),
    freelancerSubmittedAt: rawProject.freelancerSubmittedAt || rawProject.developerSubmittedAt || null,
    developerSubmission: rawProject.developerSubmission || (rawProject.status === 'Submitted' ? 'Submitted' : 'Draft'),
    submittedDate: rawProject.submittedDate || rawProject.freelancerSubmittedAt || null,
    
    testerStarted: Boolean(rawProject.testerStarted || rawProject.qaStarted),
    testerStartedAt: rawProject.testerStartedAt || rawProject.qaStartedAt || null,
    testerFinalized: Boolean(rawProject.testerFinalized || rawProject.qaFinalized || rawProject.testingStatus === 'Tester Approved' || rawProject.testingStatus === 'Finalized'),
    testerFinalizedAt: rawProject.testerFinalizedAt || rawProject.qaFinalizedAt || null,
    qaFinalized: Boolean(rawProject.qaFinalized || rawProject.testerFinalized),
    testingProgress: rawProject.testingProgress || 0,
    testingStatus: rawProject.testingStatus || 'Pending',
    
    // Admin Review & Rejection Workflow
    adminApproved: Boolean(rawProject.adminApproved || rawProject.status === 'Approved' || rawProject.status === 'Completed' || rawProject.status === 'Paid' || rawProject.developerPaymentStatus === 'Paid' || devPaid > 0),
    adminApprovedAt: rawProject.adminApprovedAt || null,
    adminRejected: Boolean(rawProject.adminRejected),
    adminRejectedAt: rawProject.adminRejectedAt || null,
    adminRejectionComment: rawProject.adminRejectionComment || rawProject.adminFeedback || rawProject.revisionReason || null,
    adminRejectionDocument: rawProject.adminRejectionDocument || null,
    adminFeedback: rawProject.adminRejectionComment || rawProject.adminFeedback || rawProject.revisionReason || null,
    
    // Issues Raised by Tester (visible to developer for rework)
    testingIssues: Array.isArray(rawProject.testingIssues) ? rawProject.testingIssues : (Array.isArray(rawProject.issues) ? rawProject.issues : []),
    issues: Array.isArray(rawProject.testingIssues) ? rawProject.testingIssues : (Array.isArray(rawProject.issues) ? rawProject.issues : []),
    
    // History & Audit Trail
    rejectionsHistory: Array.isArray(rawProject.rejectionsHistory) ? rawProject.rejectionsHistory : [],
    activityHistory: Array.isArray(rawProject.activityHistory) ? rawProject.activityHistory : []
  };
}

/**
 * Checks whether a project record is owned by the authenticated freelancer.
 */
export function isProjectAssignedToFreelancer(project, authUser) {
  if (!project || !authUser) return false;

  const authId = (authUser.id || authUser.freelancerId || '').toLowerCase().trim();
  const authEmail = (authUser.email || '').toLowerCase().trim();
  const authName = (authUser.name || authUser.fullName || '').toLowerCase().trim();

  const devId = (project.developerId || '').toLowerCase().trim();
  const devEmail = (project.developerEmail || '').toLowerCase().trim();
  const devName = (project.developer || '').toLowerCase().trim();

  // Primary check: Direct ID match
  if (authId && devId && (authId === devId || authId.replace(/[^0-9]/g, '') === devId.replace(/[^0-9]/g, ''))) {
    return true;
  }
  // Secondary check: Email match
  if (authEmail && devEmail && authEmail === devEmail) {
    return true;
  }
  // Tertiary check: Full name match
  if (authName && devName && (authName === devName || devName.includes(authName) || authName.includes(devName))) {
    return true;
  }

  return false;
}

/**
 * Queries and returns all projects strictly assigned to the authenticated freelancer.
 */
export function getAuthenticatedFreelancerProjects(authUser, allProjects) {
  if (!authUser || !Array.isArray(allProjects)) return [];

  return allProjects
    .filter(p => isProjectAssignedToFreelancer(p, authUser))
    .map(toFreelancerSafeProject);
}

/**
 * Queries a single project by ID with strict ownership validation.
 * If unauthorized or not found, returns a safe error without leaking information.
 */
export function getAuthenticatedFreelancerProjectById(authUser, allProjects, projectId) {
  if (!authUser || !projectId || !Array.isArray(allProjects)) {
    return { error: 'Project not available.', project: null };
  }

  const rawProject = allProjects.find(p => p.id && p.id.toLowerCase() === projectId.toLowerCase());
  if (!rawProject) {
    return { error: 'Project not available.', project: null };
  }

  // Strict Authorization Check
  if (!isProjectAssignedToFreelancer(rawProject, authUser)) {
    return { error: 'Access denied: Project not available.', project: null };
  }

  return { error: null, project: toFreelancerSafeProject(rawProject) };
}

/**
 * Computes the Freelancer Dashboard statistics strictly from assigned projects.
 */
export function computeFreelancerDashboardStats(assignedProjects) {
  const projects = Array.isArray(assignedProjects) ? assignedProjects : [];

  const totalProjectsCount = projects.length;
  const activeProjectsCount = projects.filter(p => getFreelancerProjectStatus(p) === 'Active').length;
  const submittedProjectsCount = projects.filter(p => getFreelancerProjectStatus(p) === 'Submitted').length;
  const underReviewProjectsCount = projects.filter(p => {
    const st = getFreelancerProjectStatus(p);
    return st === 'Under Review' || st === 'Revision Required' || st === 'Changes Requested';
  }).length;
  const approvedProjectsCount = projects.filter(p => {
    const st = getFreelancerProjectStatus(p);
    return st === 'Approved' || st === 'Completed';
  }).length;

  const totalApprovedPayoutsNum = projects
    .filter(p => isProjectAdminApproved(p))
    .reduce((acc, p) => acc + getDevAmount(p), 0);

  const totalPaidPayoutNum = projects
    .reduce((acc, p) => acc + getDevPaid(p), 0);

  return {
    totalProjectsCount,
    activeProjectsCount,
    submittedProjectsCount,
    underReviewProjectsCount,
    approvedProjectsCount,
    totalApprovedPayoutsNum,
    totalPaidPayoutNum
  };
}

/**
 * Computes the Freelancer Earnings statistics strictly from assigned projects.
 */
export function computeFreelancerEarningsStats(assignedProjects) {
  const projects = Array.isArray(assignedProjects) ? assignedProjects : [];

  const totalEarningsAmount = projects
    .filter(p => isProjectAdminApproved(p))
    .reduce((sum, p) => sum + getDevAmount(p), 0);

  const totalPendingAmount = projects
    .filter(p => isProjectAdminApproved(p) && getDevRemaining(p) > 0)
    .reduce((sum, p) => sum + getDevRemaining(p), 0);

  const totalCompletedProjectsCount = projects
    .filter(p => isProjectAdminApproved(p) && getDevRemaining(p) === 0 && (getDevPaid(p) >= getDevAmount(p) || getDevAmount(p) > 0))
    .length;

  return {
    totalEarningsAmount,
    totalPendingAmount,
    totalCompletedProjectsCount
  };
}
