/**
 * Vercel Serverless Function: Table-Wise Live Cloud Data Sync
 * Endpoint: /api/live-sync
 *
 * Persists data independently per domain table:
 *  - developers
 *  - testers
 *  - projects
 *  - applications
 *  - auth_registry (passwords + permanently deleted member IDs)
 *
 * Primary storage uses dedicated per-table JSON stores in Supabase Storage (`db_tables/*.json`),
 * and automatically syncs with PostgreSQL SQL tables (`public.developers`, `public.testers`,
 * `public.projects`, `public.member_applications`, `public.member_registry_meta`) whenever
 * `SUPABASE_SERVICE_ROLE_KEY` or `supabase/tables_setup.sql` policies are active.
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  'https://vvyevrufmitebsnpqahb.supabase.co';

const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SECRET_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  'sb_publishable_zXV7w4x5oQcvmd44tEftFg_JJ4AtxnX';

const STORAGE_BUCKET = 'avatars';
const TABLE_PATHS = {
  developers: 'db_tables/developers.json',
  testers: 'db_tables/testers.json',
  projects: 'db_tables/projects.json',
  applications: 'db_tables/applications.json',
  authRegistry: 'db_tables/auth_registry.json',
  legacy: 'live_state/platform_data.json',
};

const getSupabaseClient = () => createClient(SUPABASE_URL, SUPABASE_KEY);

const MOCK_DEV_IDS = new Set(['DEV-512', 'DEV-452', 'DEV-892', 'DEV-519', 'DEV-DEMO']);
const MOCK_TESTER_IDS = new Set(['TST-317', 'TST-841', 'TST-781', 'TST-DEMO']);
const MOCK_PROJECT_IDS = new Set(['DS-WEB-6883']);

const MOCK_DEV_EMAILS = new Set([
  'developer@hit-support.com',
  'patelhet@dahejsupport.com',
  'saheb@dahejsupport.com',
  'vikram.dev@dahejsupport.com',
  'hetgraphura@gmail.com',
]);

const MOCK_TESTER_EMAILS = new Set([
  'tester@hit-support.com',
  'hetvi@dahejsupport.com',
  'dahejsupport@gmail.com',
]);

function filterValidDevelopers(list = [], deletedIds = new Set()) {
  if (!Array.isArray(list)) return [];
  return list.filter(
    (d) =>
      d &&
      d.id &&
      !MOCK_DEV_IDS.has(d.id) &&
      !d.isDemo &&
      !deletedIds.has(String(d.id).toLowerCase().trim()) &&
      !MOCK_DEV_EMAILS.has(String(d.email || '').toLowerCase().trim())
  );
}

function filterValidTesters(list = [], deletedIds = new Set()) {
  if (!Array.isArray(list)) return [];
  return list.filter(
    (t) =>
      t &&
      t.id &&
      !MOCK_TESTER_IDS.has(t.id) &&
      !t.isDemo &&
      !deletedIds.has(String(t.id).toLowerCase().trim()) &&
      !MOCK_TESTER_EMAILS.has(String(t.email || '').toLowerCase().trim())
  );
}

function filterValidProjects(list = []) {
  if (!Array.isArray(list)) return [];
  return list.filter((p) => p && p.id && !MOCK_PROJECT_IDS.has(p.id));
}

function mergeRowsById(prev = [], incoming = [], replace = false, deletedIds = new Set()) {
  if (replace && Array.isArray(incoming)) {
    return incoming.filter(
      (item) => item?.id && !deletedIds.has(String(item.id).toLowerCase().trim())
    );
  }
  if (!Array.isArray(incoming)) {
    return (prev || []).filter(
      (item) => item?.id && !deletedIds.has(String(item.id).toLowerCase().trim())
    );
  }
  const map = new Map();
  (prev || []).forEach((item) => {
    if (item?.id && !deletedIds.has(String(item.id).toLowerCase().trim())) {
      map.set(item.id, item);
    }
  });
  incoming.forEach((item) => {
    if (item?.id && !deletedIds.has(String(item.id).toLowerCase().trim())) {
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
}

async function readStorageJson(supabase, filePath) {
  try {
    const { data, error } = await supabase.storage.from(STORAGE_BUCKET).download(filePath);
    if (error || !data) return null;
    const text = await data.text();
    return JSON.parse(text);
  } catch (err) {
    return null;
  }
}

async function writeStorageJson(supabase, filePath, payload) {
  const buffer = Buffer.from(JSON.stringify(payload, null, 2));
  const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(filePath, buffer, {
    contentType: 'application/json',
    upsert: true,
  });
  if (error) {
    throw new Error(`Storage write failed for ${filePath}: ${error.message}`);
  }
}

/**
 * Attempt PostgreSQL table read if schema & RLS/service role are active.
 * Returns null gracefully if table is not created yet or RLS restricts anon reads.
 */
