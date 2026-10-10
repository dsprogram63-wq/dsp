import React, { useState } from 'react';
import { Search, FolderKanban } from 'lucide-react';
import StatusBadge from '../../components/portal/StatusBadge';
import EmptyState from '../../components/portal/EmptyState';
import { 
  getTesterProjectStatus, 
  getDeveloperSubmittedDate 
} from '../../services/testerApiService';
import { initialAdminProjects } from '../../data/adminMockData';
import '../portal/ProjectsPage.css';

export default function TesterProjectsPage({ 
  projects = initialAdminProjects, 
  onOpenProject,
  onNavigate,
  defaultFilter = 'All' 
}) {
  const [selectedFilter, setSelectedFilter] = useState(defaultFilter);
  const [searchQuery, setSearchQuery] = useState('');

  // Exactly 6 Status Tabs in exact specified order
  const tabs = [
    'All',
    'Pending',
    'Under Review',
    'Finalized',
    'Approved',
    'Completed'
  ];

  // Helper to determine Tester Review Progress percentage
  const getTesterProgress = (p, status) => {
    if (status === 'Completed' || status === 'Approved' || status === 'Finalized') return 100;
    if (status === 'Pending') return 0;
    if (status === 'Under Review') return p.testingProgress !== undefined ? p.testingProgress : 50;
    return p.testingProgress || 0;
  };

  // Progress Bar Indicator Color
  const getProgressBarColor = (status) => {
    if (status === 'Completed' || status === 'Approved') return '#10B981';
    if (status === 'Finalized') return '#D97706';
    if (status === 'Under Review') return '#0284C7';
    if (status === 'Pending') return '#F3821D';
    return '#94A3B8';
  };

  // Tab Counts calculation across all assigned QA projects
  const getTabCount = (tabName) => {
    if (tabName === 'All') return projects.length;
    return projects.filter(p => getTesterProjectStatus(p) === tabName).length;
  };

  // Filter projects by selected tab & search query (Project Name, Project ID, Developer Name, Developer ID)
  const filteredProjects = projects.filter(p => {
    const status = getTesterProjectStatus(p);

    // Filter by tab
    if (selectedFilter !== 'All' && status !== selectedFilter) {
      return false;
    }

    // Filter by search query within selected tab
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

  // Empty state messages per selected tab / search
  const getEmptyStateMessage = () => {
    if (searchQuery.trim()) {
      return {
        title: 'No matching projects',
        desc: `No QA projects match "${searchQuery}" under ${selectedFilter} tab.`
      };
    }
    switch (selectedFilter) {
      case 'Pending':
        return { title: 'No pending projects', desc: 'No projects waiting for initial testing or review.' };
      case 'Under Review':
        return { title: 'No projects under review', desc: 'No projects currently in active testing or review cycle.' };
      case 'Finalized':
        return { title: 'No finalized projects', desc: 'No projects with completed testing review waiting for Admin approval.' };
      case 'Approved':
        return { title: 'No approved projects', desc: 'No approved projects recorded.' };
      case 'Completed':
        return { title: 'No completed projects', desc: 'No completed projects recorded in testing history.' };
      default:
        return { title: 'No projects found', desc: 'No QA projects assigned to your tester account.' };
    }
  };

  const emptyStateInfo = getEmptyStateMessage();

  return (
    <div className="projects-page-container">
      {/* Search Header Controls */}
      <div className="projects-header-controls">
        <div className="projects-search-filter-row">
          <div className="search-input-box" style={{ width: '100%', maxWidth: '380px' }}>
            <Search size={16} className="search-input-icon" />
            <input
              type="text"
              placeholder="Search by Project, ID, Developer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Exactly 6 Status Tabs in Exact Order with Tab Counts */}
      <div className="projects-filter-tabs">
        {tabs.map((tab) => {
          const count = getTabCount(tab);
          const isActive = selectedFilter === tab;

          return (
            <button
              key={tab}
              type="button"
              onClick={() => setSelectedFilter(tab)}
              className={`filter-tab-pill ${isActive ? 'active' : ''}`}
            >
              <span>{tab}</span>
              <span className="filter-tab-count">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Main Table: Exactly 7 Columns */}
      {filteredProjects.length > 0 ? (
        <div className="portal-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="portal-table-container">
            <table className="portal-table">
              <thead>
                <tr>
                  {/* Column 1: Project (Name + ID in SAME column) */}
                  <th>Project</th>
                  {/* Column 2: Developer (Name + ID in SAME column) */}
                  <th>Developer</th>
                  {/* Column 3: Submitted Date */}
                  <th>Submitted Date</th>
                  {/* Column 4: Deadline Date */}
                  <th>Deadline Date</th>
                  {/* Column 5: Progress (Testing/Review Completion) */}
                  <th>Progress</th>
                  {/* Column 6: Status */}
                  <th>Status</th>
                  {/* Column 7: Action */}
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredProjects.map((proj) => {
                  const status = getTesterProjectStatus(proj);
                  const progressVal = getTesterProgress(proj, status);
                  const submittedDateStr = getDeveloperSubmittedDate(proj);
                  const isSubmitted = submittedDateStr !== '—';

                  return (
                    <tr key={proj.id}>
                      {/* Column 1: Project (Name primary, ID secondary underneath in SAME column) */}
                      <td>
                        <span 
                          className="table-proj-name"
                          onClick={() => onOpenProject && onOpenProject(proj.id)}
                        >
                          {proj.name}
                        </span>
                        <span className="table-proj-id">{proj.id}</span>
                      </td>

                      {/* Column 2: Developer (Name primary, ID & Dev Progress secondary) */}
                      <td>
                        <span style={{ fontWeight: 700, color: '#1E293B', display: 'block' }}>
                          {proj.developer || proj.developerName || 'Rahul Patel'}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                          <span style={{ fontSize: '0.75rem', color: '#64748B', fontFamily: 'monospace', fontWeight: 600 }}>
                            {proj.developerId || 'DEV-101'}
                          </span>
                          <span style={{ fontSize: '0.68rem', fontWeight: 700, color: (proj.developerProgress || proj.progress || 0) === 100 ? '#166534' : '#0A3D75', background: (proj.developerProgress || proj.progress || 0) === 100 ? '#DCFCE7' : '#EBF3FA', padding: '1px 5px', borderRadius: '3px' }}>
                            Dev: {proj.developerProgress || proj.progress || 0}%
                          </span>
                        </div>
                      </td>

                      {/* Column 3: Submitted Date (Shows Developer's submission date or '—' if not submitted) */}
                      <td style={{ color: isSubmitted ? '#0A3D75' : '#94A3B8', fontWeight: isSubmitted ? 700 : 500, whiteSpace: 'nowrap' }}>
                        {submittedDateStr}
                      </td>

                      {/* Column 4: Deadline Date */}
                      <td style={{ color: '#17212B', fontWeight: 600, whiteSpace: 'nowrap' }}>
                        {proj.deadline || proj.completedDate || 'Ongoing'}
                      </td>

                      {/* Column 5: Progress (Testing / Review Completion) */}
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

                      {/* Column 6: Status Badge */}
                      <td>
                        <StatusBadge status={status} size="small" />
                      </td>

                      {/* Column 7: Action (View button only) */}
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

          {/* Responsive Mobile Cards View */}
          <div className="projects-mobile-cards" style={{ padding: '16px' }}>
            {filteredProjects.map((proj) => {
              const status = getTesterProjectStatus(proj);
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
        </div>
      ) : (
        <div className="portal-card" style={{ padding: '24px 0' }}>
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
    </div>
  );
}
