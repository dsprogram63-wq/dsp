import React, { useState } from 'react';
import { 
  Clock, 
  CheckCircle, 
  Hourglass, 
  IndianRupee, 
  CheckSquare, 
  ArrowRight, 
  FolderOpen,
  Search
} from 'lucide-react';
import StatsCard from '../../components/portal/StatsCard';
import StatusBadge from '../../components/portal/StatusBadge';
import { initialProjects, initialActivities } from '../../data/mockData';
import { 
  getFreelancerProjectStatus, 
  getDevAmount, 
  getDevPaid, 
  getDevProgress, 
  formatINR 
} from '../../utils/projectStatusUtils';
import './DashboardPage.css';

export default function DashboardPage({ 
  onNavigate, 
  onOpenProject, 
  projects = initialProjects 
}) {
  const [searchQuery, setSearchQuery] = useState('');

  // =========================================================================
  // 7 DASHBOARD SUMMARY BOX CALCULATIONS (Scoped to currently logged-in freelancer)
  // =========================================================================

  // 1. Total Projects: All projects assigned to the currently logged-in freelancer
  const totalProjectsCount = projects.length;

  // 2. Active Projects: In progress & not submitted
  const activeProjectsCount = projects.filter(p => getFreelancerProjectStatus(p) === 'Active').length;

  // 3. Submitted Projects: Developer progress = 100% AND submitted to QA
  const submittedProjectsCount = projects.filter(p => getFreelancerProjectStatus(p) === 'Submitted').length;

  // 4. Under Review Projects: Submitted and currently in QA review cycle (including revision/rework)
  const underReviewProjectsCount = projects.filter(p => {
    const s = getFreelancerProjectStatus(p);
    return s === 'Under Review' || s === 'Revision Required' || s === 'Changes Requested';
  }).length;

  // 5. Approved Projects: Passed QA and approved by Admin (Approved or Completed)
  const approvedProjectsCount = projects.filter(p => {
    const st = getFreelancerProjectStatus(p);
    return st === 'Approved' || st === 'Completed';
  }).length;

  // 6. Total Approved Payouts: SUM of Developer amounts from Admin-approved projects
  const totalApprovedPayoutsNum = projects
    .filter(p => {
      const st = getFreelancerProjectStatus(p);
      return st === 'Approved' || st === 'Completed';
    })
    .reduce((acc, p) => acc + getDevAmount(p), 0);

  // 7. Total Payouts: Actual money already paid to the currently logged-in freelancer
  const totalPaidPayoutNum = projects
    .reduce((acc, p) => acc + getDevPaid(p), 0);

  // Search filtering for Project Table (supports Project Name & Project ID)
  const filteredProjects = projects.filter(p => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (p.name && p.name.toLowerCase().includes(q)) || 
      (p.id && p.id.toLowerCase().includes(q))
    );
  });

  // Dynamic Next Action item based on freelancer's active assignments
  const revisionProject = projects.find(p => {
    const s = getFreelancerProjectStatus(p);
    return s === 'Revision Required' || ((p.status || '').toLowerCase().includes('revision') || (p.testingStatus || '').toLowerCase().includes('changes'));
  });
  const activeWorkProject = projects.find(p => getFreelancerProjectStatus(p) === 'Active') || projects[0];

  return (
    <div className="dashboard-view-container">
      {/* Top Section: 5 Project Status Cards */}
      <div className="dashboard-grid-stats" style={{ marginBottom: '16px' }}>
        {/* 1. Total Projects */}
        <StatsCard
          title="Total Projects"
          value={totalProjectsCount}
          icon={FolderOpen}
          subtitle="All assigned projects"
          accentColor="#0A3D75"
          onClick={() => onNavigate && onNavigate('projects')}
        />

        {/* 2. Active Projects */}
        <StatsCard
          title="Active Projects"
          value={activeProjectsCount}
          icon={Clock}
          subtitle="Currently in progress"
          accentColor="#F3821D"
          onClick={() => onNavigate && onNavigate('active-projects')}
        />

        {/* 3. Submitted Projects */}
        <StatsCard
          title="Submitted Projects"
          value={submittedProjectsCount}
          icon={CheckSquare}
          subtitle="Submitted for review"
          accentColor="#0284C7"
          onClick={() => onNavigate && onNavigate('projects')}
        />

        {/* 4. Under Review Projects */}
        <StatsCard
          title="Under Review Projects"
          value={underReviewProjectsCount}
          icon={Hourglass}
          subtitle="In QA testing cycle"
          accentColor="#D97706"
          onClick={() => onNavigate && onNavigate('projects')}
        />

        {/* 5. Approved Projects */}
        <StatsCard
          title="Approved Projects"
          value={approvedProjectsCount}
          icon={CheckCircle}
          subtitle="Final Admin approved"
          accentColor="#10B981"
          onClick={() => onNavigate && onNavigate('projects')}
        />
      </div>

      {/* Bottom Section: 2 Financial Cards */}
      <div className="dashboard-financial-stats-grid">
        {/* 6. Total Approved Payouts */}
        <StatsCard
          title="Total Approved Payouts"
          value={formatINR(totalApprovedPayoutsNum)}
          icon={IndianRupee}
          subtitle="Approved project payouts"
          accentColor="#F3821D"
          onClick={() => onNavigate && onNavigate('earnings')}
        />

        {/* 7. Total Payouts */}
        <StatsCard
          title="Total Payouts"
          value={formatINR(totalPaidPayoutNum)}
          icon={IndianRupee}
          subtitle="Disbursed to account"
          accentColor="#10B981"
          onClick={() => onNavigate && onNavigate('earnings')}
        />
      </div>

      {/* Main Grid: Projects Table & Sidebar Cards */}
      <div className="dashboard-main-grid">
        {/* Left: Project Table */}
        <div className="portal-card">
          <div className="portal-card-header" style={{ flexWrap: 'wrap', gap: '12px' }}>
            <h2 className="portal-card-title">
              <FolderOpen size={18} color="#0A3D75" />
              <span>Project Directory</span>
            </h2>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div className="search-input-box" style={{ width: '220px', margin: 0 }}>
                <Search size={14} className="search-input-icon" />
                <input
                  type="text"
                  placeholder="Search project or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ padding: '6px 10px 6px 30px', fontSize: '0.82rem' }}
                />
              </div>

              <button
                type="button"
                onClick={() => onNavigate && onNavigate('projects')}
                className="portal-card-action-btn"
              >
                <span>View All</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>

          <div className="portal-table-container">
            <table className="portal-table">
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Assigned Date</th>
                  <th>Deadline Date</th>
                  <th>Amount</th>
                  <th>Progress</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredProjects.length > 0 ? (
                  filteredProjects.map((proj) => {
                    const displayStatus = getFreelancerProjectStatus(proj);
                    const devProg = getDevProgress(proj);
                    const devAmt = getDevAmount(proj);
                    const assignedDate = proj.assignedDate || proj.startDate || '—';
                    const deadlineDate = proj.submissionDate || proj.developerDeadline || proj.deadline || '—';

                    return (
                      <tr key={proj.id}>
                        {/* Column 1: Project (Name + ID in same column) */}
                        <td>
                          <span 
                            className="table-proj-name"
                            onClick={() => onOpenProject && onOpenProject(proj.id)}
                          >
                            {proj.name}
                          </span>
                          <span className="table-proj-id">{proj.id}</span>
                        </td>

                        {/* Column 2: Assigned Date */}
                        <td style={{ whiteSpace: 'nowrap', color: '#64748B' }}>
                          {assignedDate}
                        </td>

                        {/* Column 3: Deadline Date */}
                        <td style={{ whiteSpace: 'nowrap', fontWeight: 600, color: '#0A3D75' }}>
                          {deadlineDate}
                        </td>

                        {/* Column 4: Amount (Developer Amount assigned by Admin) */}
                        <td style={{ fontWeight: 700, color: '#111827', whiteSpace: 'nowrap' }}>
                          {formatINR(devAmt)}
                        </td>

                        {/* Column 5: Progress (Developer Progress 0-100%) */}
                        <td style={{ minWidth: '120px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ flex: 1, height: '6px', backgroundColor: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
                              <div 
                                style={{ 
                                  width: `${devProg}%`, 
                                  height: '100%', 
                                  backgroundColor: displayStatus === 'Completed' || displayStatus === 'Approved' ? '#10B981' : (displayStatus === 'Under Review' ? '#D97706' : (displayStatus === 'Finalized' ? '#6366F1' : '#0A3D75')),
                                  borderRadius: '3px' 
                                }} 
                              />
                            </div>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>
                              {devProg}%
                            </span>
                          </div>
                        </td>

                        {/* Column 6: Status (Assigned | In Progress | Submitted | Under Review | Approved | Paid) */}
                        <td>
                          <StatusBadge status={displayStatus} size="small" />
                        </td>

                        {/* Column 7: Action */}
                        <td style={{ textAlign: 'right' }}>
                          <button
                            type="button"
                            onClick={() => onOpenProject && onOpenProject(proj.id)}
                            className="btn btn-navy-action"
                            style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                          >
                            Open Project
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '36px 16px', color: '#64748B' }}>
                      <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1E293B' }}>
                        {searchQuery ? `No projects match "${searchQuery}"` : 'No projects assigned yet'}
                      </div>
                      <div style={{ fontSize: '0.8rem', marginTop: '4px' }}>
                        Projects assigned to your freelancer account by Admin will appear here.
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Next Action Prompt & Recent Activity */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Next Action Box */}
          {revisionProject ? (
            <div className="next-action-card">
              <span className="next-action-badge">🔥 Action Required</span>
              <div className="next-action-title">
                Review Feedback on {revisionProject.id}
              </div>
              <p className="next-action-desc">
                {revisionProject.testingNotes || `QA / Admin requested review updates on "${revisionProject.name}" to proceed to approval.`}
              </p>
              <button
                type="button"
                onClick={() => onOpenProject && onOpenProject(revisionProject.id)}
                className="btn btn-orange-primary"
                style={{ width: '100%', padding: '9px 16px', fontSize: '0.85rem' }}
              >
                <span>Review Feedback</span>
                <ArrowRight size={14} />
              </button>
            </div>
          ) : activeWorkProject ? (
            <div className="next-action-card">
              <span className="next-action-badge" style={{ background: '#EBF3FA', color: '#0A3D75' }}>🚀 Active Workspace</span>
              <div className="next-action-title">
                {activeWorkProject.name}
              </div>
              <p className="next-action-desc">
                Deadline: {activeWorkProject.submissionDate || activeWorkProject.developerDeadline || activeWorkProject.deadline || 'Upcoming'} • Current Progress: {getDevProgress(activeWorkProject)}%
              </p>
              <button
                type="button"
                onClick={() => onOpenProject && onOpenProject(activeWorkProject.id)}
                className="btn btn-navy-action"
                style={{ width: '100%', padding: '9px 16px', fontSize: '0.85rem' }}
              >
                <span>Continue Work</span>
                <ArrowRight size={14} />
              </button>
            </div>
          ) : (
            <div className="next-action-card" style={{ borderLeftColor: '#10B981' }}>
              <span className="next-action-badge" style={{ background: '#ECFDF5', color: '#065F46' }}>✓ All Caught Up</span>
              <div className="next-action-title">
                No Pending Actions
              </div>
              <p className="next-action-desc">
                All milestone deliverables are up to date. You will be notified when new tasks or projects are assigned.
              </p>
            </div>
          )}

          {/* Recent Activity Card */}
          <div className="portal-card">
            <div className="portal-card-header" style={{ marginBottom: '16px' }}>
              <h3 className="portal-card-title" style={{ fontSize: '1rem' }}>
                <Clock size={16} color="#0A3D75" />
                <span>Recent Activity</span>
              </h3>
            </div>

            <div className="activity-stream">
              {initialActivities.map((act) => (
                <div key={act.id} className="activity-stream-item">
                  <div className={`activity-node-dot ${act.type}`} />
                  <div>
                    <div className="activity-text-str">{act.text}</div>
                    <div className="activity-time-str">{act.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
