import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import FreelancerLogin from './pages/FreelancerLogin';
import ReferralApplication from './pages/ReferralApplication';

// Admin Login Page
import AdminLoginPage from './pages/admin/AdminLoginPage';

// Freelancer Portal Components & Pages
import PortalLayout from './components/portal/PortalLayout';
import DashboardPage from './pages/portal/DashboardPage';
import ProjectsPage from './pages/portal/ProjectsPage';
import ProjectDetailPage from './pages/portal/ProjectDetailPage';
import CompletedProjectsPage from './pages/portal/CompletedProjectsPage';
import ProjectHistoryPage from './pages/portal/ProjectHistoryPage';
import EarningsPage from './pages/portal/EarningsPage';
import NotificationsPage from './pages/portal/NotificationsPage';
import ProfilePage from './pages/portal/ProfilePage';
import SettingsPage from './pages/portal/SettingsPage';

// Admin Panel Components & Pages
import AdminLayout from './components/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProjectsPage from './pages/admin/AdminProjectsPage';
import CreateProjectPage from './pages/admin/CreateProjectPage';
import AdminProjectDetailPage from './pages/admin/AdminProjectDetailPage';
import ProjectReviewPage from './pages/admin/ProjectReviewPage';
import SubmittedProjectsPage from './pages/admin/SubmittedProjectsPage';
import AdminCompletedProjectsPage from './pages/admin/AdminCompletedProjectsPage';
import AdminTestingQueuePage from './pages/admin/AdminTestingQueuePage';
import DevelopersPage from './pages/admin/DevelopersPage';
import DeveloperDetailPage from './pages/admin/DeveloperDetailPage';
import TestersPage from './pages/admin/TestersPage';
import TesterDetailPage from './pages/admin/TesterDetailPage';
import AdminEarningsPage from './pages/admin/AdminEarningsPage';
import AdminNotificationsPage from './pages/admin/AdminNotificationsPage';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';

// Tester Panel Components & Pages
import TesterLayout from './components/tester/TesterLayout';
import TesterDashboard from './pages/tester/TesterDashboard';
import TesterProjectsPage from './pages/tester/TesterProjectsPage';
import TesterProjectWorkspace from './pages/tester/TesterProjectWorkspace';
import TesterTestingQueuePage from './pages/tester/TesterTestingQueuePage';
import TesterInTestingPage from './pages/tester/TesterInTestingPage';
import TesterRevisionRequiredPage from './pages/tester/TesterRevisionRequiredPage';
import TesterApprovedProjectsPage from './pages/tester/TesterApprovedProjectsPage';
import TesterHistoryPage from './pages/tester/TesterHistoryPage';
import TesterNotificationsPage from './pages/tester/TesterNotificationsPage';
import TesterProfilePage from './pages/tester/TesterProfilePage';
import TesterSettingsPage from './pages/tester/TesterSettingsPage';
import TesterEarningsPage from './pages/tester/TesterEarningsPage';

import { initialProjects, initialProfile } from './data/mockData';
import { initialAdminProjects, initialDevelopers } from './data/adminMockData';
import { initialTesters, initialTesterProfile } from './data/testerMockData';
import { 
  getAuthenticatedFreelancerProjects, 
  getAuthenticatedFreelancerProjectById, 
  isProjectAssignedToFreelancer,
  toFreelancerSafeProject 
} from './services/freelancerApiService';
import { 
  getAuthenticatedTesterProjects, 
  getAuthenticatedTesterProjectById, 
  isProjectAssignedToTester,
  toTesterSafeProject 
} from './services/testerApiService';

