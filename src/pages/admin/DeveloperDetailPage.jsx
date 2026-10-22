import React, { useState } from 'react';
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  CheckCircle, 
  Clock, 
  IndianRupee, 
  ShieldCheck, 
  FolderKanban, 
  Award, 
  TrendingUp, 
  PlusCircle, 
  ExternalLink,
  MapPin,
  History,
  FileCheck,
  Check,
  X,
  XCircle,
  AlertCircle,
  MessageSquare,
  Trash2
} from 'lucide-react';
import StatusBadge from '../../components/portal/StatusBadge';
import EmptyState from '../../components/portal/EmptyState';
import AssignmentModal from '../../components/admin/AssignmentModal';
import DeleteConfirmModal from '../../components/admin/DeleteConfirmModal';
import ApproveMemberModal from '../../components/admin/ApproveMemberModal';
import { initialAdminProjects } from '../../data/adminMockData';
import { getOrAssignReferralTrustId } from '../../utils/referralTrustUtils';
import { sendApprovalWelcomeEmail, sendRejectionNoticeEmail, saveMemberPassword } from '../../services/emailService';
import './DeveloperDetailPage.css';

export default function DeveloperDetailPage({ 
  developer, 
  projects = [],
  onUpdateDeveloper,
  onDeleteDeveloper,
  onBack, 
  onOpenProject, 
  onNavigate 
}) {
  const [activeTab, setActiveTab] = useState('current');
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedProjectToAssign, setSelectedProjectToAssign] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);

  if (!developer) {
    return (
      <div className="portal-card">
        <EmptyState
          icon={User}
          title="Developer Not Found"
          description="The requested developer profile could not be found."
          actionLabel="Back to Developers"
          onAction={onBack}
        />
      </div>
    );
  }

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleStatusChange = (newStatus) => {
    if ((newStatus === 'Active' || newStatus === 'Approved') && developer.status === 'Pending') {
      setIsApproveModalOpen(true);
      return;
    }

    let newAvailability = developer.availability;
    if (newStatus === 'Deactivated' || newStatus === 'Rejected') {
      newAvailability = 'Inactive';
    } else if (newStatus === 'On Hold') {
      newAvailability = 'On Hold';
    } else if (newStatus === 'Active' || newStatus === 'Approved') {
      newAvailability = (developer.activeProjectsCount || 0) > 1 ? 'Busy' : 'Available';
    }

    const isNowActive = newStatus === 'Active' || newStatus === 'Approved';
    const assignedTrustId = isNowActive 
      ? (developer.referralTrustId || getOrAssignReferralTrustId({ ...developer, status: newStatus }))
      : (developer.referralTrustId || '');

    const updated = {
      ...developer,
      status: newStatus,
      availability: newAvailability,
      ...(assignedTrustId ? { referralTrustId: assignedTrustId } : {}),
      ...( isNowActive ? { applicationMessage: '', aboutSelf: '' } : {} )
    };

    if (onUpdateDeveloper) {
      onUpdateDeveloper(updated);
    }

    if (newStatus === 'Rejected') {
      showToast(`Developer "${developer.name}" application rejected. Sending status email...`);
      sendRejectionNoticeEmail({
        member: developer,
        toEmail: developer.email,
        toName: developer.fullName || developer.name,
        memberId: developer.id,
        role: 'developer'
      }).then((res) => {
        if (res?.success) {
          showToast(`✓ Developer "${developer.name}" application rejected & notice email sent to ${developer.email}`);
        }
      }).catch(err => console.error('Rejection email error:', err));
    } else {
      showToast(`Developer "${developer.name}" status updated to "${newStatus}"`);
    }
  };

  const handleOpenAssign = () => {
    // Pick an active unassigned or ongoing project if any exists
    const proj = projects.find(p => p.status === 'Starting Payment Received' || p.status === 'In Progress' || !p.developerId) || projects[0] || null;
    if (proj) {
      setSelectedProjectToAssign(proj);
      setIsAssignModalOpen(true);
    } else if (onNavigate) {
      onNavigate('admin/create-project');
    }
  };

  const handleConfirmApproveDev = async ({ password, sendEmail }) => {
    if (!developer) return;
    let emailResult = { success: false };

    if (sendEmail) {
      try {
        emailResult = await sendApprovalWelcomeEmail({
          member: developer,
          toEmail: developer.email,
          toName: developer.fullName || developer.name,
          memberId: developer.id,
          password,
          role: 'developer',
          referralTrustId: developer.referralTrustId
        });
        if (!emailResult?.success) {
          throw new Error(emailResult?.error || 'Email dispatch failed.');
        }
      } catch (err) {
        console.error('Welcome email dispatch error:', err);
        throw new Error(`Failed to send welcome email to ${developer.email}: ${err.message || 'Please check email connection.'}`);
      }
    }

    saveMemberPassword(developer.id || developer.developerId, developer.email, password, developer.developerId);

    const assignedTrustId = developer.referralTrustId || getOrAssignReferralTrustId({ ...developer, status: 'Active' });

    const updated = {
      ...developer,
      status: 'Active',
      availability: 'Available',
      password,
      referralTrustId: assignedTrustId,
      applicationMessage: '',
      aboutSelf: ''
    };

    if (onUpdateDeveloper) {
      onUpdateDeveloper(updated);
    }

    setIsApproveModalOpen(false);
    showToast(
      sendEmail
        ? (emailResult.success 
            ? `✓ Developer "${developer.name}" approved & login credentials sent to ${developer.email}!` 
            : `✓ Developer "${developer.name}" approved! (Email delivery queued to ${developer.email})`)
        : `✓ Developer "${developer.name}" approved with login password!`
    );
  };

  const handleConfirmDelete = () => {
    if (onDeleteDeveloper && developer) {
      onDeleteDeveloper(developer.id);
    }
    setIsDeleteModalOpen(false);
    if (onBack) onBack();
  };

  return (
    <div className="developer-detail-container">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="dev-status-toast">
          <CheckCircle size={16} color="#10B981" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Nav */}
      <div className="admin-detail-top-nav">
        <button type="button" onClick={onBack} className="btn-back-link">
          <ArrowLeft size={16} />
          <span>Back to Developers</span>
        </button>

        <div className="admin-detail-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Status Switcher Action Buttons */}
          <div className="dev-status-action-group">
            <span className="status-group-label">Status:</span>
            
            {developer.status === 'Pending' && (
              <div style={{ display: 'inline-flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setIsApproveModalOpen(true)}
                  className="btn btn-orange-primary"
                  style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                >
                  <Check size={14} style={{ marginRight: '4px' }} />
                  <span>Approve Developer</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleStatusChange('Rejected')}
                  className="btn btn-reject-action"
                  style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                  title="Reject Developer Application"
                >
                  <XCircle size={14} style={{ marginRight: '4px' }} />
                  <span>Reject</span>
                </button>
              </div>
            )}

            {developer.status === 'Active' && (
              <>
                <button
                  type="button"
                  onClick={() => handleStatusChange('On Hold')}
                  className="btn-status-toggle on-hold"
                >
                  ⏸ Put On Hold
                </button>
                <button
                  type="button"
                  onClick={() => handleStatusChange('Deactivated')}
                  className="btn-status-toggle deactivate"
                >
                  🚫 Deactivate
                </button>
              </>
            )}

            {developer.status === 'On Hold' && (
              <>
                <button
                  type="button"
                  onClick={() => handleStatusChange('Active')}
                  className="btn-status-toggle active"
                >
                  ● Activate
                </button>
                <button
                  type="button"
                  onClick={() => handleStatusChange('Deactivated')}
                  className="btn-status-toggle deactivate"
                >
                  🚫 Deactivate
                </button>
              </>
            )}

            {(developer.status === 'Deactivated' || developer.status === 'Rejected') && (
              <button
                type="button"
                onClick={() => handleStatusChange('Active')}
                className="btn-status-toggle active"
              >
                ● Activate Account
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsDeleteModalOpen(true)}
            className="btn btn-delete-action"
            style={{ padding: '6px 14px', fontSize: '0.8rem' }}
            title="Permanently Delete Developer"
          >
            <Trash2 size={14} style={{ marginRight: '4px' }} />
            <span>Delete Developer</span>
          </button>
        </div>
      </div>

      {/* Developer Banner Card */}
      <div className="portal-card dev-profile-banner">
        <div className="dev-banner-left">
          <div className="dev-banner-avatar-wrap">
            <img
              src={developer.avatar || '/assets/logo-icon.png'}
              alt={developer.name}
              className="dev-banner-img"
              style={{
                opacity: (developer.status === 'Deactivated' || developer.status === 'Rejected') ? 0.6 : 1,
                border: `3px solid ${developer.status === 'Active' ? '#10B981' : developer.status === 'On Hold' ? '#F59E0B' : developer.status === 'Pending' ? '#F3821D' : '#EF4444'}`
              }}
            />
            <span 
              className="dev-online-dot" 
              style={{ 
                backgroundColor: developer.status === 'Active' ? '#10B981' : developer.status === 'On Hold' ? '#F59E0B' : developer.status === 'Pending' ? '#F3821D' : '#EF4444' 
              }} 
            />
          </div>

          <div className="dev-banner-info">
            <div className="dev-name-row">
              <h1 className="dev-full-name" style={{ textDecoration: (developer.status === 'Deactivated' || developer.status === 'Rejected') ? 'line-through' : 'none' }}>
                {developer.name}
              </h1>
              <span className="dev-id-tag">{developer.id}</span>
              <StatusBadge status={developer.status} size="normal" />
            </div>

            <p className="dev-banner-headline">{developer.primarySkill} • {developer.experience || 'Verified Specialist'}</p>

            <div className="dev-banner-meta">
              <span><Mail size={13} /> {developer.email}</span>
              <span>•</span>
              <span><Phone size={13} /> {developer.mobile}</span>
              <span>•</span>
              <span><Calendar size={13} /> Registered {developer.joiningDate}</span>
              <span>•</span>
              <span>Referrer: <strong>{developer.referenceName || 'Direct Onboarding'}</strong></span>
              <span>•</span>
              <span>Referral Code: <strong style={{ color: '#0A3D75', fontFamily: 'monospace', background: '#E8F2FC', padding: '2px 7px', borderRadius: '4px', letterSpacing: '0.04em' }}>{developer.referralCode || 'DS-REF-8902'}</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Notice if Pending, On Hold or Deactivated */}
      {developer.status === 'Pending' && (
        <div className="dev-status-alert-card on-hold" style={{ background: '#FFFBEB', borderColor: '#FDE68A' }}>
          <Clock size={18} color="#D97706" />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <strong>Developer Registration Pending:</strong> Awaiting Admin review & approval. Referrer: <strong>{developer.referenceName || 'Direct'}</strong> • Code: <strong style={{ color: '#0A3D75', fontFamily: 'monospace', background: '#E8F2FC', padding: '1px 6px', borderRadius: '4px' }}>{developer.referralCode || 'DS-REF-8902'}</strong>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button 
                type="button" 
                className="btn btn-orange-primary"
                style={{ padding: '4px 14px', fontSize: '0.78rem' }}
                onClick={() => handleStatusChange('Active')}
              >
                <Check size={13} style={{ marginRight: '4px' }} />
                <span>Approve Now</span>
              </button>
              <button 
                type="button" 
                className="btn btn-reject-action"
                style={{ padding: '4px 14px', fontSize: '0.78rem' }}
                onClick={() => handleStatusChange('Rejected')}
              >
                <XCircle size={13} style={{ marginRight: '4px' }} />
                <span>Reject</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Candidate Application Message Box (Visible before approval only; deleted once approved) */}
      {developer.status === 'Pending' && (
        <div className="portal-card" style={{ marginBottom: '20px', borderLeft: '4px solid #F3821D', padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                background: '#FFF7ED',
                color: '#EA580C',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <MessageSquare size={18} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#0F172A' }}>
                  Application Message & Candidate Introduction
                </h3>
                <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                  Message typed by {developer.name} while applying for Developer Program
                </span>
              </div>
            </div>
            <span style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              padding: '3px 10px',
              borderRadius: '20px',
              background: '#FFFBEB',
              color: '#B45309',
              border: '1px solid #FDE68A'
            }}>
              Auto-cleared after approval
            </span>
          </div>

          <div style={{
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '8px',
            padding: '14px 18px',
            fontSize: '0.9rem',
            lineHeight: '1.6',
            color: '#1E293B',
            fontStyle: 'italic',
            whiteSpace: 'pre-wrap'
          }}>
            "{developer.applicationMessage || developer.aboutSelf || 'Applied via referral program. No additional note provided by applicant.'}"
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', fontSize: '0.75rem', color: '#64748B', flexWrap: 'wrap', gap: '8px' }}>
            <span>Portfolio / Showcase URL: {developer.portfolioUrl ? <a href={developer.portfolioUrl} target="_blank" rel="noreferrer" style={{ color: '#0A3D75', fontWeight: 700 }}>{developer.portfolioUrl}</a> : <span style={{ color: '#94A3B8' }}>Not provided</span>}</span>
            <span>Character count: {(developer.applicationMessage || developer.aboutSelf || '').length} characters</span>
          </div>
        </div>
      )}

      {developer.status === 'On Hold' && (
        <div className="dev-status-alert-card on-hold">
          <Clock size={18} color="#D97706" />
          <div>
            <strong>Developer is Currently On Hold:</strong> This freelancer is temporarily unavailable. Existing assignments can be monitored, but new tasks are paused.
          </div>
        </div>
      )}

      {developer.status === 'Deactivated' && (
        <div className="dev-status-alert-card deactivated">
          <ShieldCheck size={18} color="#DC2626" />
          <div>
            <strong>Developer Access is Deactivated:</strong> This freelancer's portal access is suspended. Click "Activate" above to restore access.
          </div>
        </div>
      )}

      {developer.status === 'Rejected' && (
        <div className="dev-status-alert-card deactivated">
          <AlertCircle size={18} color="#DC2626" />
          <div>
            <strong>Developer Registration Rejected:</strong> This applicant was rejected during verification. Click "Activate Account" above to admit them.
          </div>
        </div>
      )}

      {/* 5 Developer Performance Stats Cards */}
      <div className="dev-perf-grid">
        <div className="portal-card dev-stat-card">
          <span className="stat-label">Total Projects</span>
          <div className="stat-val" style={{ color: '#0A3D75' }}>
            {(developer.completedProjectsCount || 0) + (developer.activeProjectsCount || 0)}
          </div>
          <span className="stat-sub">Lifetime assigned</span>
        </div>

        <div className="portal-card dev-stat-card">
          <span className="stat-label">Completed Projects</span>
          <div className="stat-val" style={{ color: '#10B981' }}>
            {developer.completedProjectsCount || 0}
          </div>
          <span className="stat-sub">Delivered successfully</span>
        </div>

        <div className="portal-card dev-stat-card">
          <span className="stat-label">Active Projects</span>
          <div className="stat-val" style={{ color: '#F3821D' }}>
            {developer.activeProjectsCount || 0}
          </div>
          <span className="stat-sub">Currently in development</span>
        </div>

        <div className="portal-card dev-stat-card">
          <span className="stat-label">Total Payouts</span>
          <div className="stat-val" style={{ color: '#0A3D75' }}>
            {developer.totalEarnings || '₹0'}
          </div>
          <span className="stat-sub">Settled disbursements</span>
        </div>

        <div className="portal-card dev-stat-card">
          <span className="stat-label">Pending Payouts</span>
          <div className="stat-val" style={{ color: developer.pendingPayouts && developer.pendingPayouts !== '₹0' ? '#F3821D' : '#64748B' }}>
            {developer.pendingPayouts || '₹0'}
          </div>
          <span className="stat-sub">Awaiting milestone release</span>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="admin-project-tabs-bar">
        <button
          type="button"
          className={`admin-tab-pill ${activeTab === 'current' ? 'active' : ''}`}
          onClick={() => setActiveTab('current')}
        >
          <FolderKanban size={15} />
          <span>Current Projects ({(developer.currentProjects || []).length})</span>
        </button>

        <button
          type="button"
          className={`admin-tab-pill ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <History size={15} />
          <span>Completed Project History ({(developer.projectHistory || []).length})</span>
        </button>

        <button
          type="button"
          className={`admin-tab-pill ${activeTab === 'earnings' ? 'active' : ''}`}
          onClick={() => setActiveTab('earnings')}
        >
          <IndianRupee size={15} />
          <span>Payouts & Settlements ({(developer.earningsHistory || []).length})</span>
        </button>
      </div>

      {/* TAB 1: CURRENT PROJECTS */}
      {activeTab === 'current' && (
        <div className="portal-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="portal-card-header" style={{ padding: '16px 20px' }}>
            <h3 className="portal-card-title">Currently Active Projects</h3>
          </div>

          {(developer.currentProjects && developer.currentProjects.length > 0) ? (
            <div className="portal-table-container">
              <table className="portal-table">
                <thead>
                  <tr>
                    <th>Project ID</th>
                    <th>Project Name</th>
                    <th>Progress</th>
                    <th>Deadline</th>
                    <th>Freelancer Payout</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {developer.currentProjects.map((p) => (
                    <tr key={p.id}>
                      <td><span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#0A3D75' }}>{p.id}</span></td>
                      <td>
                        <span className="table-proj-name" onClick={() => onOpenProject(p.id)}>{p.name}</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div style={{ width: '70px', height: '6px', background: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ width: `${p.progress}%`, height: '100%', background: '#F3821D' }} />
                          </div>
                          <span style={{ fontSize: '0.74rem', fontWeight: 700 }}>{p.progress}%</span>
                        </div>
                      </td>
                      <td style={{ color: '#0F172A', fontWeight: 600 }}>{p.submissionDate || p.developerDeadline || p.deadline}</td>
                      <td style={{ fontWeight: 800, color: '#0A3D75' }}>{p.payout}</td>
                      <td><StatusBadge status={p.status} size="small" /></td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => onOpenProject(p.id)}
                          className="btn btn-navy-action"
                          style={{ padding: '6px 12px', fontSize: '0.76rem' }}
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ padding: '24px', textAlign: 'center', color: '#64748B' }}>
              No active projects assigned currently. Developer is available for new assignments.
            </div>
          )}
        </div>
      )}

      {/* TAB 2: COMPLETED PROJECTS HISTORY */}
      {activeTab === 'history' && (
        <div className="portal-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="portal-card-header" style={{ padding: '16px 20px' }}>
            <h3 className="portal-card-title">Delivered & Approved Projects History</h3>
          </div>

          {(developer.projectHistory && developer.projectHistory.length > 0) ? (
            <div className="portal-table-container">
              <table className="portal-table">
                <thead>
                  <tr>
                    <th>Project ID</th>
                    <th>Project Name</th>
                    <th>Completed Date</th>
                    <th>Freelancer Payout</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {developer.projectHistory.map((p) => (
                    <tr key={p.id}>
                      <td><span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#0A3D75' }}>{p.id}</span></td>
                      <td>
                        <span className="table-proj-name" onClick={() => onOpenProject(p.id)}>{p.name}</span>
                      </td>
                      <td style={{ color: '#64748B' }}>{p.completedDate}</td>
                      <td style={{ fontWeight: 800, color: '#10B981' }}>{p.payout}</td>
                      <td><StatusBadge status="Completed" size="small" /></td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => onOpenProject(p.id)}
                          className="btn btn-navy-action"
                          style={{ padding: '6px 12px', fontSize: '0.76rem' }}
                        >
                          View Archive
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ padding: '24px', textAlign: 'center', color: '#64748B' }}>
              No past project archive found.
            </div>
          )}
        </div>
      )}

      {/* TAB 3: PAYOUTS HISTORY */}
      {activeTab === 'earnings' && (
        <div className="portal-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="portal-card-header" style={{ padding: '16px 20px' }}>
            <h3 className="portal-card-title">Freelancer Payouts & Settlement Log</h3>
          </div>

          {(developer.earningsHistory && developer.earningsHistory.length > 0) ? (
            <div className="portal-table-container">
              <table className="portal-table">
                <thead>
                  <tr>
                    <th>Transaction Ref</th>
                    <th>Project</th>
                    <th>Settlement Date</th>
                    <th>Freelancer Payout</th>
                    <th>Payment Status</th>
                  </tr>
                </thead>
                <tbody>
                  {developer.earningsHistory.map((earn) => (
                    <tr key={earn.id}>
                      <td><span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#0A3D75', fontWeight: 800 }}>{earn.id}</span></td>
                      <td style={{ fontWeight: 700, color: '#0F172A' }}>{earn.project}</td>
                      <td style={{ color: '#64748B' }}>{earn.date}</td>
                      <td style={{ fontWeight: 800, color: '#10B981' }}>{earn.payout}</td>
                      <td><StatusBadge status={earn.status} size="small" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ padding: '24px', textAlign: 'center', color: '#64748B' }}>
              No settlement transactions recorded yet.
            </div>
          )}
        </div>
      )}

      {/* Reassign Modal */}
      {selectedProjectToAssign && (
        <AssignmentModal
          isOpen={isAssignModalOpen}
          project={selectedProjectToAssign}
          onClose={() => setIsAssignModalOpen(false)}
          onAssign={() => setIsAssignModalOpen(false)}
        />
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        item={developer}
        itemType="developer"
        assignedProjectsCount={Array.isArray(developer.currentProjects) ? developer.currentProjects.length : (developer.activeProjectsCount || 0)}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
      />

      {/* Approve Developer Modal */}
      <ApproveMemberModal
        isOpen={isApproveModalOpen}
        member={developer}
        role="developer"
        onClose={() => setIsApproveModalOpen(false)}
        onConfirm={handleConfirmApproveDev}
      />
    </div>
  );
}
