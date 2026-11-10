import { initialDevelopers } from '../data/adminMockData.js';
import { initialTesters } from '../data/testerMockData.js';

export const MASTER_ADMIN_EMAIL = 'dahejsupport@gmail.com';
export const MASTER_ADMIN_NAME = 'keval patel';
export const STORAGE_KEY_DELETED_MEMBERS = 'dahej_deleted_member_ids';

/**
 * Retrieve set of all permanently deleted member IDs (case-insensitive)
 */
export function getDeletedMemberIds() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DELETED_MEMBERS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return new Set(parsed.map(id => String(id).toLowerCase().trim()));
      }
    }
  } catch (e) {}
  return new Set();
}

/**
 * Permanently blacklist a deleted member ID so it can never be matched or resurrected
 */
export function addDeletedMemberId(id) {
  if (!id) return;
  try {
    const target = String(id).toLowerCase().trim();
    const current = getDeletedMemberIds();
    current.add(target);
    localStorage.setItem(STORAGE_KEY_DELETED_MEMBERS, JSON.stringify(Array.from(current)));
  } catch (e) {}
}

/**
 * Check if a member ID has been deleted by Admin
 */
export function isMemberDeleted(id) {
  if (!id) return false;
  return getDeletedMemberIds().has(String(id).toLowerCase().trim());
}

/**
 * Fetch all registered developers from state/localStorage or fallback to seeds.
 * Strictly respects deletions by Admin.
 */
export function getRegisteredDevelopers(providedDevs = null) {
  const deletedIds = getDeletedMemberIds();
  if (Array.isArray(providedDevs)) {
    return providedDevs.filter(d => d && d.id && !deletedIds.has(String(d.id).toLowerCase().trim()));
  }
  try {
    const raw = localStorage.getItem('dahej_real_v2_developers') || localStorage.getItem('dahej_developers');
    if (raw !== null && raw !== undefined) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter(d => d && d.id && !deletedIds.has(String(d.id).toLowerCase().trim()));
      }
    }
  } catch (e) {}
  return (initialDevelopers || []).filter(d => d && d.id && !deletedIds.has(String(d.id).toLowerCase().trim()));
}

/**
 * Fetch all registered testers from state/localStorage or fallback to seeds.
 * Strictly respects deletions by Admin.
 */
export function getRegisteredTesters(providedTesters = null) {
  const deletedIds = getDeletedMemberIds();
  if (Array.isArray(providedTesters)) {
    return providedTesters.filter(t => t && t.id && !deletedIds.has(String(t.id).toLowerCase().trim()));
  }
  try {
    const raw = localStorage.getItem('dahej_real_v2_testers') || localStorage.getItem('dahej_testers');
    if (raw !== null && raw !== undefined) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter(t => t && t.id && !deletedIds.has(String(t.id).toLowerCase().trim()));
      }
    }
  } catch (e) {}
  return (initialTesters || []).filter(t => t && t.id && !deletedIds.has(String(t.id).toLowerCase().trim()));
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
 * Deleted accounts are NEVER matched against.
 */
export function checkEmailAvailability(email, excludeId = null, providedDevs = null, providedTesters = null) {
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

  const devs = getRegisteredDevelopers(providedDevs);
  const testers = getRegisteredTesters(providedTesters);
  const deletedIds = getDeletedMemberIds();

  const devMatch = devs.find(d => {
    if (!d || !d.email) return false;
    if (excludeId && (d.id === excludeId || d.developerId === excludeId)) return false;
    if (d.id && deletedIds.has(String(d.id).toLowerCase().trim())) return false;
    return d.email.trim().toLowerCase() === cleanEmail;
  });
  if (devMatch) {
    return {
      available: false,
      existingRole: 'Developer',
      existingMember: devMatch,
      message: 'This email is already registered with an existing Developer account. Only one account per email is allowed.'
    };
  }

  const testerMatch = testers.find(t => {
    if (!t || !t.email) return false;
    if (excludeId && (t.id === excludeId || t.testerId === excludeId)) return false;
    if (t.id && deletedIds.has(String(t.id).toLowerCase().trim())) return false;
    return t.email.trim().toLowerCase() === cleanEmail;
  });
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
 * Deleted accounts are NEVER matched against.
 */
export function checkMobileAvailability(mobile, excludeId = null, providedDevs = null, providedTesters = null) {
  if (!mobile) return { available: true };
  const clean10 = normalizePhone10(mobile);
  if (!clean10 || clean10.length !== 10) return { available: true };

  const devs = getRegisteredDevelopers(providedDevs);
  const testers = getRegisteredTesters(providedTesters);
  const deletedIds = getDeletedMemberIds();

  const devMatch = devs.find(d => {
    if (!d) return false;
    if (excludeId && (d.id === excludeId || d.developerId === excludeId)) return false;
    if (d.id && deletedIds.has(String(d.id).toLowerCase().trim())) return false;
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
    if (!t) return false;
    if (excludeId && (t.id === excludeId || t.testerId === excludeId)) return false;
    if (t.id && deletedIds.has(String(t.id).toLowerCase().trim())) return false;
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
 * Deleted accounts are NEVER matched against.
 */
export function checkUsernameAvailability(username, excludeId = null, providedDevs = null, providedTesters = null) {
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

  const devs = getRegisteredDevelopers(providedDevs);
  const testers = getRegisteredTesters(providedTesters);
  const deletedIds = getDeletedMemberIds();

  const devMatch = devs.find(d => {
    if (!d) return false;
    if (excludeId && (d.id === excludeId || d.developerId === excludeId)) return false;
    if (d.id && deletedIds.has(String(d.id).toLowerCase().trim())) return false;
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
    if (!t) return false;
    if (excludeId && (t.id === excludeId || t.testerId === excludeId)) return false;
    if (t.id && deletedIds.has(String(t.id).toLowerCase().trim())) return false;
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
