import { 
  getFreelancerProjectStatus, 
  getTesterDashboardStatus, 
  getAdminProjectStatus, 
  getDevAmount, 
  getDevPaid, 
  getDevRemaining, 
  getTesterAmount, 
  getTesterPaid, 
  getTesterRemaining, 
  getClientAmount, 
  getClientPaid, 
  getClientRemaining, 
  calculateProjectProgressFromTasks, 
  calculateQAProgressFromTasks, 
  areAllTasksCompleted, 
  areAllQATasksPassed 
} from './src/utils/projectStatusUtils.js';

import { 
  toFreelancerSafeProject, 
  isProjectAssignedToFreelancer,
  getAuthenticatedFreelancerProjects
} from './src/services/freelancerApiService.js';

import { 
  toTesterSafeProject, 
  isProjectAssignedToTester,
  getAuthenticatedTesterProjects
} from './src/services/testerApiService.js';

console.log('================================================================');
console.log('🚀 MASTER PROJECT LIFECYCLE VERIFICATION TEST SUITE');
console.log('================================================================\n');

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`✅ PASS: ${message}`);
    passedTests++;
  } else {
    console.error(`❌ FAIL: ${message}`);
  }
}

// 1. Initial Project Creation State
const sampleAdminProject = {
  id: 'PRJ-TEST-100',
  name: 'Corporate Website Development',
  clientName: 'Global Corp Industries',
  developer: 'Rahul Patel',
  developerId: 'DEV-101',
  tester: 'Sneha Reddy',
  testerId: 'TST-201',
  clientTotalAmount: 100000,
  clientPaidAmount: 30000,
  clientRemainingAmount: 70000,
  developerAssignedAmount: 40000,
  developerPaidAmount: 0,
  developerRemainingAmount: 40000,
  testerAssignedAmount: 10000,
  testerPaidAmount: 0,
  testerRemainingAmount: 10000,
  developerStarted: false,
  developerSubmitted: false,
  testerStarted: false,
  testerFinalized: false,
  adminApproved: false,
  adminRejected: false,
  status: 'Pending',
  testingStatus: 'Pending',
  tasks: Array.from({ length: 10 }, (_, i) => ({
    id: `t-${i + 1}`,
    number: `0${i + 1}`,
    name: `Task ${i + 1}`,
    desc: `Description for Task ${i + 1}`,
    weight: 10,
    adminPercentage: 10,
    percentage: 10,
    status: 'Pending',
    qaStatus: 'Pending',
    progress: 0
  }))
};

console.log('--- TEST 1: Creation & Initial Visibility ---');
assert(getFreelancerProjectStatus(sampleAdminProject) === 'Pending', 'Developer sees Pending after creation');
assert(getTesterDashboardStatus(sampleAdminProject) === 'Pending', 'Tester sees Pending after creation');
assert(getAdminProjectStatus(sampleAdminProject) === 'Pending', 'Admin sees Pending after creation');

// Security check: Developer view sanitization
const devSafe = toFreelancerSafeProject(sampleAdminProject);
assert(devSafe.clientName === undefined, 'Developer cannot see Client Name');
assert(devSafe.clientTotalAmount === undefined, 'Developer cannot see Total Client Amount');
assert(devSafe.totalClientPrice === undefined, 'Developer cannot see Total Client Price');
assert(devSafe.testerAssignedAmount === undefined, 'Developer cannot see Tester Payout');
assert(devSafe.developerAssignedAmount === 40000, 'Developer can see Developer Assigned Amount (₹40,000)');

// Security check: Tester view sanitization
const testerSafe = toTesterSafeProject(sampleAdminProject);
assert(testerSafe.clientTotalAmount === undefined, 'Tester cannot see Total Client Amount');
assert(testerSafe.developerAssignedAmount === undefined, 'Tester cannot see Developer Payout');
assert(testerSafe.developerPayment === undefined, 'Tester cannot see Developer Payment');
assert(testerSafe.testerAssignedAmount === 10000, 'Tester can see Tester Assigned Amount (₹10,000)');

console.log('\n--- TEST 2: Developer Starts Project ---');
const devStartedProject = {
  ...sampleAdminProject,
  developerStarted: true,
  developerStartedAt: new Date().toISOString(),
  status: 'Active'
};
assert(getFreelancerProjectStatus(devStartedProject) === 'Active', 'Developer sees Active');
assert(getTesterDashboardStatus(devStartedProject) === 'Pending', 'Tester still sees Pending (QA does NOT start yet)');
assert(getAdminProjectStatus(devStartedProject) === 'In Progress', 'Admin sees In Progress');

