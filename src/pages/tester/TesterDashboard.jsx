import React, { useState } from 'react';
import { 
  FolderKanban, 
  Clock, 
  Play, 
  CheckSquare,
  CheckCircle, 
  ShieldCheck, 
  Search 
} from 'lucide-react';
import StatsCard from '../../components/portal/StatsCard';
import StatusBadge from '../../components/portal/StatusBadge';
import EmptyState from '../../components/portal/EmptyState';
import { 
  getTesterDashboardStatus, 
  computeTesterDashboardStats,
  getDeveloperSubmittedDate
} from '../../services/testerApiService';
import './TesterDashboard.css';

export default function TesterDashboard({ 
  projects = [], 
  onNavigate, 
  onOpenProject 
}) {
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Helper to determine Tester Progress percentage
  const getTesterProgress = (p, status) => {
    if (status === 'Completed' || status === 'Approved' || status === 'Finalized') return 100;
    if (status === 'Pending') return 0;
    if (status === 'Under Review') return p.testingProgress || 50;
    return p.testingProgress || 0;
  };

  const getProgressBarColor = (status) => {
    if (status === 'Completed' || status === 'Approved') return '#10B981';
    if (status === 'Finalized') return '#D97706';
    if (status === 'Under Review') return '#0284C7';
    if (status === 'Pending') return '#F3821D';
    return '#94A3B8';
  };

  // =========================================================================
  // EXACTLY 6 TESTER DASHBOARD METRICS (Scoped to authenticated Tester)
  // =========================================================================
  const {
    totalProjectsCount,
    pendingProjectsCount,
    underReviewProjectsCount,
    finalizedProjectsCount,
    approvedProjectsCount,
    completedProjectsCount
  } = computeTesterDashboardStats(projects);

  // Filter projects by selected statistic card & search query
  const filteredProjects = projects.filter(p => {
    const status = getTesterDashboardStatus(p);

    // Filter by clicked card
    if (selectedFilter !== 'All') {
      if (status !== selectedFilter) return false;
    }

    // Search query matching: Project Name, Project ID, Developer Name, Developer ID
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = (p.name || '').toLowerCase().includes(q);
      const matchId = (p.id || '').toLowerCase().includes(q);
      const matchDev = (p.developer || p.developerName || '').toLowerCase().includes(q);
      const matchDevId = (p.developerId || '').toLowerCase().includes(q);
      if (!matchName && !matchId && !matchDev && !matchDevId) return false;
    }

    return true;
  });

  // Empty state messages per selected state
  const getEmptyStateMessage = () => {
    if (searchQuery.trim()) {
      return {
        title: 'No matching projects',
        desc: `No QA projects match "${searchQuery}" under ${selectedFilter} filter.`
      };
    }
    switch (selectedFilter) {
      case 'Pending':
        return { title: 'No pending projects', desc: 'No projects waiting for initial testing.' };
      case 'Under Review':
        return { title: 'No projects under review', desc: 'No projects currently in active testing cycle.' };
      case 'Finalized':
        return { title: 'No finalized projects', desc: 'No projects submitted for Admin approval.' };
      case 'Approved':
        return { title: 'No approved projects', desc: 'No projects approved and awaiting full payout.' };
      case 'Completed':
        return { title: 'No completed projects', desc: 'No projects with payout fully settled.' };
      default:
        return { title: 'No projects assigned', desc: 'No QA projects assigned to your account.' };
    }
  };

  const emptyStateInfo = getEmptyStateMessage();

  return (
    <div className="admin-dashboard-container">
      {/* Exactly 6 Project Statistic Boxes in Exact Specified Order */}
      <div 
        className="admin-stats-grid" 
        style={{ 
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          marginBottom: '24px' 
        }}
      >
        {/* 1. Total Projects */}
        <StatsCard
          title="Total Projects"
          value={totalProjectsCount}
          icon={FolderKanban}
          subtitle="All assigned QA projects"
          accentColor="#0A3D75"
          onClick={() => setSelectedFilter('All')}
        />

        {/* 2. Pending Projects */}
        <StatsCard
          title="Pending Projects"
          value={pendingProjectsCount}
          icon={Clock}
          subtitle="Waiting for review / testing"
          accentColor="#F3821D"
          onClick={() => setSelectedFilter('Pending')}
        />

        {/* 3. Under Review Projects */}
        <StatsCard
          title="Under Review Projects"
          value={underReviewProjectsCount}
          icon={Play}
          subtitle="Currently being tested"
          accentColor="#0284C7"
          onClick={() => setSelectedFilter('Under Review')}
        />

        {/* 4. Finalized Projects (NEW BOX) */}
        <StatsCard
          title="Finalized Projects"
          value={finalizedProjectsCount}
          icon={CheckSquare}
          subtitle="QA submitted to Admin"
          accentColor="#D97706"
          onClick={() => setSelectedFilter('Finalized')}
        />

        {/* 5. Approved Projects */}
        <StatsCard
          title="Approved Projects"
          value={approvedProjectsCount}
          icon={CheckCircle}
          subtitle="Admin approved"
          accentColor="#10B981"
          onClick={() => setSelectedFilter('Approved')}
        />

        {/* 6. Completed Projects */}
        <StatsCard
          title="Completed Projects"
          value={completedProjectsCount}
          icon={ShieldCheck}
          subtitle="Admin approved & fully paid"
          accentColor="#6366F1"
          onClick={() => setSelectedFilter('Completed')}
        />
      </div>

      {/* Main Project Table Card */}
      <div className="portal-card" style={{ marginBottom: '1.5rem' }}>
        <div className="portal-card-header" style={{ flexWrap: 'wrap', gap: '12px' }}>
          <h2 className="portal-card-title">
            <FolderKanban size={18} color="#0A3D75" />
            <span>
              {selectedFilter === 'All' ? 'All Assigned Projects' : `${selectedFilter} Projects`}
            </span>
          </h2>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="search-input-box" style={{ width: '260px', margin: 0 }}>
              <Search size={14} className="search-input-icon" />
              <input
                type="text"
                placeholder="Search project or developer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ padding: '7px 12px 7px 32px', fontSize: '0.84rem' }}
              />
            </div>

            {selectedFilter !== 'All' && (
              <button
                type="button"
                className="view-all-link-btn"
                onClick={() => setSelectedFilter('All')}
              >
                <span>Show All</span>
              </button>
            )}
          </div>
        </div>

        {/* Table: Project, Developer, Submitted Date, Deadline Date, Tester Progress, Status, Action */}
        {filteredProjects.length > 0 ? (
          <div className="portal-table-container">
            <table className="portal-table">
              <thead>
                <tr>
                  {/* Column 1: Project (Name + ID) */}
                  <th>Project</th>
                  {/* Column 2: Developer (Name + ID) */}
                  <th>Developer</th>
                  {/* Column 3: Submitted Date */}
                  <th>Submitted Date</th>
                  {/* Column 4: Deadline Date */}
                  <th>Deadline Date</th>
                  {/* Column 5: Tester Progress */}
                  <th>Tester Progress</th>
                  {/* Column 6: Status */}
                  <th>Status</th>
                  {/* Column 7: Action */}
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredProjects.map((proj) => {
                  const status = getTesterDashboardStatus(proj);
                  const progressVal = getTesterProgress(proj, status);
                  const submittedDateStr = getDeveloperSubmittedDate(proj);
                  const isSubmitted = submittedDateStr !== '—';

                  return (
                    <tr key={proj.id}>
                      {/* Column 1: Project (Name + ID in SAME column) */}
                      <td>
                        <span 
                          className="table-proj-name"
                          onClick={() => onOpenProject && onOpenProject(proj.id)}
                        >
                          {proj.name}
                        </span>
                        <span className="table-proj-id">{proj.id}</span>
                      </td>

                      {/* Column 2: Developer (Name + ID + Dev Progress) */}
                      <td>
                        <span style={{ fontWeight: 700, color: '#1E293B', display: 'block' }}>
                          {proj.developer || proj.developerName || 'Rahul Patel'}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                          <span style={{ fontSize: '0.72rem', color: '#64748B', fontFamily: 'monospace', fontWeight: 600 }}>
                            {proj.developerId || 'DEV-101'}
                          </span>
                          <span style={{ fontSize: '0.68rem', fontWeight: 700, color: (proj.developerProgress || proj.progress || 0) === 100 ? '#166534' : '#0A3D75', background: (proj.developerProgress || proj.progress || 0) === 100 ? '#DCFCE7' : '#EBF3FA', padding: '1px 5px', borderRadius: '3px' }}>
                            Dev: {proj.developerProgress || proj.progress || 0}%
                          </span>
                        </div>
                      </td>

                      {/* Column 3: Submitted Date */}
                      <td style={{ color: isSubmitted ? '#0A3D75' : '#94A3B8', fontWeight: isSubmitted ? 700 : 500, whiteSpace: 'nowrap' }}>
                        {submittedDateStr}
                      </td>

                      {/* Column 4: Deadline Date */}
                      <td style={{ color: '#17212B', fontWeight: 600, whiteSpace: 'nowrap' }}>
                        {proj.deadline || proj.completedDate || 'Ongoing'}
                      </td>

                      {/* Column 5: Tester Progress */}
                      <td style={{ minWidth: '130px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ flex: 1, height: '6px', backgroundColor: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
                            <div 
                              style={{ 
                                width: `${progressVal}%`, 
                                height: '100%', 
                                backgroundColor: getProgressBarColor(status),
                                borderRadius: '3px' 
                              }} 
                            />
                          </div>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>
                            {progressVal}%
                          </span>
                        </div>
                      </td>

                      {/* Column 6: Status (Pending, Under Review, Changes Assigned, Submitted, Approved, Completed) */}
                      <td>
                        <StatusBadge status={status} size="small" />
                      </td>

                      {/* Column 7: Action (View button to open particular project page) */}
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => onOpenProject && onOpenProject(proj.id)}
                          className="btn btn-navy-action"
                          style={{ padding: '6px 14px', fontSize: '0.78rem' }}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: '24px 0' }}>
            <EmptyState
              icon={FolderKanban}
              title={emptyStateInfo.title}
              description={emptyStateInfo.desc}
              actionLabel={selectedFilter !== 'All' || searchQuery ? 'View All Projects' : undefined}
              onAction={() => {
                setSelectedFilter('All');
                setSearchQuery('');
              }}
            />
          </div>
        )}

        {/* Responsive Mobile Cards */}
        {filteredProjects.length > 0 && (
          <div className="projects-mobile-cards" style={{ padding: '16px' }}>
            {filteredProjects.map((proj) => {
              const status = getTesterDashboardStatus(proj);
              const progressVal = getTesterProgress(proj, status);
              const submittedDateStr = getDeveloperSubmittedDate(proj);
              const isSubmitted = submittedDateStr !== '—';

              return (
                <div key={proj.id} className="project-card-mobile">
                  <div className="mobile-card-top">
                    <div>
                      <h3 
                        style={{ fontSize: '1rem', fontWeight: 800, color: '#0A3D75', margin: '0 0 2px 0', cursor: 'pointer' }}
                        onClick={() => onOpenProject && onOpenProject(proj.id)}
                      >
                        {proj.name}
                      </h3>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>{proj.id}</span>
                    </div>
                    <StatusBadge status={status} size="small" />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                    <span style={{ color: '#64748B' }}>Developer:</span>
                    <strong style={{ color: '#1E293B' }}>{proj.developer || proj.developerName || 'Rahul Patel'} ({proj.developerId || 'DEV-101'})</strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.825rem' }}>
                    <span style={{ color: '#64748B' }}>Submitted:</span>
                    <strong style={{ color: isSubmitted ? '#0A3D75' : '#94A3B8' }}>{submittedDateStr}</strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.825rem' }}>
                    <span style={{ color: '#64748B' }}>Deadline:</span>
                    <strong style={{ color: '#17212B' }}>{proj.deadline || proj.completedDate || 'Ongoing'}</strong>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '4px 0' }}>
                    <div style={{ flex: 1, height: '6px', backgroundColor: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
                      <div 
                        style={{ 
                          width: `${progressVal}%`, 
                          height: '100%', 
                          backgroundColor: getProgressBarColor(status) 
                        }} 
                      />
                    </div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>{progressVal}%</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => onOpenProject && onOpenProject(proj.id)}
                    className="btn btn-navy-action"
                    style={{ width: '100%', padding: '8px', fontSize: '0.825rem' }}
                  >
                    View
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
