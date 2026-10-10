/**
 * Pure state machine and financial calculation utilities for Dahej Support Master Project Lifecycle
 * Roles: Admin, Developer/Freelancer, Tester/QA
 * 
 * Exact 8 Lifecycle Stages:
 * 1. PENDING / ASSIGNED (Project created by Admin, Developer & Tester assigned)
 * 2. DEVELOPER ACTIVE / IN PROGRESS (Developer clicks "Start Project")
 * 3. DEVELOPER SUBMITTED (Developer completes 100% tasks + links + credentials -> Submits)
 * 4. TESTER PENDING -> UNDER REVIEW (Tester clicks "Start QA", tests tasks: Pass / Fail)
 * 5. TESTER FINALIZED (All QA tasks Pass -> Tester clicks "Finalize Project")
 * 6. ADMIN REVIEW -> APPROVED or REJECTED
 *    - If Rejected: Developer rework -> Resubmit -> Tester recheck -> Finalize -> Admin review
 * 7. ADMIN APPROVED (Enters 3-track Payment Phase)
 * 8. COMPLETED (Role-specific payouts cleared or global settlement)
 */

export function getDevAmount(p) {
  if (!p) return 0;
  if (p.developerPaymentNum !== undefined) return p.developerPaymentNum;
  if (p.developerAssignedAmount !== undefined) {
    const n = typeof p.developerAssignedAmount === 'number' ? p.developerAssignedAmount : parseInt(String(p.developerAssignedAmount).replace(/[^0-9]/g, ''), 10);
    if (!isNaN(n)) return n;
  }
  if (p.freelancerPayoutNum !== undefined) return p.freelancerPayoutNum;
  if (p.amountNumber !== undefined) return p.amountNumber;
  const str = p.developerPayment || p.freelancerPayout || p.developerAssignedAmount || p.amount || '0';
  const num = parseInt(String(str).replace(/[^0-9]/g, ''), 10);
  return isNaN(num) ? 0 : num;
}

export function getDevPaid(p) {
  if (!p) return 0;
  if (p.developerPaymentPaidNum !== undefined) return p.developerPaymentPaidNum;
  if (p.developerPaidAmount !== undefined) {
    const n = typeof p.developerPaidAmount === 'number' ? p.developerPaidAmount : parseInt(String(p.developerPaidAmount).replace(/[^0-9]/g, ''), 10);
    if (!isNaN(n)) return n;
  }
  if (p.developerPaymentStatus === 'Paid' || p.payoutStatus === 'Paid') {
    return getDevAmount(p);
  }
  if (p.developerPaymentPaid !== undefined) {
    const num = parseInt(String(p.developerPaymentPaid).replace(/[^0-9]/g, ''), 10);
    return isNaN(num) ? 0 : num;
  }
  return 0;
}

export function getDevRemaining(p) {
  if (!p) return 0;
  if (p.developerPaymentRemainingNum !== undefined) return p.developerPaymentRemainingNum;
  if (p.developerRemainingAmount !== undefined) {
    const n = typeof p.developerRemainingAmount === 'number' ? p.developerRemainingAmount : parseInt(String(p.developerRemainingAmount).replace(/[^0-9]/g, ''), 10);
    if (!isNaN(n)) return n;
  }
  const total = getDevAmount(p);
  const paid = getDevPaid(p);
  return Math.max(0, total - paid);
}

export function getTesterAmount(p) {
  if (!p) return 0;
  if (p.testerPaymentNum !== undefined) return p.testerPaymentNum;
  if (p.testerAssignedAmount !== undefined) {
    const n = typeof p.testerAssignedAmount === 'number' ? p.testerAssignedAmount : parseInt(String(p.testerAssignedAmount).replace(/[^0-9]/g, ''), 10);
    if (!isNaN(n)) return n;
  }
  if (p.testerPayoutNum !== undefined) return p.testerPayoutNum;
  const str = p.testerPayment || p.testerPayout || p.testerAssignedAmount || '0';
  const num = parseInt(String(str).replace(/[^0-9]/g, ''), 10);
  return isNaN(num) ? 0 : num;
}

