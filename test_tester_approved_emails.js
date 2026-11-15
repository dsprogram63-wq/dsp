/**
 * Test Suite: Tester Approval & Finalization Notification Emails
 * 
 * Verifies User Requirements:
 * "Jab tester project approve kr de or we can say submit kar de , matlab saari issues solve ho jaaye
 * and submit kar to developer ko mail jana chahiye that project is done and successfully checked by tester,
 * and admin ko mail jana chahiye that ye wala project developer and tester dono ne complete kar diya hain
 * and ye perticular project developer and admin ko hi jana chahiye baki developer ko nahi jana chahiye"
 */

import assert from 'assert';
import {
  resolveDeveloperEmail,
  buildTesterApprovedDeveloperEmailHtml,
  buildTesterApprovedAdminEmailHtml,
  sendTesterApprovedDeveloperEmail,
  sendTesterApprovedAdminEmail,
  sendTesterApprovalNotifications
} from './src/services/emailService.js';

console.log('================================================================');
console.log('🧪 TESTING QA APPROVAL & FINALIZATION EMAIL DISPATCH SUITE');
console.log('================================================================\n');

// Mock localStorage
const mockStorage = {};
global.localStorage = {
  getItem: (k) => mockStorage[k] || null,
  setItem: (k, v) => { mockStorage[k] = String(v); },
  removeItem: (k) => { delete mockStorage[k]; },
  clear: () => { Object.keys(mockStorage).forEach(k => delete mockStorage[k]); }
};

// Mock project
const sampleProject = {
  id: 'DS-WEB-7169',
  name: 'Restaurant site',
  developer: 'RPatel',
  developerEmail: 'hetp82250@gmail.com',
  developerPayment: '₹30,000',
  tester: 'Tester',
  testerEmail: 'hetp82259@gmail.com',
  testerPayment: '₹6,000',
  liveLink: 'https://restaurant.dsprogram.space',
  driveLink: 'https://drive.google.com/restaurant.zip',
  tasks: [
    { id: 't1', name: 'Restaurant Branding & Responsive Menu Grid', status: 'Completed', progress: 100 },
    { id: 't2', name: 'Table Booking & Reservation Flow', status: 'Completed', progress: 100 },
    { id: 't3', name: 'Takeaway Cart & Order Management', status: 'Completed', progress: 100 }
  ],
  testingIssues: [
    { id: 'iss-1', title: 'Cart drawer bug', status: 'Resolved' }
  ],
  status: 'Finalized',
  testingStatus: 'Tester Approved',
  testingProgress: 100,
  qaFinalized: true,
  testerFinalized: true
};

const otherDevelopers = [
  { id: 'DEV-101', name: 'Other Dev 1', email: 'other1@dsprogram.space' },
  { id: 'DEV-102', name: 'Other Dev 2', email: 'other2@dsprogram.space' },
  { id: 'DEV-103', name: 'RPatel', email: 'hetp82250@gmail.com' }
];

// --- TEST 1: Developer Resolution Exclusivity ---
console.log('--- TEST 1: Developer Resolution & Exclusivity ---');
const resolvedDev = resolveDeveloperEmail(sampleProject, otherDevelopers);
assert.strictEqual(resolvedDev, 'hetp82250@gmail.com', 'Must resolve strictly to RPatel hetp82250@gmail.com');
console.log('✅ PASS: Resolved strictly to target project developer (hetp82250@gmail.com)');

// --- TEST 2: Developer Approval Email Template ---
console.log('\n--- TEST 2: Developer Approval Email Template Verification ---');
const devHtml = buildTesterApprovedDeveloperEmailHtml({
  project: sampleProject,
  developerName: 'RPatel',
  testerName: 'Tester'
});

assert.ok(devHtml.includes('DS-WEB-7169'), 'Developer HTML must include Project ID');
assert.ok(devHtml.includes('Restaurant site'), 'Developer HTML must include Project Name');
assert.ok(devHtml.includes('Tester'), 'Developer HTML must mention QA Tester name');
assert.ok(devHtml.toUpperCase().includes('100% QA VERIFIED'), 'Developer HTML must state 100% QA Verified');
assert.ok(devHtml.includes('₹30,000'), 'Developer HTML must display developer payout');
assert.ok(devHtml.includes('project@dsprogram.space'), 'Developer HTML must reference project operations mailer');
console.log('✅ PASS: Developer approval HTML template contains all required verified completion metadata');

// --- TEST 3: Admin Approval Email Template ---
console.log('\n--- TEST 3: Admin Approval Email Template Verification ---');
const adminHtml = buildTesterApprovedAdminEmailHtml({
  project: sampleProject,
  adminName: 'Master Admin',
  developerName: 'RPatel',
  testerName: 'Tester'
});

assert.ok(adminHtml.includes('DS-WEB-7169'), 'Admin HTML must include Project ID');
assert.ok(adminHtml.includes('Restaurant site'), 'Admin HTML must include Project Name');
assert.ok(adminHtml.includes('RPatel'), 'Admin HTML must mention Developer name');
assert.ok(adminHtml.includes('Tester'), 'Admin HTML must mention QA Specialist name');
assert.ok(adminHtml.includes('Both assigned Developer'), 'Admin HTML must highlight both completed');
assert.ok(adminHtml.includes('₹30,000'), 'Admin HTML must display developer payout');
assert.ok(adminHtml.includes('₹6,000'), 'Admin HTML must display tester payout');
assert.ok(adminHtml.includes('https://restaurant.dsprogram.space'), 'Admin HTML must contain Live URL');
assert.ok(adminHtml.includes('https://drive.google.com/restaurant.zip'), 'Admin HTML must contain Drive URL');
console.log('✅ PASS: Admin approval HTML template contains dual-completion verification and payout data');

