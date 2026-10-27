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
      const parsed = JSON.parse(text);

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

      // Merge arrays uniquely by 'id'
      const mergeById = (prev = [], incoming = []) => {
        if (!Array.isArray(incoming)) return prev;
        const map = new Map();
        (prev || []).forEach(item => { if (item?.id) map.set(item.id, item); });
        (incoming || []).forEach(item => { if (item?.id) map.set(item.id, { ...(map.get(item.id) || {}), ...item }); });
        return Array.from(map.values());
      };

      const mergedState = {
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

      const buffer = Buffer.from(JSON.stringify(mergedState, null, 2));

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(STORAGE_FILE_PATH, buffer, {
          contentType: 'application/json',
          upsert: true
        });

      if (uploadError) {
        throw new Error(uploadError.message || 'Supabase upload failed');
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