export function getTesterPaid(p) {
  if (!p) return 0;
  if (p.testerPaymentPaidNum !== undefined) return p.testerPaymentPaidNum;
  if (p.testerPaidAmount !== undefined) {
    const n = typeof p.testerPaidAmount === 'number' ? p.testerPaidAmount : parseInt(String(p.testerPaidAmount).replace(/[^0-9]/g, ''), 10);
    if (!isNaN(n)) return n;
  }
  if (p.testerPaymentStatus === 'Paid') return getTesterAmount(p);
  if (p.testerPaymentPaid !== undefined) {
    const num = parseInt(String(p.testerPaymentPaid).replace(/[^0-9]/g, ''), 10);
    return isNaN(num) ? 0 : num;
  }
  return 0;
}

export function getTesterRemaining(p) {
  if (!p) return 0;
  if (p.testerPaymentRemainingNum !== undefined) return p.testerPaymentRemainingNum;
  if (p.testerRemainingAmount !== undefined) {
    const n = typeof p.testerRemainingAmount === 'number' ? p.testerRemainingAmount : parseInt(String(p.testerRemainingAmount).replace(/[^0-9]/g, ''), 10);
    if (!isNaN(n)) return n;
  }
  const total = getTesterAmount(p);
  const paid = getTesterPaid(p);
  return Math.max(0, total - paid);
}

export function getClientAmount(p) {
  if (!p) return 0;
  if (p.totalClientPriceNum !== undefined) return p.totalClientPriceNum;
  if (p.clientTotalAmount !== undefined) return p.clientTotalAmount;
  const str = p.totalClientPrice || p.clientPrice || '0';
  const num = parseInt(String(str).replace(/[^0-9]/g, ''), 10);
  return isNaN(num) ? 0 : num;
}

export function getClientPaid(p) {
  if (!p) return 0;
  if (p.collectedClientAmountNum !== undefined) return p.collectedClientAmountNum;
  if (p.clientPaidAmount !== undefined) return p.clientPaidAmount;
  if (p.clientPaymentStatus === 'Paid' || p.clientPaymentStatus === 'Full Payment Received') return getClientAmount(p);
  const str = p.collectedClientAmount || '0';
  const num = parseInt(String(str).replace(/[^0-9]/g, ''), 10);
  return isNaN(num) ? 0 : num;
}

export function getClientRemaining(p) {
  if (!p) return 0;
  if (p.remainingClientAmountNum !== undefined) return p.remainingClientAmountNum;
  if (p.clientRemainingAmount !== undefined) return p.clientRemainingAmount;
  const total = getClientAmount(p);
  const paid = getClientPaid(p);
  return Math.max(0, total - paid);
}

export function getDevProgress(p) {
  if (!p) return 0;
  if (p.tasks && p.tasks.length > 0) {
    return calculateProjectProgressFromTasks(p.tasks);
  }
  if (p.developerProgress !== undefined) return p.developerProgress;
  if (p.freelancerProgress !== undefined) return p.freelancerProgress;
  if (p.progress !== undefined) return p.progress;
  return 0;
}

export function formatINR(num) {
  return '₹' + (num || 0).toLocaleString('en-IN');
}

export function isProjectAdminApproved(p) {
  if (!p) return false;
  const s = (p.status || '').toLowerCase().trim();
  const ts = (p.testingStatus || '').toLowerCase().trim();
  const devPaid = getDevPaid(p);
  const testerPaid = getTesterPaid(p);
  return Boolean(
    p.adminApproved === true || 
    s === 'approved' || 
    s === 'completed' || 
    s === 'paid' ||
    ts === 'approved' ||
    p.developerPaymentStatus === 'Paid' ||
    p.testerPaymentStatus === 'Paid' ||
    p.payoutStatus === 'Paid' ||
    devPaid > 0 ||
    testerPaid > 0
  );
}

/**
 * Derives the exact single lifecycle stage of a project for the Developer / Freelancer Workspace:
 * - Pending: Assigned, developer has not clicked "Start Project"
 * - Active: Developer clicked "Start Project", development in progress
 * - Submitted: Developer completed all tasks + links + credentials and submitted
 * - Under Review: QA review started, in QA testing cycle
 * - Finalized: QA tester finalized review, pending Admin approval
 * - Revision Required / Changes Requested: Admin or Tester requested changes
 * - Approved: Admin approved project, developer payout pending/partial
 * - Completed: Admin approved AND developer payout is 100% cleared
 */
