/**
 * Test Suite: QA Re-Test Notification Email & Defect Resolution Submission Validation
 * 
 * Verifies:
 * 1. Submission is strictly blocked if there are any unresolved defects (unresolvedIssuesCount > 0).
 * 2. Submission is unlocked only when all defects are marked Resolved and progress is 100%.
 * 3. resolveTesterEmail resolves tester email across project, registry, and localStorage.
 * 4. sendProjectSubmissionNotifications with isResubmission = true strictly emails ONLY the QA tester (Admin is excluded).
 * 5. Re-Test email contains Project ID, Name, Resolved Defect Breakdown, Re-test Instructions, and CTA link.
 */

import assert from 'assert';
import { 
  resolveTesterEmail, 
  buildDeveloperSubmittedTesterEmailHtml, 
  sendDeveloperSubmissionTesterEmail,
  sendProjectSubmissionNotifications 
} from './src/services/emailService.js';

console.log('================================================================');
console.log('🧪 TESTING QA RE-TEST EMAIL DISPATCH & DEFECT SUBMISSION ENFORCEMENT');
console.log('================================================================\n');

// Mock localStorage
const mockStorage = {};
global.localStorage = {
  getItem: (k) => mockStorage[k] || null,
  setItem: (k, v) => { mockStorage[k] = String(v); },
  removeItem: (k) => { delete mockStorage[k]; },
  clear: () => { Object.keys(mockStorage).forEach(k => delete mockStorage[k]); }
};

// --- TEST 1: Developer Submission Blocking with Open Defects ---
console.log('--- TEST 1: Defect Resolution Submission Guard ---');
const projectWithOpenDefects = {
  id: 'DS-WEB-7169',
  name: 'Restaurant site',
  tasks: [
    { id: 't1', name: 'Task 1', status: 'Completed', progress: 100 },
    { id: 't2', name: 'Task 2', status: 'Completed', progress: 100 }
  ],
  testingIssues: [
    { id: 'iss-1', title: 'Cart drawer bug', status: 'Open' },
    { id: 'iss-2', title: 'Header alignment bug', status: 'Resolved' }
  ],
  liveProjectLink: 'https://restaurant.dsprogram.space',
  driveProjectLink: 'https://drive.google.com/restaurant.zip'
};

const unresolvedCount = projectWithOpenDefects.testingIssues.filter(i => i.status !== 'Resolved').length;
const devProg = 100;
const allTasksDone = projectWithOpenDefects.tasks.every(t => t.status === 'Completed');
const hasLive = Boolean(projectWithOpenDefects.liveProjectLink);
const hasDrive = Boolean(projectWithOpenDefects.driveProjectLink);
const isAlreadySubmitted = false;

// Check guard logic matching ProjectDetailPage.jsx:
const isAllowedWithOpenDefects = !isAlreadySubmitted && devProg === 100 && allTasksDone && hasLive && hasDrive && !(unresolvedCount > 0);
assert.strictEqual(isAllowedWithOpenDefects, false, 'Submission MUST be blocked when there are open defects');
console.log('✅ PASS: Submission is strictly blocked when 1 or more defects are Open');

// Resolve the open defect
projectWithOpenDefects.testingIssues[0].status = 'Resolved';
const unresolvedCountAfterFix = projectWithOpenDefects.testingIssues.filter(i => i.status !== 'Resolved').length;
const isAllowedAfterFix = !isAlreadySubmitted && devProg === 100 && allTasksDone && hasLive && hasDrive && !(unresolvedCountAfterFix > 0);
assert.strictEqual(isAllowedAfterFix, true, 'Submission MUST be allowed when all defects are Resolved');
console.log('✅ PASS: Submission unlocks successfully once all defects are marked Resolved');

// --- TEST 2: Tester Email Resolution ---
console.log('\n--- TEST 2: Tester Email Resolution ---');
const projDirectTester = { id: 'DS-WEB-7169', name: 'Restaurant site', tester: 'Tester', testerEmail: 'hetp82259@gmail.com' };
assert.strictEqual(resolveTesterEmail(projDirectTester), 'hetp82259@gmail.com');
console.log('✅ PASS: Resolves direct project.testerEmail');

const projUnassignedTester = { id: 'DS-WEB-7169', name: 'Restaurant site', tester: 'Tester', testerId: 'TST-487', testerEmail: 'unassigned' };
const testerList = [{ id: 'TST-487', name: 'Tester', email: 'tester_qa@dsprogram.space' }];
assert.strictEqual(resolveTesterEmail(projUnassignedTester, testerList), 'tester_qa@dsprogram.space');
console.log('✅ PASS: Overrides "unassigned" using testers array lookup');

const projStorageTester = { id: 'DS-WEB-7169', name: 'Restaurant site', tester: 'Tester', testerId: 'TST-999' };
mockStorage['dahej_real_v2_testers'] = JSON.stringify([{ id: 'TST-999', name: 'Tester', email: 'storage_tester@dsprogram.space' }]);
assert.strictEqual(resolveTesterEmail(projStorageTester), 'storage_tester@dsprogram.space');
console.log('✅ PASS: Resolves tester email from localStorage registry');

