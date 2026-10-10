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
  AlertCircle
} from 'lucide-react';
import StatusBadge from '../../components/portal/StatusBadge';
import EmptyState from '../../components/portal/EmptyState';
import AssignmentModal from '../../components/admin/AssignmentModal';
import { initialAdminProjects } from '../../data/adminMockData';
import './DeveloperDetailPage.css';

export default function DeveloperDetailPage({ 
  developer, 
  projects = [],
  onUpdateDeveloper,
  onBack, 
  onOpenProject, 
  onNavigate 
}) {
  const [activeTab, setActiveTab] = useState('current');
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedProjectToAssign, setSelectedProjectToAssign] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

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
    let newAvailability = developer.availability;
    if (newStatus === 'Deactivated' || newStatus === 'Rejected') {
      newAvailability = 'Inactive';
    } else if (newStatus === 'On Hold') {
      newAvailability = 'On Hold';
    } else if (newStatus === 'Active' || newStatus === 'Approved') {
      newAvailability = (developer.activeProjectsCount || 0) > 1 ? 'Busy' : 'Available';
    }

    const updated = {
      ...developer,
      status: newStatus,
      availability: newAvailability
    };

    if (onUpdateDeveloper) {
      onUpdateDeveloper(updated);
    }

    if (newStatus === 'Rejected') {
      showToast(`Developer "${developer.name}" application rejected.`);
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
                  onClick={() => handleStatusChange('Active')}
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
            className="btn btn-orange-primary"
            onClick={handleOpenAssign}
            disabled={developer.status === 'Deactivated' || developer.status === 'Pending' || developer.status === 'Rejected'}
            style={{ opacity: developer.status === 'Deactivated' || developer.status === 'Pending' || developer.status === 'Rejected' ? 0.5 : 1 }}
          >
            <PlusCircle size={15} />
            <span>Assign New Project</span>
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
              <span>Referrer / ID: <strong>{developer.referenceName || 'Direct Onboarding'}</strong></span>
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
              <strong>Developer Registration Pending:</strong> This developer has registered via reference and is awaiting Admin review and approval.
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
    </div>
  );
}
