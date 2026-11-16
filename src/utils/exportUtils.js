/**
 * Utility functions for exporting data to Excel / CSV format
 * Includes UTF-8 BOM for full Microsoft Excel compatibility
 */

export function exportToCSV(filename, headers, rows) {
  if (!rows || !rows.length) {
    alert('No data available to export.');
    return;
  }

  // Format header row
  const headerLine = headers.map(h => escapeCSVField(h.label)).join(',');

  // Format data rows
  const dataLines = rows.map(row => {
    return headers.map(h => {
      let value = '';
      if (typeof h.key === 'function') {
        value = h.key(row);
      } else {
        value = row[h.key] !== undefined && row[h.key] !== null ? row[h.key] : '';
      }
      return escapeCSVField(value);
    }).join(',');
  });

  // Prepend UTF-8 BOM (\uFEFF) for Excel compatibility with Unicode characters (like ₹ and accented letters)
  const csvContent = '\uFEFF' + [headerLine, ...dataLines].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  const dateStr = new Date().toISOString().slice(0, 10);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${dateStr}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export complete A-to-Z Project Archive Record
 * Formats full overview, client & finances, dev & tester details, checklist tasks,
 * QA defect issues, credentials, submission URLs, and activity audit into an Excel-ready CSV.
 */
export function exportFullProjectArchive(project) {
  if (!project) {
    if (typeof alert === 'function') alert('No project data available to export.');
    return false;
  }

  const escape = (val) => {
    if (val === null || val === undefined) return '""';
    const s = String(val);
    if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return `"${s}"`;
  };

  const line = (k, v) => `${escape(k)},${escape(v)}`;
  const section = (title) => [
    '',
    '--------------------------------------------------------------------------------',
    escape(`[${title.toUpperCase()}]`),
    '--------------------------------------------------------------------------------'
  ];

  const nowIst = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

  const lines = [
    escape('================================================================================'),
    escape('DAHEJ SUPPORT - COMPREHENSIVE PROJECT ARCHIVE & SPECIFICATION RECORD'),
    escape('================================================================================'),
    line('Export Generated At', `${nowIst} IST`),
    line('Platform', 'Dahej Support Freelancer Network Operations Portal'),
    line('Exported By', 'Master Admin (Keval Patel)'),
    line('Record Status', 'Permanent Historical Project Archive'),

    ...section('Section 1: Project General Specifications'),
    line('Property', 'Value'),
    line('Project ID', project.id || 'N/A'),
    line('Project Name', project.name || 'N/A'),
    line('Category / Project Type', project.projectType || project.category || 'N/A'),
    line('Priority', project.priority || 'Normal'),
    line('Lifecycle Status', project.status || 'N/A'),
    line('Testing Status', project.testingStatus || 'N/A'),
    line('Assigned Date', project.assignedDate || project.assignedDateIso || 'N/A'),
    line('Submission Deadline', project.deadline || project.submissionDate || 'N/A'),
    line('Developer Submitted Date', project.submissionDate || project.developerSubmittedAt || 'N/A'),
    line('QA Finalized Date', project.testingSubmissionDate || project.testerFinalizedAt || 'N/A'),
    line('Final Delivery Date', project.finalDeliveryDate || project.completedDate || 'N/A'),
    line('Developer Completion Progress', `${project.developerProgress !== undefined ? project.developerProgress : (project.progress || 0)}%`),
    line('QA Testing Progress', `${project.testingProgress !== undefined ? project.testingProgress : 0}%`),
    line('Project Description', project.description || 'N/A'),

    ...section('Section 2: Client Information & Financial Breakdown'),
    line('Property', 'Value'),
    line('Client Name', project.clientName || project.client || 'N/A'),
    line('Total Client Contract Price', project.totalClientPrice || project.totalAmount || (project.totalClientPriceNum ? `₹${project.totalClientPriceNum.toLocaleString('en-IN')}` : '₹0')),
    line('Client Amount Paid / Collected', project.collectedClientAmount || project.paidAmount || (project.collectedClientAmountNum ? `₹${project.collectedClientAmountNum.toLocaleString('en-IN')}` : '₹0')),
    line('Client Remaining Balance', project.remainingClientAmount || project.remainingAmount || (project.remainingClientAmountNum ? `₹${project.remainingClientAmountNum.toLocaleString('en-IN')}` : '₹0')),
    line('Client Payment Status', project.clientPaymentStatus || (project.remainingClientAmountNum === 0 ? 'Full Payment Received' : 'Pending')),
    line('Client Payment Transaction ID', project.clientPaymentTransactionId || project.clientTxnId || 'N/A'),

    ...section('Section 3: Assigned Developer Details & Payout'),
    line('Property', 'Value'),
    line('Developer Name', project.developer || 'Unassigned'),
    line('Developer ID', project.developerId || 'N/A'),
    line('Developer Email', project.developerEmail || 'N/A'),
    line('Developer Primary Skill', project.developerSkill || 'N/A'),
    line('Allocated Developer Budget', project.developerPayment || project.freelancerPayout || (project.developerPaymentNum ? `₹${project.developerPaymentNum.toLocaleString('en-IN')}` : '₹0')),
    line('Developer Amount Paid', project.developerPaymentPaid || (project.developerPaymentPaidNum ? `₹${project.developerPaymentPaidNum.toLocaleString('en-IN')}` : '₹0')),
    line('Developer Remaining Payout', project.developerPaymentRemaining || (project.developerPaymentRemainingNum ? `₹${project.developerPaymentRemainingNum.toLocaleString('en-IN')}` : '₹0')),
    line('Developer Payment Status', project.developerPaymentStatus || 'Pending'),
    line('Developer Payment Transaction ID', project.developerPaymentTransactionId || 'N/A'),
    line('Developer Submission Status', project.developerSubmitted ? 'Submitted (100% Complete)' : 'In Progress'),

    ...section('Section 4: Assigned QA Tester Details & Payout'),
    line('Property', 'Value'),
    line('QA Tester Name', project.tester || 'Unassigned'),
    line('QA Tester ID', project.testerId || 'N/A'),
    line('QA Tester Email', project.testerEmail || 'N/A'),
    line('QA Tester Specialization', project.testerSpecialization || 'N/A'),
    line('Allocated QA Tester Budget', project.testerPayment || project.testerPayout || (project.testerPaymentNum ? `₹${project.testerPaymentNum.toLocaleString('en-IN')}` : '₹0')),
    line('QA Tester Amount Paid', project.testerPaymentPaid || (project.testerPaymentPaidNum ? `₹${project.testerPaymentPaidNum.toLocaleString('en-IN')}` : '₹0')),
    line('QA Tester Remaining Payout', project.testerPaymentRemaining || (project.testerPaymentRemainingNum ? `₹${project.testerPaymentRemainingNum.toLocaleString('en-IN')}` : '₹0')),
    line('QA Tester Payment Status', project.testerPaymentStatus || 'Pending'),
    line('QA Tester Payment Transaction ID', project.testerPaymentTransactionId || 'N/A'),
    line('QA Verification Status', project.testerFinalized ? 'QA Finalized (100% Passed)' : (project.testingStatus || 'Pending')),

    ...section('Section 5: Deliverable Tasks Checklist'),
    ['Task #', 'Milestone Task Name', 'Weight', 'Developer Status', 'QA Testing Status', 'Task Deadline', 'Task Scope Description'].map(escape).join(',')
  ];

  // Tasks Checklist
  const tasks = Array.isArray(project.tasks) && project.tasks.length > 0
    ? project.tasks
    : (Array.isArray(project.milestones) ? project.milestones : []);
  if (tasks.length > 0) {
    tasks.forEach((t, idx) => {
      const num = t.number || String(idx + 1).padStart(2, '0');
      const name = t.name || t.heading || `Task ${num}`;
      const weight = t.weight ? `${t.weight}%` : (t.percentage ? `${t.percentage}%` : '20%');
      const devStatus = t.status || (t.progress === 100 ? 'Completed' : 'Pending');
      const qaStatus = t.qaStatus || (t.status === 'Completed' ? 'Passed' : 'Pending');
      const deadline = t.deadline || project.deadline || 'N/A';
      const desc = t.desc || t.description || 'N/A';
      lines.push([num, name, weight, devStatus, qaStatus, deadline, desc].map(escape).join(','));
    });
  } else {
    lines.push([escape('N/A'), escape('No specific task breakdown recorded'), escape('100%'), escape(project.status || 'N/A'), escape(project.testingStatus || 'N/A'), escape(project.deadline || 'N/A'), escape(project.description || 'N/A')].join(','));
  }

  // Defect Issues Log
  lines.push(...section('Section 6: QA Defect Issues & Resolutions Log'));
  lines.push(['Issue ID', 'Title', 'Severity', 'Category', 'Reporter', 'Status', 'Expected Behavior', 'Observed Bug', 'Reported Date', 'Resolved Date', 'Attachment Link'].map(escape).join(','));
  const issues = Array.isArray(project.testingIssues) && project.testingIssues.length > 0
    ? project.testingIssues
    : (Array.isArray(project.issues) ? project.issues : []);
  if (issues.length > 0) {
    issues.forEach((iss, idx) => {
      const id = iss.id || `ISS-${idx + 1}`;
      const title = iss.title || 'Bug report';
      const severity = iss.severity || 'Normal';
      const category = iss.category || 'Functionality';
      const reporter = iss.reporter || iss.by || 'QA Tester';
      const status = iss.status || 'Resolved';
      const expected = iss.expectedBehavior || 'N/A';
      const observed = iss.observedBug || iss.description || 'N/A';
      const created = iss.createdAt || iss.time || 'N/A';
      const resolved = iss.resolvedAt || 'N/A';
      const attach = iss.cloudUrl || iss.screenshot || iss.attachmentUrl || 'None';
      lines.push([id, title, severity, category, reporter, status, expected, observed, created, resolved, attach].map(escape).join(','));
    });
  } else {
    lines.push([escape('None'), escape('Zero QA defects recorded for this project'), escape('-'), escape('-'), escape('-'), escape('Clean'), escape('-'), escape('-'), escape('-'), escape('-'), escape('-')].join(','));
  }

  // Deliverables URLs
  lines.push(...section('Section 7: Submission URLs & Repository Links'));
  lines.push(['Deliverable Asset Type', 'URL / Location'].map(escape).join(','));
  lines.push(line('Live Website / Web App URL', project.liveLink || project.liveUrl || project.submissionUrl || 'Not provided'));
  lines.push(line('Google Drive Asset Folder', project.driveLink || project.driveUrl || 'Not provided'));
  lines.push(line('GitHub / Git Repository', project.githubLink || project.githubUrl || 'Not provided'));
  lines.push(line('Submission Notes', project.submissionNotes || 'None'));

  // Credentials
  lines.push(...section('Section 8: Project Credentials & Access Information'));
  lines.push(['Service / Platform', 'Username / ID', 'Password', 'Access URL', 'Notes'].map(escape).join(','));
  const creds = Array.isArray(project.credentials) ? project.credentials : [];
  if (creds.length > 0) {
    creds.forEach((c) => {
      lines.push([
        c.service || c.label || 'Login',
        c.username || c.user || 'N/A',
        c.password || 'N/A',
        c.url || 'N/A',
        c.notes || ''
      ].map(escape).join(','));
    });
  } else {
    lines.push([escape('None'), escape('No credentials stored'), escape('-'), escape('-'), escape('-')].join(','));
  }

  // Admin Revision
  if (project.adminRejectionComment || project.adminRejected || project.adminRejectionDocument) {
    lines.push(...section('Section 9: Admin Revision & Changes Specification'));
    lines.push(line('Admin Rejection Comment', project.adminRejectionComment || 'None'));
    lines.push(line('Admin Guideline Document', project.adminRejectionDocument?.name || project.adminRejectionDocument?.url || 'None'));
    lines.push(line('Admin Revision Date', project.adminRejectedAt || 'N/A'));
  }

  // Activity Log
  lines.push(...section('Section 10: Activity Timeline & Audit History'));
  lines.push(['Timestamp / Date', 'Actor', 'Event Description'].map(escape).join(','));
  const acts = Array.isArray(project.testingActivity) && project.testingActivity.length > 0
    ? project.testingActivity
    : (Array.isArray(project.activity) ? project.activity : []);
  if (acts.length > 0) {
    acts.forEach((a) => {
      const time = a.time || a.timestamp || a.date || 'N/A';
      const actor = a.by || a.actor || a.role || 'System';
      const event = a.event || a.description || a.action || 'Logged event';
      lines.push([time, actor, event].map(escape).join(','));
    });
  } else {
    lines.push([escape('N/A'), escape('Admin'), escape('Project lifecycle record logged')].join(','));
  }

  const csvContent = '\uFEFF' + lines.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const cleanName = (project.name || 'Project').replace(/[^a-zA-Z0-9_-]/g, '_');
  const cleanId = (project.id || 'record').replace(/[^a-zA-Z0-9_-]/g, '_');
  const dateStr = new Date().toISOString().slice(0, 10);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Project_Archive_${cleanId}_${cleanName}_${dateStr}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return true;
}

function escapeCSVField(field) {
  if (field === null || field === undefined) return '""';
  const str = String(field);
  // If field contains comma, quote, or newline, escape quotes and wrap in quotes
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}