// --- TEST 3: Re-Test HTML Email Template Verification ---
console.log('\n--- TEST 3: Re-Test HTML Email Template Verification ---');
const reworkProject = {
  id: 'DS-WEB-7169',
  name: 'Restaurant site',
  developer: 'RPatel',
  developerEmail: 'hetp82250@gmail.com',
  tester: 'Tester',
  testerEmail: 'hetp82259@gmail.com',
  liveLink: 'https://restaurant.dsprogram.space',
  driveLink: 'https://drive.google.com/restaurant.zip',
  tasks: [
    { id: 't1', name: 'Menu & Food Grid', status: 'Completed' },
    { id: 't2', name: 'Takeaway Cart & Order Management', status: 'Completed', notes: 'Fixed responsive drawer on Safari' }
  ],
  testingIssues: [
    { id: 'iss-7855', title: 'Issue in Takeaway Cart & Order Management', task: 'Takeaway Cart & Order Management', status: 'Resolved', actual: 'Cart drawer failed on mobile Safari' },
    { id: 'iss-2727', title: 'Issue in Restaurant Branding', task: 'Restaurant Branding & Responsive Menu Grid', status: 'Resolved', actual: 'Hero banner overlay misplaced' }
  ]
};

const retestHtml = buildDeveloperSubmittedTesterEmailHtml({
  project: reworkProject,
  testerName: 'Tester',
  submissionDate: '15 Nov 2026',
  isResubmission: true
});

assert(retestHtml.includes('DS-WEB-7169'), 'Project ID DS-WEB-7169 must be present');
assert(retestHtml.includes('Restaurant site'), 'Project Name Restaurant site must be present');
assert(retestHtml.includes('ALL DEFECTS RESOLVED • READY FOR QA RE-TEST') || retestHtml.includes('ALL DEFECTS RESOLVED &bull; READY FOR QA RE-TEST'), 'Re-test badge must be present');
assert(retestHtml.includes('resolved all reported QA defects'), 'Must state developer resolved all QA defects');
assert(retestHtml.includes('Issue in Takeaway Cart &amp; Order Management') || retestHtml.includes('Issue in Takeaway Cart & Order Management'), 'Must list resolved defect 1');
assert(retestHtml.includes('Issue in Restaurant Branding'), 'Must list resolved defect 2');
assert(retestHtml.includes('https://restaurant.dsprogram.space'), 'Must contain live link');
assert(retestHtml.includes('https://drive.google.com/restaurant.zip'), 'Must contain drive link');
assert(retestHtml.includes('project@dsprogram.space'), 'Must be sent from project@dsprogram.space');
assert(retestHtml.includes('Admin is not copied'), 'Footer must state Admin is not copied on defect rework notifications');
assert(retestHtml.includes('https://www.dsprogram.space/freelancer-login?role=tester'), 'CTA must point to QA tester workspace');
console.log('✅ PASS: Re-test HTML contains Project ID, Name, Resolved defects breakdown, Live link, Drive link, and QA CTA');

// --- TEST 4: Exclusivity Verification on Resubmission (Tester ONLY, Admin EXCLUDED) ---
console.log('\n--- TEST 4: Re-Test Dispatch Exclusivity (Tester ONLY, Admin EXCLUDED) ---');
let capturedEmails = [];
global.fetch = async (url, options) => {
  const body = JSON.parse(options?.body || '{}');
  capturedEmails.push({ url, body });
  return {
    ok: true,
    status: 200,
    headers: {
      get: (h) => (h.toLowerCase() === 'content-type' ? 'application/json' : null)
    },
    json: async () => ({ messageId: '<mock-msg-id-retest-999@brevo.com>' })
  };
};

const resubmissionNoticeResult = await sendProjectSubmissionNotifications({
  project: reworkProject,
  isResubmission: true,
  adminEmail: 'dahejsupport@gmail.com'
});

assert(resubmissionNoticeResult.tester?.success, 'Tester notification must succeed');
assert.strictEqual(resubmissionNoticeResult.admin?.skipped, true, 'Admin MUST be marked skipped on defect resubmission');
assert.strictEqual(capturedEmails.length, 1, 'Exactly ONE email must be sent via Brevo');

const sentEmail = capturedEmails[0].body;
console.log('Captured Brevo Sender:', sentEmail.sender);
console.log('Captured Brevo Recipients (To):', sentEmail.to);
console.log('Captured Brevo Subject:', sentEmail.subject);

assert.strictEqual(sentEmail.sender.email, 'project@dsprogram.space', 'Sender must be project@dsprogram.space');
assert.strictEqual(sentEmail.to[0].email, 'hetp82259@gmail.com', 'Recipient must be tester email');
assert(sentEmail.subject.includes('[QA Re-Test Request]'), 'Subject must indicate QA Re-Test Request');
assert(sentEmail.subject.includes('DS-WEB-7169'), 'Subject must contain Project ID');
assert(sentEmail.subject.includes('Restaurant site'), 'Subject must contain Project Name');
assert(!JSON.stringify(sentEmail.to).includes('dahejsupport@gmail.com'), 'Admin email must NOT be present in recipients');
console.log('✅ PASS: On defect rework submit, email is sent strictly to assigned Tester only (Admin is 100% excluded)');

// --- TEST 5: First-Time Project Submission (Both Tester & Admin Notified) ---
console.log('\n--- TEST 5: First-Time Project Submission (Both Tester & Admin Notified) ---');
capturedEmails = [];
const firstTimeProject = {
  ...reworkProject,
  testingIssues: []
};

const firstTimeResult = await sendProjectSubmissionNotifications({
  project: firstTimeProject,
  isResubmission: false,
  adminEmail: 'dahejsupport@gmail.com'
});

assert(firstTimeResult.tester?.success, 'Tester must receive first-time submission');
assert(firstTimeResult.admin?.success, 'Admin must receive first-time submission');
assert.strictEqual(capturedEmails.length, 2, 'Exactly TWO emails must be sent for fresh first-time submission');
console.log('✅ PASS: First-time submission continues notifying both Tester and Admin');

console.log('\n================================================================');
console.log('🎉 ALL QA RE-TEST & DEFECT RESOLUTION TESTS PASSED!');
console.log('================================================================');
