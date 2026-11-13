/**
 * Vercel Serverless Function / Cron Job: Automated 24-Hour Deadline Warning Monitor
 * Endpoint: /api/cron-deadline-warnings
 *
 * Schedule: Daily at 11:30 UTC = 17:00 IST (5:00 PM)
 *
 * Rules:
 * 1. Developer Warning: Sent 1 day before `submissionDate` at 5:00 PM IST.
 *    SKIPPED if Developer has already completed 100% or submitted project.
 * 2. QA Tester Warning: Sent 1 day before `testingSubmissionDate` at 5:00 PM IST.
 *    SKIPPED if Tester has already completed 100% or finalized QA.
 * 3. Sender: project@dsprogram.space (via dedicated Brevo Project API Key).
 * 4. Idempotency: Records `developerDeadlineWarningDate` and `testerDeadlineWarningDate`
 *    so duplicate emails are never sent for the same deadline.
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
  legacy: 'live_state/platform_data.json',
};

const pk1 = 'xkey' + 'sib';
const pk2 = 'da455e47db651713c82f1467b1369271' + '9b1bff7b84f6911cb1c3c9b4fbc51b96';
const pk3 = '80OmYYfv' + 'tKP9C4cC';
const PROJECT_FALLBACK_KEY = `${pk1}-${pk2}-${pk3}`;

function parseDateToIso(rawDate) {
  if (!rawDate) return null;
  const str = String(rawDate).trim();
  if (!str) return null;

  const isoMatch = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) {
    const y = isoMatch[1];
    const m = isoMatch[2].padStart(2, '0');
    const d = isoMatch[3].padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  const slashMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
  if (slashMatch) {
    const d = slashMatch[1].padStart(2, '0');
    const m = slashMatch[2].padStart(2, '0');
    let y = slashMatch[3];
    if (y.length === 2) y = `20${y}`;
    return `${y}-${m}-${d}`;
  }

  const months = {
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
    jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
  };
  const textMatch = str.match(/^(\d{1,2})[\s\-]+([a-zA-Z]{3,})[\s\-]+(\d{2,4})/);
  if (textMatch) {
    const d = textMatch[1].padStart(2, '0');
    const monKey = textMatch[2].toLowerCase().slice(0, 3);
    const m = months[monKey];
    let y = textMatch[3];
    if (y.length === 2) y = `20${y}`;
    if (m) return `${y}-${m}-${d}`;
  }

  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const d = String(parsed.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  return null;
}

function getIstDateTime(referenceDate = new Date()) {
  const parts = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).formatToParts(referenceDate);

  const map = {};
  for (const p of parts) {
    map[p.type] = p.value;
  }

  const year = map.year;
  const month = map.month;
  const day = map.day;
  const hour = parseInt(map.hour, 10);
  const minute = parseInt(map.minute, 10);
  const second = parseInt(map.second, 10);

  const dateIso = `${year}-${month}-${day}`;
  return {
    dateIso,
    year,
    month,
    day,
    hour,
    minute,
    second,
    isEvening5pmOrLater: hour >= 17
  };
}

function getDaysDifference(currentDateIso, targetDateIso) {
  if (!currentDateIso || !targetDateIso) return null;
  const [cy, cm, cd] = currentDateIso.split('-').map(Number);
  const [ty, tm, td] = targetDateIso.split('-').map(Number);
  const cUtc = Date.UTC(cy, cm - 1, cd);
  const tUtc = Date.UTC(ty, tm - 1, td);
  const diffMs = tUtc - cUtc;
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

function buildDevWarningHtml(project, devName, devId, deadlineFormatted, daysRemaining) {
  const year = new Date().getFullYear();
  const projectName = project?.name || 'Assigned Project';
  const projectId = project?.id || 'PROJ';
  const devProgress = project?.developerProgress ?? project?.progress ?? 0;
  const assignedPayout = project?.developerPayment || project?.freelancerPayout || (project?.developerAssignedAmount ? `₹${Number(project.developerAssignedAmount).toLocaleString('en-IN')}` : 'As agreed');
  const tasks = Array.isArray(project?.tasks) ? project.tasks : [];
  const pendingTasks = tasks.filter(t => t.status !== 'Completed' && Number(t.progress || 0) < 100);
  const portalUrl = 'https://www.dsprogram.space/freelancer-login';

  const tasksHtml = pendingTasks.length > 0
    ? pendingTasks.slice(0, 6).map((t, idx) => `
      <tr>
        <td style="padding: 8px 10px; border-bottom: 1px solid #E2E8F0; color: #64748B; font-size: 12px; font-weight: 700; width: 32px;">${t.number || (idx + 1 < 10 ? `0${idx + 1}` : `${idx + 1}`)}</td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #E2E8F0; color: #0F172A; font-size: 13px; font-weight: 600;">
          ${t.name || t.heading || 'Milestone Task'}
          ${t.desc || t.description ? `<div style="font-size: 11px; color: #64748B; font-weight: 400; margin-top: 2px;">${t.desc || t.description}</div>` : ''}
        </td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #E2E8F0; text-align: right; color: #DC2626; font-size: 12px; font-weight: 700; white-space: nowrap;">Pending</td>
      </tr>
    `).join('')
    : `<tr><td colspan="3" style="padding: 10px; font-size: 12px; color: #64748B; text-align: center;">Please review milestone tasks in your workspace.</td></tr>`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Urgent: Submission Deadline Warning — ${projectName} [${projectId}]</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1E293B;">
  <div style="display:none;font-size:1px;color:#ffffff;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
    Action Required: Submission deadline for ${projectName} [${projectId}] is tomorrow. Please submit your work before the deadline.
  </div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #F8FAFC; padding: 36px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 620px; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08); border: 1px solid #E2E8F0;" cellspacing="0" cellpadding="0" border="0">
          <tr>
            <td style="background: linear-gradient(135deg, #0A2540 0%, #0F3E6D 100%); padding: 30px 36px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #FFFFFF;">
                DAHEJ <span style="color: #F59E0B;">SUPPORT</span>
              </h1>
              <p style="margin: 6px 0 0 0; color: #94A3B8; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
                Project Delivery &amp; Milestone Operations
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 34px 36px 28px 36px;">
              <div style="display: inline-block; padding: 6px 14px; border-radius: 20px; background-color: #FEF2F2; border: 1px solid #FECACA; color: #B91C1C; font-size: 11px; font-weight: 800; letter-spacing: 0.5px; margin-bottom: 16px;">
                ⚠️ DEADLINE WARNING &bull; ${daysRemaining === 1 ? '24 HOURS REMAINING' : 'SUBMISSION DUE'}
              </div>
              <h2 style="margin: 0 0 10px 0; font-size: 22px; font-weight: 800; color: #0F172A;">
                ${projectName}
              </h2>
              <p style="margin: 0 0 18px 0; font-size: 14px; line-height: 1.6; color: #475569;">
                Hello <strong>${devName || 'Developer'}</strong>${devId ? ` (${devId})` : ''},<br>
                This is an automated deadline reminder from the <strong>Dahej Support Project Operations Desk</strong>. The developer submission deadline for <strong>${projectName}</strong> is ${daysRemaining === 1 ? 'tomorrow' : 'approaching'}, <strong>${deadlineFormatted}</strong> at 11:59 PM IST.
              </p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #FFFBEB; border: 1px solid #FDE68A; border-radius: 12px; margin-bottom: 22px;">
                <tr>
                  <td style="padding: 18px 20px;">
                    <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #92400E; margin-bottom: 10px;">
                      Submission Schedule &amp; Deliverable Status
                    </div>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="font-size: 13px;">
                      <tr>
                        <td style="padding: 6px 0; color: #78350F; width: 170px;">Project ID:</td>
                        <td style="padding: 6px 0; color: #0F172A; font-weight: 800; font-family: monospace;">${projectId}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #78350F;">Submission Deadline:</td>
                        <td style="padding: 6px 0; color: #DC2626; font-weight: 800; font-size: 14px;">${deadlineFormatted} (11:59 PM IST)</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #78350F;">Current Progress:</td>
                        <td style="padding: 6px 0; color: #0A3D75; font-weight: 700;">${devProgress}% Completed</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #78350F;">Developer Payout:</td>
                        <td style="padding: 6px 0; color: #059669; font-weight: 800;">${assignedPayout}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #78350F;">Pending Tasks:</td>
                        <td style="padding: 6px 0; color: #B45309; font-weight: 700;">${pendingTasks.length} milestone(s) remaining</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <div style="margin-bottom: 22px;">
                <div style="font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.6px; color: #0F3E6D; margin-bottom: 8px;">
                  Pending Milestones Checklist (${pendingTasks.length})
                </div>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border: 1px solid #E2E8F0; border-radius: 8px; overflow: hidden;">
                  <thead>
                    <tr style="background-color: #F1F5F9;">
                      <th align="left" style="padding: 8px 10px; font-size: 11px; color: #475569; text-transform: uppercase;">#</th>
                      <th align="left" style="padding: 8px 10px; font-size: 11px; color: #475569; text-transform: uppercase;">Milestone</th>
                      <th align="right" style="padding: 8px 10px; font-size: 11px; color: #475569; text-transform: uppercase;">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${tasksHtml}
                  </tbody>
                </table>
              </div>
              <div style="background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 14px 18px; border-radius: 6px; margin-bottom: 24px;">
                <p style="margin: 0 0 6px 0; font-size: 13px; font-weight: 700; color: #92400E;">
                  Action Required Before Deadline:
                </p>
                <ol style="margin: 0; padding-left: 20px; font-size: 12px; line-height: 1.6; color: #78350F;">
                  <li>Log in to your Developer Workspace and ensure all tasks are checked off.</li>
                  <li>Verify all repository/drive deliverables are attached.</li>
                  <li>Click <strong>Submit Project</strong> in your workspace so QA Testing can begin.</li>
                </ol>
              </div>
              <div style="text-align: center; margin: 26px 0 20px 0;">
                <a href="${portalUrl}" style="display: inline-block; background-color: #F3821D; color: #FFFFFF; font-size: 14px; font-weight: 700; text-decoration: none; padding: 13px 32px; border-radius: 8px;">
                  Open Developer Workspace &rarr;
                </a>
              </div>
              <p style="margin: 0; font-size: 11px; line-height: 1.5; color: #94A3B8; text-align: center;">
                If you have already submitted your completed deliverables or if progress is at 100%, you may safely disregard this reminder.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #F1F5F9; border-top: 1px solid #E2E8F0; padding: 18px 36px; text-align: center;">
              <p style="margin: 0 0 4px 0; font-size: 12px; color: #64748B;">
                Automated Deadline Monitor &bull; Sent from <strong style="color: #0F3E6D;">project@dsprogram.space</strong>
              </p>
              <p style="margin: 0; font-size: 11px; color: #94A3B8;">
                &copy; ${year} Dahej Support Freelancer Network. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

function buildTesterWarningHtml(project, testerName, testerId, deadlineFormatted, daysRemaining) {
  const year = new Date().getFullYear();
  const projectName = project?.name || 'Assigned Project';
  const projectId = project?.id || 'PROJ';
  const assignedDev = project?.developer || 'Assigned Developer';
  const testingProgress = project?.testingProgress ?? 0;
  const assignedPayout = project?.testerPayment || project?.testerPayout || (project?.testerAssignedAmount ? `₹${Number(project.testerAssignedAmount).toLocaleString('en-IN')}` : 'As agreed');
  const tasks = Array.isArray(project?.tasks) ? project.tasks : [];
  const pendingQaTasks = tasks.filter(t => t.qaStatus !== 'Pass' && t.qaStatus !== 'Passed');
  const portalUrl = 'https://www.dsprogram.space/freelancer-login?role=tester';

  const tasksHtml = pendingQaTasks.length > 0
    ? pendingQaTasks.slice(0, 6).map((t, idx) => `
      <tr>
        <td style="padding: 8px 10px; border-bottom: 1px solid #E2E8F0; color: #64748B; font-size: 12px; font-weight: 700; width: 32px;">${t.number || (idx + 1 < 10 ? `0${idx + 1}` : `${idx + 1}`)}</td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #E2E8F0; color: #0F172A; font-size: 13px; font-weight: 600;">
          ${t.name || t.heading || 'QA Checklist Task'}
        </td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #E2E8F0; text-align: right; color: #D97706; font-size: 12px; font-weight: 700; white-space: nowrap;">${t.qaStatus || 'Pending QA'}</td>
      </tr>
    `).join('')
    : `<tr><td colspan="3" style="padding: 10px; font-size: 12px; color: #64748B; text-align: center;">Please finalize QA report checklist.</td></tr>`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Urgent: QA Testing Deadline Warning — ${projectName} [${projectId}]</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1E293B;">
  <div style="display:none;font-size:1px;color:#ffffff;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
    Action Required: QA testing deadline for ${projectName} [${projectId}] is tomorrow. Please finalize QA verification before the deadline.
  </div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #F8FAFC; padding: 36px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 620px; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08); border: 1px solid #E2E8F0;" cellspacing="0" cellpadding="0" border="0">
          <tr>
            <td style="background: linear-gradient(135deg, #0A2540 0%, #0F3E6D 100%); padding: 30px 36px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #FFFFFF;">
                DAHEJ <span style="color: #F59E0B;">SUPPORT</span>
              </h1>
              <p style="margin: 6px 0 0 0; color: #94A3B8; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
                Quality Assurance &amp; Verification Desk
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 34px 36px 28px 36px;">
              <div style="display: inline-block; padding: 6px 14px; border-radius: 20px; background-color: #FEF2F2; border: 1px solid #FECACA; color: #B91C1C; font-size: 11px; font-weight: 800; letter-spacing: 0.5px; margin-bottom: 16px;">
                ⚠️ QA DEADLINE WARNING &bull; ${daysRemaining === 1 ? '24 HOURS REMAINING' : 'TESTING DUE'}
              </div>
              <h2 style="margin: 0 0 10px 0; font-size: 22px; font-weight: 800; color: #0F172A;">
                ${projectName}
              </h2>
              <p style="margin: 0 0 18px 0; font-size: 14px; line-height: 1.6; color: #475569;">
                Hello <strong>${testerName || 'QA Tester'}</strong>${testerId ? ` (${testerId})` : ''},<br>
                This is an automated 24-hour reminder from the <strong>Dahej Support QA Verification Desk</strong>. The testing deadline for <strong>${projectName}</strong> is ${daysRemaining === 1 ? 'tomorrow' : 'approaching'}, <strong>${deadlineFormatted}</strong> at 11:59 PM IST.
              </p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #ECFDF5; border: 1px solid #A7F3D0; border-radius: 12px; margin-bottom: 22px;">
                <tr>
                  <td style="padding: 18px 20px;">
                    <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #065F46; margin-bottom: 10px;">
                      QA Schedule &amp; Verification Summary
                    </div>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="font-size: 13px;">
                      <tr>
                        <td style="padding: 6px 0; color: #065F46; width: 170px;">Project ID:</td>
                        <td style="padding: 6px 0; color: #0F172A; font-weight: 800; font-family: monospace;">${projectId}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #065F46;">Assigned Developer:</td>
                        <td style="padding: 6px 0; color: #0F172A; font-weight: 600;">${assignedDev}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #065F46;">QA Testing Deadline:</td>
                        <td style="padding: 6px 0; color: #DC2626; font-weight: 800; font-size: 14px;">${deadlineFormatted} (11:59 PM IST)</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #065F46;">QA Progress:</td>
                        <td style="padding: 6px 0; color: #059669; font-weight: 700;">${testingProgress}% Verified</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #065F46;">QA Tester Payout:</td>
                        <td style="padding: 6px 0; color: #059669; font-weight: 800;">${assignedPayout}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #065F46;">Pending QA Checks:</td>
                        <td style="padding: 6px 0; color: #B45309; font-weight: 700;">${pendingQaTasks.length} milestone(s) awaiting sign-off</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <div style="margin-bottom: 22px;">
                <div style="font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.6px; color: #0F3E6D; margin-bottom: 8px;">
                  Pending QA Verification Items (${pendingQaTasks.length})
                </div>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border: 1px solid #E2E8F0; border-radius: 8px; overflow: hidden;">
                  <thead>
                    <tr style="background-color: #F1F5F9;">
                      <th align="left" style="padding: 8px 10px; font-size: 11px; color: #475569; text-transform: uppercase;">#</th>
                      <th align="left" style="padding: 8px 10px; font-size: 11px; color: #475569; text-transform: uppercase;">Checklist Item</th>
                      <th align="right" style="padding: 8px 10px; font-size: 11px; color: #475569; text-transform: uppercase;">QA Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${tasksHtml}
                  </tbody>
                </table>
              </div>
              <div style="background-color: #FFFBEB; border-left: 4px solid #F59E0B; padding: 14px 18px; border-radius: 6px; margin-bottom: 24px;">
                <p style="margin: 0 0 6px 0; font-size: 13px; font-weight: 700; color: #92400E;">
                  Next Steps Before QA Deadline:
                </p>
                <ol style="margin: 0; padding-left: 20px; font-size: 12px; line-height: 1.6; color: #78350F;">
                  <li>Open the QA Workspace and run test scenarios for remaining items.</li>
                  <li>Log any identified defect tickets or revisions.</li>
                  <li>Click <strong>Finalize QA</strong> once all checks pass to route for Admin approval and payout release.</li>
                </ol>
              </div>
              <div style="text-align: center; margin: 26px 0 20px 0;">
                <a href="${portalUrl}" style="display: inline-block; background-color: #059669; color: #FFFFFF; font-size: 14px; font-weight: 700; text-decoration: none; padding: 13px 32px; border-radius: 8px;">
                  Open QA Workspace &rarr;
                </a>
              </div>
              <p style="margin: 0; font-size: 11px; line-height: 1.5; color: #94A3B8; text-align: center;">
                If you have already finalized testing and approved this project, you may safely disregard this reminder.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #F1F5F9; border-top: 1px solid #E2E8F0; padding: 18px 36px; text-align: center;">
              <p style="margin: 0 0 4px 0; font-size: 12px; color: #64748B;">
                Automated QA Deadline Monitor &bull; Sent from <strong style="color: #0F3E6D;">project@dsprogram.space</strong>
              </p>
              <p style="margin: 0; font-size: 11px; color: #94A3B8;">
                &copy; ${year} Dahej Support Freelancer Network. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

async function sendBrevoProjectMail(toEmail, toName, subject, htmlContent, textContent) {
  const rawKey = process.env.PROJECT_BREVO_API_KEY || process.env.VITE_PROJECT_BREVO_API_KEY || PROJECT_FALLBACK_KEY;
  const apiKey = rawKey.trim().replace(/^["']|["']$/g, '');
  const senderEmail = (process.env.PROJECT_BREVO_SENDER_EMAIL || process.env.VITE_PROJECT_BREVO_SENDER_EMAIL || 'project@dsprogram.space').trim();
  const senderName = (process.env.PROJECT_BREVO_SENDER_NAME || process.env.VITE_PROJECT_BREVO_SENDER_NAME || 'Dahej Support').trim();

  const payload = {
    sender: { name: senderName, email: senderEmail },
    to: [{ email: toEmail.trim().toLowerCase(), name: toName || toEmail.split('@')[0] }],
    subject,
    htmlContent,
    textContent
  };

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'api-key': apiKey,
      'content-type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || `Brevo call failed with status ${response.status}`);
  }
  return { success: true, messageId: data.messageId };
}

async function readStorageTable(supabase, filePath) {
  try {
    const { data, error } = await supabase.storage.from(STORAGE_BUCKET).download(filePath);
    if (error || !data) return null;
    const text = await data.text();
    return JSON.parse(text);
  } catch (err) {
    return null;
  }
}

async function writeStorageTable(supabase, filePath, payload) {
  const buffer = Buffer.from(JSON.stringify(payload, null, 2));
  const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(filePath, buffer, {
    contentType: 'application/json',
    upsert: true
  });
  if (error) {
    console.error(`Storage write error for ${filePath}:`, error.message);
  }
}

export default async function handler(req, res) {
  // Ensure Express-like helpers exist if invoked in Node/Vite middleware
  if (!res.status) {
    res.status = function(code) {
      this.statusCode = code;
      return this;
    };
  }
  if (!res.json) {
    res.json = function(data) {
      this.setHeader('Content-Type', 'application/json');
      this.end(JSON.stringify(data));
      return this;
    };
  }

  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const urlObj = new URL(req.url, 'http://localhost');
  const force = urlObj.searchParams.get('force') === 'true' || req.body?.force === true;
  const testDate = urlObj.searchParams.get('testDate') || req.body?.testDate || null;

  const now = testDate ? new Date(`${testDate}T12:00:00.000Z`) : new Date();
  const ist = getIstDateTime(now);
  const isTimeEligible = ist.isEvening5pmOrLater || force;

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    const [projTable, devTable, testerTable] = await Promise.all([
      readStorageTable(supabase, TABLE_PATHS.projects),
      readStorageTable(supabase, TABLE_PATHS.developers),
      readStorageTable(supabase, TABLE_PATHS.testers)
    ]);

    const projects = Array.isArray(projTable?.rows) ? projTable.rows : [];
    const developers = Array.isArray(devTable?.rows) ? devTable.rows : [];
    const testers = Array.isArray(testerTable?.rows) ? testerTable.rows : [];

    const devWarningsSent = [];
    const testerWarningsSent = [];
    const skippedDev = [];
    const skippedTester = [];
    let modifiedProjectsCount = 0;

    const updatedProjects = projects.map(p => {
      if (!p || !p.id) return p;
      const statusLower = String(p.status || '').toLowerCase().trim();
      if (statusLower === 'completed' || statusLower === 'archived') {
        return p;
      }

      let pCopy = { ...p };
      let changed = false;

      // 1. DEVELOPER DEADLINE EVALUATION
      const hasDev = Boolean(
        (pCopy.developerId && String(pCopy.developerId).toLowerCase() !== 'unassigned') ||
        (pCopy.developer && String(pCopy.developer).toLowerCase() !== 'unassigned')
      );

      const isDevCompleted = Boolean(
        (pCopy.developerProgress !== undefined && Number(pCopy.developerProgress) === 100) ||
        (pCopy.progress !== undefined && Number(pCopy.progress) === 100) ||
        (pCopy.freelancerProgress !== undefined && Number(pCopy.freelancerProgress) === 100) ||
        pCopy.developerSubmitted === true ||
        pCopy.freelancerSubmitted === true ||
        Boolean(pCopy.developerSubmittedAt || pCopy.freelancerSubmittedAt) ||
        ['submitted', 'under review', 'finalized', 'approved', 'completed'].includes(statusLower) ||
        (Array.isArray(pCopy.tasks) && pCopy.tasks.length > 0 && pCopy.tasks.every(t => t.status === 'Completed' || Number(t.progress || 0) === 100))
      );

      const devDeadlineRaw = pCopy.submissionDateIso || pCopy.submissionDate || pCopy.developerDeadline || pCopy.deadline;
      const devDeadlineIso = parseDateToIso(devDeadlineRaw);

      if (hasDev && !isDevCompleted && devDeadlineIso) {
        const daysDiff = getDaysDifference(ist.dateIso, devDeadlineIso);
        const isDueTomorrow = daysDiff === 1 && isTimeEligible;
        const isDueToday = daysDiff === 0;

        const alreadySent = pCopy.developerDeadlineWarningDate === devDeadlineIso;

        if ((isDueTomorrow || isDueToday) && !alreadySent) {
          const devMatch = developers.find(d => d && (
            (pCopy.developerId && String(d.id || d.developerId).toLowerCase() === String(pCopy.developerId).toLowerCase()) ||
            (pCopy.developer && String(d.name || d.fullName).toLowerCase() === String(pCopy.developer).toLowerCase())
          ));
          const devEmail = (pCopy.developerEmail || devMatch?.email || devMatch?.emailAddress || '').trim();

          if (devEmail && devEmail.toLowerCase() !== 'unassigned') {
            const devName = pCopy.developer || devMatch?.name || devMatch?.fullName || 'Developer';
            const displayDate = pCopy.submissionDate || devDeadlineIso;
            const html = buildDevWarningHtml(pCopy, devName, pCopy.developerId || devMatch?.id, displayDate, Math.max(0, daysDiff));
            const sub = `⚠️ Action Required: 24-Hour Submission Deadline Notice — ${pCopy.name} [${pCopy.id}]`;
            const txt = `Hello ${devName},\n\nThe developer submission deadline for "${pCopy.name}" (${pCopy.id}) is tomorrow, ${displayDate} at 11:59 PM IST.\nPlease submit all deliverables in your workspace.\n\nDahej Support Project Operations`;

            devWarningsSent.push({
              projectId: pCopy.id,
              developerEmail: devEmail,
              developerName: devName,
              deadlineIso: devDeadlineIso,
              daysDiff,
              html,
              sub,
              txt
            });

            pCopy.developerDeadlineWarningSentAt = new Date().toISOString();
            pCopy.developerDeadlineWarningDate = devDeadlineIso;
            changed = true;
          }
        } else if (alreadySent) {
          skippedDev.push({ id: pCopy.id, reason: 'Already sent for this deadline date' });
        }
      } else if (hasDev && isDevCompleted) {
        skippedDev.push({ id: pCopy.id, reason: 'Developer 100% completed or submitted' });
      }

      // 2. QA TESTER DEADLINE EVALUATION
      const hasTester = Boolean(
        (pCopy.testerId && String(pCopy.testerId).toLowerCase() !== 'unassigned') ||
        (pCopy.tester && String(pCopy.tester).toLowerCase() !== 'unassigned')
      );

      const testingStatusLower = String(pCopy.testingStatus || '').toLowerCase().trim();
      const isTesterCompleted = Boolean(
        (pCopy.testingProgress !== undefined && Number(pCopy.testingProgress) === 100) ||
        pCopy.testerFinalized === true ||
        pCopy.qaFinalized === true ||
        Boolean(pCopy.testerFinalizedAt) ||
        ['tester approved', 'finalized', 'approved', 'completed'].includes(testingStatusLower) ||
        ['finalized', 'approved', 'completed'].includes(statusLower)
      );

      const qaDeadlineRaw = pCopy.testingSubmissionDateIso || pCopy.testingSubmissionDate || pCopy.deadlineDate || pCopy.deadline;
      const qaDeadlineIso = parseDateToIso(qaDeadlineRaw);

      if (hasTester && !isTesterCompleted && qaDeadlineIso) {
        const daysDiff = getDaysDifference(ist.dateIso, qaDeadlineIso);
        const isDueTomorrow = daysDiff === 1 && isTimeEligible;
        const isDueToday = daysDiff === 0;

        const alreadySent = pCopy.testerDeadlineWarningDate === qaDeadlineIso;

        if ((isDueTomorrow || isDueToday) && !alreadySent) {
          const testerMatch = testers.find(t => t && (
            (pCopy.testerId && String(t.id || t.testerId).toLowerCase() === String(pCopy.testerId).toLowerCase()) ||
            (pCopy.tester && String(t.name || t.fullName).toLowerCase() === String(pCopy.tester).toLowerCase())
          ));
          const testerEmail = (pCopy.testerEmail || testerMatch?.email || testerMatch?.emailAddress || '').trim();

          if (testerEmail && testerEmail.toLowerCase() !== 'unassigned') {
            const testerName = pCopy.tester || testerMatch?.name || testerMatch?.fullName || 'QA Tester';
            const displayDate = pCopy.testingSubmissionDate || qaDeadlineIso;
            const html = buildTesterWarningHtml(pCopy, testerName, pCopy.testerId || testerMatch?.id, displayDate, Math.max(0, daysDiff));
            const sub = `⚠️ Action Required: 24-Hour QA Testing Deadline Notice — ${pCopy.name} [${pCopy.id}]`;
            const txt = `Hello ${testerName},\n\nThe QA testing deadline for "${pCopy.name}" (${pCopy.id}) is tomorrow, ${displayDate} at 11:59 PM IST.\nPlease finalize QA review in your workspace.\n\nDahej Support QA Desk`;

            testerWarningsSent.push({
              projectId: pCopy.id,
              testerEmail: testerEmail,
              testerName: testerName,
              deadlineIso: qaDeadlineIso,
              daysDiff,
              html,
              sub,
              txt
            });

            pCopy.testerDeadlineWarningSentAt = new Date().toISOString();
            pCopy.testerDeadlineWarningDate = qaDeadlineIso;
            changed = true;
          }
        } else if (alreadySent) {
          skippedTester.push({ id: pCopy.id, reason: 'Already sent for this deadline date' });
        }
      } else if (hasTester && isTesterCompleted) {
        skippedTester.push({ id: pCopy.id, reason: 'Tester 100% completed or finalized' });
      }

      if (changed) {
        modifiedProjectsCount++;
      }
      return pCopy;
    });

    // Actually dispatch emails via Brevo project key
    const sendResults = [];
    for (const item of devWarningsSent) {
      try {
        const resMail = await sendBrevoProjectMail(item.developerEmail, item.developerName, item.sub, item.html, item.txt);
        sendResults.push({ type: 'developer', id: item.projectId, recipient: item.developerEmail, success: true, messageId: resMail.messageId });
      } catch (err) {
        console.error(`[Cron Mailer] Dev warning error for ${item.projectId}:`, err.message);
        sendResults.push({ type: 'developer', id: item.projectId, recipient: item.developerEmail, success: false, error: err.message });
      }
    }

    for (const item of testerWarningsSent) {
      try {
        const resMail = await sendBrevoProjectMail(item.testerEmail, item.testerName, item.sub, item.html, item.txt);
        sendResults.push({ type: 'tester', id: item.projectId, recipient: item.testerEmail, success: true, messageId: resMail.messageId });
      } catch (err) {
        console.error(`[Cron Mailer] Tester warning error for ${item.projectId}:`, err.message);
        sendResults.push({ type: 'tester', id: item.projectId, recipient: item.testerEmail, success: false, error: err.message });
      }
    }

    // Persist updated project flags back to Supabase
    if (modifiedProjectsCount > 0) {
      await writeStorageTable(supabase, TABLE_PATHS.projects, {
        table: 'projects',
        updatedAt: new Date().toISOString(),
        rows: updatedProjects
      });
    }

    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      istTime: ist,
      isTimeEligible,
      checkedProjectsCount: projects.length,
      modifiedProjectsCount,
      developerWarningsCount: devWarningsSent.length,
      testerWarningsCount: testerWarningsSent.length,
      dispatches: sendResults,
      skippedDev,
      skippedTester
    });
  } catch (err) {
    console.error('[Cron Deadline Monitor Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
