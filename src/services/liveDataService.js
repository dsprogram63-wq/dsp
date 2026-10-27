/**
 * Dahej Support - Live Cloud Data & State Synchronization Service
 * 
 * Provides real-time and persistent synchronization between all devices, browsers,
 * and sessions using Supabase Cloud Storage and the /api/live-sync endpoint.
 */

import { supabase } from './supabase.js';

const STORAGE_BUCKET = 'documents';
const STORAGE_FILE_PATH = 'live_state/platform_data.json';

// In-memory cache of the latest live state
let memoryCloudState = null;

/**
 * Determine live sync endpoints
 */
function getSyncEndpoints() {
  const endpoints = [];
  if (typeof window !== 'undefined') {
    if (window.location.hostname.includes('dsprogram.space')) {
      endpoints.push('https://www.dsprogram.space/api/live-sync');
    }
    endpoints.push('/api/live-sync');
    if (window.location.origin) {
      endpoints.push(`${window.location.origin}/api/live-sync`);
    }
  } else {
    endpoints.push('https://www.dsprogram.space/api/live-sync');
    endpoints.push('http://localhost:5173/api/live-sync');
  }
  return [...new Set(endpoints)];
}

/**
 * Directly fetch live platform state from Supabase Cloud Storage
 */
async function fetchDirectFromSupabase() {
  try {
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .download(STORAGE_FILE_PATH);

    if (error || !data) return null;

    const text = await data.text();
    return JSON.parse(text);
  } catch (err) {
    console.warn('Direct Supabase live state download error:', err);
    return null;
  }
}

/**
 * Directly save live platform state to Supabase Cloud Storage
 */
async function saveDirectToSupabase(updatedState) {
  try {
    const buffer = Buffer.from ? Buffer.from(JSON.stringify(updatedState, null, 2)) : new Blob([JSON.stringify(updatedState, null, 2)], { type: 'application/json' });
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(STORAGE_FILE_PATH, buffer, {
        contentType: 'application/json',
        upsert: true
      });

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Direct Supabase live state upload error:', err);
    return false;
  }
}

/**
 * Fetch all platform data from the live cloud.
 * Falls back gracefully to memory or local cache.
 */
export async function fetchLivePlatformData() {
  let liveData = null;

  // 1. Try /api/live-sync proxy endpoints
  const endpoints = getSyncEndpoints();
  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout ? AbortSignal.timeout(4000) : undefined
      });
      if (res.ok) {
        const json = await res.json();
        if (json && json.data) {
          liveData = json.data;
          break;
        }
      }
    } catch (e) {
      // Try next endpoint
    }
  }

  // 2. Fallback: Direct Supabase client
  if (!liveData) {
    liveData = await fetchDirectFromSupabase();
  }

  if (liveData) {
    if (Array.isArray(liveData.developers)) {
      liveData.developers = liveData.developers.map(d => {
        if (d.id === 'DEV-512' && (d.referralTrustId === 'RFF-DahejSupport-269' || d.referralTrustId === 'RFF-PatelHet-512' || !d.referralTrustId)) {
          return {
            ...d,
            referralTrustId: 'RFF-PatelHetBh-512',
            referenceName: 'Dahej Support',
            referenceId: 'RFF-DahejSupport-269',
            referralCode: 'RFF-DahejSupport-269'
          };
        }
        return d;
      });
    }
    memoryCloudState = liveData;
    syncLiveStateToLocalStorage(liveData);
    return liveData;
  }

  return memoryCloudState;
}

/**
 * Save partial or complete updates to the live cloud database.
 */
export async function saveLivePlatformData(updates = {}) {
  if (!updates || typeof updates !== 'object') return false;

  // 1. Update memory cache immediately
  const currentState = memoryCloudState || {};
  const mergeById = (prev = [], incoming = []) => {
    if (!Array.isArray(incoming)) return prev;
    const map = new Map();
    (prev || []).forEach(item => { if (item?.id) map.set(item.id, item); });
    (incoming || []).forEach(item => { if (item?.id) map.set(item.id, { ...(map.get(item.id) || {}), ...item }); });
    return Array.from(map.values());
  };

  const nextState = {
    ...currentState,
    version: '2.0.0',
    updatedAt: new Date().toISOString(),
    developers: updates.developers ? mergeById(currentState.developers, updates.developers) : currentState.developers,
    testers: updates.testers ? mergeById(currentState.testers, updates.testers) : currentState.testers,
    adminProjects: updates.adminProjects ? mergeById(currentState.adminProjects, updates.adminProjects) : currentState.adminProjects,
    projects: updates.projects ? mergeById(currentState.projects, updates.projects) : (updates.adminProjects ? mergeById(currentState.projects, updates.adminProjects) : currentState.projects),
    passwords: {
      ...(currentState.passwords || {}),
      ...(updates.passwords || {})
    },
    applications: updates.applications ? mergeById(currentState.applications, updates.applications) : currentState.applications
  };

  if (Array.isArray(nextState.developers)) {
    nextState.developers = nextState.developers.map(d => {
      if (d.id === 'DEV-512' && (d.referralTrustId === 'RFF-DahejSupport-269' || d.referralTrustId === 'RFF-PatelHet-512' || !d.referralTrustId)) {
        return {
          ...d,
          referralTrustId: 'RFF-PatelHetBh-512',
          referenceName: 'Dahej Support',
          referenceId: 'RFF-DahejSupport-269',
          referralCode: 'RFF-DahejSupport-269'
        };
      }
      return d;
    });
  }

  memoryCloudState = nextState;
  syncLiveStateToLocalStorage(nextState);

  // 2. Try saving via /api/live-sync
  const endpoints = getSyncEndpoints();
  let saved = false;

  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
        signal: AbortSignal.timeout ? AbortSignal.timeout(4000) : undefined
      });
      if (res.ok) {
        const json = await res.json();
        if (json && json.success) {
          saved = true;
          break;
        }
      }
    } catch (e) {}
  }

  // 3. Fallback: Save directly to Supabase storage
  if (!saved) {
    saved = await saveDirectToSupabase(nextState);
  }

  return saved;
}

