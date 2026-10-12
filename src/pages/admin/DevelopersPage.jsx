import React, { useState } from 'react';
import { 
  Users, 
  UserCheck, 
  Clock, 
  Search, 
  Eye, 
  ShieldCheck, 
  CheckCircle, 
  AlertCircle,
  IndianRupee,
  PauseCircle,
  XCircle,
  Check,
  ChevronDown,
  UserX,
  UserPlus,
  Download
} from 'lucide-react';
import StatsCard from '../../components/portal/StatsCard';
import StatusBadge from '../../components/portal/StatusBadge';
import EmptyState from '../../components/portal/EmptyState';
import { exportToCSV } from '../../utils/exportUtils';
import { initialDevelopers } from '../../data/adminMockData';
import './DevelopersPage.css';

export default function DevelopersPage({ 
  developers = initialDevelopers, 
  projects = [],
  onUpdateDeveloper,
  onOpenDeveloper, 
  onNavigate 
}) {
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState(null);
  const [openDropdownId, setOpenDropdownId] = useState(null);

  const filterTabs = ['All', 'Pending', 'Active', 'On Hold', 'Deactivated'];

  // Ensure unique developer accounts by ID
  const uniqueDevelopers = Array.from(
    new Map((developers || []).map(dev => [dev.id, dev])).values()
  );

  // Dynamic helper: Calculate currently assigned projects for a developer
  const getDevAssignedProjectsCount = (dev) => {
    let countFromProjects = 0;
    if (Array.isArray(projects) && projects.length > 0) {
      countFromProjects = projects.filter(p => 
        (p.developerId && p.developerId === dev.id) ||
        (p.developer && dev.name && p.developer.toLowerCase().trim() === dev.name.toLowerCase().trim())
      ).length;
    }
    const countFromCurrent = Array.isArray(dev.currentProjects) ? dev.currentProjects.length : 0;
    const countFromProp = dev.activeProjectsCount || 0;
    return Math.max(countFromProjects, countFromCurrent, countFromProp);
  };

  // =========================================================================
  // DYNAMIC STATISTIC CALCULATIONS (Strict Status Priority & Real System Data)
  // Priority: 1. Pending -> 2. Deactivated -> 3. On Hold -> 4. Active (Assigned vs Free)
  // =========================================================================

  // 1. Total Developers: ALL unique developer accounts regardless of status
  const totalDevs = uniqueDevelopers.length;

  // 2. Pending Developers: Registration completed, awaiting admin approval
  const pendingDevsList = uniqueDevelopers.filter(d => d.status === 'Pending');
  const pendingDevsCount = pendingDevsList.length;

  // 3. Deactivated Developers: Platform access revoked
  const deactivatedDevsList = uniqueDevelopers.filter(d => d.status === 'Deactivated');
  const deactivatedDevs = deactivatedDevsList.length;

  // 4. On Hold Developers: Explicitly paused by admin (independent of projects)
  const onHoldDevsList = uniqueDevelopers.filter(d => d.status === 'On Hold');
  const onHoldDevs = onHoldDevsList.length;

  // 5. Approved/Active Developers pool
  const activeDevsList = uniqueDevelopers.filter(d => d.status === 'Active' || d.status === 'Approved');

  // 6. Assigned Developers: Approved/Active + at least 1 currently assigned project (> 0)
  const assignedDevsList = activeDevsList.filter(d => getDevAssignedProjectsCount(d) > 0);
  const assignedDevs = assignedDevsList.length;

  // 7. Free Developers: Approved/Active + 0 currently assigned projects
  const freeDevsList = activeDevsList.filter(d => getDevAssignedProjectsCount(d) === 0);
  const freeDevs = freeDevsList.length;

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleStatusChange = (dev, newStatus) => {
    const assignedCount = getDevAssignedProjectsCount(dev);
    let newAvailability = dev.availability;
    if (newStatus === 'Deactivated' || newStatus === 'Rejected') {
      newAvailability = 'Inactive';
    } else if (newStatus === 'On Hold') {
      newAvailability = 'On Hold';
    } else if (newStatus === 'Active' || newStatus === 'Approved') {
      newAvailability = assignedCount > 0 ? 'Busy' : 'Available';
    }

    const updated = {
      ...dev,
      status: newStatus,
      availability: newAvailability
    };

    if (onUpdateDeveloper) {
      onUpdateDeveloper(updated);
    }
    setOpenDropdownId(null);
    showToast(`Developer "${dev.name}" status updated to "${newStatus}"`);
  };

  const handleApprove = (dev) => {
    handleStatusChange(dev, 'Active');
    showToast(`Developer "${dev.name}" approved successfully!`);
  };

  const handleReject = (dev) => {
    handleStatusChange(dev, 'Rejected');
    showToast(`Developer "${dev.name}" application rejected.`);
  };

  const filtered = uniqueDevelopers.filter(dev => {
    const isAssigned = getDevAssignedProjectsCount(dev) > 0;
    const isActive = dev.status === 'Active' || dev.status === 'Approved';

    // Filter Tab
    if (selectedFilter === 'Pending' && dev.status !== 'Pending') return false;
    if (selectedFilter === 'Active' && !isActive) return false;
    if (selectedFilter === 'On Hold' && dev.status !== 'On Hold') return false;
    if (selectedFilter === 'Deactivated' && dev.status !== 'Deactivated' && dev.status !== 'Rejected') return false;
    if (selectedFilter === 'Assigned' && !(isActive && isAssigned)) return false;
    if (selectedFilter === 'Free' && !(isActive && !isAssigned)) return false;

    // Search Query (Name, ID, Email, Primary Skill)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        (dev.name && dev.name.toLowerCase().includes(q)) ||
        (dev.id && dev.id.toLowerCase().includes(q)) ||
        (dev.email && dev.email.toLowerCase().includes(q)) ||
        (dev.primarySkill && dev.primarySkill.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Export filtered developers to Excel/CSV
  const handleExportDevelopers = () => {
    const headers = [
      { label: 'Developer ID', key: 'id' },
      { label: 'Full Name', key: 'name' },
      { label: 'Email Address', key: 'email' },
      { label: 'Mobile Number', key: 'mobile' },
      { label: 'Primary Skill', key: 'primarySkill' },
      { label: 'Experience', key: 'experience' },
      { label: 'Account Status', key: 'status' },
      { label: 'Availability', key: 'availability' },
      { label: 'Active Projects', key: (d) => getDevAssignedProjectsCount(d) },
      { label: 'Completed Projects', key: (d) => d.completedProjectsCount || 0 },
      { label: 'Revision Projects', key: (d) => d.revisionProjectsCount || 0 },
      { label: 'Total Earnings', key: (d) => d.totalEarnings || '₹0' },
      { label: 'Pending Payouts', key: (d) => d.pendingPayouts || '₹0' },
      { label: 'Rating', key: (d) => d.rating || '—' },
      { label: 'Reference / Referrer', key: (d) => d.referenceName || '—' },
      { label: 'Referral Code', key: (d) => d.referralCode || '—' },
      { label: 'Registration Date', key: (d) => d.joiningDate || '—' }
    ];

    exportToCSV('Dahej_Support_Developers_Export', headers, filtered);
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
          title="Total Developers"
          value={totalDevs.toString()}
          icon={Users}
          subtitle="All registered developers"
          accentColor="#0A3D75"
          onClick={() => setSelectedFilter('All')}
        />

        <StatsCard
          title="Pending Developers"
          value={pendingDevsCount.toString()}
          icon={Clock}
          subtitle="Awaiting admin approval"
          accentColor="#F3821D"
          onClick={() => setSelectedFilter('Pending')}
        />

        <StatsCard
          title="Assigned Developers"
          value={assignedDevs.toString()}
          icon={UserCheck}
          subtitle="Currently working on projects"
          accentColor="#0A3D75"
          onClick={() => setSelectedFilter('Assigned')}
        />

        <StatsCard
          title="Free Developers"
          value={freeDevs.toString()}
          icon={CheckCircle}
          subtitle="Approved with 0 active projects"
          accentColor="#10B981"
          onClick={() => setSelectedFilter('Free')}
        />

        <StatsCard
          title="On Hold Developers"
          value={onHoldDevs.toString()}
          icon={PauseCircle}
          subtitle="Temporarily paused accounts"
          accentColor="#F3821D"
          onClick={() => setSelectedFilter('On Hold')}
        />

        <StatsCard
          title="Deactivated Developers"
          value={deactivatedDevs.toString()}
          icon={XCircle}
          subtitle="Revoked platform access"
          accentColor="#DC2626"
          onClick={() => setSelectedFilter('Deactivated')}
        />
      </div>

      {/* Dedicated Pending Developers Section at the top */}
      {pendingDevsList.length > 0 && (
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
                  Pending Developers ({pendingDevsList.length})
                </h3>
                <span style={{ fontSize: '0.75rem', color: '#B45309' }}>
                  Newly registered developers awaiting admin verification & approval
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
                  <th>Developer</th>
                  <th>Contact Details</th>
                  <th>Referrer / Reference</th>
                  <th>Registered On</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingDevsList.map((dev) => (
                  <tr key={`pending-${dev.id}`} style={{ background: '#FFFDF5' }}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <img
                          src={dev.avatar || '/assets/logo-icon.png'}
                          alt={dev.name}
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
                            onClick={() => onOpenDeveloper(dev.id)}
                          >
                            {dev.name}
                          </div>
                          <span className="table-proj-id" style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0A3D75' }}>
                            {dev.id}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.8rem', color: '#0F172A' }}>{dev.email}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{dev.mobile}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: '#0A3D75', fontSize: '0.82rem' }}>
                        {dev.referenceName || 'Direct Reference'}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '2px' }}>
                        Code: <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0A3D75', background: '#E8F2FC', padding: '1px 5px', borderRadius: '4px' }}>{dev.referralCode || 'DS-REF-8902'}</span>
                      </div>
                    </td>
                    <td style={{ color: '#64748B', fontSize: '0.82rem' }}>
                      {dev.joiningDate || 'Recently'}
                    </td>
                    <td>
                      <StatusBadge status="Pending" size="small" />
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          onClick={() => onOpenDeveloper(dev.id)}
                          className="btn btn-navy-action"
                          style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                        >
                          <Eye size={13} style={{ marginRight: '4px' }} />
                          <span>View Profile</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApprove(dev)}
                          className="btn btn-orange-primary"
                          style={{ padding: '6px 14px', fontSize: '0.78rem' }}
                        >
                          <Check size={13} style={{ marginRight: '4px' }} />
                          <span>Approve Developer</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReject(dev)}
                          className="btn btn-reject-action"
                          style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                          title="Reject Developer Application"
                        >
                          <XCircle size={13} style={{ marginRight: '4px' }} />
                          <span>Reject</span>
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
            placeholder="Search by developer name, ID, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div className="projects-filter-tabs" style={{ margin: 0 }}>
            {filterTabs.map((tab) => {
              const count = tab === 'All'
                ? totalDevs
                : tab === 'Pending'
                  ? pendingDevsCount
                  : tab === 'Active'
                    ? activeDevsList.length
                    : tab === 'On Hold'
                      ? onHoldDevs
                      : deactivatedDevs;

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
            onClick={handleExportDevelopers}
            className="btn btn-navy-action"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            title="Export Developers list to Excel / CSV"
          >
            <Download size={15} />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* Developers Table with EXACT 7 Columns */}
      {filtered.length > 0 ? (
        <div className="portal-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="portal-table-container">
            <table className="portal-table">
              <thead>
                <tr>
                  <th>Developer</th>
                  <th>Total Projects</th>
                  <th>Completed Projects</th>
                  <th>Total Payouts</th>
                  <th>Pending Payouts</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((dev) => {
                  const assignedCount = getDevAssignedProjectsCount(dev);
                  const totalProjects = (dev.completedProjectsCount || 0) + assignedCount;

                  return (
                    <tr key={dev.id} className={dev.status === 'Deactivated' ? 'dev-row-deactivated' : ''}>
                      {/* 1. Developer Column: Photo + Name + ID */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <img
                            src={dev.avatar || '/assets/logo-icon.png'}
                            alt={dev.name}
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
                              onClick={() => onOpenDeveloper(dev.id)}
                            >
                              {dev.name}
                            </div>
                            <span className="table-proj-id" style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0A3D75' }}>
                              {dev.id}
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
                          {dev.completedProjectsCount || 0}
                        </span>
                      </td>

                      {/* 4. Total Payouts */}
                      <td>
                        <span style={{ fontWeight: 800, color: '#0A3D75' }}>
                          {dev.totalEarnings || '₹0'}
                        </span>
                      </td>

                      {/* 5. Pending Payouts */}
                      <td>
                        <span style={{ fontWeight: 700, color: dev.pendingPayouts && dev.pendingPayouts !== '₹0' ? '#F3821D' : '#64748B' }}>
                          {dev.pendingPayouts || '₹0'}
                        </span>
                      </td>

                      {/* 6. Status */}
                      <td>
                        <StatusBadge status={dev.status} size="small" />
                      </td>

                      {/* 7. Actions */}
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            onClick={() => onOpenDeveloper(dev.id)}
                            className="btn btn-navy-action"
                            style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                          >
                            <Eye size={13} style={{ marginRight: '4px' }} />
                            <span>View Profile</span>
                          </button>

                          {/* Contextual Status Action */}
                          {dev.status === 'Pending' && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleApprove(dev)}
                                className="btn btn-orange-primary"
                                style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                              >
                                <Check size={13} style={{ marginRight: '4px' }} />
                                <span>Approve</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleReject(dev)}
                                className="btn btn-reject-action"
                                style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                              >
                                <XCircle size={13} style={{ marginRight: '4px' }} />
                                <span>Reject</span>
                              </button>
                            </>
                          )}

                          {dev.status === 'Active' && (
                            <div className="dev-status-select-wrap">
                              <select
                                value="Active"
                                onChange={(e) => handleStatusChange(dev, e.target.value)}
                                className="sort-select"
                                style={{ padding: '5px 8px', fontSize: '0.75rem', height: '31px' }}
                              >
                                <option value="Active" disabled>Status Action</option>
                                <option value="On Hold">Put On Hold</option>
                                <option value="Deactivated">Deactivate</option>
                              </select>
                            </div>
                          )}

                          {dev.status === 'On Hold' && (
                            <div className="dev-status-select-wrap">
                              <select
                                value="On Hold"
                                onChange={(e) => handleStatusChange(dev, e.target.value)}
                                className="sort-select"
                                style={{ padding: '5px 8px', fontSize: '0.75rem', height: '31px' }}
                              >
                                <option value="On Hold" disabled>Status Action</option>
                                <option value="Active">Activate</option>
                                <option value="Deactivated">Deactivate</option>
                              </select>
                            </div>
                          )}

                          {(dev.status === 'Deactivated' || dev.status === 'Rejected') && (
                            <button
                              type="button"
                              onClick={() => handleStatusChange(dev, 'Active')}
                              className="btn btn-navy-action"
                              style={{ padding: '6px 12px', fontSize: '0.78rem', background: '#F8FAFC' }}
                            >
                              <Check size={13} style={{ marginRight: '4px' }} />
                              <span>Activate</span>
                            </button>
                          )}
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
            icon={Users}
            title={totalDevs === 0 ? "No Developers Registered Yet" : "No Developers Found"}
            description={totalDevs === 0 
              ? "Real developers who register via the referral application form will appear in the Pending queue above for admin review and approval."
              : "No developers match your search or status filter."}
            actionLabel={totalDevs === 0 ? "Open Application Form" : "Reset Filters"}
            onAction={() => {
              if (totalDevs === 0 && onNavigate) {
                onNavigate('apply');
              } else {
                setSelectedFilter('All');
                setSearchQuery('');
              }
            }}
          />
        </div>
      )}
    </div>
  );
}