async function tryReadSqlRows(supabase, tableName) {
  try {
    const { data, error } = await supabase.from(tableName).select('data');
    if (error || !Array.isArray(data) || data.length === 0) return null;
    return data.map((r) => r.data).filter(Boolean);
  } catch (e) {
    return null;
  }
}

/**
 * Mirror rows to PostgreSQL table if available & permitted; never fails request if RLS is locked.
 */
async function trySyncSqlTable(supabase, tableName, rows = [], mapRow, replaceAll = false, deletedId = null) {
  try {
    if (deletedId) {
      await supabase.from(tableName).delete().ilike('id', deletedId);
    }
    if (replaceAll) {
      const ids = rows.map((r) => r.id).filter(Boolean);
      const { data: existing, error: selErr } = await supabase.from(tableName).select('id');
      if (selErr) return false;
      const toDelete = (existing || []).map((r) => r.id).filter((id) => !ids.includes(id));
      for (const delId of toDelete) {
        await supabase.from(tableName).delete().eq('id', delId);
      }
    }
    if (rows.length > 0) {
      const sqlRows = rows.map(mapRow);
      const { error } = await supabase.from(tableName).upsert(sqlRows, { onConflict: 'id' });
      return !error;
    }
    return true;
  } catch (e) {
    return false;
  }
}

function mapDeveloperSqlRow(d) {
  return {
    id: d.id,
    developer_id: d.developerId || d.id,
    name: d.name || d.fullName || 'Developer',
    full_name: d.fullName || d.name || 'Developer',
    username: d.username || d.fullName || d.name || '',
    email: d.email || '',
    mobile: d.mobile || '',
    avatar: d.avatar || '',
    primary_skill: d.primarySkill || '',
    experience: d.experience || '',
    portfolio_url: d.portfolioUrl || '',
    reference_name: d.referenceName || '',
    referral_code: d.referralCode || '',
    reference_id: d.referenceId || '',
    referral_trust_id: d.referralTrustId || '',
    status: d.status || 'Pending',
    availability: d.availability || 'Pending Approval',
    password: d.password || null,
    joining_date: d.joiningDate || '',
    data: d,
    updated_at: new Date().toISOString(),
  };
}

function mapTesterSqlRow(t) {
  return {
    id: t.id,
    tester_id: t.testerId || t.id,
    name: t.name || t.fullName || 'QA Tester',
    full_name: t.fullName || t.name || 'QA Tester',
    username: t.username || t.fullName || t.name || '',
    email: t.email || '',
    mobile: t.mobile || '',
    avatar: t.avatar || '',
    role: t.role || 'QA / Software Tester',
    specialization: t.specialization || '',
    testing_tools: t.testingTools || '',
    experience: t.experience || '',
    reference_name: t.referenceName || '',
    referral_code: t.referralCode || '',
    reference_id: t.referenceId || '',
    referral_trust_id: t.referralTrustId || '',
    status: t.status || 'Pending',
    availability: t.availability || 'Pending Approval',
    password: t.password || null,
    joining_date: t.joiningDate || '',
    data: t,
    updated_at: new Date().toISOString(),
  };
}

function mapProjectSqlRow(p) {
  return {
    id: p.id,
    name: p.name || 'Untitled Project',
    client_name: p.clientName || p.client || '',
    developer_id: p.developerId || null,
    developer_name: p.developer || '',
    developer_email: p.developerEmail || '',
    tester_id: p.testerId || null,
    tester_name: p.tester || '',
    tester_email: p.testerEmail || '',
    status: p.status || 'Pending',
    testing_status: p.testingStatus || 'Pending',
    progress: Number(p.progress) || 0,
    data: p,
    updated_at: new Date().toISOString(),
  };
}