export function getFreelancerProjectStatus(p) {
  if (!p) return 'Pending';

  const s = (p.status || '').toLowerCase().trim();
  const ts = (p.testingStatus || '').toLowerCase().trim();
  const devTotal = getDevAmount(p);
  const devPaid = getDevPaid(p);
  const devRemaining = getDevRemaining(p);

  // 1. Check Admin Approval
  const isAdminApproved = Boolean(
    p.adminApproved === true || 
    s === 'approved' || 
    s === 'completed' || 
    s === 'paid'
  );

  if (isAdminApproved) {
    // COMPLETED: Admin approved AND developer payment for this project is 100% paid
    const isFullyPaid = (devTotal > 0 && devPaid >= devTotal) || p.developerPaymentStatus === 'Paid' || (devTotal > 0 && devRemaining === 0);
    if (isFullyPaid) {
      return 'Completed';
    }
    return 'Approved';
  }

  // 2. Check Admin Rejection / Changes Requested
  if (p.adminRejected === true || s === 'changes requested' || s === 'revision required' || ts === 'changes requested') {
    return 'Revision Required';
  }

  // 3. Check QA Finalization (QA tester passed all checklist items and clicked Finalize)
  const isQAFinalized = Boolean(
    p.qaFinalized === true || 
    p.testerFinalized === true ||
    ts === 'tester approved' || 
    ts === 'finalized' || 
    s === 'finalized'
  );

  if (isQAFinalized) {
    return 'Finalized';
  }

  // 4. Check QA Review Underway
  const isQAUnderway = Boolean(
    p.qaStarted === true || 
    p.testerStarted === true ||
    ts === 'in testing' || 
    ts === 'under review' || 
    s === 'under review' ||
    (p.testingProgress !== undefined && p.testingProgress > 0)
  );

  if (isQAUnderway) {
    return 'Under Review';
  }

  // 5. Check Developer Submission
  const isDevSubmitted = Boolean(
    p.developerSubmitted === true || 
    p.freelancerSubmitted === true || 
    p.developerSubmission === 'Submitted' || 
    s === 'submitted' ||
    p.submittedDate && p.submittedDate !== 'Pending' && p.submittedDate !== '—'
  );

  if (isDevSubmitted) {
    return 'Submitted';
  }

  // 6. Check Developer Started
  const isDevStarted = Boolean(
    p.developerStarted === true || 
    p.freelancerStarted === true || 
    s === 'active' || 
    s === 'in progress' || 
    (p.progress !== undefined && p.progress > 0) ||
    (p.developerProgress !== undefined && p.developerProgress > 0)
  );

  if (isDevStarted) {
    return 'Active';
  }

  // 7. Initial state: Assigned / Pending
  return 'Pending';
}

/**
 * Derives the exact single lifecycle stage of a project for the Tester / QA Workspace:
 * - Pending: Awaiting Developer submission OR Developer submitted & QA not started yet
 * - Under Review: QA review started, testing in progress
 * - Finalized: QA passed all tests and finalized review
 * - Revision Required / Changes Requested: Revisions requested
 * - Approved: Admin approved project, tester payout pending/partial
 * - Completed: Admin approved AND tester payout is 100% cleared
 */
export function getTesterDashboardStatus(p) {
  if (!p) return 'Pending';

  const ts = (p.testingStatus || '').toLowerCase().trim();
  const s = (p.status || '').toLowerCase().trim();
  const testerTotal = getTesterAmount(p);
  const testerPaid = getTesterPaid(p);
  const testerRemaining = getTesterRemaining(p);

  // 1. Check Admin Approval
  const isAdminApproved = Boolean(
    p.adminApproved === true || 
    s === 'approved' || 
    s === 'completed' || 
    s === 'paid' ||
    ts === 'approved'
  );

  if (isAdminApproved) {
    const isFullyPaid = (testerTotal > 0 && testerPaid >= testerTotal) || p.testerPaymentStatus === 'Paid' || (testerTotal > 0 && testerRemaining === 0);
    if (isFullyPaid) {
      return 'Completed';
    }
    return 'Approved';
  }

  // 2. Check Admin Rejection
  if (p.adminRejected === true || s === 'changes requested' || s === 'revision required' || ts === 'changes requested') {
    return 'Revision Required';
  }

  // 3. Check Tester Finalization
  const isFinalized = Boolean(
    p.testerFinalized === true ||
    p.qaFinalized === true ||
    ts === 'tester approved' || 
    ts === 'finalized' || 
    s === 'finalized'
  );

  if (isFinalized) {
    return 'Finalized';
  }

  // 4. Check QA Started
  const isQAStarted = Boolean(
    p.testerStarted === true ||
    p.qaStarted === true ||
    ts === 'in testing' ||
    ts === 'under review' ||
    s === 'under review' ||
    (p.testingProgress !== undefined && p.testingProgress > 0)
  );

  if (isQAStarted) {
    return 'Under Review';
  }

  // 5. Pending QA
  return 'Pending';
}