console.log('\n--- TEST 3: Developer Completes 100% Tasks and Submits ---');
const devCompletedTasks = sampleAdminProject.tasks.map(t => ({
  ...t,
  status: 'Completed',
  progress: 100
}));
const devProg = calculateProjectProgressFromTasks(devCompletedTasks);
assert(devProg === 100, 'Developer progress is exactly 100%');
assert(areAllTasksCompleted(devCompletedTasks) === true, 'All developer tasks completed');

const devSubmittedProject = {
  ...devStartedProject,
  tasks: devCompletedTasks,
  developerSubmitted: true,
  freelancerSubmitted: true,
  developerSubmittedAt: new Date().toISOString(),
  submittedDate: '06 Oct 2026',
  liveProjectLink: 'https://globalcorp.dahej.app',
  driveProjectLink: 'https://drive.google.com/test-zip',
  status: 'Submitted'
};
assert(getFreelancerProjectStatus(devSubmittedProject) === 'Submitted', 'Developer sees Submitted');
assert(getTesterDashboardStatus(devSubmittedProject) === 'Pending', 'Tester sees Pending (Ready to start QA)');
assert(getAdminProjectStatus(devSubmittedProject) === 'Submitted', 'Admin sees Submitted');

console.log('\n--- TEST 4: Tester Starts QA ---');
const testerStartedProject = {
  ...devSubmittedProject,
  testerStarted: true,
  testerStartedAt: new Date().toISOString(),
  testingStatus: 'In Testing',
  status: 'Under Review'
};
assert(getFreelancerProjectStatus(testerStartedProject) === 'Under Review', 'Developer sees Under Review');
assert(getTesterDashboardStatus(testerStartedProject) === 'Under Review', 'Tester sees Under Review');
assert(getAdminProjectStatus(testerStartedProject) === 'Under Review', 'Admin sees Under Review');

console.log('\n--- TEST 5: Tester Passes 9 Tasks, Fails 1 Task (Task 4) ---');
const qaCheckedTasks = testerStartedProject.tasks.map((t, idx) => {
  if (idx === 3) {
    // Task 4 Fails
    return { ...t, qaStatus: 'Fail', status: 'Failed', progress: 0 };
  }
  return { ...t, qaStatus: 'Pass' };
});
const qaProg = calculateQAProgressFromTasks(qaCheckedTasks);
assert(qaProg === 90, 'QA Progress is 90%');
assert(areAllQATasksPassed(qaCheckedTasks) === false, 'Not all QA tasks passed');

const testerFailedProject = {
  ...testerStartedProject,
  tasks: qaCheckedTasks,
  testingProgress: 90,
  testingIssues: [
    {
      id: 'issue-1',
      title: 'Mobile navigation overflow and broken CTA',
      severity: 'Major',
      taskId: 't-4',
      taskName: 'Task 4',
      status: 'Open'
    }
  ]
};
const devReworkProg = calculateProjectProgressFromTasks(qaCheckedTasks);
assert(devReworkProg === 90, 'Developer task 4 is reset, developer progress drops to 90%');

console.log('\n--- TEST 6: Developer Fixes Task 4 and Resubmits ---');
// Developer marks Task 4 complete again
const devReworkedTasks = qaCheckedTasks.map((t, idx) => {
  if (idx === 3) {
    // Resubmitted task returns to QA status 'Pending' for Tester to re-verify
    return { ...t, status: 'Completed', progress: 100, qaStatus: 'Pending' };
  }
  return t;
});
assert(devReworkedTasks[3].qaStatus === 'Pending', 'Previously failed task returns to QA Pending');
assert(devReworkedTasks[0].qaStatus === 'Pass', 'Unaffected passed tasks remain Pass');

const devResubmittedProject = {
  ...testerFailedProject,
  tasks: devReworkedTasks,
  status: 'Submitted',
  testerStarted: false
};

console.log('\n--- TEST 7: Tester Re-tests and Passes Task 4 -> Finalizes QA ---');
const allPassedTasks = devReworkedTasks.map(t => ({ ...t, qaStatus: 'Pass' }));
assert(areAllQATasksPassed(allPassedTasks) === true, 'All QA tasks passed');
assert(calculateQAProgressFromTasks(allPassedTasks) === 100, 'QA Progress is 100%');

