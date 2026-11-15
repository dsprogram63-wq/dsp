/**
 * Test Suite: QA Tester Defect Notification Email Dispatch to Developer
 * Tests:
 * 1. resolveDeveloperEmail with project, developer list, and localStorage fallbacks
 * 2. buildTesterDefectEmailHtml with all defect fields, screenshot proof, expected/actual comparison
 * 3. sendTesterDefectReportEmail strictly to Developer from project@dsprogram.space (admin excluded)
 */

import assert from 'assert';
import { 
  resolveDeveloperEmail, 
  buildTesterDefectEmailHtml, 
  sendTesterDefectReportEmail 
} from './src/services/emailService.js';

console.log('================================================================');
console.log('🧪 TESTING QA TESTER DEFECT REPORT EMAIL DISPATCH SYSTEM');
console.log('================================================================\n');

// Mock localStorage
const mockStorage = {};
global.localStorage = {
  getItem: (k) => mockStorage[k] || null,
  setItem: (k, v) => { mockStorage[k] = String(v); },
  removeItem: (k) => { delete mockStorage[k]; },
  clear: () => { Object.keys(mockStorage).forEach(k => delete mockStorage[k]); }
};

// --- TEST 1: resolveDeveloperEmail ---
console.log('--- TEST 1: Developer Email Resolution ---');
const projDirect = { id: 'DS-WEB-7169', name: 'Restaurant site', developer: 'RPatel', developerEmail: 'hetp82250@gmail.com' };
assert.strictEqual(resolveDeveloperEmail(projDirect), 'hetp82250@gmail.com');
console.log('✅ PASS: Resolves direct project.developerEmail');

const projUnassigned = { id: 'DS-WEB-7169', name: 'Restaurant site', developer: 'RPatel', developerId: 'DEV-538', developerEmail: 'unassigned' };
const devList = [{ id: 'DEV-538', name: 'RPatel', email: 'rpatel@dsprogram.space' }];
assert.strictEqual(resolveDeveloperEmail(projUnassigned, devList), 'rpatel@dsprogram.space');
console.log('✅ PASS: Overrides "unassigned" using developers array lookup');

const projStorageOnly = { id: 'DS-WEB-7169', name: 'Restaurant site', developer: 'RPatel', developerId: 'DEV-999' };
mockStorage['dahej_real_v2_developers'] = JSON.stringify([{ id: 'DEV-999', name: 'RPatel', email: 'fallback_dev@dsprogram.space' }]);
assert.strictEqual(resolveDeveloperEmail(projStorageOnly), 'fallback_dev@dsprogram.space');
console.log('✅ PASS: Resolves developer email from localStorage registry');

// --- TEST 2: HTML Email Template Generation ---
console.log('\n--- TEST 2: Defect Email HTML Template Verification ---');
const sampleIssue = {
  id: 'iss-7855',
  title: 'Issue in Takeaway Cart & Order Management',
  task: 'Takeaway Cart & Order Management',
  severity: 'High',
  category: 'Functionality',
  description: 'When tapping Add to Cart on mobile Safari, the drawer does not open and items are not persisted.',
  expectedResult: 'Drawer opens smoothly within 200ms and shows updated subtotal.',
  actualResult: 'Cart drawer remains unresponsive with unhandled JS promise error in console.',
  reporter: 'QA Specialist Keval',
  date: '14 Nov 2026',
  attachmentName: 'screenshot_cart_bug.png',
  cloudUrl: 'https://vvyevrufmitebsnpqahb.supabase.co/storage/v1/object/public/bug-screenshots/bugs/1794626014363_cart_proof.jpg'
};

const html = buildTesterDefectEmailHtml({
  project: projDirect,
  issue: sampleIssue,
  developerName: 'RPatel',
  testerName: 'QA Specialist Keval'
});

