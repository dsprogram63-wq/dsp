// Persistent Baseline Data for Dahej Support Tester Panel & QA System

export const initialTesterProfile = {
  name: 'Hetvi',
  email: 'hetvi@dahejsupport.com',
  id: 'TST-781',
  role: 'Dedicated QA Specialist',
  status: 'Active',
  referralTrustId: 'RFF-Hetvi-781',
  avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=160'
};

export const initialTesters = [
  {
    id: 'TST-781',
    testerId: 'TST-781',
    name: 'Hetvi',
    fullName: 'Hetvi',
    email: 'hetvi@dahejsupport.com',
    mobile: '+91 97234 87654',
    role: 'QA / Software Tester',
    specialization: 'Web & Functional QA Testing',
    testingTools: 'Postman, Cypress, Jira',
    experience: '3+ Years',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=160',
    referralTrustId: 'RFF-Hetvi-781',
    referenceName: 'Reference Verification',
    referralCode: 'DS-TST-201',
    referenceId: 'DS-TST-201',
    joiningDate: '10 Oct 2026',
    status: 'Active',
    availability: 'Busy',
    activeTestingProjects: 1,
    completedTesting: 0,
    approvedCount: 0,
    returnedCount: 0,
    issuesRaised: 0,
    totalPayouts: '₹0',
    totalPayoutsNum: 0,
    pendingPayouts: '₹5,000',
    pendingPayoutsNum: 5000,
    rating: 5.0,
    currentProjects: [
      {
        id: 'DS-WEB-6883',
        name: 'Framing Site',
        clientName: 'Framing Site Client',
        status: 'Active',
        testingStatus: 'Pending',
        progress: 20
      }
    ],
    testingHistory: [],
    earningsHistory: []
  },
  {
    id: 'TST-317',
    testerId: 'TST-317',
    name: 'Patel Het',
    fullName: 'Patel Het',
    email: 'dahejsupport@gmail.com',
    mobile: '+91 9662003947',
    role: 'QA / Software Tester',
    specialization: 'Functional QA Testing',
    testingTools: 'Postman, Manual QA',
    experience: '2+ Years',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=160',
    referralTrustId: 'RFF-PatelHet-317',
    referenceName: 'Reddy',
    referralCode: 'DS-REF-552',
    referenceId: 'DS-REF-552',
    joiningDate: '20 Oct 2026',
    status: 'Active',
    availability: 'Available',
    applicationMessage: '',
    aboutSelf: '',
    activeTestingProjects: 0,
    completedTesting: 0,
    totalPayouts: '₹0',
    pendingPayouts: '₹0',
    rating: 5.0,
    currentProjects: [],
    testingHistory: [],
    earningsHistory: []
  },
  {
    id: 'TST-841',
    testerId: 'TST-841',
    name: 'Patel Het',
    fullName: 'Patel Het',
    email: 'hetp82259@gmail.com',
    mobile: '+91 9662003947',
    role: 'QA / Software Tester',
    specialization: 'Automated & Functional QA',
    testingTools: 'Selenium, Cypress, Postman',
    experience: '3+ Years',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=160',
    referenceName: 'Reddy',
    referralCode: 'DS-REF-552',
    referenceId: 'DS-REF-552',
    joiningDate: '20 Oct 2026',
    status: 'Pending',
    availability: 'Available',
    applicationMessage: 'i am ready for work',
    activeTestingProjects: 0,
    completedTesting: 0,
    totalPayouts: '₹0',
    pendingPayouts: '₹0',
    rating: 5.0,
    currentProjects: [],
    testingHistory: [],
    earningsHistory: []
  }
];

export const defaultTestingChecklist = [
  { id: 'chk-1', number: '01', title: 'Homepage Layout & Hero Functionality', category: 'UI / Layout', status: 'Pending', notes: '' },
  { id: 'chk-2', number: '02', title: 'Navigation & Smooth Internal Routing', category: 'Navigation', status: 'Pending', notes: '' },
  { id: 'chk-3', number: '03', title: 'Responsive Viewport Breakpoints (Desktop/Tablet/Mobile)', category: 'Responsive', status: 'Pending', notes: '' },
  { id: 'chk-4', number: '04', title: 'Contact Lead Form & Input Validation', category: 'Functionality', status: 'Pending', notes: '' },
  { id: 'chk-5', number: '05', title: 'All Buttons, Modals, CTAs & Link Triggers', category: 'UI / Interaction', status: 'Pending', notes: '' },
  { id: 'chk-6', number: '06', title: 'API & Webhook Lead Routing Functionality', category: 'API / Integration', status: 'Pending', notes: '' },
  { id: 'chk-7', number: '07', title: 'Database & Data Persistence Checks', category: 'Database', status: 'Pending', notes: '' },
  { id: 'chk-8', number: '08', title: 'Authentication, Access & Route Guarding', category: 'Authentication', status: 'Pending', notes: '' },
  { id: 'chk-9', number: '09', title: 'Mobile Touch Interactions & Drawer Menu', category: 'Mobile QA', status: 'Pending', notes: '' },
  { id: 'chk-10', number: '10', title: 'Cross-Browser Compatibility (Chrome, Firefox, Safari, Edge)', category: 'Browser QA', status: 'Pending', notes: '' },
  { id: 'chk-11', number: '11', title: 'Page Load Speed & Asset Optimization (<2s load)', category: 'Performance', status: 'Pending', notes: '' },
  { id: 'chk-12', number: '12', title: 'SEO Metadata, Schema Tags & Favicon Setup', category: 'SEO / Meta', status: 'Pending', notes: '' },
  { id: 'chk-13', number: '13', title: 'Client Content & Typography Spell-check', category: 'Content Verification', status: 'Pending', notes: '' },
  { id: 'chk-14', number: '14', title: 'Final Production Deployment & SSL Verification', category: 'Deployment', status: 'Pending', notes: '' }
];

export const initialTesterNotifications = [];

export const initialTesterEarnings = [];
