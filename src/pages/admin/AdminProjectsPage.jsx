import React, { useState } from 'react';
import { 
  Search, 
  PlusCircle, 
  FolderKanban,
  Download
} from 'lucide-react';
import StatusBadge from '../../components/portal/StatusBadge';
import EmptyState from '../../components/portal/EmptyState';
import { exportToCSV } from '../../utils/exportUtils';
import { initialAdminProjects, initialDevelopers } from '../../data/adminMockData';
import { initialTesters } from '../../data/testerMockData';
import './AdminProjectsPage.css';

export default function AdminProjectsPage({ 
  projects = initialAdminProjects,
  developers = initialDevelopers,
  testers = initialTesters,
  onNavigate, 
  onOpenProject, 
  defaultFilter = 'All' 
}) {
  const [selectedStatus, setSelectedStatus] = useState(defaultFilter);
  const [selectedDev, setSelectedDev] = useState('All');
  const [selectedTester, setSelectedTester] = useState('All');
  const [selectedPriority, setSelectedPriority] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Exactly 9 Project Status Sections in Exact Required Order
  const statusTabs = [
    'All',
    'Starting Payment Received',
    'Assigned Projects',
    'In Progress',
    'Under Review',
    'Submitted',
    'Approved',
    'Full Payment Received',
    'Completed'
  ];

  // ==========================================
  // PAYMENT & STATUS EXTRACTION HELPERS
  // ==========================================
  const getClientTotal = (p) => {
    if (p.totalClientPriceNum !== undefined) return p.totalClientPriceNum;
    if (p.clientPriceNum !== undefined) return p.clientPriceNum;
    if (p.amountNumber !== undefined) return p.amountNumber;
    const num = parseInt((p.totalClientPrice || p.clientPrice || p.amount || '0').replace(/[^0-9]/g, ''), 10);
    return isNaN(num) ? 0 : num;
  };

  const getClientPaid = (p) => {
    if (p.collectedClientAmountNum !== undefined) return p.collectedClientAmountNum;
    if (p.clientPaidNum !== undefined) return p.clientPaidNum;
    if (p.clientPaymentStatus === 'Full Payment Received' || p.clientPaymentStatus === 'Paid') return getClientTotal(p);
    const num = parseInt((p.collectedClientAmount || p.clientPaid || '0').replace(/[^0-9]/g, ''), 10);
    return isNaN(num) ? 0 : num;
  };

  const getClientRemaining = (p) => {
    if (p.remainingClientAmountNum !== undefined) return p.remainingClientAmountNum;
    if (p.clientPaymentStatus === 'Full Payment Received' || p.clientPaymentStatus === 'Paid') return 0;
    const total = getClientTotal(p);
    const paid = getClientPaid(p);
    return Math.max(0, total - paid);
  };

  const getDevTotal = (p) => {
    if (p.developerPaymentNum !== undefined) return p.developerPaymentNum;
    if (p.freelancerPayoutNum !== undefined) return p.freelancerPayoutNum;
    if (p.developerAmountNum !== undefined) return p.developerAmountNum;
    const num = parseInt((p.developerPayment || p.freelancerPayout || p.developerAmount || '0').replace(/[^0-9]/g, ''), 10);
    return isNaN(num) ? 0 : num;
  };

  const getDevRemaining = (p) => {
    if (p.developerPaymentRemainingNum !== undefined) return p.developerPaymentRemainingNum;
    if (p.developerPaymentStatus === 'Paid') return 0;
    const total = getDevTotal(p);
    const paid = p.developerPaymentPaidNum || parseInt((p.developerPaymentPaid || '0').replace(/[^0-9]/g, ''), 10) || 0;
    return Math.max(0, total - paid);
  };

  const getTesterTotal = (p) => {
    if (p.testerPaymentNum !== undefined) return p.testerPaymentNum;
    if (p.testerAmountNum !== undefined) return p.testerAmountNum;
    const num = parseInt((p.testerPayment || p.testerAmount || '0').replace(/[^0-9]/g, ''), 10);
    return isNaN(num) ? 0 : num;
  };

  const getTesterRemaining = (p) => {
    if (p.testerPaymentRemainingNum !== undefined) return p.testerPaymentRemainingNum;
    if (p.testerPaymentStatus === 'Paid') return 0;
    const total = getTesterTotal(p);
    const paid = p.testerPaymentPaidNum || parseInt((p.testerPaymentPaid || '0').replace(/[^0-9]/g, ''), 10) || 0;
    return Math.max(0, total - paid);
  };

  // ==========================================
  // TAB MATCHING LOGIC (STRICT BUSINESS RULES)
  // ==========================================
  const matchesTab = (p, tab) => {
    const clientTotal = getClientTotal(p);
    const clientRemaining = getClientRemaining(p);
    const devRemaining = getDevRemaining(p);
    const testerRemaining = getTesterRemaining(p);

    const isClientFullyPaid = (clientTotal > 0 && clientRemaining === 0) || p.clientPaymentStatus === 'Full Payment Received';
    const isDevFullyPaid = getDevTotal(p) > 0 ? (devRemaining === 0 || p.developerPaymentStatus === 'Paid') : true;
    const isTesterFullyPaid = getTesterTotal(p) > 0 ? (testerRemaining === 0 || p.testerPaymentStatus === 'Paid') : true;

    // Completed = Client 100% + Dev 100% + Tester 100%
    const isFinanciallyCompleted = isClientFullyPaid && isDevFullyPaid && isTesterFullyPaid;

    const s = (p.status || '').toLowerCase().trim();
    const ts = (p.testingStatus || '').toLowerCase().trim();
    const devProg = p.developerProgress !== undefined ? p.developerProgress : (p.progress !== undefined ? p.progress : 0);

    switch (tab) {
      // 1. ALL: Master project list
      case 'All':
        return true;

      // 2. STARTING PAYMENT RECEIVED: Initial stage before development begins
      case 'Starting Payment Received': {
        const hasStartingPayment = (
          p.startingPaymentReceived === true ||
          p.startingPaymentReceived === 'true' ||
          p.clientPaymentStatus === 'Starting Payment Received' ||
          p.clientPaymentStatus === 'Partial Payment'
        );
        const isBeyondInitial = (
          s === 'submitted' || 
          s === 'under review' || 
          s === 'finalized' || 
          s === 'approved' || 
          s === 'completed' || 
          p.developerSubmitted === true || 
          p.testerStarted === true || 
          p.adminApproved === true ||
          (devProg > 0 && s === 'active')
        );
        return hasStartingPayment && !isBeyondInitial;
      }

      // 3. ASSIGNED PROJECTS: Developer/Tester assigned AND Developer has not started yet (0% progress)
      case 'Assigned Projects': {
        const hasDevAssigned = Boolean(p.developer && p.developer !== 'Unassigned' && p.developer !== '');
        const isNotStarted = devProg === 0 && !p.developerStarted && s !== 'active' && s !== 'in progress';
        const isNotBeyond = (
          s !== 'submitted' && 
          s !== 'under review' && 
          s !== 'finalized' && 
          s !== 'approved' && 
          s !== 'completed' && 
          !p.developerSubmitted && 
          !p.testerStarted
        );
        return hasDevAssigned && isNotStarted && isNotBeyond;
      }

      // 4. IN PROGRESS: Developer started & actively working (not submitted yet)
      case 'In Progress': {
        const isDevInProgress = (
          ((devProg > 0 && devProg < 100) || s === 'active' || s === 'in progress' || p.developerStarted) &&
          !p.developerSubmitted &&
          s !== 'submitted'
        );
        const isNotBeyond = (
          s !== 'under review' && 
          s !== 'finalized' && 
          s !== 'approved' && 
          s !== 'completed' && 
          !p.testerStarted
        );
        return isDevInProgress && isNotBeyond;
      }

      // 5. UNDER REVIEW: QA Tester actively testing, defects checking, or rework verification
      case 'Under Review': {
        const isQAUnderway = (
          ts === 'in testing' || 
          ts === 'testing' || 
          ts === 'in-testing' || 
          ts === 'changes requested' || 
          ts === 'changes assigned' || 
          ts === 'revision required' || 
          s === 'under review' || 
          s === 'revision required' || 
          p.testerStarted === true || 
          p.qaStarted === true ||
          (p.testingProgress !== undefined && p.testingProgress > 0 && p.testingProgress < 100)
        );
        const isQADoneOrApproved = (
          p.testerFinalized || 
          p.qaFinalized || 
          s === 'finalized' || 
          ts === 'tester approved' || 
          p.adminApproved || 
          s === 'approved' || 
          s === 'completed'
        );
        return isQAUnderway && !isQADoneOrApproved;
      }

      // 6. SUBMITTED: Developer submitted (queued for QA) OR QA Finalized (queued for Admin Approval)
      case 'Submitted': {
        const isDevSubmittedAwaitingQA = (
          (s === 'submitted' || p.developerSubmitted === true || p.freelancerSubmitted === true) &&
          !p.testerStarted &&
          ts !== 'in testing' &&
          ts !== 'changes requested' &&
          s !== 'under review' &&
          s !== 'revision required'
        );
        const isQAFinalizedAwaitingAdmin = (
          p.testerFinalized || 
          p.qaFinalized || 
          s === 'finalized' || 
          ts === 'finalized' || 
          ts === 'tester approved' || 
          ts === 'tester submitted' || 
          s === 'pending approval'
        );
        const isNotApprovedOrCompleted = !p.adminApproved && s !== 'approved' && s !== 'completed';
        return (isDevSubmittedAwaitingQA || isQAFinalizedAwaitingAdmin) && isNotApprovedOrCompleted;
      }

      // 7. APPROVED: Admin approved after QA review (payments may still be pending)
      case 'Approved':
        return (
          (p.adminApproved || s === 'approved' || ts === 'approved') &&
          !isFinanciallyCompleted
        );

      // 8. FULL PAYMENT RECEIVED: Client has paid 100% of project amount
      case 'Full Payment Received':
        return isClientFullyPaid;

      // 9. COMPLETED: Client 100% + Developer 100% + Tester 100% fully cleared
      case 'Completed':
        return isFinanciallyCompleted;

      default:
        return true;
    }
  };

  // Filter projects by Tab, Top Filters (Dev, Tester, Priority), and Search
  const filteredProjects = projects.filter(p => {
    // 1. Tab Status filter
    if (!matchesTab(p, selectedStatus)) {
      return false;
    }

    // 2. Developer filter
    if (selectedDev !== 'All' && p.developer !== selectedDev) {
      return false;
    }

    // 3. Tester filter
    if (selectedTester !== 'All' && p.tester !== selectedTester) {
      return false;
    }

    // 4. Priority filter
    if (selectedPriority !== 'All' && p.priority !== selectedPriority) {
      return false;
    }

    // 5. Search query (Project Name, ID, Developer, Tester, Project Type, Client)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = (p.name || '').toLowerCase().includes(q);
      const matchId = (p.id || '').toLowerCase().includes(q);
      const matchDev = (p.developer || '').toLowerCase().includes(q);
      const matchTester = (p.tester || '').toLowerCase().includes(q);
      const matchType = (p.projectType || '').toLowerCase().includes(q);
      const matchClient = (p.client || '').toLowerCase().includes(q);
      if (!matchName && !matchId && !matchDev && !matchTester && !matchType && !matchClient) {
        return false;
      }
    }

    return true;
  });

  // Sort projects A -> Z based on Project Name
  const sortedProjects = [...filteredProjects].sort((a, b) => {
    return (a.name || '').localeCompare(b.name || '');
  });

  // Empty state title based on selected tab / search
  const getEmptyStateTitle = () => {
    if (searchQuery.trim() || selectedDev !== 'All' || selectedTester !== 'All' || selectedPriority !== 'All') {
      return 'No projects match your search/filter criteria';
    }
    switch (selectedStatus) {
      case 'Starting Payment Received':
        return 'No projects with starting payment received';
      case 'Assigned Projects':
        return 'No assigned projects found';
      case 'In Progress':
        return 'No projects currently in progress';
      case 'Under Review':
        return 'No projects under QA review';
      case 'Submitted':
        return 'No submitted projects awaiting admin approval';
      case 'Approved':
        return 'No approved projects found';
      case 'Full Payment Received':
        return 'No projects with full client payment received';
      case 'Completed':
        return 'No completed projects found';
      default:
        return 'No projects found';
    }
  };

  // Export filtered projects to Excel/CSV
  const handleExportProjects = () => {
    const headers = [
      { label: 'Project ID', key: 'id' },
      { label: 'Project Name', key: 'name' },
      { label: 'Client', key: 'client' },
      { label: 'Category / Type', key: (p) => p.projectType || p.category || 'Website' },
      { label: 'Assigned Developer', key: (p) => p.developer || 'Unassigned' },
      { label: 'Developer ID', key: (p) => p.developerId || '—' },
      { label: 'Assigned QA Tester', key: (p) => p.tester || 'Unassigned' },
      { label: 'QA Tester ID', key: (p) => p.testerId || '—' },
      { label: 'Developer Progress (%)', key: (p) => p.developerProgress || p.progress || 0 },
      { label: 'QA Testing Progress (%)', key: (p) => p.testingProgress || 0 },
      { label: 'Project Status', key: 'status' },
      { label: 'QA Testing Status', key: (p) => p.testingStatus || 'Awaiting Testing' },
      { label: 'Client Price', key: (p) => p.totalClientPrice || p.clientPrice || p.amount || '—' },
      { label: 'Developer Payout', key: (p) => p.developerPayment || p.freelancerPayout || '—' },
      { label: 'Tester Payout', key: (p) => p.testerPayment || p.testerAmount || '—' },
      { label: 'Priority', key: (p) => p.priority || 'Medium' },
      { label: 'Assigned Date', key: 'assignedDate' },
      { label: 'Deadline', key: (p) => p.deadline || '—' }
    ];

    exportToCSV('Dahej_Support_Projects_Export', headers, sortedProjects);
  };

  return (
    <div className="admin-projects-page-container">
      {/* Top Header Controls (Search & 3 Main Filters) */}
      <div className="admin-projects-top-bar">
        <div className="admin-projects-search-row">
          <div className="search-input-box" style={{ maxWidth: '320px' }}>
            <Search size={16} className="search-input-icon" />
            <input
              type="text"
              placeholder="Search by project, developer, tester..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="admin-filter-selects-row">
            {/* Filter 1: All Developers */}
            <select
              value={selectedDev}
              onChange={(e) => setSelectedDev(e.target.value)}
              className="sort-select"
            >
              <option value="All">All Developers</option>
              {(developers || []).map(d => (
                <option key={d.id} value={d.name}>{d.name}</option>
              ))}
            </select>

            {/* Filter 2: All Testers */}
            <select
              value={selectedTester}
              onChange={(e) => setSelectedTester(e.target.value)}
              className="sort-select"
            >
              <option value="All">All Testers</option>
              {(testers || []).map(t => (
                <option key={t.id} value={t.name}>{t.name}</option>
              ))}
            </select>

            {/* Filter 3: All Priorities */}
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="sort-select"
            >
              <option value="All">All Priorities</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Urgent">Urgent</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            onClick={handleExportProjects}
            className="btn btn-navy-action"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            title="Export Projects list to Excel / CSV"
          >
            <Download size={15} />
            <span>Export Excel</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('admin/create-project')}
            className="btn btn-orange-primary"
          >
            <PlusCircle size={16} />
            <span>Create Project</span>
          </button>
        </div>
      </div>

      {/* Exactly 9 Filter Status Tabs in Exact Specified Order */}
      <div className="projects-filter-tabs">
        {statusTabs.map((tab) => {
          const count = projects.filter(p => {
            if (!matchesTab(p, tab)) return false;
            if (selectedDev !== 'All' && p.developer !== selectedDev) return false;
            if (selectedTester !== 'All' && p.tester !== selectedTester) return false;
            if (selectedPriority !== 'All' && p.priority !== selectedPriority) return false;
            return true;
          }).length;

          return (
            <button
              key={tab}
              type="button"
              onClick={() => setSelectedStatus(tab)}
              className={`filter-tab-pill ${selectedStatus === tab ? 'active' : ''}`}
            >
              <span>{tab}</span>
              <span className="filter-tab-count">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Main Table */}
      {sortedProjects.length > 0 ? (
        <div className="portal-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="portal-table-container">
            <table className="portal-table">
              <thead>
                <tr>
                  <th>Project Name</th>
                  <th>Developer</th>
                  <th>Tester</th>
                  <th>{selectedStatus === 'Under Review' ? 'Tester Progress' : 'Dev Progress'}</th>
                  <th>Testing Status</th>
                  <th>Freelancer Payout</th>
                  <th>Tester Payout</th>
                  <th>Project Status</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {sortedProjects.map((p) => {
                  const isTesterApproved = p.testingStatus === 'Tester Approved';
                  const isRevision = p.testingStatus === 'Changes Requested' || p.status === 'Revision Required';
                  const isUnderTesting = p.testingStatus === 'In Testing';
                  const testerProgressVal = p.testingProgress !== undefined ? p.testingProgress : (isUnderTesting ? 65 : (isTesterApproved ? 100 : 0));

                  return (
                    <tr key={p.id}>
                      <td>
                        <span 
                          className="table-proj-name"
                          onClick={() => onOpenProject(p.id)}
                        >
                          {p.name}
                        </span>
                        <div style={{ display: 'flex', gap: '6px', marginTop: '2px' }}>
                          <span className="table-proj-id" style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0A3D75' }}>{p.id}</span>
                          <span className="table-proj-id">• {p.projectType}</span>
                        </div>
                      </td>

                      <td>
                        <span style={{ fontWeight: 700, color: '#1E293B' }}>{p.developer || 'Unassigned'}</span>
                      </td>

                      <td>
                        <span style={{ fontWeight: 700, color: '#C2410C' }}>{p.tester || 'Unassigned'}</span>
                      </td>

                      <td style={{ minWidth: '120px' }}>
                        {selectedStatus === 'Under Review' ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ flex: 1, height: '6px', backgroundColor: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
                              <div 
                                style={{ 
                                  width: `${testerProgressVal}%`, 
                                  height: '100%', 
                                  backgroundColor: isTesterApproved ? '#10B981' : '#F3821D',
                                  borderRadius: '3px' 
                                }} 
                              />
                            </div>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: isTesterApproved ? '#10B981' : '#EA580C' }}>
                              {testerProgressVal}%
                            </span>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ flex: 1, height: '6px', backgroundColor: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
                              <div 
                                style={{ 
                                  width: `${p.developerProgress !== undefined ? p.developerProgress : (p.progress || 0)}%`, 
                                  height: '100%', 
                                  backgroundColor: '#0A3D75',
                                  borderRadius: '3px' 
                                }} 
                              />
                            </div>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0A3D75' }}>
                              {p.developerProgress !== undefined ? p.developerProgress : (p.progress || 0)}%
                            </span>
                          </div>
                        )}
                      </td>

                      <td>
                        <span className={`qa-table-badge ${
                          isTesterApproved ? 'badge-approved' :
                          isRevision ? 'badge-revision' :
                          isUnderTesting ? 'badge-testing' : 'badge-pending'
                        }`}>
                          {p.testingStatus || 'Awaiting Tester'}
                        </span>
                      </td>

                      <td style={{ fontWeight: 800, color: '#0F172A', whiteSpace: 'nowrap' }}>
                        {p.freelancerPayout || p.developerPayment}
                      </td>

                      <td style={{ fontWeight: 800, color: '#C2410C', whiteSpace: 'nowrap' }}>
                        {p.testerPayment || p.testerPayout || '₹0'}
                      </td>

                      <td>
                        <StatusBadge status={p.status} size="small" />
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => onOpenProject(p.id)}
                          className="btn btn-navy-action"
                          style={{ padding: '6px 14px', fontSize: '0.78rem' }}
                        >
                          Manage
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
            icon={FolderKanban}
            title={getEmptyStateTitle()}
            description="Try changing your search term, developer filter, tester filter, or status tab."
            actionLabel="Reset Filters"
            onAction={() => {
              setSelectedStatus('All');
              setSelectedDev('All');
              setSelectedTester('All');
              setSelectedPriority('All');
              setSearchQuery('');
            }}
          />
        </div>
      )}
    </div>
  );
}
