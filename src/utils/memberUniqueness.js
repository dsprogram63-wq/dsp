import { initialDevelopers } from '../data/adminMockData.js';
import { initialTesters } from '../data/testerMockData.js';

export const MASTER_ADMIN_EMAIL = 'dahejsupport@gmail.com';
export const MASTER_ADMIN_NAME = 'keval patel';

/**
 * Fetch all registered developers from localStorage or fallback to seeds
 */
export function getRegisteredDevelopers() {
  try {
    const raw = localStorage.getItem('dahej_real_v2_developers') || localStorage.getItem('dahej_developers');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}
  return initialDevelopers || [];
}

/**
 * Fetch all registered testers from localStorage or fallback to seeds
 */
export function getRegisteredTesters() {
  try {
    const raw = localStorage.getItem('dahej_real_v2_testers') || localStorage.getItem('dahej_testers');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}
  return initialTesters || [];
}

/**
 * Clean & normalize a phone number into its last 10 digits
 */
export function normalizePhone10(phone) {
  if (!phone) return '';
  return String(phone).replace(/\D/g, '').slice(-10);
}

/**
 * Clean & normalize username / full name (lowercased, trimmed, single spaces)
 */
export function normalizeUsername(name) {
  if (!name) return '';
  return String(name).trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Check if an email address is already registered in Developer or QA Tester accounts
 * Rule: 1 email = 1 account across both Developer and Tester tracks
 */
export function checkEmailAvailability(email, excludeId = null) {
  if (!email || typeof email !== 'string') return { available: true };
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail) return { available: true };

  // Block platform administration email from candidate registrations
  if (cleanEmail === MASTER_ADMIN_EMAIL) {
    return {
      available: false,
      existingRole: 'Master Admin',
      message: 'This email is reserved for Platform Administration and cannot be used for registration.'
    };
  }

  const devs = getRegisteredDevelopers();
  const testers = getRegisteredTesters();

  const devMatch = devs.find(d => 
    (excludeId ? d.id !== excludeId : true) && 
    d.email && d.email.trim().toLowerCase() === cleanEmail
  );
  if (devMatch) {
    return {
      available: false,
      existingRole: 'Developer',
      existingMember: devMatch,
      message: 'This email is already registered with an existing Developer account. Only one account per email is allowed.'
    };
  }

  const testerMatch = testers.find(t => 
    (excludeId ? (t.id !== excludeId && t.testerId !== excludeId) : true) && 
    t.email && t.email.trim().toLowerCase() === cleanEmail
  );
  if (testerMatch) {
    return {
      available: false,
      existingRole: 'QA Tester',
      existingMember: testerMatch,
      message: 'This email is already registered with an existing QA Tester account. Only one account per email is allowed.'
    };
  }

  return { available: true };
}

/**
 * Check if a mobile number is already registered in Developer or QA Tester accounts
 * Rule: 1 phone number = 1 account across both Developer and Tester tracks
 */
export function checkMobileAvailability(mobile, excludeId = null) {
  if (!mobile) return { available: true };
  const clean10 = normalizePhone10(mobile);
  if (!clean10 || clean10.length !== 10) return { available: true };

  const devs = getRegisteredDevelopers();
  const testers = getRegisteredTesters();

  const devMatch = devs.find(d => {
    if (excludeId && d.id === excludeId) return false;
    const dPhone = normalizePhone10(d.mobile || d.mobileNumber);
    return dPhone === clean10;
  });
  if (devMatch) {
    return {
      available: false,
      existingRole: 'Developer',
      existingMember: devMatch,
      message: 'This mobile number is already registered with an existing Developer account. Each phone number can only be used once.'
    };
  }

  const testerMatch = testers.find(t => {
    if (excludeId && (t.id === excludeId || t.testerId === excludeId)) return false;
    const tPhone = normalizePhone10(t.mobile || t.mobileNumber);
    return tPhone === clean10;
  });
  if (testerMatch) {
    return {
      available: false,
      existingRole: 'QA Tester',
      existingMember: testerMatch,
      message: 'This mobile number is already registered with an existing QA Tester account. Each phone number can only be used once.'
    };
  }

  return { available: true };
}

/**
 * Check if a username / full name is already taken across Developer, QA Tester, or Admin
 * Rule: Usernames must be 100% unique across all users
 */
export function checkUsernameAvailability(username, excludeId = null) {
  if (!username || typeof username !== 'string') return { available: true };
  const clean = normalizeUsername(username);
  if (!clean) return { available: true };

  // Block reserved system administrator usernames
  if (clean === MASTER_ADMIN_NAME || clean === 'admin' || clean === 'administrator' || clean === 'master admin') {
    return {
      available: false,
      existingRole: 'Master Admin',
      message: 'This username is already taken. Please choose a different unique username.'
    };
  }

  const devs = getRegisteredDevelopers();
  const testers = getRegisteredTesters();

  const devMatch = devs.find(d => {
    if (excludeId && d.id === excludeId) return false;
    const devName = normalizeUsername(d.username || d.fullName || d.name);
    return devName === clean;
  });
  if (devMatch) {
    return {
      available: false,
      existingRole: 'Developer',
      existingMember: devMatch,
      message: 'This username is already taken. Please choose a different unique username.'
    };
  }

  const testerMatch = testers.find(t => {
    if (excludeId && (t.id === excludeId || t.testerId === excludeId)) return false;
    const tName = normalizeUsername(t.username || t.fullName || t.name);
    return tName === clean;
  });
  if (testerMatch) {
    return {
      available: false,
      existingRole: 'QA Tester',
      existingMember: testerMatch,
      message: 'This username is already taken. Please choose a different unique username.'
    };
  }

  return { available: true };
}
