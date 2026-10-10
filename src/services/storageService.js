import { supabase } from './supabase.js';

/**
 * Uploads any file directly to a specified Supabase Storage bucket
 * and returns the permanent Public URL.
 * 
 * @param {string} bucket - Storage bucket name ('avatars', 'documents', 'submissions', 'bug-screenshots', 'resumes')
 * @param {string} filePath - Path / unique filename inside bucket
 * @param {File|Blob} file - File object from input[type=file]
 * @returns {Promise<{ url: string, path: string, error: any }>}
 */
export async function uploadFileToBucket(bucket, filePath, file) {
  try {
    if (!file) throw new Error('No file provided');

    // Clean filename (remove spaces & special chars)
    const cleanPath = filePath.replace(/[^a-zA-Z0-9._\-/]/g, '_');

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(cleanPath, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (error) {
      console.error(`Error uploading to ${bucket}:`, error);
      return { url: null, path: null, error };
    }

    // Get permanent public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return {
      url: urlData.publicUrl,
      path: data.path,
      error: null
    };
  } catch (err) {
    console.error('Storage upload exception:', err);
    return { url: null, path: null, error: err.message };
  }
}

/**
 * Uploads a profile avatar image and returns the public image URL
 */
export async function uploadAvatar(userId, file) {
  const ext = file.name ? file.name.split('.').pop() : 'png';
  const filePath = `avatars/${userId || Date.now()}_avatar.${ext}`;
  return await uploadFileToBucket('avatars', filePath, file);
}

/**
 * Uploads an admin specification or project attachment (PDF, DOCX, ZIP, etc.)
 */
export async function uploadProjectDocument(projectId, file) {
  const cleanName = (file.name || 'document.pdf').replace(/\s+/g, '_');
  const filePath = `projects/${projectId || 'general'}/${Date.now()}_${cleanName}`;
  const res = await uploadFileToBucket('documents', filePath, file);
  
  return {
    ...res,
    name: file.name,
    size: file.size,
    type: file.type || 'application/octet-stream',
  };
}

/**
 * Uploads a developer task delivery / code ZIP / submission file
 */
export async function uploadTaskSubmission(taskId, file) {
  const cleanName = (file.name || 'submission.zip').replace(/\s+/g, '_');
  const filePath = `tasks/${taskId || 'general'}/${Date.now()}_${cleanName}`;
  const res = await uploadFileToBucket('submissions', filePath, file);

  return {
    ...res,
    name: file.name,
    size: file.size,
    type: file.type || 'application/octet-stream',
  };
}

/**
 * Uploads a QA Tester bug screenshot or proof
 */
export async function uploadBugScreenshot(testerId, file) {
  const ext = file.name ? file.name.split('.').pop() : 'png';
  const filePath = `bugs/${testerId || 'tester'}/${Date.now()}_screenshot.${ext}`;
  return await uploadFileToBucket('bug-screenshots', filePath, file);
}

/**
 * Uploads a resume / CV for a new freelancer/tester applicant
 */
export async function uploadResume(emailOrId, file) {
  const ext = file.name ? file.name.split('.').pop() : 'pdf';
  const cleanId = (emailOrId || 'applicant').replace(/[^a-zA-Z0-9]/g, '_');
  const filePath = `resumes/${cleanId}_${Date.now()}_resume.${ext}`;
  return await uploadFileToBucket('resumes', filePath, file);
}
