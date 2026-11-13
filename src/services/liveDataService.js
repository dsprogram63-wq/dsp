/**
 * Dahej Support - Table-Wise Live Cloud Data & State Synchronization Service
 *
 * Persists data independently per domain table (`developers`, `testers`, `projects`,
 * `applications`, `auth_registry`) via `/api/live-sync` and direct Supabase fallback.
 */

import { supabase } from './supabase.js';

const STORAGE_BUCKET = 'avatars';
const TABLE_PATHS = {
  developers: 'db_tables/developers.json',
  testers: 'db_tables/testers.json',
  projects: 'db_tables/projects.json',
  applications: 'db_tables/applications.json',
  authRegistry: 'db_tables/auth_registry.json',
  legacy: 'live_state/platform_data.json',
};

// In-memory cache of the latest live state
let memoryCloudState = null;

const MOCK_DEV_IDS = new Set(['DEV-512', 'DEV-452', 'DEV-892', 'DEV-519', 'DEV-DEMO']);
const MOCK_TESTER_IDS = new Set(['TST-317', 'TST-841', 'TST-781', 'TST-DEMO']);
const MOCK_PROJECT_IDS = new Set(['DS-WEB-6883']);

export function sanitizeLivePlatformState(state) {
  if (!state || typeof state !== 'object') return state;

  const deletedIds = new Set(
    (state.deletedMemberIds || []).map((id) => String(id).toLowerCase().trim())
  );

  // 1. Developers: keep only genuinely registered and non-deleted developers
  if (Array.isArray(state.developers)) {
    state.developers = state.developers.filter(
      (d) =>
        d &&
        !MOCK_DEV_IDS.has(d.id) &&
        !d.isDemo &&
        !deletedIds.has(String(d.id || '').toLowerCase()) &&
        d.email !== 'developer@hit-support.com' &&
        d.email !== 'patelhet@dahejsupport.com' &&
        d.email !== 'saheb@dahejsupport.com' &&
        d.email !== 'vikram.dev@dahejsupport.com' &&
        d.email !== 'hetgraphura@gmail.com'
    );
  }

  // 2. Testers: keep only genuinely registered and non-deleted testers
  if (Array.isArray(state.testers)) {
    state.testers = state.testers.filter(
      (t) =>
        t &&
        !MOCK_TESTER_IDS.has(t.id) &&
        !t.isDemo &&
        !deletedIds.has(String(t.id || '').toLowerCase()) &&
        t.email !== 'tester@hit-support.com' &&
        t.email !== 'hetvi@dahejsupport.com' &&
        t.email !== 'dahejsupport@gmail.com'
    );
  }

  // 3. Projects with cross-reconciliation
  const validDevs = Array.isArray(state.developers) ? state.developers : [];
  const validTesters = Array.isArray(state.testers) ? state.testers : [];

  const reconcileProjectAssignments = (list) => {
    if (!Array.isArray(list)) return list;
    return list.map((p) => {
      if (!p || !p.id) return p;
      let pCopy = { ...p };

      if (!pCopy.developer || pCopy.developer === 'Unassigned' || !pCopy.developerId) {
        const assignedDev = validDevs.find((d) =>
          Array.isArray(d.currentProjects) &&
          d.currentProjects.some(
            (cp) => cp && String(cp.id).toUpperCase() === String(pCopy.id).toUpperCase()
          )
        );
        if (assignedDev) {
          const devProj = assignedDev.currentProjects.find(
            (cp) => cp && String(cp.id).toUpperCase() === String(pCopy.id).toUpperCase()
          );
          pCopy.developer = devProj?.developer || assignedDev.name || assignedDev.fullName;
          pCopy.developerId = devProj?.developerId || assignedDev.id || assignedDev.developerId;
          pCopy.developerEmail = devProj?.developerEmail || assignedDev.email || '';
          pCopy.developerSkill = devProj?.developerSkill || assignedDev.primarySkill || '';
          pCopy.developerAvatar = devProj?.developerAvatar || assignedDev.avatar || '';
        }
      }

      if (!pCopy.tester || pCopy.tester === 'Unassigned' || !pCopy.testerId) {
        const assignedTester = validTesters.find((t) =>
          Array.isArray(t.currentProjects) &&
          t.currentProjects.some(
            (cp) => cp && String(cp.id).toUpperCase() === String(pCopy.id).toUpperCase()
          )
        );
        if (assignedTester) {
          const testerProj = assignedTester.currentProjects.find(
            (cp) => cp && String(cp.id).toUpperCase() === String(pCopy.id).toUpperCase()
          );
          pCopy.tester = testerProj?.tester || assignedTester.name || assignedTester.fullName;
          pCopy.testerId = testerProj?.testerId || assignedTester.id || assignedTester.testerId;
          pCopy.testerEmail = testerProj?.testerEmail || assignedTester.email || '';
          pCopy.testerSpecialization =
            testerProj?.testerSpecialization || assignedTester.specialization || assignedTester.role || '';
          pCopy.testerAvatar = testerProj?.testerAvatar || assignedTester.avatar || '';
        }
      }

      return pCopy;
    });
  };

  if (Array.isArray(state.adminProjects)) {
    state.adminProjects = reconcileProjectAssignments(
      state.adminProjects.filter((p) => p && !MOCK_PROJECT_IDS.has(p.id))
    );
  }
  if (Array.isArray(state.projects)) {
    state.projects = reconcileProjectAssignments(
      state.projects.filter((p) => p && !MOCK_PROJECT_IDS.has(p.id))
    );
  }

  return state;
}

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

