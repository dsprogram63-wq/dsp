import React, { useState } from 'react';
import { 
  Search, 
  Play, 
  User, 
  Clock, 
  AlertCircle, 
  CheckCircle, 
  AlertOctagon,
  CheckSquare2,
  FolderKanban
} from 'lucide-react';
import StatusBadge from '../../components/portal/StatusBadge';
import EmptyState from '../../components/portal/EmptyState';

export default function TesterTestingQueuePage({ 
  projects = [], 
  onOpenProject 
}) {
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  const filterTabs = ['All', 'Pending Testing', 'In Testing', 'Revision Required', 'Resubmitted', 'Approved'];

  const filteredProjects = projects.filter(proj => {
    // Text search
    const matchesSearch = 
      proj.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proj.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proj.developer.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    // Filter status
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Pending Testing') return proj.testingStatus === 'Awaiting Testing' || (proj.status === 'Submitted' && proj.testingProgress === 0);
    if (activeFilter === 'In Testing') return proj.testingStatus === 'In Testing';
    if (activeFilter === 'Revision Required') return proj.status === 'Revision Required' || proj.testingStatus === 'Changes Requested';
    if (activeFilter === 'Resubmitted') return proj.testingStatus === 'Resubmitted' || proj.status === 'Resubmitted';
    if (activeFilter === 'Approved') return proj.testingStatus === 'Tester Approved' || proj.status === 'Completed';
    return true;
  });

  return (
    <div className="admin-projects-page-container">
      {/* Top Search Controls */}
      <div className="admin-projects-top-bar">
        <div className="admin-projects-search-row">
          <div className="search-input-box" style={{ maxWidth: '380px' }}>
            <Search size={16} className="search-input-icon" />
            <input 
              type="text" 
              placeholder="Search queue by project or developer..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="projects-filter-tabs">
        {filterTabs.map((tab) => {
          const count = tab === 'All'
            ? projects.length
            : tab === 'Pending Testing'
            ? projects.filter(p => p.testingStatus === 'Awaiting Testing' || (p.status === 'Submitted' && p.testingProgress === 0)).length
            : tab === 'In Testing'
            ? projects.filter(p => p.testingStatus === 'In Testing').length
            : tab === 'Revision Required'
            ? projects.filter(p => p.status === 'Revision Required' || p.testingStatus === 'Changes Requested').length
            : tab === 'Approved'
            ? projects.filter(p => p.testingStatus === 'Tester Approved' || p.status === 'Completed').length
            : 0;

          return (
            <button
              key={tab}
              type="button"
              className={`filter-tab-pill ${activeFilter === tab ? 'active' : ''}`}
              onClick={() => setActiveFilter(tab)}
            >
              <span>{tab}</span>
              <span className="filter-tab-count">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Queue Table Card */}
      {filteredProjects.length > 0 ? (
        <div className="portal-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="portal-table-container">
            <table className="portal-table">
              <thead>
                <tr>
                  <th>Project Name</th>
                  <th>Developer</th>
                  <th>Submitted Date</th>
                  <th>Dev Progress</th>
                  <th>QA Progress</th>
                  <th>Testing Status</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredProjects.map((proj) => {
                  const isUnderTesting = proj.testingStatus === 'In Testing';
                  const isRevisionReq = proj.status === 'Revision Required' || proj.testingStatus === 'Changes Requested';
                  const isApproved = proj.testingStatus === 'Tester Approved';

                  return (
                    <tr key={proj.id}>
                      <td>
                        <span 
                          className="table-proj-name"
                          onClick={() => onOpenProject(proj.id)}
                        >
                          {proj.name}
                        </span>
                        <div style={{ display: 'flex', gap: '6px', marginTop: '2px' }}>
                          <span className="table-proj-id" style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0A3D75' }}>{proj.id}</span>
                          <span className="table-proj-id">• {proj.projectType}</span>
                        </div>
                      </td>

                      <td>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#1E293B', fontWeight: 600, fontSize: '0.84rem' }}>
                          <User size={14} color="#0A3D75" />
                          <span>{proj.developer}</span>
                        </div>
                      </td>

                      <td style={{ color: '#0A3D75', fontWeight: 700, whiteSpace: 'nowrap' }}>
                        {proj.submittedDate || proj.assignedDate || '12 Oct 2026'}
                      </td>

                      <td style={{ minWidth: '110px' }}>
                        <span style={{ fontWeight: 700, color: '#0A3D75' }}>
                          {proj.developerProgress || proj.progress || 100}%
                        </span>
                      </td>

                      <td style={{ minWidth: '130px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ flex: 1, height: '6px', backgroundColor: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
                            <div 
                              style={{ 
                                width: `${proj.testingProgress || (isUnderTesting ? 65 : 10)}%`, 
                                height: '100%', 
                                backgroundColor: isApproved ? '#10B981' : '#F3821D',
                                borderRadius: '3px' 
                              }} 
                            />
                          </div>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#C2410C' }}>
                            {proj.testingProgress || (isUnderTesting ? 65 : 0)}%
                          </span>
                        </div>
                      </td>

                      <td>
                        <span className={`qa-table-badge ${
                          isApproved ? 'badge-approved' :
                          isRevisionReq ? 'badge-revision' :
                          isUnderTesting ? 'badge-testing' : 'badge-pending'
                        }`}>
                          {proj.testingStatus || 'Pending Testing'}
                        </span>
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <button 
                          type="button"
                          className="btn btn-navy-action"
                          style={{ padding: '6px 14px', fontSize: '0.78rem' }}
                          onClick={() => onOpenProject(proj.id)}
                        >
                          <Play size={12} />
                          <span>{isUnderTesting ? 'Continue QA' : isRevisionReq ? 'Review Revision' : 'Start Testing'}</span>
                        </button>
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
            icon={CheckSquare2}
            title="No projects in this filter"
            description="All projects matching this criteria have been processed or moved to other stages."
            actionLabel="View All Queue"
            onAction={() => setActiveFilter('All')}
          />
        </div>
      )}
    </div>
  );
}