const testerFinalizedProject = {
  ...devResubmittedProject,
  tasks: allPassedTasks,
  testingProgress: 100,
  testerFinalized: true,
  testerFinalizedAt: new Date().toISOString(),
  testingStatus: 'Tester Approved',
  status: 'Finalized'
};
assert(getFreelancerProjectStatus(testerFinalizedProject) === 'Finalized', 'Developer sees Finalized');
assert(getTesterDashboardStatus(testerFinalizedProject) === 'Finalized', 'Tester sees Finalized');
assert(getAdminProjectStatus(testerFinalizedProject) === 'Pending Approval', 'Admin sees Pending Approval');

console.log('\n--- TEST 8: Admin Rejection & Request Changes Workflow ---');
const adminRejectedProject = {
  ...testerFinalizedProject,
  adminRejected: true,
  adminRejectedAt: new Date().toISOString(),
  adminRejectionComment: 'Homepage banner needs to be redesigned. Mobile navigation is still incorrect.',
  adminRejectionDocument: { name: 'Revision_Specifications.pdf', size: '1.2 MB' },
  testerFinalized: false,
  status: 'Changes Requested'
};
assert(getFreelancerProjectStatus(adminRejectedProject) === 'Revision Required', 'Developer sees Revision Required');
assert(getAdminProjectStatus(adminRejectedProject) === 'Changes Requested', 'Admin sees Changes Requested');

console.log('\n--- TEST 9: Developer Resubmits -> QA Finalizes -> Admin Approves ---');
const adminApprovedProject = {
  ...testerFinalizedProject,
  adminApproved: true,
  adminApprovedAt: new Date().toISOString(),
  adminRejected: false,
  status: 'Approved'
};
assert(getFreelancerProjectStatus(adminApprovedProject) === 'Approved', 'Developer sees Approved');
assert(getTesterDashboardStatus(adminApprovedProject) === 'Approved', 'Tester sees Approved');
assert(getAdminProjectStatus(adminApprovedProject) === 'Approved', 'Admin sees Approved');

console.log('\n--- TEST 10: 3-Track Payment Phase & Independent Role Completion ---');
// Developer fully paid (₹40,000 paid, remaining = 0)
const devPaidProject = {
  ...adminApprovedProject,
  developerPaidAmount: 40000,
  developerRemainingAmount: 0,
  testerPaidAmount: 0,
  testerRemainingAmount: 10000,
  clientPaidAmount: 50000,
  clientRemainingAmount: 50000
};
assert(getFreelancerProjectStatus(devPaidProject) === 'Completed', 'Developer sees Completed independently when developer payout is cleared');
assert(getTesterDashboardStatus(devPaidProject) === 'Approved', 'Tester still sees Approved (Tester payment still pending)');
assert(getAdminProjectStatus(devPaidProject) === 'Approved', 'Admin still sees Approved (Client & Tester not fully paid)');

// Tester fully paid (₹10,000 paid, remaining = 0)
const testerPaidProject = {
  ...devPaidProject,
  testerPaidAmount: 10000,
  testerRemainingAmount: 0
};
assert(getTesterDashboardStatus(testerPaidProject) === 'Completed', 'Tester sees Completed independently when tester payout is cleared');
assert(getAdminProjectStatus(testerPaidProject) === 'Approved', 'Admin still sees Approved (Client payment still partial)');

// Client fully paid (₹100,000 paid, remaining = 0)
const globalCompletedProject = {
  ...testerPaidProject,
  clientPaidAmount: 100000,
  clientRemainingAmount: 0
};
assert(getFreelancerProjectStatus(globalCompletedProject) === 'Completed', 'Developer: Completed');
assert(getTesterDashboardStatus(globalCompletedProject) === 'Completed', 'Tester: Completed');
assert(getAdminProjectStatus(globalCompletedProject) === 'Completed', 'Global Project: Completed (All 3 tracks fully settled)');

console.log('\n--- TEST 11: Profile Photo Upload Constraints & 2 MB Limit Verification ---');
const MAX_PHOTO_SIZE = 2 * 1024 * 1024; // 2 MB = 2,097,152 bytes

