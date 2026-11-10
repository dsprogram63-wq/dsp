// Persistent base mock data for Dahej Support Freelancer Portal
import { initialAdminProjects } from './adminMockData';
import { toFreelancerSafeProject } from '../services/freelancerApiService';

export const initialProfile = {
  name: 'Developer',
  fullName: 'Developer',
  email: '',
  id: '',
  developerId: '',
  freelancerId: '',
  mobile: '',
  role: 'Full Stack Developer',
  roleTitle: 'Full Stack Developer',
  status: 'Active',
  referralTrustId: '',
  referralCode: 'RFF-DahejSupport-269',
  referenceId: 'RFF-DahejSupport-269',
  referenceName: 'Dahej Support',
  joiningDate: '',
  avatar: ''
};

// Initial freelancer projects derived safely from initialAdminProjects
export const initialProjects = initialAdminProjects.map(toFreelancerSafeProject).filter(Boolean);

export const initialEarnings = [];

export const initialNotifications = [];

export const initialActivities = [];