export default function App() {
  // Authentication session from LocalStorage
  const [authSession, setAuthSession] = useState(() => {
    try {
      const saved = localStorage.getItem('dahej_auth_session');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse auth session:', e);
    }
    return null;
  });

  // Freelancer Profile state with LocalStorage persistence
  const [freelancerProfile, setFreelancerProfile] = useState(() => {
    try {
      const saved = localStorage.getItem('dahej_freelancer_profile');
      if (saved) return { ...initialProfile, ...JSON.parse(saved) };
    } catch (e) {
      console.error('Failed to parse freelancer profile:', e);
    }
    return initialProfile;
  });

  // Tester Profile state with LocalStorage persistence
  const [testerProfile, setTesterProfile] = useState(() => {
    try {
      const saved = localStorage.getItem('dahej_tester_profile');
      if (saved) return { ...initialTesterProfile, ...JSON.parse(saved) };
    } catch (e) {
      console.error('Failed to parse tester profile:', e);
    }
    return initialTesterProfile;
  });

  // Parse initial route from URL
  const getInitialState = () => {
    const path = window.location.pathname.toLowerCase();

    // ================= ADMIN LOGIN ROUTE =================
    if (path.includes('admin/login') || path.includes('admin-login')) {
      return { page: 'admin-login', subView: null };
    }

    // ================= TESTER ROUTES =================
    if (path.startsWith('/tester')) {
      if (path.includes('testing-queue')) return { page: 'tester', subView: 'testing-queue' };
      if (path.includes('in-testing')) return { page: 'tester', subView: 'in-testing' };
      if (path.includes('revision-required')) return { page: 'tester', subView: 'revision-required' };
      if (path.includes('approved-projects')) return { page: 'tester', subView: 'approved-projects' };
      if (path.includes('history')) return { page: 'tester', subView: 'history' };
      if (path.includes('earnings')) return { page: 'tester', subView: 'earnings' };
      if (path.includes('notifications')) return { page: 'tester', subView: 'notifications' };
      if (path.includes('profile')) return { page: 'tester', subView: 'profile' };
      if (path.includes('settings')) return { page: 'tester', subView: 'settings' };
      if (path.includes('projects/')) {
        const parts = path.split('projects/');
        const projId = parts[1] ? parts[1].toUpperCase() : 'DS-APP-2048';
        return { page: 'tester', subView: 'project-detail', selectedProjectId: projId };
      }
      if (path.includes('projects')) return { page: 'tester', subView: 'projects' };
      return { page: 'tester', subView: 'dashboard' };
    }

    // ================= ADMIN ROUTES =================
    if (path.startsWith('/admin')) {
      if (path.includes('create') || path.includes('create-project')) return { page: 'admin', subView: 'create-project' };
      if (path.includes('review')) {
        const parts = path.split('/projects/');
        const projId = parts[1] ? parts[1].replace('/review', '').toUpperCase() : 'DS-APP-2048';
        return { page: 'admin', subView: 'project-review', selectedProjectId: projId };
      }
      if (path.includes('testing-queue')) return { page: 'admin', subView: 'testing-queue' };
      if (path.includes('submitted-projects')) return { page: 'admin', subView: 'submitted-projects' };
      if (path.includes('completed-projects')) return { page: 'admin', subView: 'completed-projects' };
      if (path.includes('active-projects')) return { page: 'admin', subView: 'active-projects' };
      if (path.includes('developers/')) {
        const parts = path.split('developers/');
        const devId = parts[1] ? parts[1].toUpperCase() : '';
        return { page: 'admin', subView: 'developer-detail', selectedDeveloperId: devId };
      }
      if (path.includes('developers')) return { page: 'admin', subView: 'developers' };
      if (path.includes('testers/')) {
        const parts = path.split('testers/');
        const tId = parts[1] ? parts[1].toUpperCase() : '';
        return { page: 'admin', subView: 'tester-detail', selectedTesterId: tId };
      }
      if (path.includes('testers')) return { page: 'admin', subView: 'testers' };
      if (path.includes('earnings')) return { page: 'admin', subView: 'earnings' };
      if (path.includes('notifications')) return { page: 'admin', subView: 'notifications' };
      if (path.includes('settings')) return { page: 'admin', subView: 'settings' };
      if (path.includes('projects/')) {
        const parts = path.split('projects/');
        const projId = parts[1] ? parts[1].toUpperCase() : 'DS-WEB-1024';
        return { page: 'admin', subView: 'project-detail', selectedProjectId: projId };
      }
      if (path.includes('projects')) return { page: 'admin', subView: 'projects' };
      return { page: 'admin', subView: 'dashboard' };
    }
    
    // ================= LOGIN ROUTES =================
    if (path.includes('freelancer-login') || path.includes('tester-login') || path === '/login' || path.startsWith('/login')) {
      const isTester = path.includes('tester') || window.location.search.includes('role=tester') || window.location.search.includes('tester');
      const defaultRole = isTester ? 'tester' : 'freelancer';
      return { page: 'login', subView: null, defaultRole };
    }

    // ================= FREELANCER PORTAL ROUTES =================
    if (path.startsWith('/freelancer/') || path === '/freelancer' || path.startsWith('/portal')) {
      if (path.includes('completed-projects')) return { page: 'portal', subView: 'completed-projects' };
      if (path.includes('active-projects')) return { page: 'portal', subView: 'active-projects' };
      if (path.includes('history')) return { page: 'portal', subView: 'history' };
      if (path.includes('earnings')) return { page: 'portal', subView: 'earnings' };
      if (path.includes('notifications')) return { page: 'portal', subView: 'notifications' };
      if (path.includes('profile')) return { page: 'portal', subView: 'profile' };
      if (path.includes('settings')) return { page: 'portal', subView: 'settings' };
      if (path.includes('projects/')) {
        const parts = path.split('projects/');
        const projId = parts[1] ? parts[1].toUpperCase() : null;
        return { page: 'portal', subView: 'project-detail', selectedProjectId: projId || 'DS-WEB-1024' };
      }
      if (path.includes('projects')) return { page: 'portal', subView: 'projects' };
      return { page: 'portal', subView: 'dashboard' };
    }

    if (path.includes('apply')) {
      const defaultRole = (path.includes('tester') || window.location.search.includes('role=tester') || window.location.search.includes('tester')) ? 'tester' : 'developer';
      return { page: 'apply', subView: null, defaultRole };
    }
    return { page: 'home', subView: null };
  };

  const [routeState, setRouteState] = useState(getInitialState);
  
  // System Clean Reset: Clears all cached mock entries on startup for a 100% clean real-data system
  (() => {
    try {
      // Unconditionally wipe all legacy mock storage keys
      const legacyKeys = [
        'dahej_developers', 'dahej_testers', 'dahej_admin_projects', 'dahej_freelancer_projects',
        'dahej_profile', 'dahej_freelancer_profile', 'dahej_tester_profile'
      ];
      legacyKeys.forEach(k => {
        try { localStorage.removeItem(k); } catch (e) {}
      });
    } catch (e) {
      console.error('Failed to reset legacy storage:', e);
    }
  })();

  // State for Freelancer Portal (100% clean real-data only)
  const [projects, setProjects] = useState(() => {
    try {
      const saved = localStorage.getItem('dahej_real_v2_freelancer_projects');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse freelancer projects:', e);
    }
    return [];
  });
  const [selectedProjectId, setSelectedProjectId] = useState(routeState.selectedProjectId || null);

  // State for Admin Panel (100% clean real-data only)
  const [adminProjects, setAdminProjects] = useState(() => {
    try {
      const saved = localStorage.getItem('dahej_real_v2_admin_projects');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse admin projects:', e);
    }
    return [];
  });

  // State for Developers (100% clean real-data only)
  const [developers, setDevelopers] = useState(() => {
    try {
      const saved = localStorage.getItem('dahej_real_v2_developers');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse developers:', e);
    }
    return [];
  });

  // State for Testers (100% clean real-data only)
  const [testers, setTesters] = useState(() => {
    try {
      const saved = localStorage.getItem('dahej_real_v2_testers');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse testers:', e);
    }
    return [];
  });
  const [selectedAdminProjectId, setSelectedAdminProjectId] = useState(routeState.selectedProjectId || null);
  const [selectedDeveloperId, setSelectedDeveloperId] = useState(routeState.selectedDeveloperId || '');
  const [selectedTesterId, setSelectedTesterId] = useState(routeState.selectedTesterId || '');

  // State for Tester Panel
  const [selectedTesterProjectId, setSelectedTesterProjectId] = useState(routeState.selectedProjectId || null);

  // Proactive Real-Time Sanitizer: Clean state sync
  useEffect(() => {
    // Delete legacy keys from localStorage
    const legacyKeys = [
      'dahej_developers', 'dahej_testers', 'dahej_admin_projects', 'dahej_freelancer_projects',
      'dahej_profile', 'dahej_freelancer_profile', 'dahej_tester_profile'
    ];
    legacyKeys.forEach(k => {
      try { localStorage.removeItem(k); } catch (e) {}
    });
  }, []);

  // Sync real data to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('dahej_real_v2_admin_projects', JSON.stringify(adminProjects));
    } catch (e) {
      console.error(e);
    }
  }, [adminProjects]);

  useEffect(() => {
    try {
      localStorage.setItem('dahej_real_v2_freelancer_projects', JSON.stringify(projects));
    } catch (e) {
      console.error(e);
    }
  }, [projects]);

  useEffect(() => {
    try {
      localStorage.setItem('dahej_real_v2_developers', JSON.stringify(developers));
    } catch (e) {
      console.error(e);
    }
  }, [developers]);

  useEffect(() => {
    try {
      localStorage.setItem('dahej_real_v2_testers', JSON.stringify(testers));
    } catch (e) {
      console.error(e);
    }
  }, [testers]);

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const state = getInitialState();
      setRouteState(state);
      if (state.selectedProjectId) {
        setSelectedProjectId(state.selectedProjectId);
        setSelectedAdminProjectId(state.selectedProjectId);
        setSelectedTesterProjectId(state.selectedProjectId);
      }
      if (state.selectedDeveloperId) {
        setSelectedDeveloperId(state.selectedDeveloperId);
      }
      if (state.selectedTesterId) {
        setSelectedTesterId(state.selectedTesterId);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Authentication Handlers
  const handleLoginSuccess = (role, user) => {
    const sessionData = { role, user, timestamp: Date.now() };
    setAuthSession(sessionData);
    try {
      localStorage.setItem('dahej_auth_session', JSON.stringify(sessionData));
    } catch (e) {
      console.error(e);
    }

    if (role === 'admin') {
      navigateTo('admin/dashboard');
    } else if (role === 'tester') {
      navigateTo('tester/dashboard');
    } else {
      navigateTo('portal/dashboard');
    }
  };

  const handleLogout = (originRole) => {
    setAuthSession(null);
    try {
      localStorage.removeItem('dahej_auth_session');
    } catch (e) {
      console.error(e);
    }

    if (originRole === 'admin' || routeState.page === 'admin') {
      navigateTo('admin-login');
    } else {
      navigateTo('login');
    }
  };

  // Freelancer update (syncs to master projects list with strict ownership validation)
  const handleUpdateProject = (updatedProj) => {
    // If authenticated as freelancer, verify ownership before saving
    if (authSession && authSession.role === 'freelancer' && authSession.user) {
      if (!isProjectAssignedToFreelancer(updatedProj, authSession.user)) {
        console.error('Access denied: Cannot update project belonging to another freelancer.');
        return;
      }
    }
    const targetId = (updatedProj.id || '').toUpperCase();
    const updatedDevList = projects.map(p => (p.id || '').toUpperCase() === targetId ? { ...p, ...updatedProj } : p);
    const updatedAdminList = adminProjects.map(p => (p.id || '').toUpperCase() === targetId ? { ...p, ...updatedProj } : p);

    setProjects(updatedDevList);
    setAdminProjects(updatedAdminList);
    try {
      localStorage.setItem('dahej_real_v2_freelancer_projects', JSON.stringify(updatedDevList));
      localStorage.setItem('dahej_real_v2_admin_projects', JSON.stringify(updatedAdminList));
    } catch (e) {}
  };

  // Tester project update (syncs to master projects list with strict ownership validation)
  const handleUpdateTesterProject = (updatedProj) => {
    // If authenticated as tester, verify ownership before saving
    if (authSession && authSession.role === 'tester' && authSession.user) {
      if (!isProjectAssignedToTester(updatedProj, authSession.user)) {
        console.error('Access denied: Cannot update project belonging to another tester.');
        return;
      }
    }
    const targetId = (updatedProj.id || '').toUpperCase();
    const updatedAdminList = adminProjects.map(p => (p.id || '').toUpperCase() === targetId ? { ...p, ...updatedProj } : p);
    const updatedDevList = projects.map(p => (p.id || '').toUpperCase() === targetId ? { ...p, ...updatedProj } : p);

    setAdminProjects(updatedAdminList);
    setProjects(updatedDevList);
    try {
      localStorage.setItem('dahej_real_v2_admin_projects', JSON.stringify(updatedAdminList));
      localStorage.setItem('dahej_real_v2_freelancer_projects', JSON.stringify(updatedDevList));
    } catch (e) {}
  };

  // Admin update (syncs master projects list and updates developer & tester assignments)
  const handleUpdateAdminProject = (updatedProj) => {
    const targetId = (updatedProj.id || '').toUpperCase();
    const updatedProjectsList = adminProjects.map(p => (p.id || '').toUpperCase() === targetId ? { ...p, ...updatedProj } : p);
    const updatedDevList = projects.map(p => (p.id || '').toUpperCase() === targetId ? { ...p, ...updatedProj } : p);

    setAdminProjects(updatedProjectsList);
    setProjects(updatedDevList);
    try {
      localStorage.setItem('dahej_real_v2_admin_projects', JSON.stringify(updatedProjectsList));
      localStorage.setItem('dahej_real_v2_freelancer_projects', JSON.stringify(updatedDevList));
    } catch (e) {}

    // Dynamic sync of developers active workloads & availability
    setDevelopers(prevDevs => prevDevs.map(d => {
      const allDevProjs = updatedProjectsList.filter(
        p => (p.developer && p.developer.toLowerCase() === d.name.toLowerCase()) || (p.developerId && p.developerId === d.id)
      );
      const activeCount = allDevProjs.filter(p => p.status !== 'Completed').length;
      let avail = d.availability;
      if (d.status === 'Active') {
        avail = activeCount > 0 ? 'Busy' : 'Available';
      }
      return {
        ...d,
        activeProjectsCount: activeCount,
        availability: avail,
        currentProjects: allDevProjs
      };
    }));

    // Dynamic sync of testers active workloads & availability
    setTesters(prevTesters => prevTesters.map(t => {
      const allTesterProjs = updatedProjectsList.filter(
        p => (p.tester && p.tester.toLowerCase() === t.name.toLowerCase()) || (p.testerId && p.testerId === t.id)
      );
      const activeCount = allTesterProjs.filter(p => p.status !== 'Completed').length;
      let avail = t.availability;
      if (t.status === 'Active') {
        avail = activeCount > 0 ? 'Busy' : 'Available';
      }
      return {
        ...t,
        activeTestingProjects: activeCount,
        availability: avail,
        currentProjects: allTesterProjs
      };
    }));
  };

  // Admin developer update
  const handleUpdateDeveloper = (updatedDev) => {
    setDevelopers(prev => prev.map(d => d.id === updatedDev.id ? updatedDev : d));
  };

  // Freelancer profile update (strictly enforces immutable fields & persists to localStorage, authSession & developer directory)
  const handleUpdateFreelancerProfile = (updatedFields) => {
    const authUser = (authSession && authSession.user) || null;
    const authId = (authUser && (authUser.id || authUser.freelancerId)) || '';
    
    const matchedDev = developers.find(d => 
      (d.id && d.id.toLowerCase() === authId.toLowerCase()) ||
      (authUser && authUser.email && d.email && d.email.toLowerCase() === authUser.email.toLowerCase())
    ) || (initialDevelopers || []).find(d => 
      (d.id && d.id.toLowerCase() === authId.toLowerCase()) ||
      (authUser && authUser.email && d.email && d.email.toLowerCase() === authUser.email.toLowerCase())
    ) || {
      id: authId,
      name: (authUser && (authUser.fullName || authUser.name)) || 'Developer',
      email: (authUser && authUser.email) || '',
      mobile: (authUser && authUser.mobile) || '',
      joiningDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      referenceName: (authUser && authUser.referenceName) || 'Reference Verification',
      referenceId: 'REF-00125'
    };

    // Only accept allowed editable fields: fullName / name, mobile, email, avatar
    const sanitizedName = (updatedFields.fullName || updatedFields.name || matchedDev.name || 'Developer').trim();
    const sanitizedEmail = (updatedFields.email || matchedDev.email || '').trim();
    const sanitizedMobile = (updatedFields.mobile || matchedDev.mobile || '').trim();
    const updatedAvatar = updatedFields.avatar || matchedDev.avatar || (authUser && authUser.avatar) || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=160';

    const newProfile = {
      fullName: sanitizedName,
      name: sanitizedName,
      email: sanitizedEmail,
      mobile: sanitizedMobile,
      // Permanent immutable fields strictly preserved
      freelancerId: authId,
      id: authId,
      joiningDate: matchedDev.joiningDate || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      experienceAtJoining: matchedDev.experienceAtJoining !== undefined ? matchedDev.experienceAtJoining : 2,
      experienceReferenceDate: matchedDev.experienceReferenceDate || '2025-06-15',
      referenceName: matchedDev.referenceName || 'Reference Verification',
      referenceId: matchedDev.referenceId || (authId ? `REF-00${authId.replace(/[^0-9]/g, '') || '101'}` : 'REF-001'),
      program: 'The HIT Support Developer Program',
      roleTitle: 'The HIT Support Developer Program',
      avatar: updatedAvatar,
      updatedAt: new Date().toISOString()
    };

    setFreelancerProfile(newProfile);
    try {
      localStorage.setItem(`dahej_profile_${authId}`, JSON.stringify(newProfile));
      localStorage.setItem('dahej_freelancer_profile', JSON.stringify(newProfile));
    } catch (e) {
      console.error('Failed to save freelancer profile to localStorage:', e);
    }

    // Update active auth session if currently logged in as freelancer
    if (authSession && authSession.role === 'freelancer') {
      const updatedSession = {
        ...authSession,
        user: {
          ...authSession.user,
          name: sanitizedName,
          fullName: sanitizedName,
          email: sanitizedEmail,
          mobile: sanitizedMobile,
          avatar: updatedAvatar
        }
      };
      setAuthSession(updatedSession);
      try {
        localStorage.setItem('dahej_auth_session', JSON.stringify(updatedSession));
      } catch (e) {
        console.error('Failed to save auth session to localStorage:', e);
      }
    }

    // Sync in developers directory list
    setDevelopers(prevDevs => prevDevs.map(d => {
      if (d.id === authId || (authUser && d.email === authUser.email)) {
        return {
          ...d,
          name: sanitizedName,
          email: sanitizedEmail,
          mobile: sanitizedMobile,
          avatar: updatedAvatar
        };
      }
      return d;
    }));
  };

  // Tester profile update (strictly enforces immutable fields & persists to localStorage, authSession & tester directory)
  const handleUpdateTesterProfile = (updatedFields) => {
    const authUser = (authSession && authSession.user) || null;
    const authId = (authUser && (authUser.id || authUser.testerId)) || '';
    
    const matchedTester = testers.find(t => 
      (t.id && t.id.toLowerCase() === authId.toLowerCase()) ||
      (authUser && authUser.email && t.email && t.email.toLowerCase() === authUser.email.toLowerCase())
    ) || (initialTesters || []).find(t => 
      (t.id && t.id.toLowerCase() === authId.toLowerCase()) ||
      (authUser && authUser.email && t.email && t.email.toLowerCase() === authUser.email.toLowerCase())
    ) || {
      id: authId,
      name: (authUser && (authUser.fullName || authUser.name)) || 'QA Tester',
      email: (authUser && authUser.email) || '',
      mobile: (authUser && authUser.mobile) || '',
      joiningDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      referenceName: (authUser && authUser.referenceName) || 'Reference Verification',
      referenceId: 'REF-00125'
    };

    // Only accept allowed editable fields: fullName / name, mobile, email, avatar
    const sanitizedName = (updatedFields.fullName || updatedFields.name || matchedTester.name || 'QA Tester').trim();
    const sanitizedEmail = (updatedFields.email || matchedTester.email || '').trim();
    const sanitizedMobile = (updatedFields.mobile || matchedTester.mobile || '').trim();
    const updatedAvatar = updatedFields.avatar || matchedTester.avatar || (authUser && authUser.avatar) || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=160';

    const newProfile = {
      fullName: sanitizedName,
      name: sanitizedName,
      email: sanitizedEmail,
      mobile: sanitizedMobile,
      // Permanent immutable fields strictly preserved
      testerId: authId,
      id: authId,
      joiningDate: matchedTester.joiningDate || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      experienceAtJoining: matchedTester.experienceAtJoining !== undefined ? matchedTester.experienceAtJoining : (matchedTester.experience ? parseInt(matchedTester.experience) || 3 : 3),
      experienceReferenceDate: matchedTester.experienceReferenceDate || matchedTester.joiningDate || '2025-02-10',
      referenceName: matchedTester.referenceName || 'Reference Verification',
      referenceId: matchedTester.referenceId || (authId ? `REF-00${authId.replace(/[^0-9]/g, '') || '125'}` : 'REF-002'),
      program: 'The HIT Support Tester Program',
      roleTitle: 'The HIT Support Tester Program',
      avatar: updatedAvatar,
      verified: matchedTester.verified !== false,
      updatedAt: new Date().toISOString()
    };

    setTesterProfile(newProfile);
    try {
      localStorage.setItem(`dahej_tester_profile_${authId}`, JSON.stringify(newProfile));
      localStorage.setItem('dahej_tester_profile', JSON.stringify(newProfile));
    } catch (e) {
      console.error('Failed to save tester profile to localStorage:', e);
    }

    // Update active auth session if currently logged in as tester
    if (authSession && authSession.role === 'tester') {
      const updatedSession = {
        ...authSession,
        user: {
          ...authSession.user,
          name: sanitizedName,
          fullName: sanitizedName,
          email: sanitizedEmail,
          mobile: sanitizedMobile,
          avatar: updatedAvatar
        }
      };
      setAuthSession(updatedSession);
      try {
        localStorage.setItem('dahej_auth_session', JSON.stringify(updatedSession));
      } catch (e) {
        console.error('Failed to save auth session to localStorage:', e);
      }
    }

    // Sync in testers directory list
    setTesters(prevTesters => prevTesters.map(t => {
      if (t.id === authId || (authUser && t.email === authUser.email)) {
        return {
          ...t,
          name: sanitizedName,
          email: sanitizedEmail,
          mobile: sanitizedMobile,
          avatar: updatedAvatar
        };
      }
      return t;
    }));
  };

  // Admin tester update
  const handleUpdateTester = (updatedTester) => {
    setTesters(prev => prev.map(t => t.id === updatedTester.id ? updatedTester : t));
  };

  // Admin create project (dynamically updates developer/tester assigned state)
  const handleCreateAdminProject = (newProj) => {
    const updatedProjects = [newProj, ...adminProjects];
    setAdminProjects(updatedProjects);
    const safeProj = toFreelancerSafeProject(newProj);
    if (safeProj) {
      setProjects(prev => [safeProj, ...prev]);
    }

    // Dynamic sync of developers active workloads & availability
    setDevelopers(prevDevs => prevDevs.map(d => {
      const allDevProjs = updatedProjects.filter(
        p => (p.developer && p.developer.toLowerCase() === d.name.toLowerCase()) || (p.developerId && p.developerId === d.id)
      );
      const activeCount = allDevProjs.filter(p => p.status !== 'Completed').length;
      let avail = d.availability;
      if (d.status === 'Active') {
        avail = activeCount > 0 ? 'Busy' : 'Available';
      }
      return {
        ...d,
        activeProjectsCount: activeCount,
        availability: avail,
        currentProjects: allDevProjs
      };
    }));

    // Dynamic sync of testers active workloads & availability
    setTesters(prevTesters => prevTesters.map(t => {
      const allTesterProjs = updatedProjects.filter(
        p => (p.tester && p.tester.toLowerCase() === t.name.toLowerCase()) || (p.testerId && p.testerId === t.id)
      );
      const activeCount = allTesterProjs.filter(p => p.status !== 'Completed').length;
      let avail = t.availability;
      if (t.status === 'Active') {
        avail = activeCount > 0 ? 'Busy' : 'Available';
      }
      return {
        ...t,
        activeTestingProjects: activeCount,
        availability: avail,
        currentProjects: allTesterProjs
      };
    }));

    setSelectedAdminProjectId(newProj.id);
    navigateTo(`admin/projects/${newProj.id}`);
  };

  // Referral / Developer registration handler (dynamically adds to Pending Developers with saved avatar)
  const handleApplyDeveloper = (newDevData) => {
    const newId = newDevData.applicantId || `DEV-${Math.floor(100 + Math.random() * 900)}`;
    const newDev = {
      id: newId,
      developerId: newId,
      name: newDevData.fullName,
      fullName: newDevData.fullName,
      email: newDevData.email,
      mobile: newDevData.mobileNumber || '+91 98765 00000',
      primarySkill: newDevData.primarySkill || 'Full Stack Developer',
      experience: newDevData.experienceYears || '3+ Years',
      portfolioUrl: newDevData.portfolioUrl || '',
      avatar: newDevData.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=160',
      referenceName: newDevData.referenceName || 'Reference Verification',
      referralCode: newDevData.referralCode || 'DS-REF-8902',
      joiningDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      status: 'Pending',
      availability: 'Pending Approval',
      activeProjectsCount: 0,
      completedProjectsCount: 0,
      revisionProjectsCount: 0,
      currentProgress: 0,
      totalEarnings: '₹0',
      totalEarningsNum: 0,
      pendingPayouts: '₹0',
      pendingPayoutsNum: 0,
      rating: 5.0,
      currentProjects: [],
      projectHistory: [],
      earningsHistory: []
    };
    setDevelopers(prev => [newDev, ...prev]);
  };

  // Referral / QA Tester registration handler (dynamically adds to Pending Testers with saved avatar)
  const handleApplyTester = (newTesterData) => {
    const newId = newTesterData.applicantId || `TST-${Math.floor(100 + Math.random() * 900)}`;
    const newTester = {
      id: newId,
      testerId: newId,
      name: newTesterData.fullName,
      fullName: newTesterData.fullName,
      email: newTesterData.email,
      mobile: newTesterData.mobileNumber || '+91 98765 00000',
      role: 'QA / Software Tester',
      specialization: newTesterData.specialization || 'Web & Functional QA Testing',
      testingTools: newTesterData.testingTools || 'Postman, Cypress, Jira',
      experience: newTesterData.experienceYears || '3+ Years',
      avatar: newTesterData.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=160',
      referenceName: newTesterData.referenceName || 'Reference Verification',
      referralCode: newTesterData.referralCode || 'DS-TST-201',
      joiningDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      status: 'Pending',
      availability: 'Pending Approval',
      activeTestingProjects: 0,
      completedTesting: 0,
      approvedCount: 0,
      returnedCount: 0,
      issuesRaised: 0,
      totalPayouts: '₹0',
      totalPayoutsNum: 0,
      pendingPayouts: '₹0',
      pendingPayoutsNum: 0,
      rating: 5.0,
      currentProjects: [],
      testingHistory: [],
      earningsHistory: []
    };
    setTesters(prev => [newTester, ...prev]);
  };

  // Unified Navigation router
  const navigateTo = (destination, targetAnchorId = null) => {
    let newUrl = '/';
    let nextState = { page: 'home', subView: null };

    if (destination === 'home') {
      nextState = { page: 'home', subView: null };
      newUrl = '/';
    } else if (destination === 'login' || destination === 'freelancer-login') {
      nextState = { page: 'login', subView: null, defaultRole: 'freelancer' };
      newUrl = '/freelancer-login';
    } else if (destination === 'tester-login') {
      nextState = { page: 'login', subView: null, defaultRole: 'tester' };
      newUrl = '/freelancer-login?role=tester';
    } else if (destination === 'admin-login' || destination === 'admin/login') {
      nextState = { page: 'admin-login', subView: null };
      newUrl = '/admin/login';
    } else if (destination === 'apply' || destination === 'apply-developer') {
      nextState = { page: 'apply', subView: null, defaultRole: 'developer' };
      newUrl = '/apply';
    } else if (destination === 'apply-tester' || destination === 'tester-apply') {
      nextState = { page: 'apply', subView: null, defaultRole: 'tester' };
      newUrl = '/apply?role=tester';
    } else if (destination === 'logout') {
      if (routeState.page === 'admin') {
        handleLogout('admin');
        return;
      } else {
        handleLogout('portal');
        return;
      }
    } else if (destination === 'admin-logout') {
      handleLogout('admin');
      return;
    }
    // TESTER NAVIGATION
    else if (destination.startsWith('tester/')) {
      const sub = destination.replace('tester/', '');
      if (sub.startsWith('projects/')) {
        const pId = sub.replace('projects/', '');
        setSelectedTesterProjectId(pId);
        nextState = { page: 'tester', subView: 'project-detail', selectedProjectId: pId };
        newUrl = `/tester/projects/${pId}`;
      } else {
        nextState = { page: 'tester', subView: sub };
        newUrl = `/tester/${sub}`;
      }
    }
    // ADMIN NAVIGATION
    else if (destination.startsWith('admin/')) {
      const sub = destination.replace('admin/', '');
      if (sub.startsWith('projects/') && sub.includes('/review')) {
        const pId = sub.replace('projects/', '').replace('/review', '');
        setSelectedAdminProjectId(pId);
        nextState = { page: 'admin', subView: 'project-review', selectedProjectId: pId };
        newUrl = `/admin/projects/${pId}/review`;
      } else if (sub.startsWith('projects/')) {
        const pId = sub.replace('projects/', '');
        setSelectedAdminProjectId(pId);
        nextState = { page: 'admin', subView: 'project-detail', selectedProjectId: pId };
        newUrl = `/admin/projects/${pId}`;
      } else if (sub.startsWith('developers/')) {
        const dId = sub.replace('developers/', '');
        setSelectedDeveloperId(dId);
        nextState = { page: 'admin', subView: 'developer-detail', selectedDeveloperId: dId };
        newUrl = `/admin/developers/${dId}`;
      } else if (sub.startsWith('testers/')) {
        const tId = sub.replace('testers/', '');
        setSelectedTesterId(tId);
        nextState = { page: 'admin', subView: 'tester-detail', selectedTesterId: tId };
        newUrl = `/admin/testers/${tId}`;
      } else if (sub === 'create-project' || sub === 'projects/create') {
        nextState = { page: 'admin', subView: 'create-project' };
        newUrl = `/admin/projects/create`;
      } else {
        nextState = { page: 'admin', subView: sub };
        newUrl = `/admin/${sub}`;
      }
    }
    // FREELANCER PORTAL NAVIGATION
    else if (destination.startsWith('portal/') || [
      'dashboard', 'projects', 'active-projects', 'completed-projects', 
      'history', 'earnings', 'notifications', 'profile', 'settings'
    ].includes(destination)) {
      const sub = destination.replace('portal/', '');
      nextState = { page: 'portal', subView: sub };
      newUrl = `/freelancer/${sub}`;
    } else if (destination.startsWith('project-detail:') || destination.startsWith('projects/')) {
      const pId = destination.replace('project-detail:', '').replace('projects/', '');
      setSelectedProjectId(pId);
      nextState = { page: 'portal', subView: 'project-detail', selectedProjectId: pId };
      newUrl = `/freelancer/projects/${pId}`;
    }

    setRouteState(nextState);
    window.history.pushState({}, '', newUrl);

    if (nextState.page === 'home') {
      if (targetAnchorId) {
        setTimeout(() => {
          const el = document.getElementById(targetAnchorId);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
          } else if (targetAnchorId === 'hero') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }, 50);
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleOpenFreelancerProject = (projectId) => {
    setSelectedProjectId(projectId);
    navigateTo(`project-detail:${projectId}`);
  };

  const handleOpenAdminProject = (projectId) => {
    setSelectedAdminProjectId(projectId);
    navigateTo(`admin/projects/${projectId}`);
  };

  const handleOpenAdminDeveloper = (devId) => {
    setSelectedDeveloperId(devId);
    navigateTo(`admin/developers/${devId}`);
  };

  const handleOpenAdminTester = (tId) => {
    setSelectedTesterId(tId);
    navigateTo(`admin/testers/${tId}`);
  };

  const handleOpenTesterProject = (projectId) => {
    setSelectedTesterProjectId(projectId);
    navigateTo(`tester/projects/${projectId}`);
  };

  // Get Page Title for Freelancer Header
  const getPortalHeaderInfo = () => {
    switch (routeState.subView) {
      case 'dashboard':
        return { title: 'Dashboard' };
      case 'projects':
        return { title: 'Projects' };
      case 'earnings':
        return { title: 'Earnings' };
      case 'profile':
        return { title: 'Profile' };
      case 'project-detail':
        return { title: 'Project Details' };
      default:
        return { title: 'Freelancer Workspace' };
    }
  };

  // Get Page Title for Admin Header (Clean: Title only per user's design rule)
  const getAdminHeaderInfo = () => {
    switch (routeState.subView) {
      case 'dashboard':
        return { title: 'Operations Dashboard' };
      case 'projects':
        return { title: 'Project Directory' };
      case 'create-project':
        return { title: 'Create New Project' };
      case 'active-projects':
        return { title: 'Active Projects' };
      case 'submitted-projects':
        return { title: 'Submitted Projects' };
      case 'testing-queue':
        return { title: 'QA & Testing Queue' };
      case 'completed-projects':
        return { title: 'Completed Projects' };
      case 'developers':
        return { title: 'Developer Directory' };
      case 'developer-detail':
        return { title: 'Developer Profile' };
      case 'testers':
        return { title: 'QA Tester Directory' };
      case 'tester-detail':
        return { title: 'Tester Profile' };
      case 'earnings':
        return { title: 'Platform Earnings & Financials' };
      case 'notifications':
        return { title: 'Admin Notifications' };
      case 'settings':
        return { title: 'System Settings' };
      case 'project-detail':
        return { title: 'Project Details' };
      case 'project-review':
        return { title: 'Project Submission Review' };
      default:
        return { title: 'Admin Console' };
    }
  };

  // Get Page Title for Tester Header
  const getTesterHeaderInfo = () => {
    switch (routeState.subView) {
      case 'dashboard':
        return { title: 'Dashboard' };
      case 'projects':
        return { title: 'Projects' };
      case 'earnings':
        return { title: 'Earnings' };
      case 'profile':
        return { title: 'Profile' };
      case 'project-detail':
        return { title: 'Project Workspace' };
      default:
        return { title: 'QA Tester Workspace' };
    }
  };

  // ==================== DEDICATED ADMIN LOGIN VIEW ====================
  if (routeState.page === 'admin-login') {
    return (
      <AdminLoginPage 
        onNavigate={navigateTo} 
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  // ==================== TESTER PANEL VIEW ====================
  if (routeState.page === 'tester') {
    // If not authenticated as tester or admin, prompt with Tester login
    if (!authSession || (authSession.role !== 'tester' && authSession.role !== 'admin')) {
      return (
        <FreelancerLogin 
          onNavigate={navigateTo} 
          defaultRole="tester"
          onLoginSuccess={handleLoginSuccess}
        />
      );
    }

    const testerHeader = getTesterHeaderInfo();
    const authTesterUser = (authSession && authSession.user) || null;
    const authTesterId = (authTesterUser && (authTesterUser.id || authTesterUser.testerId)) || '';

    const matchedTester = testers.find(t => 
      (t.id && t.id.toLowerCase() === authTesterId.toLowerCase()) ||
      (authTesterUser && authTesterUser.email && t.email && t.email.toLowerCase() === authTesterUser.email.toLowerCase())
    ) || (initialTesters || []).find(t => 
      (t.id && t.id.toLowerCase() === authTesterId.toLowerCase()) ||
      (authTesterUser && authTesterUser.email && t.email && t.email.toLowerCase() === authTesterUser.email.toLowerCase())
    ) || null;

    // Check if this specific tester has saved custom edits in localStorage
    const savedCustomTesterProfile = (() => {
      try {
        const saved = localStorage.getItem(`dahej_tester_profile_${authTesterId}`);
        if (saved) return JSON.parse(saved);
      } catch (e) {}
      return null;
    })();

    const currentLoggedInTester = {
      id: authTesterId,
      testerId: authTesterId,
      fullName: (savedCustomTesterProfile && (savedCustomTesterProfile.fullName || savedCustomTesterProfile.name)) || (authTesterUser && (authTesterUser.fullName || authTesterUser.name)) || (matchedTester && (matchedTester.fullName || matchedTester.name)) || 'QA Tester',
      name: (savedCustomTesterProfile && (savedCustomTesterProfile.name || savedCustomTesterProfile.fullName)) || (authTesterUser && (authTesterUser.name || authTesterUser.fullName)) || (matchedTester && (matchedTester.name || matchedTester.fullName)) || 'QA Tester',
      email: (savedCustomTesterProfile && savedCustomTesterProfile.email) || (authTesterUser && authTesterUser.email) || (matchedTester && matchedTester.email) || '',
      mobile: (savedCustomTesterProfile && savedCustomTesterProfile.mobile) || (authTesterUser && authTesterUser.mobile) || (matchedTester && matchedTester.mobile) || '',
      joiningDate: (matchedTester && matchedTester.joiningDate) || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      experienceAtJoining: (matchedTester && matchedTester.experienceAtJoining !== undefined) ? matchedTester.experienceAtJoining : (matchedTester && matchedTester.experience ? parseInt(matchedTester.experience) || 3 : 3),
      experienceReferenceDate: (matchedTester && matchedTester.experienceReferenceDate) || (matchedTester && matchedTester.joiningDate) || '2025-02-10',
      referenceName: (matchedTester && matchedTester.referenceName) || 'Reference Verification',
      referenceId: (matchedTester && matchedTester.referenceId) || (authTesterId ? `REF-00${authTesterId.replace(/[^0-9]/g, '') || '125'}` : 'REF-002'),
      program: 'The HIT Support Tester Program',
      roleTitle: 'The HIT Support Tester Program',
      avatar: (matchedTester && matchedTester.avatar) || (authTesterUser && authTesterUser.avatar) || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=160',
      verified: matchedTester ? matchedTester.verified !== false : true
    };

    // Strictly fetch ONLY projects assigned to the authenticated tester
    const assignedTesterProjects = getAuthenticatedTesterProjects(currentLoggedInTester, adminProjects);

    let currentTesterProject = null;
    if (routeState.subView === 'project-detail') {
      const projResult = getAuthenticatedTesterProjectById(currentLoggedInTester, adminProjects, selectedTesterProjectId);
      currentTesterProject = projResult.project; // null if unauthorized or not found
    } else {
      currentTesterProject = assignedTesterProjects.find(p => p.id === selectedTesterProjectId) || assignedTesterProjects[0] || null;
    }

    return (
      <TesterLayout
        currentPath={routeState.subView}
        title={testerHeader.title}
        profile={currentLoggedInTester}
        projectsCount={assignedTesterProjects.length}
        projects={assignedTesterProjects}
        onNavigate={navigateTo}
        onLogout={() => handleLogout('tester')}
      >
        {routeState.subView === 'dashboard' && (
          <TesterDashboard
            projects={assignedTesterProjects}
            onOpenProject={handleOpenTesterProject}
            onNavigate={navigateTo}
          />
        )}

        {routeState.subView === 'projects' && (
          <TesterProjectsPage
            projects={assignedTesterProjects}
            onOpenProject={handleOpenTesterProject}
            onNavigate={navigateTo}
            defaultFilter="All"
          />
        )}

        {routeState.subView === 'testing-queue' && (
          <TesterTestingQueuePage
            projects={assignedTesterProjects}
            onOpenProject={handleOpenTesterProject}
            onNavigate={navigateTo}
          />
        )}

        {routeState.subView === 'in-testing' && (
          <TesterInTestingPage
            projects={assignedTesterProjects}
            onOpenProject={handleOpenTesterProject}
            onNavigate={navigateTo}
          />
        )}

        {routeState.subView === 'revision-required' && (
          <TesterRevisionRequiredPage
            projects={assignedTesterProjects}
            onOpenProject={handleOpenTesterProject}
            onNavigate={navigateTo}
          />
        )}

        {routeState.subView === 'approved-projects' && (
          <TesterApprovedProjectsPage
            projects={assignedTesterProjects}
            onOpenProject={handleOpenTesterProject}
            onNavigate={navigateTo}
          />
        )}

        {routeState.subView === 'history' && (
          <TesterHistoryPage
            projects={assignedTesterProjects}
            onOpenProject={handleOpenTesterProject}
          />
        )}

        {routeState.subView === 'earnings' && (
          <TesterEarningsPage
            projects={assignedTesterProjects}
            onOpenProject={handleOpenTesterProject}
          />
        )}

        {routeState.subView === 'notifications' && (
          <TesterNotificationsPage
            projects={assignedTesterProjects}
            onOpenProject={handleOpenTesterProject}
            onNavigate={navigateTo}
          />
        )}

        {routeState.subView === 'profile' && (
          <TesterProfilePage 
            profile={currentLoggedInTester}
            onUpdateProfile={handleUpdateTesterProfile}
          />
        )}

        {routeState.subView === 'settings' && (
          <TesterSettingsPage />
        )}

        {routeState.subView === 'project-detail' && (
          <TesterProjectWorkspace
            project={currentTesterProject}
            onBack={() => navigateTo('tester/testing-queue')}
            onUpdateProject={handleUpdateTesterProject}
            onNavigate={navigateTo}
          />
        )}
      </TesterLayout>
    );
  }

  // ==================== ADMIN PANEL VIEW ====================
  if (routeState.page === 'admin') {
    // Route protection: If user is not authenticated as Admin, show Admin Login page
    if (!authSession || authSession.role !== 'admin') {
      return (
        <AdminLoginPage 
          onNavigate={navigateTo} 
          onLoginSuccess={handleLoginSuccess}
        />
      );
    }

    const adminHeader = getAdminHeaderInfo();
    const currentAdminProject = adminProjects.find(p => p.id === selectedAdminProjectId) || adminProjects[0];
    const currentDeveloper = developers.find(d => d.id === selectedDeveloperId) || developers[0] || null;
    const currentTester = testers.find(t => t.id === selectedTesterId) || testers[0] || null;

    return (
      <AdminLayout
        currentPath={routeState.subView}
        title={adminHeader.title}
        onNavigate={navigateTo}
        projectsCount={adminProjects.length}
        developersCount={developers.length}
        testersCount={testers.length}
        projects={adminProjects}
        developers={developers}
        testers={testers}
      >
        {routeState.subView === 'dashboard' && (
          <AdminDashboard
            projects={adminProjects}
            developers={developers}
            testers={testers}
            onNavigate={navigateTo}
            onOpenProject={handleOpenAdminProject}
          />
        )}

        {routeState.subView === 'projects' && (
          <AdminProjectsPage
            projects={adminProjects}
            developers={developers}
            testers={testers}
            onNavigate={navigateTo}
            onOpenProject={handleOpenAdminProject}
            defaultFilter="All"
          />
        )}

        {routeState.subView === 'active-projects' && (
          <AdminProjectsPage
            projects={adminProjects}
            developers={developers}
            testers={testers}
            onNavigate={navigateTo}
            onOpenProject={handleOpenAdminProject}
            defaultFilter="In Progress"
          />
        )}

        {routeState.subView === 'create-project' && (
          <CreateProjectPage
            onBack={() => navigateTo('admin/projects')}
            onSaveProject={handleCreateAdminProject}
            availableDevelopers={developers}
            availableTesters={testers}
          />
        )}

        {routeState.subView === 'testing-queue' && (
          <AdminTestingQueuePage
            projects={adminProjects}
            onOpenProject={handleOpenAdminProject}
            onNavigate={navigateTo}
          />
        )}

        {routeState.subView === 'submitted-projects' && (
          <SubmittedProjectsPage
            projects={adminProjects}
            onNavigate={navigateTo}
            onOpenProject={handleOpenAdminProject}
          />
        )}

        {routeState.subView === 'completed-projects' && (
          <AdminCompletedProjectsPage
            projects={adminProjects}
            onOpenProject={handleOpenAdminProject}
          />
        )}

        {routeState.subView === 'developers' && (
          <DevelopersPage
            developers={developers}
            projects={adminProjects}
            onUpdateDeveloper={handleUpdateDeveloper}
            onOpenDeveloper={handleOpenAdminDeveloper}
            onNavigate={navigateTo}
          />
        )}

        {routeState.subView === 'developer-detail' && (
          <DeveloperDetailPage
            developer={currentDeveloper}
            projects={adminProjects}
            onUpdateDeveloper={handleUpdateDeveloper}
            onBack={() => navigateTo('admin/developers')}
            onOpenProject={handleOpenAdminProject}
            onNavigate={navigateTo}
          />
        )}

        {routeState.subView === 'testers' && (
          <TestersPage
            testers={testers}
            projects={adminProjects}
            onUpdateTester={handleUpdateTester}
            onOpenTester={handleOpenAdminTester}
            onNavigate={navigateTo}
          />
        )}

        {routeState.subView === 'tester-detail' && (
          <TesterDetailPage
            tester={currentTester}
            projects={adminProjects}
            onUpdateTester={handleUpdateTester}
            onBack={() => navigateTo('admin/testers')}
            onOpenProject={handleOpenAdminProject}
            onNavigate={navigateTo}
          />
        )}

        {routeState.subView === 'earnings' && (
          <AdminEarningsPage
            projects={adminProjects}
            onOpenProject={handleOpenAdminProject}
            onUpdateProject={handleUpdateAdminProject}
            onNavigate={navigateTo}
          />
        )}

        {routeState.subView === 'notifications' && (
          <AdminNotificationsPage
            onOpenProject={handleOpenAdminProject}
            onNavigate={navigateTo}
          />
        )}

        {routeState.subView === 'settings' && (
          <AdminSettingsPage />
        )}

        {routeState.subView === 'project-detail' && (
          <AdminProjectDetailPage
            project={currentAdminProject}
            developers={developers}
            testers={testers}
            onBack={() => navigateTo('admin/projects')}
            onUpdateProject={handleUpdateAdminProject}
            onNavigate={navigateTo}
          />
        )}

        {routeState.subView === 'project-review' && (
          <ProjectReviewPage
            project={currentAdminProject}
            onBack={() => navigateTo('admin/submitted-projects')}
            onUpdateProject={handleUpdateAdminProject}
            onNavigate={navigateTo}
          />
        )}
      </AdminLayout>
    );
  }

  // ==================== FREELANCER PORTAL VIEW ====================
  if (routeState.page === 'portal') {
    // If not authenticated as freelancer or admin, prompt with Freelancer login
    if (!authSession || (authSession.role !== 'freelancer' && authSession.role !== 'admin')) {
      return (
        <FreelancerLogin 
          onNavigate={navigateTo} 
          defaultRole="freelancer"
          onLoginSuccess={handleLoginSuccess}
        />
      );
    }

    const { title: portalTitle } = getPortalHeaderInfo();
    const authUser = (authSession && authSession.user) || null;
    const authId = authUser ? (authUser.id || authUser.freelancerId || 'DEV-101') : 'DEV-101';

    // Find developer record from developers directory
    const matchedDev = developers.find(d => 
      (d.id && d.id.toLowerCase() === authId.toLowerCase()) ||
      (authUser && authUser.email && d.email && d.email.toLowerCase() === authUser.email.toLowerCase())
    ) || initialDevelopers.find(d => 
      (d.id && d.id.toLowerCase() === authId.toLowerCase()) ||
      (authUser && authUser.email && d.email && d.email.toLowerCase() === authUser.email.toLowerCase())
    ) || null;

    // Check if this specific developer has saved custom edits in localStorage
    const savedCustomProfile = (() => {
      try {
        const saved = localStorage.getItem(`dahej_profile_${authId}`);
        if (saved) return JSON.parse(saved);
      } catch (e) {}
      return null;
    })();

    const currentLoggedInFreelancer = {
      freelancerId: authId,
      id: authId,
      fullName: (savedCustomProfile && (savedCustomProfile.fullName || savedCustomProfile.name)) || (authUser && (authUser.fullName || authUser.name)) || (matchedDev && matchedDev.name) || 'Developer',
      name: (savedCustomProfile && (savedCustomProfile.name || savedCustomProfile.fullName)) || (authUser && (authUser.name || authUser.fullName)) || (matchedDev && matchedDev.name) || 'Developer',
      email: (savedCustomProfile && savedCustomProfile.email) || (authUser && authUser.email) || (matchedDev && matchedDev.email) || '',
      mobile: (savedCustomProfile && savedCustomProfile.mobile) || (authUser && authUser.mobile) || (matchedDev && matchedDev.mobile) || '',
      joiningDate: (matchedDev && matchedDev.joiningDate) || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      experienceAtJoining: (matchedDev && matchedDev.experienceAtJoining !== undefined) ? matchedDev.experienceAtJoining : 2,
      experienceReferenceDate: (matchedDev && matchedDev.experienceReferenceDate) || '2025-06-15',
      referenceName: (matchedDev && matchedDev.referenceName) || 'Reference Verification',
      referenceId: (matchedDev && matchedDev.referenceId) || (authId ? `REF-00${authId.replace(/[^0-9]/g, '') || '101'}` : 'REF-001'),
      program: 'The HIT Support Developer Program',
      roleTitle: 'The HIT Support Developer Program',
      avatar: (matchedDev && matchedDev.avatar) || (authUser && authUser.avatar) || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=160'
    };

    // Strictly fetch ONLY projects assigned to the authenticated freelancer
    const assignedFreelancerProjects = getAuthenticatedFreelancerProjects(currentLoggedInFreelancer, adminProjects);

    // Active project for project-detail view: strictly verified against authenticated identity
    let activeProject = null;
    if (routeState.subView === 'project-detail') {
      const projResult = getAuthenticatedFreelancerProjectById(currentLoggedInFreelancer, adminProjects, selectedProjectId);
      activeProject = projResult.project; // Will be null if unauthorized or not found, causing ProjectDetailPage to render Access Denied
    }

    return (
      <PortalLayout
        currentPath={routeState.subView}
        title={portalTitle}
        profile={currentLoggedInFreelancer}
        projectsCount={assignedFreelancerProjects.length}
        projects={assignedFreelancerProjects}
        onNavigate={navigateTo}
        onLogout={() => handleLogout('freelancer')}
      >
        {routeState.subView === 'dashboard' && (
          <DashboardPage 
            projects={assignedFreelancerProjects}
            onNavigate={navigateTo} 
            onOpenProject={handleOpenFreelancerProject} 
          />
        )}

        {routeState.subView === 'projects' && (
          <ProjectsPage 
            projects={assignedFreelancerProjects}
            onOpenProject={handleOpenFreelancerProject} 
            defaultFilter="All"
          />
        )}

        {routeState.subView === 'active-projects' && (
          <ProjectsPage 
            projects={assignedFreelancerProjects}
            onOpenProject={handleOpenFreelancerProject} 
            defaultFilter="Active"
          />
        )}

        {routeState.subView === 'completed-projects' && (
          <CompletedProjectsPage 
            projects={assignedFreelancerProjects}
            onOpenProject={handleOpenFreelancerProject} 
          />
        )}

        {routeState.subView === 'history' && (
          <ProjectHistoryPage 
            projects={assignedFreelancerProjects}
            onOpenProject={handleOpenFreelancerProject} 
          />
        )}

        {routeState.subView === 'earnings' && (
          <EarningsPage 
            projects={assignedFreelancerProjects}
            onOpenProject={handleOpenFreelancerProject} 
          />
        )}

        {routeState.subView === 'notifications' && (
          <NotificationsPage 
            projects={assignedFreelancerProjects}
            onOpenProject={handleOpenFreelancerProject} 
            onNavigate={navigateTo}
          />
        )}

        {routeState.subView === 'profile' && (
          <ProfilePage 
            profile={currentLoggedInFreelancer}
            onUpdateProfile={handleUpdateFreelancerProfile}
          />
        )}

        {routeState.subView === 'settings' && (
          <SettingsPage />
        )}

        {routeState.subView === 'project-detail' && (
          <ProjectDetailPage
            project={activeProject}
            onBack={() => navigateTo('projects')}
            onUpdateProject={handleUpdateProject}
            onNavigate={navigateTo}
          />
        )}
      </PortalLayout>
    );
  }

  // ==================== PUBLIC LANDING / LOGIN / APPLY ====================
  return (
    <div className="app-root">
      <Navbar onNavigate={navigateTo} currentPage={routeState.page} />

      {routeState.page === 'home' && <Home onNavigate={navigateTo} />}
      {routeState.page === 'login' && (
        <FreelancerLogin 
          onNavigate={navigateTo} 
          defaultRole={routeState.defaultRole || 'freelancer'}
          onLoginSuccess={handleLoginSuccess}
        />
      )}
      {routeState.page === 'apply' && (
        <ReferralApplication 
          onNavigate={navigateTo} 
          onApplyDeveloper={handleApplyDeveloper} 
          onApplyTester={handleApplyTester}
          initialRole={routeState.defaultRole || 'developer'}
        />
      )}

      <Footer onNavigate={navigateTo} />
    </div>
  );
}