/**
 * Global / Admin Project Status:
 * - Completed: Admin approved AND client 100% paid AND dev 100% paid AND tester 100% paid
 * - Approved: Admin approved (any payment remaining)
 * - Changes Requested: Admin or QA requested changes
 * - Pending Approval: Tester finalized, awaiting Admin review
 * - Under Review: Tester started QA
 * - Submitted: Developer submitted, awaiting QA
 * - In Progress: Developer working
 * - Pending: Newly created, not started
 */
export function getAdminProjectStatus(p) {
  if (!p) return 'Pending';

  const s = (p.status || '').toLowerCase().trim();
  const ts = (p.testingStatus || '').toLowerCase().trim();

  const devRemaining = getDevRemaining(p);
  const testerRemaining = getTesterRemaining(p);
  const clientRemaining = getClientRemaining(p);

  const isAdminApproved = Boolean(
    p.adminApproved === true || 
    s === 'approved' || 
    s === 'completed'
  );

  if (isAdminApproved) {
    if (clientRemaining === 0 && devRemaining === 0 && testerRemaining === 0) {
      return 'Completed';
    }
    return 'Approved';
  }

  if (p.adminRejected === true || s === 'changes requested' || s === 'revision required' || ts === 'changes requested') {
    return 'Changes Requested';
  }

  if (p.testerFinalized === true || p.qaFinalized === true || s === 'finalized' || ts === 'finalized' || ts === 'tester approved') {
    return 'Pending Approval';
  }

  if (p.testerStarted === true || p.qaStarted === true || s === 'under review' || ts === 'in testing' || ts === 'under review') {
    return 'Under Review';
  }

  if (p.developerSubmitted === true || p.freelancerSubmitted === true || s === 'submitted') {
    return 'Submitted';
  }

  if (p.developerStarted === true || p.freelancerStarted === true || s === 'active' || s === 'in progress') {
    return 'In Progress';
  }

  return 'Pending';
}

/**
 * Automatically calculates experience from original joining experience and reference date.
 * Formula: currentExperience = experienceAtJoining + completeYearsElapsedSince(experienceReferenceDate)
 */
export function calculateCurrentExperience(experienceAtJoining, experienceReferenceDate) {
  let baseYears = 2;
  if (typeof experienceAtJoining === 'number') {
    baseYears = experienceAtJoining;
  } else if (typeof experienceAtJoining === 'string') {
    const parsed = parseInt(experienceAtJoining.replace(/[^0-9]/g, ''), 10);
    baseYears = isNaN(parsed) ? 2 : parsed;
  }

  let elapsedYears = 0;
  if (experienceReferenceDate) {
    const refDate = new Date(experienceReferenceDate);
    if (!isNaN(refDate.getTime())) {
      const now = new Date();
      elapsedYears = now.getFullYear() - refDate.getFullYear();
      const monthDiff = now.getMonth() - refDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < refDate.getDate())) {
        elapsedYears--;
      }
      elapsedYears = Math.max(0, elapsedYears);
    }
  }

  const total = baseYears + elapsedYears;
  return `${total} ${total === 1 ? 'Year' : 'Years'}`;
}

/**
 * Calculates overall developer project progress based on Admin-assigned task percentage weights.
 * Formula: Overall Project Progress = SUM(taskWeight * (taskProgress / 100))
 * Where:
 * - Pending: 0% task progress
 * - In Progress: 50% task progress
 * - Completed: 100% task progress
 * - Failed / Rework Required: 0% task progress
 */