async function downloadJsonTable(filePath) {
  try {
    const { data, error } = await supabase.storage.from(STORAGE_BUCKET).download(filePath);
    if (error || !data) return null;
    const text = await data.text();
    return JSON.parse(text);
  } catch (err) {
    return null;
  }
}

async function uploadJsonTable(filePath, payload) {
  const jsonText = JSON.stringify(payload, null, 2);
  const body =
    typeof Buffer !== 'undefined'
      ? Buffer.from(jsonText)
      : new Blob([jsonText], { type: 'application/json' });
  const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(filePath, body, {
    contentType: 'application/json',
    upsert: true,
  });
  if (error) throw error;
}

/**
 * Directly fetch table-wise platform data from Supabase Storage fallback
 */
async function fetchDirectFromSupabase() {
  try {
    const [devFile, testerFile, projFile, appFile, authFile] = await Promise.all([
      downloadJsonTable(TABLE_PATHS.developers),
      downloadJsonTable(TABLE_PATHS.testers),
      downloadJsonTable(TABLE_PATHS.projects),
      downloadJsonTable(TABLE_PATHS.applications),
      downloadJsonTable(TABLE_PATHS.authRegistry),
    ]);

    let legacy = null;
    if (!devFile && !testerFile && !projFile && !authFile) {
      legacy = await downloadJsonTable(TABLE_PATHS.legacy);
      if (!legacy) return null;
    }

    return {
      version: '3.0.0-tables',
      updatedAt:
        devFile?.updatedAt ||
        testerFile?.updatedAt ||
        projFile?.updatedAt ||
        legacy?.updatedAt ||
        new Date().toISOString(),
      developers: devFile?.rows || legacy?.developers || [],
      testers: testerFile?.rows || legacy?.testers || [],
      adminProjects: projFile?.rows || legacy?.adminProjects || legacy?.projects || [],
      projects: projFile?.rows || legacy?.projects || legacy?.adminProjects || [],
      applications: appFile?.rows || legacy?.applications || [],
      passwords: authFile?.passwords || legacy?.passwords || {},
      deletedMemberIds: authFile?.deletedMemberIds || legacy?.deletedMemberIds || [],
    };
  } catch (err) {
    console.warn('Direct Supabase table fetch error:', err);
    return null;
  }
}

/**
 * Directly save ONLY the changed table(s) to Supabase Storage fallback
 */
async function saveDirectToSupabase(updates, nextState) {
  try {
    const now = nextState.updatedAt || new Date().toISOString();
    const writes = [];

    if (updates.developers || updates.updateDeveloper || updates.deletedMemberId) {
      writes.push(
        uploadJsonTable(TABLE_PATHS.developers, {
          table: 'developers',
          updatedAt: now,
          rows: nextState.developers || [],
        })
      );
    }
    if (updates.testers || updates.updateTester || updates.deletedMemberId) {
      writes.push(
        uploadJsonTable(TABLE_PATHS.testers, {
          table: 'testers',
          updatedAt: now,
          rows: nextState.testers || [],
        })
      );
    }
    if (updates.adminProjects || updates.projects || updates.updateProject) {
      writes.push(
        uploadJsonTable(TABLE_PATHS.projects, {
          table: 'projects',
          updatedAt: now,
          rows: nextState.adminProjects || nextState.projects || [],
        })
      );
    }
    if (updates.applications || updates.addApplication) {
      writes.push(
        uploadJsonTable(TABLE_PATHS.applications, {
          table: 'applications',
          updatedAt: now,
          rows: nextState.applications || [],
        })
      );
    }
    if (updates.passwords || updates.deletedMemberId || updates.deletedMemberIds) {
      writes.push(
        uploadJsonTable(TABLE_PATHS.authRegistry, {
          table: 'auth_registry',
          updatedAt: now,
          passwords: nextState.passwords || {},
          deletedMemberIds: nextState.deletedMemberIds || [],
        })
      );
    }

    await Promise.all(writes);
    return true;
  } catch (err) {
    console.error('Direct Supabase table upload error:', err);
    return false;
  }
}

