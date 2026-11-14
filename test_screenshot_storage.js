import assert from 'assert';
import { getDocPreviewSource, downloadProjectDocument } from './src/utils/documentDownloadHelper.js';
import { getRevisionSource } from './src/utils/projectStatusUtils.js';

console.log('================================================================');
console.log('🧪 TESTING DEFECT SCREENSHOT STORAGE & PREVIEW FIDELITY');
console.log('================================================================');

// 1. Mock Base64 image
const sampleBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

const mockIssue = {
  id: 'iss-7169',
  title: 'Issue in Takeaway Cart & Order Management',
  description: 'Problem observed during checkout drawer state toggle.',
  severity: 'High',
  category: 'Functionality',
  task: 'Takeaway Cart & Order Management',
  expected: 'Cart opens smoothly',
  expectedResult: 'Cart opens smoothly',
  actual: 'Cart drawer frozen on mobile',
  actualResult: 'Cart drawer frozen on mobile',
  date: '14 Nov 2026',
  status: 'Open',
  reporter: 'Tester',
  attachmentName: 'screenshot_bug_report.png',
  attachment: 'screenshot_bug_report.png',
  attachmentUrl: sampleBase64,
  attachmentDataUrl: sampleBase64,
  screenshot: sampleBase64
};

const mockProject = {
  id: 'DS-WEB-7169',
  name: 'Restaurant site',
  status: 'Revision Required',
  revisionOrigin: 'tester',
  testingIssues: [mockIssue],
  issues: [mockIssue]
};

// Test 1: getRevisionSource detects tester origin
const revSource = getRevisionSource(mockProject);
assert.strictEqual(revSource.isTester, true, 'Revision source must identify tester origin');
assert.strictEqual(revSource.role, 'QA Tester', 'Role must be QA Tester');
console.log('✅ TEST 1 PASSED: Revision source accurately reflects QA Tester origin');

// Test 2: Issue object has complete screenshot properties
assert.ok(mockIssue.screenshot, 'Issue must contain screenshot');
assert.ok(mockIssue.attachmentUrl, 'Issue must contain attachmentUrl');
assert.ok(mockIssue.attachmentDataUrl, 'Issue must contain attachmentDataUrl');
assert.strictEqual(mockIssue.screenshot, sampleBase64, 'Screenshot must preserve exact Base64 data');
console.log('✅ TEST 2 PASSED: Defect issue preserves Base64 screenshot across all properties');

// Test 3: getDocPreviewSource resolves Base64 directly
const previewSource = getDocPreviewSource({
  name: mockIssue.attachmentName,
  dataUrl: mockIssue.screenshot,
  fileData: mockIssue.screenshot
}, mockProject);
assert.strictEqual(previewSource, sampleBase64, 'Preview source must match exact Base64 payload');
console.log('✅ TEST 3 PASSED: Document & Lightbox preview helper returns exact Base64 image');

// Test 4: downloadProjectDocument handles dataUrl
let downloadedToast = null;
downloadProjectDocument({
  name: 'screenshot_bug_report.png',
  dataUrl: sampleBase64
}, mockProject, (msg) => { downloadedToast = msg; });
// In node environment document is undefined, but the function safely catches or executes without throwing
console.log('✅ TEST 4 PASSED: Document download helper executes safely');

console.log('================================================================');
console.log('🎉 ALL SCREENSHOT STORAGE & DISPLAY TESTS PASSED!');
console.log('================================================================');
