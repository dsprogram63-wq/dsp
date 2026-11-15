/**
 * Test Suite: Admin Payment Released Notification Emails
 * 
 * Verifies User Requirements:
 * "jab admin payment release kare , to jiska payment release hua hain usko mail karna hain ,
 * like agar developer ka payment release kiya hain to usko developer ko mail jana chahiye
 * that aapka payment release kiya hain , vo aapko 24 hours me mil jayega ,
 * and same agar tester ki payment release kare to usko bhi mail jana chahiye,
 * that 24 hours me aapko payment mil jayegi"
 */

import assert from 'assert';
import {
  resolveDeveloperEmail,
  resolveTesterEmail,
  buildDeveloperPaymentReleasedEmailHtml,
  buildTesterPaymentReleasedEmailHtml,
  sendDeveloperPaymentReleasedEmail,
  sendTesterPaymentReleasedEmail,
  sendPaymentReleaseNotifications
} from './src/services/emailService.js';

console.log('================================================================');
console.log('🧪 TESTING ADMIN PAYMENT RELEASED NOTIFICATION EMAIL SUITE');
console.log('================================================================\n');

// Mock localStorage
const mockStorage = {};
global.localStorage = {
  getItem: (k) => mockStorage[k] || null,
  setItem: (k, v) => { mockStorage[k] = String(v); },
  removeItem: (k) => { delete mockStorage[k]; },
  clear: () => { Object.keys(mockStorage).forEach(k => delete mockStorage[k]); }
};

const sampleProject = {
  id: 'DS-WEB-7169',
  name: 'Restaurant site',
  developer: 'RPatel',
  developerEmail: 'hetp82250@gmail.com',
  developerPayment: '₹30,000',
  developerPaymentNum: 30000,
  tester: 'Tester',
  testerEmail: 'hetp82259@gmail.com',
  testerPayment: '₹6,000',
  testerPaymentNum: 6000,
  liveLink: 'https://restaurant.dsprogram.space',
  driveLink: 'https://drive.google.com/restaurant.zip',
  status: 'Approved'
};

const otherDevelopers = [
  { id: 'DEV-101', name: 'Other Dev 1', email: 'other1@dsprogram.space' },
  { id: 'DEV-102', name: 'Other Dev 2', email: 'other2@dsprogram.space' },
  { id: 'DEV-103', name: 'RPatel', email: 'hetp82250@gmail.com' }
];

const otherTesters = [
  { id: 'TST-201', name: 'Other Tester 1', email: 'othertester1@dsprogram.space' },
  { id: 'TST-202', name: 'Tester', email: 'hetp82259@gmail.com' }
];

// --- TEST 1: Developer Payment HTML Template Verification ---
console.log('--- TEST 1: Developer Payment HTML Template Verification ---');
const devHtml = buildDeveloperPaymentReleasedEmailHtml({
  project: sampleProject,
  developerName: 'RPatel',
  amount: 30000,
  transactionId: 'TXN-DEV-71694821',
  paymentMode: 'UPI Transfer',
  paymentDate: '15 Nov 2026'
});

assert.ok(devHtml.includes('DS-WEB-7169'), 'Developer HTML must include Project ID');
assert.ok(devHtml.includes('Restaurant site'), 'Developer HTML must include Project Name');
assert.ok(devHtml.includes('RPatel'), 'Developer HTML must mention Developer name');
assert.ok(devHtml.includes('₹30,000'), 'Developer HTML must display released amount');
assert.ok(devHtml.includes('24 hours') || devHtml.includes('24 Hours'), 'Developer HTML must clearly state 24 hours crediting timeframe');
assert.ok(devHtml.includes('TXN-DEV-71694821'), 'Developer HTML must include transaction / UTR reference');
assert.ok(devHtml.includes('UPI Transfer'), 'Developer HTML must include payment mode');
assert.ok(devHtml.includes('project@dsprogram.space'), 'Developer HTML must reference project operations mailer');
assert.ok(devHtml.includes('freelancer/earnings'), 'Developer HTML must link to freelancer earnings');
console.log('✅ PASS: Developer payment release HTML contains all required 24-hour guarantee & financial metadata');

// --- TEST 2: QA Tester Payment HTML Template Verification ---
console.log('\n--- TEST 2: QA Tester Payment HTML Template Verification ---');
const testerHtml = buildTesterPaymentReleasedEmailHtml({
  project: sampleProject,
  testerName: 'Tester',
  amount: 6000,
  transactionId: 'TXN-TST-71693892',
  paymentMode: 'UPI Transfer',
  paymentDate: '15 Nov 2026'
});

assert.ok(testerHtml.includes('DS-WEB-7169'), 'Tester HTML must include Project ID');
assert.ok(testerHtml.includes('Restaurant site'), 'Tester HTML must include Project Name');
assert.ok(testerHtml.includes('Tester'), 'Tester HTML must mention QA Tester name');
assert.ok(testerHtml.includes('₹6,000'), 'Tester HTML must display released amount');
assert.ok(testerHtml.includes('24 hours') || testerHtml.includes('24 Hours'), 'Tester HTML must clearly state 24 hours crediting timeframe');
assert.ok(testerHtml.includes('TXN-TST-71693892'), 'Tester HTML must include transaction / UTR reference');
assert.ok(testerHtml.includes('UPI Transfer'), 'Tester HTML must include payment mode');
assert.ok(testerHtml.includes('project@dsprogram.space'), 'Tester HTML must reference project operations mailer');
assert.ok(testerHtml.includes('tester/earnings'), 'Tester HTML must link to tester earnings');
console.log('✅ PASS: Tester payment release HTML contains all required 24-hour guarantee & financial metadata');

