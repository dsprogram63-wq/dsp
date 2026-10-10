import React, { useState } from 'react';
import { Search, History, Eye, Filter, Calendar } from 'lucide-react';
import StatusBadge from '../../components/portal/StatusBadge';
import EmptyState from '../../components/portal/EmptyState';
import { initialProjects } from '../../data/mockData';
import { 
  getFreelancerProjectStatus, 
  getDevAmount, 
  formatINR 
} from '../../utils/projectStatusUtils';

export default function ProjectHistoryPage({ 
  onOpenProject, 
  projects = initialProjects 
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');

  // Map dynamic projects list to history entries
  const historyItems = projects.map(p => {
    const status = getFreelancerProjectStatus(p);
    const amt = formatINR(getDevAmount(p));
    return {
      id: p.id,
      name: p.name,
      client: p.client || 'Dahej Support Client',
      assignedDate: p.assignedDate || p.startDate || '—',
      submittedDate: p.submittedDate || (status === 'Active' ? 'In Progress' : 'Submitted'),
      completedDate: status === 'Completed' ? (p.completedDate || p.submissionDate || p.developerDeadline || p.deadline || 'Completed') : (status === 'Under Review' ? 'Under Review' : (p.submissionDate || p.developerDeadline || p.deadline || 'Ongoing')),
      amount: amt,
      status: status
    };
  });

  const filteredHistory = historyItems.filter(item => {
    if (selectedStatus !== 'All' && item.status !== selectedStatus) {
      return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        (item.name || '').toLowerCase().includes(q) ||
        (item.id || '').toLowerCase().includes(q) ||
        (item.client || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="projects-page-container">
      {/* Top Controls */}
      <div className="projects-header-controls">
        <div className="projects-search-filter-row">
          <div className="search-input-box">
            <Search size={16} className="search-input-icon" />
            <input
              type="text"
              placeholder="Search project audit history..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="sort-select"
          >
            <option value="All">All Statuses</option>
            <option value="Completed">Completed</option>
            <option value="Under Review">Under Review</option>
            <option value="Revision Required">Revision Required</option>
            <option value="In Progress">In Progress</option>
          </select>
        </div>
      </div>

      {/* History Table */}
      {filteredHistory.length > 0 ? (
        <div className="portal-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="portal-table-container">
            <table className="portal-table">
              <thead>
                <tr>
                  <th>Project ID</th>
                  <th>Project Name & Client</th>
                  <th>Assigned Date</th>
                  <th>Submitted Date</th>
                  <th>Completed Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <span style={{ fontWeight: 800, color: '#0A3D75' }}>{item.id}</span>
                    </td>
                    <td>
                      <span 
                        className="table-proj-name"
                        onClick={() => onOpenProject(item.id)}
                      >
                        {item.name}
                      </span>
                      <span className="table-proj-id">{item.client}</span>
                    </td>
                    <td style={{ color: '#64748B', whiteSpace: 'nowrap' }}>
                      {item.assignedDate}
                    </td>
                    <td style={{ color: '#475569', whiteSpace: 'nowrap' }}>
                      {item.submittedDate}
                    </td>
                    <td style={{ color: '#64748B', whiteSpace: 'nowrap', fontWeight: item.status === 'Completed' ? 600 : 400 }}>
                      {item.completedDate}
                    </td>
                    <td style={{ fontWeight: 800, color: '#111827' }}>
                      {item.amount}
                    </td>
                    <td>
                      <StatusBadge status={item.status} size="small" />
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={() => onOpenProject(item.id)}
                        className="btn btn-navy-action"
                        style={{ padding: '6px 14px', fontSize: '0.78rem' }}
                      >
                        <Eye size={13} style={{ marginRight: '4px' }} />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="portal-card">
          <EmptyState
            icon={History}
            title="No project history found"
            description="No logs match your filter criteria."
            actionLabel="Reset Filters"
            onAction={() => {
              setSelectedStatus('All');
              setSearchQuery('');
            }}
          />
        </div>
      )}
    </div>
  );
}
