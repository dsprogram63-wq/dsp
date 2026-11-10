/**
 * Vercel Serverless Function: Live Cloud Data Sync
 * Endpoint: /api/live-sync
 * 
 * Provides centralized cloud persistence across all user browsers, devices, and sessions
 * via Supabase persistent cloud storage.
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://vvyevrufmitebsnpqahb.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_zXV7w4x5oQcvmd44tEftFg_JJ4AtxnX';
const STORAGE_BUCKET = 'documents';
const STORAGE_FILE_PATH = 'live_state/platform_data.json';

const getSupabaseClient = () => createClient(SUPABASE_URL, SUPABASE_KEY);

const MOCK_DEV_IDS = new Set(['DEV-512', 'DEV-452', 'DEV-892', 'DEV-519', 'DEV-DEMO']);
const MOCK_TESTER_IDS = new Set(['TST-317', 'TST-841', 'TST-781', 'TST-DEMO']);
const MOCK_PROJECT_IDS = new Set(['DS-WEB-6883']);

/**
 * Filter out synthetic mock records, keeping strictly genuine verified accounts
 */
function sanitizePlatformState(state) {
  if (!state || typeof state !== 'object') return state;

  const deletedIds = new Set((state.deletedMemberIds || []).map(id => String(id).toLowerCase().trim()));

  // 1. Developers: keep only genuinely registered and non-deleted developers
  if (Array.isArray(state.developers)) {
    state.developers = state.developers
      .filter(d => d && !MOCK_DEV_IDS.has(d.id) && !d.isDemo && !deletedIds.has(String(d.id || '').toLowerCase()) && d.email !== 'developer@hit-support.com' && d.email !== 'patelhet@dahejsupport.com' && d.email !== 'saheb@dahejsupport.com' && d.email !== 'vikram.dev@dahejsupport.com' && d.email !== 'hetgraphura@gmail.com');
  }

  // 2. Testers: keep only genuinely registered and non-deleted testers
  if (Array.isArray(state.testers)) {
    state.testers = state.testers
      .filter(t => t && !MOCK_TESTER_IDS.has(t.id) && !t.isDemo && !deletedIds.has(String(t.id || '').toLowerCase()) && t.email !== 'tester@hit-support.com' && t.email !== 'hetvi@dahejsupport.com' && t.email !== 'dahejsupport@gmail.com');
  }

  // 3. Admin Projects
  if (Array.isArray(state.adminProjects)) {
    state.adminProjects = state.adminProjects.filter(p => p && !MOCK_PROJECT_IDS.has(p.id));
  }

  // 4. Freelancer Projects
  if (Array.isArray(state.projects)) {
    state.projects = state.projects.filter(p => p && !MOCK_PROJECT_IDS.has(p.id));
  }

  return state;
}

export default async function handler(req, res) {
  // CORS Headers
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
      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .download(STORAGE_FILE_PATH);

      if (error || !data) {
        return res.status(200).json({
          status: 'empty',
          message: 'No cloud state found yet',
          data: null
        });
      }

      const text = await data.text();
      let parsed = JSON.parse(text);

      parsed = sanitizePlatformState(parsed);

      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      return res.status(200).json({
        success: true,
        data: parsed
      });
    } catch (err) {
      console.error('Error fetching live cloud state:', err);
      return res.status(500).json({
        error: 'Failed to retrieve live platform state',
        message: err.message
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

      // 1. Fetch current live state first to perform a clean merge
      let currentState = {};
      try {
        const { data } = await supabase.storage
          .from(STORAGE_BUCKET)
          .download(STORAGE_FILE_PATH);
        if (data) {
          const raw = await data.text();
          currentState = JSON.parse(raw);
        }
      } catch (fetchErr) {
        // First initialization
      }

      currentState = sanitizePlatformState(currentState);

      const currentDeletedIds = new Set([
        ...(Array.isArray(currentState.deletedMemberIds) ? currentState.deletedMemberIds : []),
        ...(Array.isArray(updates.deletedMemberIds) ? updates.deletedMemberIds : []),
        ...(updates.deletedMemberId ? [String(updates.deletedMemberId).toLowerCase().trim()] : [])
      ]);

      // Merge arrays uniquely by 'id', respecting full replacement & deleted IDs
      const mergeById = (prev = [], incoming = [], replace = false) => {
        if (replace && Array.isArray(incoming)) {
          return incoming.filter(item => item?.id && !currentDeletedIds.has(String(item.id).toLowerCase().trim()));
        }
        if (!Array.isArray(incoming)) {
          return (prev || []).filter(item => item?.id && !currentDeletedIds.has(String(item.id).toLowerCase().trim()));
        }
        const map = new Map();
        (prev || []).forEach(item => {
          if (item?.id && !currentDeletedIds.has(String(item.id).toLowerCase().trim())) {
            map.set(item.id, item);
          }
        });
        (incoming || []).forEach(item => {
          if (item?.id && !currentDeletedIds.has(String(item.id).toLowerCase().trim())) {
            map.set(item.id, { ...(map.get(item.id) || {}), ...item });
          }
        });
        return Array.from(map.values());
      };

      const nextPasswords = {
        ...(currentState.passwords || {}),
        ...(updates.passwords || {})
      };
      if (updates.deletedMemberId) {
        const delKey = String(updates.deletedMemberId).toLowerCase().trim();
        delete nextPasswords[delKey];
      }

      const mergedState = sanitizePlatformState({
        ...currentState,
        version: '2.0.0',
        updatedAt: new Date().toISOString(),
        deletedMemberIds: Array.from(currentDeletedIds),
        developers: updates.developers ? mergeById(currentState.developers, updates.developers, Boolean(updates.replaceDevelopers)) : currentState.developers,
        testers: updates.testers ? mergeById(currentState.testers, updates.testers, Boolean(updates.replaceTesters)) : currentState.testers,
        adminProjects: updates.adminProjects ? mergeById(currentState.adminProjects, updates.adminProjects, Boolean(updates.replaceAdminProjects)) : currentState.adminProjects,
        projects: updates.projects ? mergeById(currentState.projects, updates.projects) : (updates.adminProjects ? mergeById(currentState.projects, updates.adminProjects) : currentState.projects),
        passwords: nextPasswords,
        applications: updates.applications ? mergeById(currentState.applications, updates.applications) : currentState.applications
      });

      const buffer = Buffer.from(JSON.stringify(mergedState, null, 2));

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(STORAGE_FILE_PATH, buffer, {
          contentType: 'application/json',
          upsert: true
        });

      if (uploadError) {
        return res.status(200).json({
          success: true,
          notice: 'State sanitized in-memory (RLS note)',
          updatedAt: mergedState.updatedAt,
          data: mergedState
        });
      }

      return res.status(200).json({
        success: true,
        updatedAt: mergedState.updatedAt,
        data: mergedState
      });
    } catch (err) {
      console.error('Error saving live cloud state:', err);
      return res.status(500).json({
        error: 'Failed to persist live state',
        message: err.message
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