function mapApplicationSqlRow(a) {
  return {
    id: a.id,
    role_track: a.roleTrack || a.role || 'developer',
    full_name: a.fullName || a.name || '',
    email: a.email || '',
    mobile: a.mobile || a.mobileNumber || '',
    avatar: a.avatar || '',
    referral_code: a.referralCode || a.referenceId || '',
    reference_name: a.referenceName || '',
    status: a.status || 'Pending',
    data: a,
    updated_at: new Date().toISOString(),
  };
}

/**
 * Load all tables cleanly, migrating once from legacy platform_data.json if needed
 */
async function loadAllTables(supabase) {
  const [devFile, testerFile, projFile, appFile, authFile, sqlDevs, sqlTesters, sqlProjs] =
    await Promise.all([
      readStorageJson(supabase, TABLE_PATHS.developers),
      readStorageJson(supabase, TABLE_PATHS.testers),
      readStorageJson(supabase, TABLE_PATHS.projects),
      readStorageJson(supabase, TABLE_PATHS.applications),
      readStorageJson(supabase, TABLE_PATHS.authRegistry),
      tryReadSqlRows(supabase, 'developers'),
      tryReadSqlRows(supabase, 'testers'),
      tryReadSqlRows(supabase, 'projects'),
    ]);

  let legacy = null;
  if (!devFile && !testerFile && !projFile && !authFile) {
    legacy = await readStorageJson(supabase, TABLE_PATHS.legacy);
  }

  const deletedMemberIds = Array.isArray(authFile?.deletedMemberIds)
    ? authFile.deletedMemberIds
    : Array.isArray(legacy?.deletedMemberIds)
      ? legacy.deletedMemberIds
      : [];

  const deletedSet = new Set(deletedMemberIds.map((id) => String(id).toLowerCase().trim()));

  const rawDevelopers = sqlDevs || devFile?.rows || legacy?.developers || [];
  const rawTesters = sqlTesters || testerFile?.rows || legacy?.testers || [];
  const rawProjects = sqlProjs || projFile?.rows || legacy?.adminProjects || legacy?.projects || [];
  const rawApplications = appFile?.rows || legacy?.applications || [];
  const passwords = authFile?.passwords || legacy?.passwords || {};

  const validDevelopers = filterValidDevelopers(rawDevelopers, deletedSet);
  const validTesters = filterValidTesters(rawTesters, deletedSet);
  const validProjects = filterValidProjects(rawProjects);

  // Cross-reconcile project assignments from developer & tester records
  let projectsReconciled = false;
  const reconciledProjects = validProjects.map((p) => {
    if (!p || !p.id) return p;
    let projCopy = { ...p };

    const isDevUnassigned =
      !projCopy.developer ||
      projCopy.developer === 'Unassigned' ||
      !projCopy.developerId;

    if (isDevUnassigned) {
      const assignedDev = validDevelopers.find((d) =>
        Array.isArray(d.currentProjects) &&
        d.currentProjects.some(
          (cp) => cp && String(cp.id).toUpperCase() === String(projCopy.id).toUpperCase()
        )
      );
      if (assignedDev) {
        const devProj = assignedDev.currentProjects.find(
          (cp) => cp && String(cp.id).toUpperCase() === String(projCopy.id).toUpperCase()
        );
        projCopy.developer = devProj?.developer || assignedDev.name || assignedDev.fullName;
        projCopy.developerId = devProj?.developerId || assignedDev.id || assignedDev.developerId;
        projCopy.developerEmail = devProj?.developerEmail || assignedDev.email || '';
        projCopy.developerSkill = devProj?.developerSkill || assignedDev.primarySkill || '';
        projCopy.developerAvatar = devProj?.developerAvatar || assignedDev.avatar || '';
        projectsReconciled = true;
      }
    }

    const isTesterUnassigned =
      !projCopy.tester ||
      projCopy.tester === 'Unassigned' ||
      !projCopy.testerId;

    if (isTesterUnassigned) {
      const assignedTester = validTesters.find((t) =>
        Array.isArray(t.currentProjects) &&
        t.currentProjects.some(
          (cp) => cp && String(cp.id).toUpperCase() === String(projCopy.id).toUpperCase()
        )
      );
      if (assignedTester) {
        const testerProj = assignedTester.currentProjects.find(
          (cp) => cp && String(cp.id).toUpperCase() === String(projCopy.id).toUpperCase()
        );
        projCopy.tester = testerProj?.tester || assignedTester.name || assignedTester.fullName;
        projCopy.testerId = testerProj?.testerId || assignedTester.id || assignedTester.testerId;
        projCopy.testerEmail = testerProj?.testerEmail || assignedTester.email || '';
        projCopy.testerSpecialization =
          testerProj?.testerSpecialization || assignedTester.specialization || assignedTester.role || '';
        projCopy.testerAvatar = testerProj?.testerAvatar || assignedTester.avatar || '';
        projectsReconciled = true;
      }
    }

    return projCopy;
  });

  if (projectsReconciled && supabase) {
    writeStorageJson(supabase, TABLE_PATHS.projects, {
      table: 'projects',
      updatedAt: new Date().toISOString(),
      rows: reconciledProjects,
    }).catch(() => {});
  }

  return {
    developers: validDevelopers,
    testers: validTesters,
    projects: reconciledProjects,
    applications: Array.isArray(rawApplications) ? rawApplications : [],
    passwords,
    deletedMemberIds,
    storageMode: sqlDevs || sqlTesters || sqlProjs ? 'postgres+table-storage' : 'table-storage',
    updatedAt:
      devFile?.updatedAt ||
      testerFile?.updatedAt ||
      projFile?.updatedAt ||
      legacy?.updatedAt ||
      new Date().toISOString(),
  };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const supabase = getSupabaseClient();

  if (req.method === 'GET') {
    try {
      const tables = await loadAllTables(supabase);

      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      return res.status(200).json({
        success: true,
        storageMode: tables.storageMode,
        data: {
          version: '3.0.0-tables',
          updatedAt: tables.updatedAt,
          developers: tables.developers,
          testers: tables.testers,
          adminProjects: tables.projects,
          projects: tables.projects,
          applications: tables.applications,
          passwords: tables.passwords,
          deletedMemberIds: tables.deletedMemberIds,
        },
      });
    } catch (err) {
      console.error('Error fetching table-wise cloud state:', err);
      return res.status(500).json({
        error: 'Failed to retrieve live platform tables',
        message: err.message,
      });
    }
  }

  if (req.method === 'POST') {
    try {
      let body = req.body;
      if (typeof body === 'string') {
        try {
          body = JSON.parse(body);
        } catch (e) {
          return res.status(400).json({ error: 'Malformed JSON payload' });
        }
      }

      const updates = body || {};
      const now = new Date().toISOString();

      // Load current table state cleanly
      const current = await loadAllTables(supabase);

      const deletedSet = new Set([
        ...current.deletedMemberIds.map((id) => String(id).toLowerCase().trim()),
        ...(Array.isArray(updates.deletedMemberIds)
          ? updates.deletedMemberIds.map((id) => String(id).toLowerCase().trim())
          : []),
        ...(updates.deletedMemberId ? [String(updates.deletedMemberId).toLowerCase().trim()] : []),
      ]);

      const writePromises = [];

      // 1. Auth Registry Table (Passwords & Deleted IDs)
      let nextPasswords = { ...(current.passwords || {}), ...(updates.passwords || {}) };
      if (updates.deletedMemberId) {
        delete nextPasswords[String(updates.deletedMemberId).toLowerCase().trim()];
      }
      const deletedArr = Array.from(deletedSet);
      const authChanged = Boolean(
        updates.passwords || updates.deletedMemberId || updates.deletedMemberIds
      );
      if (authChanged) {
        writePromises.push(
          writeStorageJson(supabase, TABLE_PATHS.authRegistry, {
            table: 'auth_registry',
            updatedAt: now,
            passwords: nextPasswords,
            deletedMemberIds: deletedArr,
          })
        );
      }

      // 2. Developers Table (Independent table write & atomic record upsert)
      let nextDevelopers = current.developers;
      const devChanged = Boolean(
        updates.developers || updates.updateDeveloper || updates.deletedMemberId
      );
      if (devChanged) {
        if (updates.updateDeveloper && updates.updateDeveloper.id) {
          nextDevelopers = mergeRowsById(
            current.developers,
            [updates.updateDeveloper],
            false,
            deletedSet
          );
        } else if (Array.isArray(updates.developers)) {
          nextDevelopers = mergeRowsById(
            current.developers,
            updates.developers,
            Boolean(updates.replaceDevelopers),
            deletedSet
          );
        } else {
          nextDevelopers = filterValidDevelopers(current.developers, deletedSet);
        }
        nextDevelopers = filterValidDevelopers(nextDevelopers, deletedSet);

        writePromises.push(
          writeStorageJson(supabase, TABLE_PATHS.developers, {
            table: 'developers',
            updatedAt: now,
            rows: nextDevelopers,
          })
        );
        writePromises.push(
          trySyncSqlTable(
            supabase,
            'developers',
            nextDevelopers,
            mapDeveloperSqlRow,
            Boolean(updates.replaceDevelopers),
            updates.deletedMemberId
          )
        );
      }

      // 3. Testers Table (Independent table write & atomic record upsert)
      let nextTesters = current.testers;
      const testerChanged = Boolean(
        updates.testers || updates.updateTester || updates.deletedMemberId
      );
      if (testerChanged) {
        if (updates.updateTester && updates.updateTester.id) {
          nextTesters = mergeRowsById(current.testers, [updates.updateTester], false, deletedSet);
        } else if (Array.isArray(updates.testers)) {
          nextTesters = mergeRowsById(
            current.testers,
            updates.testers,
            Boolean(updates.replaceTesters),
            deletedSet
          );
        } else {
          nextTesters = filterValidTesters(current.testers, deletedSet);
        }
        nextTesters = filterValidTesters(nextTesters, deletedSet);

        writePromises.push(
          writeStorageJson(supabase, TABLE_PATHS.testers, {
            table: 'testers',
            updatedAt: now,
            rows: nextTesters,
          })
        );
        writePromises.push(
          trySyncSqlTable(
            supabase,
            'testers',
            nextTesters,
            mapTesterSqlRow,
            Boolean(updates.replaceTesters),
            updates.deletedMemberId
          )
        );
      }

      // 4. Projects Table (Independent table write & atomic record upsert)
      let nextProjects = current.projects;
      const projChanged = Boolean(
        updates.adminProjects || updates.projects || updates.updateProject
      );
      if (projChanged) {
        if (updates.updateProject && updates.updateProject.id) {
          nextProjects = mergeRowsById(current.projects, [updates.updateProject], false, deletedSet);
        } else {
          const incomingProjs = updates.adminProjects || updates.projects;
          nextProjects = mergeRowsById(
            current.projects,
            incomingProjs,
            Boolean(updates.replaceAdminProjects),
            deletedSet
          );
        }
        nextProjects = filterValidProjects(nextProjects);

        writePromises.push(
          writeStorageJson(supabase, TABLE_PATHS.projects, {
            table: 'projects',
            updatedAt: now,
            rows: nextProjects,
          })
        );
        writePromises.push(
          trySyncSqlTable(
            supabase,
            'projects',
            nextProjects,
            mapProjectSqlRow,
            Boolean(updates.replaceAdminProjects),
            null
          )
        );
      }

      // 5. Applications Table
      let nextApplications = current.applications;
      if (updates.applications || updates.addApplication) {
        const incomingApps = updates.addApplication
          ? [updates.addApplication]
          : updates.applications;
        nextApplications = mergeRowsById(current.applications, incomingApps, false, deletedSet);
        writePromises.push(
          writeStorageJson(supabase, TABLE_PATHS.applications, {
            table: 'applications',
            updatedAt: now,
            rows: nextApplications,
          })
        );
        writePromises.push(
          trySyncSqlTable(
            supabase,
            'member_applications',
            nextApplications,
            mapApplicationSqlRow,
            false,
            null
          )
        );
      }

      await Promise.all(writePromises);

      const responseData = {
        version: '3.0.0-tables',
        updatedAt: now,
        developers: nextDevelopers,
        testers: nextTesters,
        adminProjects: nextProjects,
        projects: nextProjects,
        applications: nextApplications,
        passwords: nextPasswords,
        deletedMemberIds: deletedArr,
      };

      return res.status(200).json({
        success: true,
        updatedAt: now,
        storageMode: current.storageMode,
        data: responseData,
      });
    } catch (err) {
      console.error('Error persisting table-wise cloud state:', err);
      return res.status(500).json({
        error: 'Failed to persist live tables',
        message: err.message,
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
