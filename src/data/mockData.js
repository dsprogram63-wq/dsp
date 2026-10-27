// Persistent base mock data for Dahej Support Freelancer Portal
import { initialAdminProjects } from './adminMockData';
import { toFreelancerSafeProject } from '../services/freelancerApiService';

export const initialProfile = {
  name: 'Patel Het Bh',
  fullName: 'Patel Het Bh',
  email: 'hetgraphura@gmail.com',
  id: 'DEV-512',
  developerId: 'DEV-512',
  freelancerId: 'DEV-512',
  mobile: '+91 9662003948',
  role: 'Full Stack Developer (React & Node)',
  roleTitle: 'Full Stack Developer (React & Node)',
  status: 'Active',
  referralTrustId: 'RFF-PatelHetBh-512',
  referralCode: 'RFF-DahejSupport-269',
  referenceId: 'RFF-DahejSupport-269',
  referenceName: 'Dahej Support',
  joiningDate: '26 Oct 2026',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=160'
};

// Initial freelancer projects derived safely from initialAdminProjects
export const initialProjects = initialAdminProjects.map(toFreelancerSafeProject).filter(Boolean);

export const initialEarnings = [];

export const initialNotifications = [];

export const initialActivities = [];
