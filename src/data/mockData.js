// Persistent base mock data for Dahej Support Freelancer Portal
import { initialAdminProjects } from './adminMockData';
import { toFreelancerSafeProject } from '../services/freelancerApiService';

export const initialProfile = {
  name: 'Patel Het',
  email: 'patelhet@dahejsupport.com',
  id: 'DEV-452',
  freelancerId: 'DEV-452',
  role: 'Frontend Developer',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=160'
};

// Initial freelancer projects derived safely from initialAdminProjects
export const initialProjects = initialAdminProjects.map(toFreelancerSafeProject).filter(Boolean);

export const initialEarnings = [];

export const initialNotifications = [];

export const initialActivities = [];