// --- TEST 4 & 5: Mocked Send Functions & Recipient Guarantees ---
console.log('\n--- TEST 4: Dispatch Verification & Exclusivity (No other developers get mail) ---');

const sentEmails = [];
global.fetch = async (url, options) => {
  const payload = JSON.parse(options.body);
  sentEmails.push({ url, payload });
  return {
    ok: true,
    status: 200,
    headers: {
      get: (h) => (h && h.toLowerCase() === 'content-type' ? 'application/json' : null)
    },
    json: async () => ({ messageId: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}` }),
    text: async () => JSON.stringify({ messageId: 'msg_ok' })
  };
};

async function runDispatchTests() {
  // Test sendTesterApprovedDeveloperEmail
  sentEmails.length = 0;
  const devSendRes = await sendTesterApprovedDeveloperEmail({
    project: sampleProject,
    testerName: 'Tester',
    developers: otherDevelopers
  });

  assert.strictEqual(devSendRes.success, true, 'Developer email dispatch should succeed');
  assert.strictEqual(devSendRes.recipient, 'hetp82250@gmail.com', 'Recipient must be assigned developer');
  assert.strictEqual(sentEmails.length, 1, 'Exactly ONE email should be sent for developer notice');

  const devEmailCall = sentEmails[0].payload;
  assert.strictEqual(devEmailCall.sender.email, 'project@dsprogram.space', 'Sender must be project@dsprogram.space');
  assert.strictEqual(devEmailCall.sender.name, 'Dahej Support');
  assert.strictEqual(devEmailCall.to.length, 1, 'Must have exactly 1 recipient');
  assert.strictEqual(devEmailCall.to[0].email, 'hetp82250@gmail.com', 'Recipient must strictly be hetp82250@gmail.com');
  // Check no other developers are in to, cc, or bcc
  assert.ok(!devEmailCall.cc || devEmailCall.cc.length === 0, 'No CC recipients allowed');
  assert.ok(!devEmailCall.bcc || devEmailCall.bcc.length === 0, 'No BCC recipients allowed');
  console.log('✅ PASS: Developer email sent strictly to hetp82250@gmail.com from project@dsprogram.space');

  // Test sendTesterApprovedAdminEmail
  sentEmails.length = 0;
  const adminSendRes = await sendTesterApprovedAdminEmail({
    project: sampleProject,
    adminEmail: 'dahejsupport@gmail.com',
    testerName: 'Tester',
    developers: otherDevelopers
  });

  assert.strictEqual(adminSendRes.success, true, 'Admin email dispatch should succeed');
  assert.strictEqual(adminSendRes.recipient, 'dahejsupport@gmail.com', 'Recipient must be Master Admin');
  assert.strictEqual(sentEmails.length, 1, 'Exactly ONE email should be sent for admin notice');

  const adminEmailCall = sentEmails[0].payload;
  assert.strictEqual(adminEmailCall.sender.email, 'project@dsprogram.space', 'Sender must be project@dsprogram.space');
  assert.strictEqual(adminEmailCall.to.length, 1, 'Must have exactly 1 recipient');
  assert.strictEqual(adminEmailCall.to[0].email, 'dahejsupport@gmail.com', 'Recipient must strictly be dahejsupport@gmail.com');
  console.log('✅ PASS: Admin email sent strictly to dahejsupport@gmail.com from project@dsprogram.space');

  // Test combined sendTesterApprovalNotifications
  sentEmails.length = 0;
  const combinedRes = await sendTesterApprovalNotifications({
    project: sampleProject,
    testerName: 'Tester',
    developers: otherDevelopers,
    adminEmail: 'dahejsupport@gmail.com'
  });

  assert.strictEqual(combinedRes.developer.success, true, 'Combined developer dispatch must succeed');
  assert.strictEqual(combinedRes.admin.success, true, 'Combined admin dispatch must succeed');
  assert.strictEqual(sentEmails.length, 2, 'Total of 2 emails sent: 1 to developer, 1 to admin');

  const recipients = sentEmails.map(call => call.payload.to[0].email).sort();
  assert.deepStrictEqual(recipients, ['dahejsupport@gmail.com', 'hetp82250@gmail.com'], 'Recipients must be strictly the assigned developer and master admin');

  // Verify other developers did not receive anything
  const otherEmails = otherDevelopers.filter(d => d.email !== 'hetp82250@gmail.com').map(d => d.email);
  otherEmails.forEach(email => {
    assert.ok(!recipients.includes(email), `Other developer ${email} must NEVER receive the approval email`);
  });
  console.log('✅ PASS: Dual-dispatch guarantees exclusivity — assigned developer and master admin only, zero other developers notified.');

  console.log('\n🎉 ALL TESTER APPROVAL EMAIL TESTS PASSED SUCCESSFULLY (5/5)');
}

runDispatchTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