// --- TEST 3: Mock Dispatch & Strict Exclusivity ---
console.log('\n--- TEST 3: Dispatch & Strict Recipient Exclusivity Verification ---');

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
  // Case A: Admin releases ONLY Developer's payment
  sentEmails.length = 0;
  const devOnlyRes = await sendDeveloperPaymentReleasedEmail({
    project: sampleProject,
    amount: 30000,
    transactionId: 'TXN-DEV-71694821',
    paymentMode: 'UPI Transfer',
    paymentDate: '15 Nov 2026',
    developers: otherDevelopers
  });

  assert.strictEqual(devOnlyRes.success, true, 'Developer email dispatch must succeed');
  assert.strictEqual(devOnlyRes.recipient, 'hetp82250@gmail.com');
  assert.strictEqual(sentEmails.length, 1, 'Exactly 1 email sent');

  const devCall = sentEmails[0].payload;
  assert.strictEqual(devCall.sender.email, 'project@dsprogram.space');
  assert.strictEqual(devCall.to.length, 1);
  assert.strictEqual(devCall.to[0].email, 'hetp82250@gmail.com');
  assert.ok(devCall.subject.includes('24 Hours') || devCall.subject.includes('24 hours'), 'Subject line must state 24 hours crediting');
  console.log('✅ PASS: Developer payment release email sent strictly to assigned developer (hetp82250@gmail.com)');

  // Case B: Admin releases ONLY QA Tester's payment
  sentEmails.length = 0;
  const testerOnlyRes = await sendTesterPaymentReleasedEmail({
    project: sampleProject,
    amount: 6000,
    transactionId: 'TXN-TST-71693892',
    paymentMode: 'UPI Transfer',
    paymentDate: '15 Nov 2026',
    testers: otherTesters
  });

  assert.strictEqual(testerOnlyRes.success, true, 'Tester email dispatch must succeed');
  assert.strictEqual(testerOnlyRes.recipient, 'hetp82259@gmail.com');
  assert.strictEqual(sentEmails.length, 1, 'Exactly 1 email sent');

  const testerCall = sentEmails[0].payload;
  assert.strictEqual(testerCall.sender.email, 'project@dsprogram.space');
  assert.strictEqual(testerCall.to.length, 1);
  assert.strictEqual(testerCall.to[0].email, 'hetp82259@gmail.com');
  assert.ok(testerCall.subject.includes('24 Hours') || testerCall.subject.includes('24 hours'), 'Subject line must state 24 hours crediting');
  console.log('✅ PASS: QA Tester payment release email sent strictly to assigned tester (hetp82259@gmail.com)');

  // Case C: Combined sendPaymentReleaseNotifications when both are disbursed
  sentEmails.length = 0;
  const combinedRes = await sendPaymentReleaseNotifications({
    project: sampleProject,
    devReleased: true,
    devAmount: 30000,
    devTxnId: 'TXN-DEV-71694821',
    devPaymentMode: 'UPI Transfer',
    devPaymentDate: '15 Nov 2026',
    testerReleased: true,
    testerAmount: 6000,
    testerTxnId: 'TXN-TST-71693892',
    testerPaymentMode: 'UPI Transfer',
    testerPaymentDate: '15 Nov 2026',
    developers: otherDevelopers,
    testers: otherTesters
  });

  assert.strictEqual(combinedRes.developer.success, true);
  assert.strictEqual(combinedRes.tester.success, true);
  assert.strictEqual(sentEmails.length, 2, 'Exactly 2 emails sent');

  const recipients = sentEmails.map(call => call.payload.to[0].email).sort();
  assert.deepStrictEqual(recipients, ['hetp82250@gmail.com', 'hetp82259@gmail.com']);

  // Ensure NO other developers in registry received the developer's money notice
  const unrelatedDevs = otherDevelopers.filter(d => d.email !== 'hetp82250@gmail.com').map(d => d.email);
  unrelatedDevs.forEach(e => {
    assert.ok(!recipients.includes(e), `Unrelated developer ${e} must NEVER receive payment email`);
  });

  // Ensure NO other testers in registry received the tester's money notice
  const unrelatedTesters = otherTesters.filter(t => t.email !== 'hetp82259@gmail.com').map(t => t.email);
  unrelatedTesters.forEach(e => {
    assert.ok(!recipients.includes(e), `Unrelated tester ${e} must NEVER receive payment email`);
  });

  console.log('✅ PASS: Dual release notifies assigned Developer & assigned QA Specialist exclusively with zero leaks.');

  console.log('\n🎉 ALL ADMIN PAYMENT RELEASED EMAIL TESTS PASSED SUCCESSFULLY (5/5)');
}

runDispatchTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