assert(html.includes('DS-WEB-7169'), 'Project ID DS-WEB-7169 must be in HTML');
assert(html.includes('Restaurant site'), 'Project Name Restaurant site must be in HTML');
assert(html.includes('iss-7855'), 'Defect ID iss-7855 must be in HTML');
assert(html.includes('Issue in Takeaway Cart &amp; Order Management') || html.includes('Issue in Takeaway Cart & Order Management'), 'Issue title must be in HTML');
assert(html.includes('Takeaway Cart &amp; Order Management') || html.includes('Takeaway Cart & Order Management'), 'Task name must be in HTML');
assert(html.includes('HIGH SEVERITY'), 'High severity badge must be in HTML');
assert(html.includes('Functionality'), 'Category must be in HTML');
assert(html.includes('When tapping Add to Cart on mobile Safari'), 'Description must be in HTML');
assert(html.includes('Drawer opens smoothly within 200ms'), 'Expected result must be in HTML');
assert(html.includes('Cart drawer remains unresponsive'), 'Actual result must be in HTML');
assert(html.includes('QA Specialist Keval'), 'Reporter must be in HTML');
assert(html.includes('screenshot_cart_bug.png'), 'Attachment filename must be in HTML');
assert(html.includes('https://vvyevrufmitebsnpqahb.supabase.co/storage/v1/object/public/bug-screenshots/bugs/1794626014363_cart_proof.jpg'), 'Screenshot proof URL must be in HTML');
assert(html.includes('project@dsprogram.space'), 'Sender project@dsprogram.space must be in footer');
assert(html.includes('Admin is not copied'), 'Footer must explicitly state Admin is not copied');
assert(html.includes('https://www.dsprogram.space/freelancer-login'), 'CTA link to freelancer workspace must be present');
console.log('✅ PASS: HTML template contains all project details, defect specifics, expected/actual comparison, screenshot proof, and freelancer CTA');

// --- TEST 3: Email Dispatch Exclusivity (Developer Only, Admin Excluded) ---
console.log('\n--- TEST 3: Defect Email Dispatch Exclusivity ---');
// Mock fetch to verify exact payload sent
let lastBrevoPayload = null;
global.fetch = async (url, options) => {
  const body = JSON.parse(options?.body || '{}');
  lastBrevoPayload = { url, body, headers: options?.headers };
  return {
    ok: true,
    status: 200,
    json: async () => ({ messageId: '<mock-msg-id-12345@brevo.com>' })
  };
};

const dispatchResult = await sendTesterDefectReportEmail({
  project: projDirect,
  issue: sampleIssue,
  testerName: 'QA Specialist Keval'
});

assert(dispatchResult.success, 'Dispatch must succeed');
assert.strictEqual(dispatchResult.recipient, 'hetp82250@gmail.com');
assert(lastBrevoPayload, 'Brevo payload must be captured');

const brevoBody = lastBrevoPayload.body;
console.log('Captured Brevo Sender:', brevoBody.sender);
console.log('Captured Brevo Recipients (To):', brevoBody.to);
console.log('Captured Brevo Subject:', brevoBody.subject);

// Verify sender is project@dsprogram.space
assert.strictEqual(brevoBody.sender.email, 'project@dsprogram.space', 'Sender must be project@dsprogram.space');

// Verify recipient is strictly the developer
assert.strictEqual(brevoBody.to.length, 1, 'There must be exactly ONE recipient');
assert.strictEqual(brevoBody.to[0].email, 'hetp82250@gmail.com', 'Recipient must be developer email');

// Verify Admin is completely absent
assert(!brevoBody.cc || brevoBody.cc.length === 0, 'No CC recipients allowed');
assert(!brevoBody.bcc || brevoBody.bcc.length === 0, 'No BCC recipients allowed');
const adminEmail = 'dahejsupport@gmail.com';
assert(!JSON.stringify(brevoBody.to).includes(adminEmail), 'Admin email must NOT be in To list');
assert(!brevoBody.subject.includes('Admin'), 'Subject must not be addressed to Admin');
assert(brevoBody.subject.includes('DS-WEB-7169'), 'Subject must contain project ID');
assert(brevoBody.subject.includes('Restaurant site'), 'Subject must contain project name');
assert(brevoBody.subject.includes('High Priority'), 'Subject must contain defect severity');
console.log('✅ PASS: Email sent strictly from project@dsprogram.space to developer only (Admin is completely excluded)');

console.log('\n================================================================');
console.log('🎉 ALL TESTER DEFECT EMAIL TESTS PASSED SUCCESSFULLY!');
console.log('================================================================');