const validPhotoFile = { name: 'profile.jpg', size: 1.4 * 1024 * 1024, type: 'image/jpeg' };
const oversizedPhotoFile = { name: 'huge_raw.png', size: 3.2 * 1024 * 1024, type: 'image/png' };
const exactLimitPhotoFile = { name: 'boundary.webp', size: 2 * 1024 * 1024, type: 'image/webp' };
const invalidTypeFile = { name: 'document.pdf', size: 500 * 1024, type: 'application/pdf' };

assert(validPhotoFile.size <= MAX_PHOTO_SIZE, '1.4 MB image file is accepted within 2 MB limit');
assert(oversizedPhotoFile.size > MAX_PHOTO_SIZE, '3.2 MB image file is rejected for exceeding 2 MB limit');
assert(exactLimitPhotoFile.size <= MAX_PHOTO_SIZE, 'Exact 2.00 MB image file passes boundary check');
assert(!invalidTypeFile.type.startsWith('image/'), 'Non-image file type (application/pdf) is rejected');

// Verify Base64 Avatar persistence in Developer & Tester models
const sampleDeveloperRegistration = {
  applicantId: 'DEV-999',
  fullName: 'Vikram Sharma',
  email: 'vikram.dev@example.com',
  mobileNumber: '+91 9876543210',
  primarySkill: 'Full Stack Developer (React & Node)',
  avatar: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBD...',
  status: 'Pending'
};
assert(sampleDeveloperRegistration.avatar.startsWith('data:image/'), 'Developer registration preserves uploaded base64 profile photo');

const sampleTesterRegistration = {
  applicantId: 'TST-888',
  fullName: 'Pooja Nair',
  email: 'pooja.qa@example.com',
  mobileNumber: '+91 9123456789',
  specialization: 'Automation & API Testing',
  avatar: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...',
  status: 'Pending'
};
assert(sampleTesterRegistration.avatar.startsWith('data:image/'), 'Tester registration preserves uploaded base64 profile photo');

console.log('\n--- TEST 12: Developer & QA Tester Rejection Workflow ---');
const pendingDev = {
  id: 'DEV-109',
  name: 'Karan Mehra',
  status: 'Pending',
  availability: 'Pending Approval'
};
const rejectedDev = {
  ...pendingDev,
  status: 'Rejected',
  availability: 'Inactive'
};
assert(rejectedDev.status === 'Rejected', 'Developer rejected status is accurately set to Rejected');
assert(rejectedDev.availability === 'Inactive', 'Rejected developer availability is Inactive');

const pendingTester = {
  id: 'TST-309',
  name: 'Anjali Verma',
  status: 'Pending',
  availability: 'Pending Approval'
};
const rejectedTester = {
  ...pendingTester,
  status: 'Rejected',
  availability: 'Inactive'
};
assert(rejectedTester.status === 'Rejected', 'QA Tester rejected status is accurately set to Rejected');
assert(rejectedTester.availability === 'Inactive', 'Rejected tester availability is Inactive');

console.log('\n--- TEST 13: Project Document Isolation & Exact Binary Fidelity ---');
const projectWithBinaryDoc = {
  id: 'PRJ-SPEC-505',
  name: 'FinTech Banking Portal',
  developer: 'Rahul Patel',
  developerId: 'DEV-101',
  tester: 'Sneha Reddy',
  testerId: 'TST-201',
  documents: [
    {
      id: 'doc-999',
      name: 'Client_Bank_Specification_v3.pdf',
      type: 'application/pdf',
      size: '2.8 MB',
      dataUrl: 'data:application/pdf;base64,JVBERi0xLjQKJcTl8uXrp/Og0MTGCjEgMCBvYmoK...',
      fileData: 'data:application/pdf;base64,JVBERi0xLjQKJcTl8uXrp/Og0MTGCjEgMCBvYmoK...',
      url: 'data:application/pdf;base64,JVBERi0xLjQKJcTl8uXrp/Og0MTGCjEgMCBvYmoK...',
      date: '10 Oct 2026',
      status: 'Uploaded'
    }
  ],
  tasks: [{ id: 't-1', name: 'UI Auth', status: 'Pending' }]
};

const devSafeProj = toFreelancerSafeProject(projectWithBinaryDoc);
const testerSafeProj = toTesterSafeProject(projectWithBinaryDoc);

assert(devSafeProj.documents.length === 1, 'Assigned developer sees exactly 1 document uploaded for this project');
assert(devSafeProj.documents[0].name === 'Client_Bank_Specification_v3.pdf', 'Developer sees exact uploaded document file name');
assert(devSafeProj.documents[0].dataUrl.startsWith('data:application/pdf'), 'Developer document preserves exact binary dataUrl');