/**
 * Fetch a member by email or ID directly from the live cloud.
 * Returns { member, role } or null.
 */
export async function getLiveMemberByEmailOrId(idOrEmail) {
  if (!idOrEmail) return null;
  const clean = idOrEmail.toString().trim().toLowerCase();

  // Ensure we have the latest cloud state
  const state = await fetchLivePlatformData();
  if (!state) return null;

  const devs = state.developers || [];
  const testers = state.testers || [];

  const matchedDev = devs.find(d => 
    (d.email && d.email.toLowerCase().trim() === clean) ||
    (d.id && d.id.toLowerCase().trim() === clean) ||
    (d.developerId && d.developerId.toLowerCase().trim() === clean) ||
    (d.name && d.name.toLowerCase().trim() === clean) ||
    (d.fullName && d.fullName.toLowerCase().trim() === clean)
  );

  if (matchedDev) {
    return { member: matchedDev, role: 'freelancer' };
  }

  const matchedTester = testers.find(t => 
    (t.email && t.email.toLowerCase().trim() === clean) ||
    (t.id && t.id.toLowerCase().trim() === clean) ||
    (t.testerId && t.testerId.toLowerCase().trim() === clean) ||
    (t.name && t.name.toLowerCase().trim() === clean) ||
    (t.fullName && t.fullName.toLowerCase().trim() === clean)
  );

  if (matchedTester) {
    return { member: matchedTester, role: 'tester' };
  }

  return null;
}

/**
 * Syncs the live cloud state into LocalStorage as an ultra-fast offline cache.
 */
export function syncLiveStateToLocalStorage(data) {
  if (!data || typeof window === 'undefined') return;

  try {
    if (Array.isArray(data.developers) && data.developers.length > 0) {
      localStorage.setItem('dahej_real_v2_developers', JSON.stringify(data.developers));
      localStorage.setItem('dahej_developers', JSON.stringify(data.developers));
    }
    if (Array.isArray(data.adminProjects) && data.adminProjects.length > 0) {
      localStorage.setItem('dahej_real_v2_admin_projects', JSON.stringify(data.adminProjects));
      localStorage.setItem('dahej_admin_projects', JSON.stringify(data.adminProjects));
    }
    if (Array.isArray(data.projects) && data.projects.length > 0) {
      localStorage.setItem('dahej_real_v2_freelancer_projects', JSON.stringify(data.projects));
      localStorage.setItem('dahej_freelancer_projects', JSON.stringify(data.projects));
    }
    if (Array.isArray(data.testers) && data.testers.length > 0) {
      localStorage.setItem('dahej_real_v2_testers', JSON.stringify(data.testers));
      localStorage.setItem('dahej_testers', JSON.stringify(data.testers));
    }
    if (data.passwords && typeof data.passwords === 'object') {
      const existing = localStorage.getItem('dahej_member_passwords');
      const parsed = existing ? JSON.parse(existing) : {};
      const merged = { ...parsed, ...data.passwords };
      localStorage.setItem('dahej_member_passwords', JSON.stringify(merged));
    }

    // Proactively heal DEV-512 cached custom profiles in localStorage
    try {
      const pKey = 'dahej_profile_DEV-512';
      const cachedP = localStorage.getItem(pKey);
      if (cachedP) {
        const parsedP = JSON.parse(cachedP);
        if (parsedP.referralTrustId === 'RFF-DahejSupport-269' || parsedP.referralTrustId === 'RFF-PatelHet-512') {
          parsedP.referralTrustId = 'RFF-PatelHetBh-512';
          localStorage.setItem(pKey, JSON.stringify(parsedP));
        }
      }
      const fKey = 'dahej_freelancer_profile';
      const cachedF = localStorage.getItem(fKey);
      if (cachedF) {
        const parsedF = JSON.parse(cachedF);
        if (parsedF.id === 'DEV-512' && (parsedF.referralTrustId === 'RFF-DahejSupport-269' || parsedF.referralTrustId === 'RFF-PatelHet-512')) {
          parsedF.referralTrustId = 'RFF-PatelHetBh-512';
          localStorage.setItem(fKey, JSON.stringify(parsedF));
        }
      }
    } catch (healErr) {}
  } catch (e) {
    console.error('Failed to sync live state to localStorage:', e);
  }
}