export function calculateProjectProgressFromTasks(tasks) {
  if (!tasks || !Array.isArray(tasks) || tasks.length === 0) return 0;

  const hasWeights = tasks.some(t => t.weight !== undefined || t.adminPercentage !== undefined || t.percentage !== undefined);
  let totalContribution = 0;

  if (hasWeights) {
    const rawWeights = tasks.map(t => {
      const w = t.weight !== undefined ? t.weight : (t.adminPercentage !== undefined ? t.adminPercentage : (t.percentage || 0));
      return typeof w === 'number' ? w : parseInt(String(w).replace(/[^0-9]/g, ''), 10) || 0;
    });
    const sumRaw = rawWeights.reduce((a, b) => a + b, 0);

    tasks.forEach((t, i) => {
      const taskWeight = sumRaw > 0 ? (rawWeights[i] / sumRaw) * 100 : (100 / tasks.length);
      let taskProg = 0;
      if (t.status === 'Completed' || t.status === 'Done') {
        taskProg = 100;
      } else if (t.status === 'In Progress') {
        taskProg = 50;
      } else if (t.status === 'Failed' || t.status === 'Rework Required') {
        taskProg = 0;
      } else if (t.status === 'Pending') {
        taskProg = 0;
      } else {
        taskProg = t.progress !== undefined ? t.progress : 0;
      }

      totalContribution += (taskWeight * taskProg) / 100;
    });
  } else {
    const equalWeight = 100 / tasks.length;
    tasks.forEach(t => {
      let taskProg = 0;
      if (t.status === 'Completed' || t.status === 'Done') {
        taskProg = 100;
      } else if (t.status === 'In Progress') {
        taskProg = 50;
      } else if (t.status === 'Failed' || t.status === 'Rework Required') {
        taskProg = 0;
      } else if (t.status === 'Pending') {
        taskProg = 0;
      } else {
        taskProg = t.progress !== undefined ? t.progress : 0;
      }

      totalContribution += (equalWeight * taskProg) / 100;
    });
  }

  return Math.min(100, Math.max(0, Math.round(totalContribution)));
}

/**
 * Calculates QA Testing Progress based on Passed Task Weights.
 * Formula: QA Progress = SUM(taskWeight for all tasks with status === 'Passed' || status === 'Pass')
 */
export function calculateQAProgressFromTasks(tasks) {
  if (!tasks || !Array.isArray(tasks) || tasks.length === 0) return 0;

  const hasWeights = tasks.some(t => t.weight !== undefined || t.adminPercentage !== undefined || t.percentage !== undefined);
  let totalPassedPercentage = 0;

  if (hasWeights) {
    const rawWeights = tasks.map(t => {
      const w = t.weight !== undefined ? t.weight : (t.adminPercentage !== undefined ? t.adminPercentage : (t.percentage || 0));
      return typeof w === 'number' ? w : parseInt(String(w).replace(/[^0-9]/g, ''), 10) || 0;
    });
    const sumRaw = rawWeights.reduce((a, b) => a + b, 0);

    tasks.forEach((t, i) => {
      const taskWeight = sumRaw > 0 ? (rawWeights[i] / sumRaw) * 100 : (100 / tasks.length);
      const isPassed = (t.qaStatus === 'Passed' || t.qaStatus === 'Pass' || t.testingStatus === 'Passed' || t.status === 'Passed' || t.status === 'Pass');
      if (isPassed) {
        totalPassedPercentage += taskWeight;
      }
    });
  } else {
    const equalWeight = 100 / tasks.length;
    tasks.forEach(t => {
      const isPassed = (t.qaStatus === 'Passed' || t.qaStatus === 'Pass' || t.testingStatus === 'Passed' || t.status === 'Passed' || t.status === 'Pass');
      if (isPassed) {
        totalPassedPercentage += equalWeight;
      }
    });
  }

  return Math.min(100, Math.max(0, Math.round(totalPassedPercentage)));
}

/**
 * Checks whether all tasks are 100% completed by Developer
 */
export function areAllTasksCompleted(tasks) {
  if (!tasks || !Array.isArray(tasks) || tasks.length === 0) return false;
  return tasks.every(t => (t.status === 'Completed' || t.status === 'Done') && (t.progress === 100 || t.progress === undefined));
}

/**
 * Checks whether all QA tasks are Passed by Tester
 */
export function areAllQATasksPassed(tasks) {
  if (!tasks || !Array.isArray(tasks) || tasks.length === 0) return false;
  return tasks.every(t => (t.qaStatus === 'Passed' || t.qaStatus === 'Pass' || t.testingStatus === 'Passed' || t.status === 'Passed' || t.status === 'Pass'));
}