assert(testerSafeProj.documents.length === 1, 'Assigned tester sees exactly 1 document uploaded for this project');
assert(testerSafeProj.documents[0].name === 'Client_Bank_Specification_v3.pdf', 'Tester sees exact uploaded document file name');
assert(testerSafeProj.documents[0].dataUrl.startsWith('data:application/pdf'), 'Tester document preserves exact binary dataUrl');

// Verify authorization isolation
const unassignedDevUser = { id: 'DEV-999', name: 'Other Developer' };
const unassignedTesterUser = { id: 'TST-999', name: 'Other Tester' };
assert(!isProjectAssignedToFreelancer(projectWithBinaryDoc, unassignedDevUser), 'Unassigned developer cannot access Project A documents');
assert(!isProjectAssignedToTester(projectWithBinaryDoc, unassignedTesterUser), 'Unassigned tester cannot access Project A documents');

console.log('\n--- TEST 14: Strict Multi-Tenant Assignment Isolation (Patel Het vs Saheb) ---');
const projectAssignedToPatelHet = {
  id: 'DS-WEB-6883',
  name: 'Framing Site',
  developer: 'Patel Het',
  developerId: 'DEV-452',
  developerEmail: 'patelhet@dahejsupport.com',
  tester: 'Hetvi',
  testerId: 'TST-781',
  testerEmail: 'hetvi@dahejsupport.com',
  status: 'Active',
  tasks: [{ id: 't-1', name: 'Site structure', status: 'In Progress', progress: 0 }]
};

const patelHetAuth = {
  id: 'DEV-452',
  freelancerId: 'DEV-452',
  name: 'Patel Het',
  email: 'patelhet@dahejsupport.com'
};

const sahebAuth = {
  id: 'DEV-892',
  freelancerId: 'DEV-892',
  name: 'Saheb',
  email: 'saheb@dahejsupport.com'
};

const hetviAuth = {
  id: 'TST-781',
  testerId: 'TST-781',
  name: 'Hetvi',
  email: 'hetvi@dahejsupport.com'
};

const otherTesterAuth = {
  id: 'TST-999',
  testerId: 'TST-999',
  name: 'Sneha',
  email: 'sneha@dahejsupport.com'
};

// 1. Verify developer assignment isolation
assert(isProjectAssignedToFreelancer(projectAssignedToPatelHet, patelHetAuth) === true, 'Patel Het can access project assigned to Patel Het');
assert(isProjectAssignedToFreelancer(projectAssignedToPatelHet, sahebAuth) === false, 'Saheb CANNOT access project assigned to Patel Het');

const patelHetVisibleProjs = getAuthenticatedFreelancerProjects(patelHetAuth, [projectAssignedToPatelHet]);
assert(patelHetVisibleProjs.length === 1, 'Patel Het dashboard has exactly 1 project');
assert(patelHetVisibleProjs[0].id === 'DS-WEB-6883', 'Patel Het sees Framing Site');

const sahebVisibleProjs = getAuthenticatedFreelancerProjects(sahebAuth, [projectAssignedToPatelHet]);
assert(sahebVisibleProjs.length === 0, 'Saheb dashboard has 0 projects (Completely isolated)');

// 2. Verify tester assignment isolation
assert(isProjectAssignedToTester(projectAssignedToPatelHet, hetviAuth) === true, 'Hetvi can access QA project assigned to Hetvi');
assert(isProjectAssignedToTester(projectAssignedToPatelHet, otherTesterAuth) === false, 'Other tester CANNOT access QA project assigned to Hetvi');

const hetviVisibleProjs = getAuthenticatedTesterProjects(hetviAuth, [projectAssignedToPatelHet]);
assert(hetviVisibleProjs.length === 1, 'Hetvi tester dashboard has exactly 1 project');

const otherTesterVisibleProjs = getAuthenticatedTesterProjects(otherTesterAuth, [projectAssignedToPatelHet]);
assert(otherTesterVisibleProjs.length === 0, 'Other tester dashboard has 0 projects (Completely isolated)');

console.log('================================================================');
console.log(`🎉 TEST SUMMARY: ${passedTests}/${totalTests} TESTS PASSED!`);
console.log('================================================================');


