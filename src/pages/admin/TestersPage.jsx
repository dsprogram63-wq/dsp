import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Search, 
  UserCheck, 
  CheckCircle, 
  Clock, 
  Eye, 
  PauseCircle,
  XCircle,
  Check,
  IndianRupee,
  Users,
  Download,
  Trash2
} from 'lucide-react';
import StatsCard from '../../components/portal/StatsCard';
import StatusBadge from '../../components/portal/StatusBadge';
import EmptyState from '../../components/portal/EmptyState';
import DeleteConfirmModal from '../../components/admin/DeleteConfirmModal';
import ApproveMemberModal from '../../components/admin/ApproveMemberModal';
import { exportToCSV } from '../../utils/exportUtils';
import { initialTesters } from '../../data/testerMockData';
import { getOrAssignReferralTrustId } from '../../utils/referralTrustUtils';
import { sendApprovalWelcomeEmail, sendRejectionNoticeEmail, saveMemberPassword } from '../../services/emailService';
import './TestersPage.css';

export default function TestersPage({ 
  testers = initialTesters, 
  projects = [],
  onUpdateTester,
  onDeleteTester,
  onOpenTester,
  onNavigate 
}) {
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [toastMessage, setToastMessage] = useState(null);
  const [deleteTargetTester, setDeleteTargetTester] = useState(null);
  const [approveTargetTester, setApproveTargetTester] = useState(null);

  const filterTabs = ['All', 'Pending', 'Active', 'On Hold', 'Deactivated'];

  // Ensure unique tester accounts by ID
  const uniqueTesters = Array.from(
    new Map((testers || []).map(t => [t.id, t])).values()
  );

  // Dynamic helper: Calculate currently assigned testing projects for a tester
  const getTesterAssignedProjectsCount = (t) => {
    let countFromProjects = 0;
    if (Array.isArray(projects) && projects.length > 0) {
      countFromProjects = projects.filter(p => 
        (p.testerId && p.testerId === t.id) ||
        (p.tester && t.name && p.tester.toLowerCase().trim() === t.name.toLowerCase().trim())
      ).length;
    }
    const countFromCurrent = Array.isArray(t.currentProjects) ? t.currentProjects.length : 0;
    const countFromProp = t.activeTestingProjects || 0;
    return Math.max(countFromProjects, countFromCurrent, countFromProp);
  };

  // =========================================================================
  // DYNAMIC STATISTIC CALCULATIONS (Strict Status Priority & Real System Data)
  // Priority: 1. Pending -> 2. Deactivated -> 3. On Hold -> 4. Active (Assigned vs Free)
  // =========================================================================

  // 1. Total Testers: ALL unique tester accounts regardless of status
  const totalTesters = uniqueTesters.length;

  // 2. Pending Testers: Registration completed, awaiting admin approval
  const pendingTestersList = uniqueTesters.filter(t => t.status === 'Pending');
  const pendingTestersCount = pendingTestersList.length;

  // 3. Deactivated Testers: Platform access revoked
  const deactivatedTestersList = uniqueTesters.filter(t => t.status === 'Deactivated');
  const deactivatedTesters = deactivatedTestersList.length;

  // 4. On Hold Testers: Explicitly paused by admin (independent of projects)
  const onHoldTestersList = uniqueTesters.filter(t => t.status === 'On Hold');
  const onHoldTesters = onHoldTestersList.length;

  // 5. Approved/Active Testers pool
  const activeTestersList = uniqueTesters.filter(t => t.status === 'Active' || t.status === 'Approved');

  // 6. Assigned Testers: Approved/Active + at least 1 currently assigned testing project (> 0)
  const assignedTestersList = activeTestersList.filter(t => getTesterAssignedProjectsCount(t) > 0);
  const assignedTesters = assignedTestersList.length;

  // 7. Free Testers: Approved/Active + 0 currently assigned testing projects
  const freeTestersList = activeTestersList.filter(t => getTesterAssignedProjectsCount(t) === 0);
  const freeTesters = freeTestersList.length;

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleStatusChange = (tester, newStatus) => {
    if ((newStatus === 'Active' || newStatus === 'Approved') && tester.status === 'Pending') {
      setApproveTargetTester(tester);
      return;
    }

    const assignedCount = getTesterAssignedProjectsCount(tester);
    let newAvailability = tester.availability;
    if (newStatus === 'Deactivated' || newStatus === 'Rejected') {
      newAvailability = 'Inactive';
    } else if (newStatus === 'On Hold') {
      newAvailability = 'On Hold';
    } else if (newStatus === 'Active' || newStatus === 'Approved') {
      newAvailability = assignedCount > 0 ? 'Busy' : 'Available';
    }

    const isNowActive = newStatus === 'Active' || newStatus === 'Approved';
    const assignedTrustId = isNowActive 
      ? (tester.referralTrustId || getOrAssignReferralTrustId({ ...tester, status: newStatus }, testers))
      : (tester.referralTrustId || '');

    const updated = {
      ...tester,
      status: newStatus,
      availability: newAvailability,
      ...(assignedTrustId ? { referralTrustId: assignedTrustId } : {}),
      ...( isNowActive ? { applicationMessage: '', aboutSelf: '' } : {} )
    };

    if (onUpdateTester) {
      onUpdateTester(updated);
    }
    if (newStatus === 'Rejected') {
      showToast(`QA Tester "${tester.name}" rejected. Dispatching status notice to ${tester.email}...`);
      sendRejectionNoticeEmail({
        member: tester,
        toEmail: tester.email,
        toName: tester.fullName || tester.name,
        memberId: tester.id || tester.testerId,
        role: 'tester'
      }).then((res) => {
        if (res?.success) {
          showToast(`✓ Rejection email dispatched to ${tester.email} (Please check Inbox & Spam folder)`);
        } else {
          showToast(`⚠️ Could not send rejection email: ${res?.error || 'Dispatch error'}`);
        }
      }).catch(err => {
        console.error('Rejection email error:', err);
        showToast(`⚠️ Rejection email error: ${err.message || 'Dispatch error'}`);
      });
    } else {
      showToast(`QA Tester "${tester.name}" status updated to "${newStatus}"`);
    }
  };

  const handleApprove = (tester) => {
    setApproveTargetTester(tester);
  };

  const handleConfirmApproveTester = async ({ password, sendEmail }) => {
    if (!approveTargetTester) return;
    const tester = approveTargetTester;
    let emailResult = { success: false };

    const assignedCount = getTesterAssignedProjectsCount(tester);
    const assignedTrustId = tester.referralTrustId || getOrAssignReferralTrustId({ ...tester, status: 'Active' }, testers);

    if (sendEmail) {
      try {
        emailResult = await sendApprovalWelcomeEmail({
          member: tester,
          toEmail: tester.email,
          toName: tester.fullName || tester.name,
          memberId: tester.id || tester.testerId,
          password,
          role: 'tester',
          referralTrustId: assignedTrustId
        });
        if (!emailResult?.success) {
          throw new Error(emailResult?.error || 'Email dispatch failed.');
        }
      } catch (err) {
        console.error('Welcome email dispatch error:', err);
        throw new Error(`Failed to send welcome email to ${tester.email}: ${err.message || 'Please check email connection.'}`);
      }
    }

    saveMemberPassword(tester.id || tester.testerId, tester.email, password, tester.testerId);

    const updated = {
      ...tester,
      status: 'Active',
      availability: assignedCount > 0 ? 'Busy' : 'Available',
      password,
      referralTrustId: assignedTrustId,
      applicationMessage: '',
      aboutSelf: ''
    };

    if (onUpdateTester) {
      onUpdateTester(updated);
    }

    setApproveTargetTester(null);
    showToast(
      sendEmail
        ? (emailResult.success 
            ? `✓ QA Tester "${tester.name}" approved & login credentials sent to ${tester.email}!` 
            : `✓ QA Tester "${tester.name}" approved! (Email delivery queued to ${tester.email})`)
        : `✓ QA Tester "${tester.name}" approved with login password!`
    );
  };

  const handleReject = (tester) => {
    handleStatusChange(tester, 'Rejected');
  };

  const handleConfirmDelete = () => {
    if (!deleteTargetTester) return;
    const testerToDelete = deleteTargetTester;
    if (onDeleteTester) {
      onDeleteTester(testerToDelete.id);
    }
    setDeleteTargetTester(null);
    showToast(`QA Tester "${testerToDelete.name}" (${testerToDelete.id}) permanently deleted.`);
  };

  const filtered = uniqueTesters.filter(t => {
    const isAssigned = getTesterAssignedProjectsCount(t) > 0;
    const isActive = t.status === 'Active' || t.status === 'Approved';

    // Filter Tab
    if (selectedFilter === 'Pending' && t.status !== 'Pending') return false;
    if (selectedFilter === 'Active' && !isActive) return false;
    if (selectedFilter === 'On Hold' && t.status !== 'On Hold') return false;
    if (selectedFilter === 'Deactivated' && t.status !== 'Deactivated' && t.status !== 'Rejected') return false;
    if (selectedFilter === 'Assigned' && !(isActive && isAssigned)) return false;
    if (selectedFilter === 'Free' && !(isActive && !isAssigned)) return false;

    // Search Query (Name, ID, Specialization, Email)
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return (
        (t.name && t.name.toLowerCase().includes(q)) ||
        (t.id && t.id.toLowerCase().includes(q)) ||
        (t.email && t.email.toLowerCase().includes(q)) ||
        (t.specialization && t.specialization.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Export filtered QA testers to Excel/CSV
  const handleExportTesters = () => {
    const headers = [
      { label: 'Tester ID', key: 'id' },
      { label: 'Full Name', key: 'name' },
      { label: 'Email Address', key: 'email' },
      { label: 'Mobile Number', key: 'mobile' },
      { label: 'Role / Specialization', key: (t) => t.specialization || t.role || 'QA Specialist' },
      { label: 'Experience', key: 'experience' },
      { label: 'Account Status', key: 'status' },
      { label: 'Availability', key: 'availability' },
      { label: 'Active QA Projects', key: (t) => getTesterAssignedProjectsCount(t) },
      { label: 'Completed QA Tasks', key: (t) => t.completedTesting || 0 },
      { label: 'Approved Projects', key: (t) => t.approvedCount || 0 },
      { label: 'Revision Requested', key: (t) => t.returnedCount || 0 },
      { label: 'Total Payouts', key: (t) => t.totalPayouts || '₹0' },
      { label: 'Pending Payouts', key: (t) => t.pendingPayouts || '₹0' },
      { label: 'Rating', key: (t) => t.rating || '—' },
      { label: 'Reference / Referrer', key: (t) => t.referenceName || '—' },
      { label: 'Referral Code', key: (t) => t.referralCode || '—' },
      { label: 'Registration Date', key: (t) => t.joiningDate || '—' }
    ];

    exportToCSV('Dahej_Support_Testers_Export', headers, filtered);
  };

  return (
    <div className="developers-page-container">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="dev-status-toast">
          <CheckCircle size={16} color="#10B981" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Statistic Cards Grid */}
      <div className="dev-stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        <StatsCard
          title="Total Testers"
          value={totalTesters.toString()}
          icon={ShieldCheck}
          subtitle="All registered QA testers"
          accentColor="#0A3D75"
          onClick={() => setSelectedFilter('All')}
        />

        <StatsCard
          title="Pending Testers"
          value={pendingTestersCount.toString()}
          icon={Clock}
          subtitle="Awaiting admin approval"
          accentColor="#F3821D"
          onClick={() => setSelectedFilter('Pending')}
        />

        <StatsCard
          title="Assigned Testers"
          value={assignedTesters.toString()}
          icon={UserCheck}
          subtitle="Currently verifying projects"
          accentColor="#0A3D75"
          onClick={() => setSelectedFilter('Assigned')}
        />

        <StatsCard
          title="Free Testers"
          value={freeTesters.toString()}
          icon={CheckCircle}
          subtitle="Approved with 0 active QA tasks"
          accentColor="#10B981"
          onClick={() => setSelectedFilter('Free')}
        />

        <StatsCard
          title="On Hold Testers"
          value={onHoldTesters.toString()}
          icon={PauseCircle}
          subtitle="Temporarily paused accounts"
          accentColor="#F3821D"
          onClick={() => setSelectedFilter('On Hold')}
        />

        <StatsCard
          title="Deactivated Testers"
          value={deactivatedTesters.toString()}
          icon={XCircle}
          subtitle="Revoked QA access"
          accentColor="#DC2626"
          onClick={() => setSelectedFilter('Deactivated')}
        />
      </div>

      {/* Dedicated Pending Testers Section at the top */}
      {pendingTestersList.length > 0 && (
        <div className="portal-card" style={{ padding: 0, overflow: 'hidden', border: '1.5px solid #FCD34D' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            padding: '14px 20px', 
            background: '#FFFBEB',
            borderBottom: '1px solid #FEF3C7'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ 
                width: '32px', 
                height: '32px', 
                borderRadius: '8px', 
                background: '#FEF3C7', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: '#D97706'
              }}>
                <Clock size={18} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#92400E' }}>
                  Pending Testers ({pendingTestersList.length})
                </h3>
                <span style={{ fontSize: '0.75rem', color: '#B45309' }}>
                  Newly registered QA testers awaiting admin verification & approval
                </span>
              </div>
            </div>
            <span style={{ 
              fontSize: '0.75rem', 
              fontWeight: 800, 
              padding: '4px 10px', 
              background: '#FDE68A', 
              color: '#92400E', 
              borderRadius: '20px' 
            }}>
              Action Required
            </span>
          </div>

          <div className="portal-table-container">
            <table className="portal-table">
              <thead>
                <tr>
                  <th>Tester</th>
                  <th>Application Message</th>
                  <th>Contact Details</th>
                  <th>Referrer / Reference</th>
                  <th>Registered On</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingTestersList.map((tester) => (
                  <tr key={`pending-${tester.id}`} style={{ background: '#FFFDF5' }}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <img
                          src={tester.avatar || '/assets/logo-icon.png'}
                          alt={tester.name}
                          style={{ 
                            width: '38px', 
                            height: '38px', 
                            borderRadius: '50%', 
                            objectFit: 'cover',
                            border: '1.5px solid #FCD34D',
                            flexShrink: 0
                          }}
                        />
                        <div>
                          <div 
                            className="table-proj-name"
                            onClick={() => onOpenTester(tester.id)}
                          >
                            {tester.name}
                          </div>
                          <span className="table-proj-id" style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0A3D75' }}>
                            {tester.id}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td style={{ maxWidth: '240px' }}>
                      <div style={{
                        fontSize: '0.78rem',
                        color: '#334155',
                        background: '#F8FAFC',
                        border: '1px solid #E2E8F0',
                        borderRadius: '6px',
                        padding: '6px 10px',
                        lineHeight: '1.45',
                        fontStyle: 'italic',
                        maxHeight: '62px',
                        overflowY: 'auto'
                      }}>
                        "{tester.applicationMessage || tester.aboutSelf || 'Applied via referral. No custom note provided.'}"
                      </div>
                      <div style={{ fontSize: '0.68rem', color: '#B45309', marginTop: '3px', fontWeight: 600 }}>
                        Auto-deletes upon approval
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.8rem', color: '#0F172A' }}>{tester.email}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{tester.mobile}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: '#0A3D75', fontSize: '0.82rem' }}>
                        {tester.referenceName || 'Direct Reference'}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '2px' }}>
                        Code: <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#C2410C', background: '#FFF7ED', padding: '1px 5px', borderRadius: '4px' }}>{tester.referralCode || 'DS-TST-201'}</span>
                      </div>
                    </td>
                    <td style={{ color: '#64748B', fontSize: '0.82rem' }}>
                      {tester.joiningDate || 'Recently'}
                    </td>
                    <td>
                      <StatusBadge status="Pending" size="small" />
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          onClick={() => onOpenTester(tester.id)}
                          className="btn btn-navy-action"
                          style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                        >
                          <Eye size={13} style={{ marginRight: '4px' }} />
                          <span>View Profile</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApprove(tester)}
                          className="btn btn-orange-primary"
                          style={{ padding: '6px 14px', fontSize: '0.78rem' }}
                        >
                          <Check size={13} style={{ marginRight: '4px' }} />
                          <span>Approve Tester</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReject(tester)}
                          className="btn btn-reject-action"
                          style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                          title="Reject QA Tester Application"
                        >
                          <XCircle size={13} style={{ marginRight: '4px' }} />
                          <span>Reject</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTargetTester(tester)}
                          className="btn btn-delete-action"
                          style={{ padding: '6px 10px', fontSize: '0.78rem' }}
                          title="Delete QA Tester Application"
                        >
                          <Trash2 size={13} style={{ marginRight: '4px' }} />
                          <span>Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Top Filter & Search Bar with Export Action */}
      <div className="admin-projects-top-bar">
        <div className="search-input-box" style={{ maxWidth: '340px' }}>
          <Search size={16} className="search-input-icon" />
          <input
            type="text"
            placeholder="Search by tester name, ID, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div className="projects-filter-tabs" style={{ margin: 0 }}>
            {filterTabs.map((tab) => {
              const count = tab === 'All'
                ? totalTesters
                : tab === 'Pending'
                  ? pendingTestersCount
                  : tab === 'Active'
                    ? activeTestersList.length
                    : tab === 'On Hold'
                      ? onHoldTesters
                      : deactivatedTesters;

              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setSelectedFilter(tab)}
                  className={`filter-tab-pill ${selectedFilter === tab ? 'active' : ''}`}
                >
                  <span>{tab}</span>
                  <span className="filter-tab-count">{count}</span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={handleExportTesters}
            className="btn btn-navy-action"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            title="Export QA Testers list to Excel / CSV"
          >
            <Download size={15} />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* Testers Table with EXACT 7 Columns */}
      {filtered.length > 0 ? (
        <div className="portal-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="portal-table-container">
            <table className="portal-table">
              <thead>
                <tr>
                  <th>Tester</th>
                  <th>Total Projects</th>
                  <th>Completed Projects</th>
                  <th>Total Payouts</th>
                  <th>Pending Payouts</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((tester) => {
                  const assignedCount = getTesterAssignedProjectsCount(tester);
                  const totalProjects = (tester.completedTesting || 0) + assignedCount;

                  return (
                    <tr key={tester.id} className={tester.status === 'Deactivated' ? 'dev-row-deactivated' : ''}>
                      {/* 1. Tester Column: Photo + Name + ID */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <img
                            src={tester.avatar || '/assets/logo-icon.png'}
                            alt={tester.name}
                            style={{ 
                              width: '38px', 
                              height: '38px', 
                              borderRadius: '50%', 
                              objectFit: 'cover',
                              border: '1.5px solid #CBD5E1',
                              flexShrink: 0
                            }}
                          />
                          <div>
                            <div 
                              className="table-proj-name"
                              onClick={() => onOpenTester(tester.id)}
                            >
                              {tester.name}
                            </div>
                            <span className="table-proj-id" style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0A3D75' }}>
                              {tester.id}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* 2. Total Projects */}
                      <td>
                        <span style={{ fontWeight: 800, color: '#0F172A' }}>
                          {totalProjects}
                        </span>
                      </td>

                      {/* 3. Completed Projects */}
                      <td>
                        <span style={{ fontWeight: 700, color: '#10B981' }}>
                          {tester.completedTesting || 0}
                        </span>
                      </td>

                      {/* 4. Total Payouts */}
                      <td>
                        <span style={{ fontWeight: 800, color: '#0A3D75' }}>
                          {tester.totalPayouts || '₹0'}
                        </span>
                      </td>

                      {/* 5. Pending Payouts */}
                      <td>
                        <span style={{ fontWeight: 700, color: tester.pendingPayouts && tester.pendingPayouts !== '₹0' ? '#F3821D' : '#64748B' }}>
                          {tester.pendingPayouts || '₹0'}
                        </span>
                      </td>

                      {/* 6. Status */}
                      <td>
                        <StatusBadge status={tester.status} size="small" />
                      </td>

                      {/* 7. Actions */}
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            onClick={() => onOpenTester(tester.id)}
                            className="btn btn-navy-action"
                            style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                          >
                            <Eye size={13} style={{ marginRight: '4px' }} />
                            <span>View Profile</span>
                          </button>

                          {/* Contextual Status Action */}
                          {tester.status === 'Pending' && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleApprove(tester)}
                                className="btn btn-orange-primary"
                                style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                              >
                                <Check size={13} style={{ marginRight: '4px' }} />
                                <span>Approve</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleReject(tester)}
                                className="btn btn-reject-action"
                                style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                              >
                                <XCircle size={13} style={{ marginRight: '4px' }} />
                                <span>Reject</span>
                              </button>
                            </>
                          )}

                          {tester.status === 'Active' && (
                            <div className="dev-status-select-wrap">
                              <select
                                value="Active"
                                onChange={(e) => {
                                  if (e.target.value === 'DELETE_TESTER') {
                                    setDeleteTargetTester(tester);
                                  } else {
                                    handleStatusChange(tester, e.target.value);
                                  }
                                }}
                                className="sort-select"
                                style={{ padding: '5px 8px', fontSize: '0.75rem', height: '31px' }}
                              >
                                <option value="Active" disabled>Status Action</option>
                                <option value="On Hold">Put On Hold</option>
                                <option value="Deactivated">Deactivate</option>
                                <option value="DELETE_TESTER">🗑️ Delete QA Tester</option>
                              </select>
                            </div>
                          )}

                          {tester.status === 'On Hold' && (
                            <div className="dev-status-select-wrap">
                              <select
                                value="On Hold"
                                onChange={(e) => {
                                  if (e.target.value === 'DELETE_TESTER') {
                                    setDeleteTargetTester(tester);
                                  } else {
                                    handleStatusChange(tester, e.target.value);
                                  }
                                }}
                                className="sort-select"
                                style={{ padding: '5px 8px', fontSize: '0.75rem', height: '31px' }}
                              >
                                <option value="On Hold" disabled>Status Action</option>
                                <option value="Active">Activate</option>
                                <option value="Deactivated">Deactivate</option>
                                <option value="DELETE_TESTER">🗑️ Delete QA Tester</option>
                              </select>
                            </div>
                          )}

                          {(tester.status === 'Deactivated' || tester.status === 'Rejected') && (
                            <button
                              type="button"
                              onClick={() => handleStatusChange(tester, 'Active')}
                              className="btn btn-navy-action"
                              style={{ padding: '6px 12px', fontSize: '0.78rem', background: '#F8FAFC' }}
                            >
                              <Check size={13} style={{ marginRight: '4px' }} />
                              <span>Activate</span>
                            </button>
                          )}

                          {/* Delete QA Tester Action */}
                          <button
                            type="button"
                            onClick={() => setDeleteTargetTester(tester)}
                            className="btn btn-delete-action"
                            style={{ padding: '6px 10px', fontSize: '0.78rem' }}
                            title="Delete QA Tester"
                          >
                            <Trash2 size={13} style={{ marginRight: '4px' }} />
                            <span>Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="portal-card">
          <EmptyState
            icon={ShieldCheck}
            title={totalTesters === 0 ? "No QA Testers Registered Yet" : "No QA Testers Found"}
            description={totalTesters === 0 
              ? "Real QA testers who register via the referral application form will appear in the Pending queue above for admin review and approval."
              : "No testers match your search or status filter."}
            actionLabel={totalTesters === 0 ? "Open Application Form" : "Reset Filters"}
            onAction={() => {
              if (totalTesters === 0 && onNavigate) {
                onNavigate('apply');
              } else {
                setSelectedFilter('All');
                setSearchTerm('');
              }
            }}
          />
        </div>
      )}

      {/* Delete QA Tester Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(deleteTargetTester)}
        item={deleteTargetTester}
        itemType="tester"
        assignedProjectsCount={deleteTargetTester ? getTesterAssignedProjectsCount(deleteTargetTester) : 0}
        onClose={() => setDeleteTargetTester(null)}
        onConfirm={handleConfirmDelete}
      />

      {/* Approve QA Tester Password & Welcome Email Modal */}
      <ApproveMemberModal
        isOpen={Boolean(approveTargetTester)}
        member={approveTargetTester}
        role="tester"
        onClose={() => setApproveTargetTester(null)}
        onConfirm={handleConfirmApproveTester}
      />
    </div>
  );
}