/**
 * Fetch all platform data from the live cloud tables.
 * Falls back gracefully to memory or local cache.
 */
export async function fetchLivePlatformData() {
  let liveData = null;

  // 1. Try /api/live-sync endpoint
  const endpoints = getSyncEndpoints();
  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout ? AbortSignal.timeout(4500) : undefined,
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

  // 2. Fallback: Direct Supabase table download
  if (!liveData) {
    liveData = await fetchDirectFromSupabase();
  }

  if (liveData) {
    liveData = sanitizeLivePlatformState(liveData);
    memoryCloudState = liveData;
    syncLiveStateToLocalStorage(liveData);
    return liveData;
  }

  return memoryCloudState;
}

/**
 * Save partial, table-level, or single-record updates to the live cloud database.
 */
export async function saveLivePlatformData(updates = {}) {
  if (!updates || typeof updates !== 'object') return false;

  // 1. Update memory cache immediately
  const currentState = memoryCloudState || {};

  const currentDeletedIds = new Set([
    ...(Array.isArray(currentState.deletedMemberIds) ? currentState.deletedMemberIds : []),
    ...(Array.isArray(updates.deletedMemberIds) ? updates.deletedMemberIds : []),
    ...(updates.deletedMemberId ? [String(updates.deletedMemberId).toLowerCase().trim()] : []),
  ]);

  const mergeById = (prev = [], incoming = [], replace = false) => {
    if (replace && Array.isArray(incoming)) {
      return incoming.filter(
        (item) => item?.id && !currentDeletedIds.has(String(item.id).toLowerCase().trim())
      );
    }
    if (!Array.isArray(incoming)) {
      return (prev || []).filter(
        (item) => item?.id && !currentDeletedIds.has(String(item.id).toLowerCase().trim())
      );
    }
    const map = new Map();
    (prev || []).forEach((item) => {
      if (item?.id && !currentDeletedIds.has(String(item.id).toLowerCase().trim())) {
        map.set(item.id, item);
      }
    });
    (incoming || []).forEach((item) => {
      if (item?.id && !currentDeletedIds.has(String(item.id).toLowerCase().trim())) {
        const existing = map.get(item.id) || {};
        const merged = { ...existing, ...item };

        // Assignment Protection: If existing project had an assigned developer, do not allow
        // a blanket sync with 'Unassigned' or null to strip the developer assignment
        if (
          existing.developer &&
          existing.developer !== 'Unassigned' &&
          (!item.developer || item.developer === 'Unassigned') &&
          !item.explicitUnassignDeveloper
        ) {
          merged.developer = existing.developer;
          merged.developerId = existing.developerId;
          merged.developerEmail = existing.developerEmail || merged.developerEmail;
          merged.developerSkill = existing.developerSkill || merged.developerSkill;
          merged.developerAvatar = existing.developerAvatar || merged.developerAvatar;
        }

        // Assignment Protection: Same for QA Tester
        if (
          existing.tester &&
          existing.tester !== 'Unassigned' &&
          (!item.tester || item.tester === 'Unassigned') &&
          !item.explicitUnassignTester
        ) {
          merged.tester = existing.tester;
          merged.testerId = existing.testerId;
          merged.testerEmail = existing.testerEmail || merged.testerEmail;
          merged.testerSpecialization = existing.testerSpecialization || merged.testerSpecialization;
          merged.testerAvatar = existing.testerAvatar || merged.testerAvatar;
        }

        map.set(item.id, merged);
      }
    });
    return Array.from(map.values());
  };

  const nextPasswords = {
    ...(currentState.passwords || {}),
    ...(updates.passwords || {}),
  };
  if (updates.deletedMemberId) {
    const delKey = String(updates.deletedMemberId).toLowerCase().trim();
    delete nextPasswords[delKey];
  }

  const nextDevelopers = updates.updateDeveloper
    ? mergeById(currentState.developers, [updates.updateDeveloper], false)
    : updates.developers
      ? mergeById(currentState.developers, updates.developers, Boolean(updates.replaceDevelopers))
      : currentState.developers;

  const nextTesters = updates.updateTester
    ? mergeById(currentState.testers, [updates.updateTester], false)
    : updates.testers
      ? mergeById(currentState.testers, updates.testers, Boolean(updates.replaceTesters))
      : currentState.testers;

  const nextProjects = updates.updateProject
    ? mergeById(currentState.adminProjects || currentState.projects, [updates.updateProject], false)
    : updates.adminProjects
      ? mergeById(
          currentState.adminProjects,
          updates.adminProjects,
          Boolean(updates.replaceAdminProjects)
        )
      : updates.projects
        ? mergeById(currentState.projects, updates.projects, false)
        : currentState.adminProjects || currentState.projects;

  const nextApplications = updates.addApplication
    ? mergeById(currentState.applications, [updates.addApplication], false)
    : updates.applications
      ? mergeById(currentState.applications, updates.applications, false)
      : currentState.applications;

  const nextState = sanitizeLivePlatformState({
    ...currentState,
    version: '3.0.0-tables',
    updatedAt: new Date().toISOString(),
    deletedMemberIds: Array.from(currentDeletedIds),
    developers: nextDevelopers,
    testers: nextTesters,
    adminProjects: nextProjects,
    projects: nextProjects,
    passwords: nextPasswords,
    applications: nextApplications,
  });

  memoryCloudState = nextState;
  syncLiveStateToLocalStorage(nextState);

  // 2. Save via /api/live-sync
  const endpoints = getSyncEndpoints();
  let saved = false;

  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
        signal: AbortSignal.timeout ? AbortSignal.timeout(4500) : undefined,
      });
      if (res.ok) {
        const json = await res.json();
        if (json && json.success) {
          if (json.data) {
            memoryCloudState = sanitizeLivePlatformState(json.data);
            syncLiveStateToLocalStorage(memoryCloudState);
          }
          saved = true;
          break;
        }
      }
    } catch (e) {}
  }

  // 3. Fallback: Save directly to Supabase table files
  if (!saved) {
    saved = await saveDirectToSupabase(updates, nextState);
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

  const state = await fetchLivePlatformData();
  if (!state) return null;

  const devs = state.developers || [];
  const testers = state.testers || [];

  const matchedDev = devs.find(
    (d) =>
      (d.email && d.email.toLowerCase().trim() === clean) ||
      (d.id && d.id.toLowerCase().trim() === clean) ||
      (d.developerId && d.developerId.toLowerCase().trim() === clean) ||
      (d.name && d.name.toLowerCase().trim() === clean) ||
      (d.fullName && d.fullName.toLowerCase().trim() === clean)
  );

  if (matchedDev) {
    return { member: matchedDev, role: 'freelancer' };
  }

  const matchedTester = testers.find(
    (t) =>
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
    const clean = sanitizeLivePlatformState(data);

    if (Array.isArray(clean.developers)) {
      localStorage.setItem('dahej_real_v2_developers', JSON.stringify(clean.developers));
      localStorage.setItem('dahej_developers', JSON.stringify(clean.developers));
    }
    if (Array.isArray(clean.adminProjects)) {
      localStorage.setItem('dahej_real_v2_admin_projects', JSON.stringify(clean.adminProjects));
      localStorage.setItem('dahej_admin_projects', JSON.stringify(clean.adminProjects));
    }
    if (Array.isArray(clean.projects)) {
      localStorage.setItem('dahej_real_v2_freelancer_projects', JSON.stringify(clean.projects));
      localStorage.setItem('dahej_freelancer_projects', JSON.stringify(clean.projects));
    }
    if (Array.isArray(clean.testers)) {
      localStorage.setItem('dahej_real_v2_testers', JSON.stringify(clean.testers));
      localStorage.setItem('dahej_testers', JSON.stringify(clean.testers));
    }
    if (clean.passwords && typeof clean.passwords === 'object') {
      const existing = localStorage.getItem('dahej_member_passwords');
      const parsed = existing ? JSON.parse(existing) : {};
      const merged = { ...parsed, ...clean.passwords };
      localStorage.setItem('dahej_member_passwords', JSON.stringify(merged));
    }

    // Purge any stale mock profiles from localStorage
    ['DEV-512', 'DEV-452', 'DEV-892', 'DEV-519', 'DEV-DEMO'].forEach((id) => {
      try {
        localStorage.removeItem(`dahej_profile_${id}`);
      } catch (e) {}
    });
    ['TST-317', 'TST-781', 'TST-841', 'TST-DEMO'].forEach((id) => {
      try {
        localStorage.removeItem(`dahej_tester_profile_${id}`);
      } catch (e) {}
    });
  } catch (e) {
    console.error('Failed to sync live state to localStorage:', e);
  }
}
