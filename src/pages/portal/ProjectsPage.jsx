import React, { useState } from 'react';
import { Search, FolderKanban } from 'lucide-react';
import StatusBadge from '../../components/portal/StatusBadge';
import EmptyState from '../../components/portal/EmptyState';
import { 
  getFreelancerProjectStatus, 
  getDevAmount, 
  getDevProgress, 
  formatINR 
} from '../../utils/projectStatusUtils';
import { initialProjects } from '../../data/mockData';
import './ProjectsPage.css';

export default function ProjectsPage({ 
  onOpenProject, 
  projects = initialProjects, 
  defaultFilter = 'All' 
}) {
  const [selectedFilter, setSelectedFilter] = useState(defaultFilter);
  const [searchQuery, setSearchQuery] = useState('');

  // 7 Status Tabs in exact specified order: All, Active, Submitted, Under Review, Finalized, Approved, Completed
  const tabs = [
    'All',
    'Active',
    'Submitted',
    'Under Review',
    'Finalized',
    'Approved',
    'Completed'
  ];

  // Tab Counts calculation across all assigned projects using the state machine
  const getTabCount = (tabName) => {
    if (tabName === 'All') return projects.length;
    if (tabName === 'Under Review') {
      return projects.filter(p => {
        const s = getFreelancerProjectStatus(p);
        return s === 'Under Review' || s === 'Revision Required' || s === 'Changes Requested';
      }).length;
    }
    return projects.filter(p => getFreelancerProjectStatus(p) === tabName).length;
  };

  // Filter projects by selected tab & search query (Name & ID)
  const filteredProjects = projects.filter(p => {
    const status = getFreelancerProjectStatus(p);

    // Tab filter (must belong to that single tab, or All)
    if (selectedFilter !== 'All') {
      if (selectedFilter === 'Under Review') {
        if (status !== 'Under Review' && status !== 'Revision Required' && status !== 'Changes Requested') {
          return false;
        }
      } else if (status !== selectedFilter) {
        return false;
      }
    }

    // Search filter: Project Name or Project ID
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = (p.name || '').toLowerCase().includes(q);
      const matchId = (p.id || '').toLowerCase().includes(q);
      if (!matchName && !matchId) return false;
    }

    return true;
  });

  // Empty state description text per tab
  const getEmptyStateMessage = () => {
    if (searchQuery.trim()) {
      return {
        title: 'No matching projects',
        desc: `No projects match "${searchQuery}" under ${selectedFilter} filter.`
      };
    }

    switch (selectedFilter) {
      case 'Active':
        return { title: 'No active projects', desc: 'You have no projects currently in progress.' };
      case 'Submitted':
        return { title: 'No submitted projects', desc: 'No projects currently submitted and awaiting QA assignment.' };
      case 'Under Review':
        return { title: 'No projects under review', desc: 'No projects currently undergoing QA testing or revision review.' };
      case 'Finalized':
        return { title: 'No finalized projects', desc: 'No projects waiting for final Admin approval.' };
      case 'Approved':
        return { title: 'No approved projects', desc: 'No projects currently approved and awaiting payout release.' };
      case 'Completed':
        return { title: 'No completed projects', desc: 'No projects with developer payout 100% cleared yet.' };
      default:
        return { title: 'No projects found', desc: 'No projects assigned to your account.' };
    }
  };

  const emptyStateInfo = getEmptyStateMessage();

  return (
    <div className="projects-page-container">
      {/* Search Bar */}
      <div className="projects-header-controls">
        <div className="projects-search-filter-row">
          <div className="search-input-box" style={{ width: '100%', maxWidth: '380px' }}>
            <Search size={16} className="search-input-icon" />
            <input
              type="text"
              placeholder="Search by Project Name or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Exactly 7 Status-Based Tabs in Exact Order with Tab Counts */}
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
        <div className="portal-card" style={{ padding: '0', overflow: 'hidden' }}>
          <div className="portal-table-container">
            <table className="portal-table">
              <thead>
                <tr>
                  {/* Column 1: Project (Name + ID in same column) */}
                  <th>Project</th>
                  {/* Column 2: Assigned Date */}
                  <th>Assigned Date</th>
                  {/* Column 3: Deadline Date */}
                  <th>Deadline Date</th>
                  {/* Column 4: Amount */}
                  <th>Amount</th>
                  {/* Column 5: Progress */}
                  <th>Progress</th>
                  {/* Column 6: Status */}
                  <th>Status</th>
                  {/* Column 7: Action */}
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredProjects.map((p) => {
                  const status = getFreelancerProjectStatus(p);
                  const devProg = getDevProgress(p);
                  const devAmt = getDevAmount(p);
                  const assignedDate = p.assignedDate || p.startDate || '—';
                  const deadlineDate = p.submissionDate || p.developerDeadline || p.deadline || p.completedDate || 'Ongoing';

                  return (
                    <tr key={p.id}>
                      {/* Column 1: Project (Name + ID in SAME column) */}
                      <td>
                        <span 
                          className="table-proj-name"
                          onClick={() => onOpenProject && onOpenProject(p.id)}
                        >
                          {p.name}
                        </span>
                        <span className="table-proj-id">{p.id}</span>
                      </td>

                      {/* Column 2: Assigned Date */}
                      <td style={{ color: '#64748B', whiteSpace: 'nowrap' }}>
                        {assignedDate}
                      </td>

                      {/* Column 3: Deadline Date */}
                      <td style={{ fontWeight: 600, color: status === 'Under Review' && p.adminFeedback ? '#EF4444' : '#0A3D75', whiteSpace: 'nowrap' }}>
                        {deadlineDate}
                      </td>

                      {/* Column 4: Amount (Freelancer Payout Amount Only) */}
                      <td style={{ fontWeight: 800, color: '#111827', whiteSpace: 'nowrap' }}>
                        {formatINR(devAmt)}
                      </td>

                      {/* Column 5: Progress */}
                      <td style={{ minWidth: '130px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ flex: 1, height: '6px', backgroundColor: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
                            <div 
                              style={{ 
                                width: `${devProg}%`, 
                                height: '100%', 
                                backgroundColor: status === 'Completed' || status === 'Approved' ? '#10B981' : (status === 'Under Review' ? '#D97706' : (status === 'Finalized' ? '#6366F1' : '#0A3D75')),
                                borderRadius: '3px' 
                              }} 
                            />
                          </div>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>
                            {devProg}%
                          </span>
                        </div>
                      </td>

                      {/* Column 6: Status */}
                      <td>
                        <StatusBadge status={status} size="small" />
                      </td>

                      {/* Column 7: Action (View button only) */}
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => onOpenProject && onOpenProject(p.id)}
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
            {filteredProjects.map((p) => {
              const status = getFreelancerProjectStatus(p);
              const devProg = getDevProgress(p);
              const devAmt = getDevAmount(p);

              return (
                <div key={p.id} className="project-card-mobile">
                  <div className="mobile-card-top">
                    <div>
                      <h3 
                        style={{ fontSize: '1rem', fontWeight: 800, color: '#0A3D75', margin: '0 0 2px 0', cursor: 'pointer' }}
                        onClick={() => onOpenProject && onOpenProject(p.id)}
                      >
                        {p.name}
                      </h3>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>{p.id}</span>
                    </div>
                    <StatusBadge status={status} size="small" />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.825rem', color: '#64748B' }}>
                    <span>Assigned: <strong style={{ color: '#1E293B' }}>{p.assignedDate || '—'}</strong></span>
                    <span>Deadline: <strong style={{ color: '#0A3D75' }}>{p.submissionDate || p.developerDeadline || p.deadline || p.completedDate || 'Ongoing'}</strong></span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                    <span style={{ color: '#64748B' }}>Freelancer Payout:</span>
                    <span style={{ fontWeight: 800, color: '#111827' }}>{formatINR(devAmt)}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ flex: 1, height: '6px', backgroundColor: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
                      <div 
                        style={{ 
                          width: `${devProg}%`, 
                          height: '100%', 
                          backgroundColor: status === 'Completed' || status === 'Approved' ? '#10B981' : '#0A3D75' 
                        }} 
                      />
                    </div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>{devProg}%</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => onOpenProject && onOpenProject(p.id)}
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
        <EmptyState
          icon={FolderKanban}
          title={emptyStateInfo.title}
          description={emptyStateInfo.desc}
          actionLabel={searchQuery ? 'Clear Search' : undefined}
          onAction={searchQuery ? () => setSearchQuery('') : undefined}
        />
      )}
    </div>
  );
}
