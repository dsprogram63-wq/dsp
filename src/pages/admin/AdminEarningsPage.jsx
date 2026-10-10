import React, { useState } from 'react';
import { 
  IndianRupee, 
  CheckCircle2, 
  Clock, 
  Wallet, 
  Search, 
  Eye, 
  ShieldCheck, 
  Users,
  Building2,
  Filter,
  Check,
  Download
} from 'lucide-react';
import StatsCard from '../../components/portal/StatsCard';
import StatusBadge from '../../components/portal/StatusBadge';
import EmptyState from '../../components/portal/EmptyState';
import PaymentSettlementModal from '../../components/admin/PaymentSettlementModal';
import { exportToCSV } from '../../utils/exportUtils';
import { initialAdminProjects, initialDevelopers } from '../../data/adminMockData';
import { initialTesters } from '../../data/testerMockData';
import '../../components/admin/PaymentSettlementModal.css';

export default function AdminEarningsPage({ 
  projects = initialAdminProjects, 
  onOpenProject, 
  onUpdateProject,
  onNavigate 
}) {
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [selectedClientPayment, setSelectedClientPayment] = useState('All');
  const [selectedDevPayment, setSelectedDevPayment] = useState('All');
  const [selectedTesterPayment, setSelectedTesterPayment] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Payment Settlement Modal State
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedProjectForPay, setSelectedProjectForPay] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleOpenPayModal = (project) => {
    setSelectedProjectForPay(project);
    setIsPayModalOpen(true);
  };

  const handleClosePayModal = () => {
    setIsPayModalOpen(false);
    setSelectedProjectForPay(null);
  };

  const handleSavePaymentUpdate = (updatedProject) => {
    if (onUpdateProject) {
      onUpdateProject(updatedProject);
    }
    showToast(`Payment settlement updated for "${updatedProject.name}"`);
  };

  // =========================================================================
  // FINANCIAL EXTRACTION HELPERS (Strict Financial Separation of 3 Flows)
  // =========================================================================

  // 1. Client Payment Flow
  const getClientTotal = (p) => {
    if (p.totalClientPriceNum !== undefined) return p.totalClientPriceNum;
    if (p.clientPriceNum !== undefined) return p.clientPriceNum;
    if (p.totalAmountNum !== undefined) return p.totalAmountNum;
    if (p.amountNumber !== undefined) return p.amountNumber;
    const num = parseInt(String(p.totalClientPrice || p.clientPrice || p.amount || '0').replace(/[^0-9]/g, ''), 10);
    return isNaN(num) ? 0 : num;
  };

  const getClientPaid = (p) => {
    if (p.collectedClientAmountNum !== undefined) return p.collectedClientAmountNum;
    if (p.clientPaidNum !== undefined) return p.clientPaidNum;
    if (p.paidAmountNum !== undefined) return p.paidAmountNum;
    if (p.clientPaymentStatus === 'Full Payment Received' || p.clientPaymentStatus === 'Paid') {
      return getClientTotal(p);
    }
    const num = parseInt(String(p.collectedClientAmount || p.clientPaid || p.paidAmount || '0').replace(/[^0-9]/g, ''), 10);
    return isNaN(num) ? 0 : num;
  };

  const getClientRemaining = (p) => {
    const total = getClientTotal(p);
    const paid = getClientPaid(p);
    return Math.max(0, total - paid);
  };

  // 2. Developer Payment Flow
  const getDevTotal = (p) => {
    if (p.developerPaymentNum !== undefined) return p.developerPaymentNum;
    if (p.freelancerPayoutNum !== undefined) return p.freelancerPayoutNum;
    if (p.developerAmountNum !== undefined) return p.developerAmountNum;
    const num = parseInt(String(p.developerPayment || p.freelancerPayout || p.developerAmount || '0').replace(/[^0-9]/g, ''), 10);
    return isNaN(num) ? 0 : num;
  };

  const getDevPaid = (p) => {
    if (p.developerPaymentPaidNum !== undefined) return p.developerPaymentPaidNum;
    if (p.devPaidNum !== undefined) return p.devPaidNum;
    if (p.developerPaymentStatus === 'Paid') {
      return getDevTotal(p);
    }
    const num = parseInt(String(p.developerPaymentPaid || p.devPaid || '0').replace(/[^0-9]/g, ''), 10);
    return isNaN(num) ? 0 : num;
  };

  const getDevRemaining = (p) => {
    const total = getDevTotal(p);
    const paid = getDevPaid(p);
    return Math.max(0, total - paid);
  };

  // 3. Tester Payment Flow
  const getTesterTotal = (p) => {
    if (p.testerPaymentNum !== undefined) return p.testerPaymentNum;
    if (p.testerAmountNum !== undefined) return p.testerAmountNum;
    const num = parseInt(String(p.testerPayment || p.testerAmount || '0').replace(/[^0-9]/g, ''), 10);
    return isNaN(num) ? 0 : num;
  };

  const getTesterPaid = (p) => {
    if (p.testerPaymentPaidNum !== undefined) return p.testerPaymentPaidNum;
    if (p.testerPaidNum !== undefined) return p.testerPaidNum;
    if (p.testerPaymentStatus === 'Paid') {
      return getTesterTotal(p);
    }
    const num = parseInt(String(p.testerPaymentPaid || p.testerPaid || '0').replace(/[^0-9]/g, ''), 10);
    return isNaN(num) ? 0 : num;
  };

  const getTesterRemaining = (p) => {
    const total = getTesterTotal(p);
    const paid = getTesterPaid(p);
    return Math.max(0, total - paid);
  };

  // =========================================================================
  // 7 TOP SUMMARY BOX CALCULATIONS
  // =========================================================================
  // 1. Total Revenue: SUM of Total Project Amount of ALL projects
  const totalRevenueNum = projects.reduce((acc, p) => acc + getClientTotal(p), 0);

  // 2. Collected Revenue: SUM of Client Payments Received
  const collectedRevenueNum = projects.reduce((acc, p) => acc + getClientPaid(p), 0);

  // 3. Pending Revenue: Total Revenue - Collected Revenue (Client pending money only)
  const pendingRevenueNum = projects.reduce((acc, p) => acc + getClientRemaining(p), 0);

  // 4. Total Amount to Developers: SUM of Developer Assigned Amount across all projects
  const totalDevAmountNum = projects.reduce((acc, p) => acc + getDevTotal(p), 0);

  // 5. Remaining Amount to Developer: SUM of all remaining Developer payouts
  const remainingDevAmountNum = projects.reduce((acc, p) => acc + getDevRemaining(p), 0);

  // 6. Total Amount to Testers: SUM of Tester Assigned Amount across all projects
  const totalTesterAmountNum = projects.reduce((acc, p) => acc + getTesterTotal(p), 0);

  // 7. Remaining Amount to Tester: SUM of all remaining Tester payouts
  const remainingTesterAmountNum = projects.reduce((acc, p) => acc + getTesterRemaining(p), 0);

  const formatINR = (num) => '₹' + (num || 0).toLocaleString('en-IN');

  // =========================================================================
  // EXACT 5 PROJECT SECTIONS / FILTER TABS
  // =========================================================================
  const filterTabs = [
    'All',
    'Full Payment Pending',
    'Developer Payment Pending',
    'Tester Payment Pending',
    'Completed'
  ];

  const matchesFilterTab = (p, tab) => {
    const clientRem = getClientRemaining(p);
    const devRem = getDevRemaining(p);
    const testerRem = getTesterRemaining(p);

    switch (tab) {
      case 'All':
        return true;
      case 'Full Payment Pending':
        return clientRem > 0;
      case 'Developer Payment Pending':
        return devRem > 0;
      case 'Tester Payment Pending':
        return testerRem > 0;
      case 'Completed':
        return clientRem === 0 && devRem === 0 && testerRem === 0;
      default:
        return true;
    }
  };

  const filtered = projects.filter(p => {
    // Top Status Filter Tab
    if (!matchesFilterTab(p, selectedFilter)) return false;

    // Dropdown filters
    const clientRem = getClientRemaining(p);
    const devRem = getDevRemaining(p);
    const testerRem = getTesterRemaining(p);

    if (selectedClientPayment !== 'All') {
      if (selectedClientPayment === 'Full Payment Received' && clientRem !== 0) return false;
      if (selectedClientPayment === 'Partial Payment' && (getClientPaid(p) === 0 || clientRem === 0)) return false;
      if (selectedClientPayment === 'Pending' && getClientPaid(p) !== 0) return false;
    }

    if (selectedDevPayment !== 'All') {
      if (selectedDevPayment === 'Paid' && devRem !== 0) return false;
      if (selectedDevPayment === 'Partial' && (getDevPaid(p) === 0 || devRem === 0)) return false;
      if (selectedDevPayment === 'Pending' && getDevPaid(p) !== 0) return false;
    }

    if (selectedTesterPayment !== 'All') {
      if (selectedTesterPayment === 'Paid' && testerRem !== 0) return false;
      if (selectedTesterPayment === 'Partial' && (getTesterPaid(p) === 0 || testerRem === 0)) return false;
      if (selectedTesterPayment === 'Pending' && getTesterPaid(p) !== 0) return false;
    }

    // Search query (Project Name, ID, Client, Developer Name, Developer ID, Tester Name, Tester ID)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.id && p.id.toLowerCase().includes(q)) ||
        (p.client && p.client.toLowerCase().includes(q)) ||
        (p.developer && p.developer.toLowerCase().includes(q)) ||
        (p.developerId && p.developerId.toLowerCase().includes(q)) ||
        (p.tester && p.tester.toLowerCase().includes(q)) ||
        (p.testerId && p.testerId.toLowerCase().includes(q)) ||
        (p.developerTransactionId && p.developerTransactionId.toLowerCase().includes(q)) ||
        (p.testerTransactionId && p.testerTransactionId.toLowerCase().includes(q)) ||
        (p.clientTransactionId && p.clientTransactionId.toLowerCase().includes(q)) ||
        (p.transactionId && p.transactionId.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Export filtered financial records to Excel/CSV
  const handleExportEarnings = () => {
    const headers = [
      { label: 'Project ID', key: 'id' },
      { label: 'Project Name', key: 'name' },
      { label: 'Client Name', key: (p) => p.client || '—' },
      { label: 'Project Status', key: 'status' },
      { label: 'Total Client Price', key: (p) => formatINR(getClientTotal(p)) },
      { label: 'Client Collected Amount', key: (p) => formatINR(getClientPaid(p)) },
      { label: 'Client Remaining Amount', key: (p) => formatINR(getClientRemaining(p)) },
      { label: 'Client Payment Status', key: (p) => p.clientPaymentStatus || (getClientRemaining(p) === 0 ? 'Full Payment Received' : 'Pending') },
      { label: 'Client Transaction ID', key: (p) => p.clientTransactionId || p.clientTxnId || '—' },
      { label: 'Client Payment Method', key: (p) => p.clientPaymentMode || '—' },
      { label: 'Assigned Developer', key: (p) => p.developer || 'Unassigned' },
      { label: 'Developer Total Payout', key: (p) => formatINR(getDevTotal(p)) },
      { label: 'Developer Paid Amount', key: (p) => formatINR(getDevPaid(p)) },
      { label: 'Developer Remaining Amount', key: (p) => formatINR(getDevRemaining(p)) },
      { label: 'Developer Payment Status', key: (p) => getDevStatus(p) },
      { label: 'Developer Transaction ID', key: (p) => p.developerTransactionId || p.transactionId || '—' },
      { label: 'Developer Payment Method', key: (p) => p.developerPaymentMode || '—' },
      { label: 'Assigned QA Tester', key: (p) => p.tester || 'Unassigned' },
      { label: 'Tester Total Payout', key: (p) => formatINR(getTesterTotal(p)) },
      { label: 'Tester Paid Amount', key: (p) => formatINR(getTesterPaid(p)) },
      { label: 'Tester Remaining Amount', key: (p) => formatINR(getTesterRemaining(p)) },
      { label: 'Tester Payment Status', key: (p) => getTesterStatus(p) },
      { label: 'Tester Transaction ID', key: (p) => p.testerTransactionId || p.testerTxnId || '—' },
      { label: 'Tester Payment Method', key: (p) => p.testerPaymentMode || '—' }
    ];

    exportToCSV('Dahej_Support_Earnings_Financial_Export', headers, filteredProjects);
  };

  return (
    <div className="developers-page-container">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="dev-status-toast">
          <CheckCircle2 size={16} color="#10B981" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Exactly 7 Top Statistic Cards */}
      <div className="dev-stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        <StatsCard
          title="Total Revenue"
          value={formatINR(totalRevenueNum)}
          icon={IndianRupee}
          subtitle="Total client project value"
          accentColor="#0A3D75"
          onClick={() => { setSelectedFilter('All'); setSelectedClientPayment('All'); }}
        />

        <StatsCard
          title="Collected Revenue"
          value={formatINR(collectedRevenueNum)}
          icon={CheckCircle2}
          subtitle="Received from clients"
          accentColor="#10B981"
          onClick={() => setSelectedFilter('Completed')}
        />

        <StatsCard
          title="Pending Revenue"
          value={formatINR(pendingRevenueNum)}
          icon={Clock}
          subtitle="Total pending from clients"
          accentColor="#F3821D"
          onClick={() => setSelectedFilter('Full Payment Pending')}
        />

        <StatsCard
          title="Total Amount to Developers"
          value={formatINR(totalDevAmountNum)}
          icon={Users}
          subtitle="Allocated developer budget"
          accentColor="#0A3D75"
        />

        <StatsCard
          title="Remaining Amount to Developer"
          value={formatINR(remainingDevAmountNum)}
          icon={Wallet}
          subtitle="Unpaid developer payouts"
          accentColor="#D97706"
          onClick={() => setSelectedFilter('Developer Payment Pending')}
        />

        <StatsCard
          title="Total Amount to Testers"
          value={formatINR(totalTesterAmountNum)}
          icon={ShieldCheck}
          subtitle="Allocated QA tester budget"
          accentColor="#0A3D75"
        />

        <StatsCard
          title="Remaining Amount to Tester"
          value={formatINR(remainingTesterAmountNum)}
          icon={Clock}
          subtitle="Unpaid tester payouts"
          accentColor="#DC2626"
          onClick={() => setSelectedFilter('Tester Payment Pending')}
        />
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="admin-projects-top-bar">
        <div className="search-input-box" style={{ maxWidth: '340px' }}>
          <Search size={16} className="search-input-icon" />
          <input
            type="text"
            placeholder="Search by project, client, developer, tester..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="admin-filter-selects-row">
          <select
            value={selectedClientPayment}
            onChange={(e) => setSelectedClientPayment(e.target.value)}
            className="sort-select"
          >
            <option value="All">Client Payment: All</option>
            <option value="Full Payment Received">Full Payment Received</option>
            <option value="Partial Payment">Partial Payment</option>
            <option value="Pending">Pending Payment</option>
          </select>

          <select
            value={selectedDevPayment}
            onChange={(e) => setSelectedDevPayment(e.target.value)}
            className="sort-select"
          >
            <option value="All">Developer Payment: All</option>
            <option value="Paid">Developer Paid</option>
            <option value="Partial">Developer Partial</option>
            <option value="Pending">Developer Pending</option>
          </select>

          <select
            value={selectedTesterPayment}
            onChange={(e) => setSelectedTesterPayment(e.target.value)}
            className="sort-select"
          >
            <option value="All">Tester Payment: All</option>
            <option value="Paid">Tester Paid</option>
            <option value="Partial">Tester Partial</option>
            <option value="Pending">Tester Pending</option>
          </select>

          <button
            type="button"
            onClick={handleExportEarnings}
            className="btn btn-navy-action"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            title="Export Earnings to Excel / CSV"
          >
            <Download size={15} />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs Pills */}
      <div className="projects-filter-tabs" style={{ margin: 0 }}>
        {filterTabs.map((tab) => {
          const count = projects.filter(p => matchesFilterTab(p, tab)).length;

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

      {/* Earnings Table with Action Column */}
      {filtered.length > 0 ? (
        <div className="portal-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="portal-table-container">
            <table className="portal-table">
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Client</th>
                  <th>Total Price</th>
                  <th>Developer</th>
                  <th>Developer Payment</th>
                  <th>Tester</th>
                  <th>Tester Payment</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const clientTotal = getClientTotal(p);
                  const clientPaid = getClientPaid(p);
                  const clientRemaining = getClientRemaining(p);

                  const devTotal = getDevTotal(p);
                  const devPaid = getDevPaid(p);
                  const devRemaining = getDevRemaining(p);

                  const testerTotal = getTesterTotal(p);
                  const testerPaid = getTesterPaid(p);
                  const testerRemaining = getTesterRemaining(p);

                  const hasAnyRemaining = clientRemaining > 0 || devRemaining > 0 || testerRemaining > 0;

                  const clientStatusText = clientRemaining === 0 && clientTotal > 0
                    ? 'Full Payment Received'
                    : clientPaid > 0
                      ? 'Partial Payment'
                      : 'Pending';

                  const devStatusText = devRemaining === 0 && devTotal > 0
                    ? 'Paid'
                    : devPaid > 0
                      ? 'Partial'
                      : 'Pending';

                  const testerStatusText = testerRemaining === 0 && testerTotal > 0
                    ? 'Paid'
                    : testerPaid > 0
                      ? 'Partial'
                      : 'Pending';

                  return (
                    <tr key={p.id}>
                      {/* 1. Project: Name + ID in same cell */}
                      <td>
                        <div 
                          className="table-proj-name"
                          onClick={() => onOpenProject && onOpenProject(p.id)}
                        >
                          {p.name}
                        </div>
                        <span className="table-proj-id" style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0A3D75' }}>
                          {p.id}
                        </span>
                      </td>

                      {/* 2. Client */}
                      <td>
                        <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.86rem' }}>
                          {p.client || 'Client Account'}
                        </div>
                      </td>

                      {/* 3. Total Price: Amount + Status + Remaining + Txn */}
                      <td>
                        <div style={{ fontWeight: 800, color: '#0A3D75', fontSize: '0.94rem' }}>
                          {formatINR(clientTotal)}
                        </div>
                        <div style={{ marginTop: '4px', marginBottom: '3px' }}>
                          <StatusBadge status={clientStatusText} size="small" />
                        </div>
                        <div style={{ 
                          fontSize: '0.74rem', 
                          color: clientRemaining > 0 ? '#D97706' : '#10B981', 
                          fontWeight: 600 
                        }}>
                          Remaining: {formatINR(clientRemaining)}
                        </div>
                        {(p.clientTransactionId || p.clientTxnId) && clientPaid > 0 && (
                          <div style={{ marginTop: '4px', fontSize: '0.7rem', color: '#0A3D75', background: '#F1F5F9', padding: '1px 5px', borderRadius: '4px', display: 'inline-block', fontFamily: 'monospace', fontWeight: 700 }}>
                            Txn: {p.clientTransactionId || p.clientTxnId}
                          </div>
                        )}
                      </td>

                      {/* 4. Developer: Name + ID in same cell */}
                      <td>
                        <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.86rem' }}>
                          {p.developer || 'Unassigned'}
                        </div>
                        <span style={{ fontSize: '0.74rem', fontFamily: 'monospace', color: '#0A3D75', fontWeight: 700 }}>
                          {p.developerId || '—'}
                        </span>
                      </td>

                      {/* 5. Developer Payment: Amount + Status + Remaining + Txn */}
                      <td>
                        <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.92rem' }}>
                          {formatINR(devTotal)}
                        </div>
                        <div style={{ marginTop: '4px', marginBottom: '3px' }}>
                          <StatusBadge status={devStatusText} size="small" />
                        </div>
                        {devRemaining > 0 ? (
                          <div style={{ fontSize: '0.74rem', color: '#D97706', fontWeight: 600 }}>
                            Remaining: {formatINR(devRemaining)}
                          </div>
                        ) : (
                          <div style={{ fontSize: '0.74rem', color: '#10B981', fontWeight: 600 }}>
                            Remaining: ₹0
                          </div>
                        )}
                        {(p.developerTransactionId || p.transactionId) && devPaid > 0 && (
                          <div style={{ marginTop: '4px', fontSize: '0.7rem', color: '#15803D', background: '#DCFCE7', padding: '1px 5px', borderRadius: '4px', display: 'inline-block', fontFamily: 'monospace', fontWeight: 700 }}>
                            Txn: {p.developerTransactionId || p.transactionId}
                          </div>
                        )}
                      </td>

                      {/* 6. Tester: Name + ID in same cell */}
                      <td>
                        <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.86rem' }}>
                          {p.tester || 'Unassigned'}
                        </div>
                        <span style={{ fontSize: '0.74rem', fontFamily: 'monospace', color: '#0A3D75', fontWeight: 700 }}>
                          {p.testerId || '—'}
                        </span>
                      </td>

                      {/* 7. Tester Payment: Amount + Status + Remaining + Txn */}
                      <td>
                        <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.92rem' }}>
                          {formatINR(testerTotal)}
                        </div>
                        <div style={{ marginTop: '4px', marginBottom: '3px' }}>
                          <StatusBadge status={testerStatusText} size="small" />
                        </div>
                        {testerRemaining > 0 ? (
                          <div style={{ fontSize: '0.74rem', color: '#D97706', fontWeight: 600 }}>
                            Remaining: {formatINR(testerRemaining)}
                          </div>
                        ) : (
                          <div style={{ fontSize: '0.74rem', color: '#10B981', fontWeight: 600 }}>
                            Remaining: ₹0
                          </div>
                        )}
                        {(p.testerTransactionId || p.testerTxnId) && testerPaid > 0 && (
                          <div style={{ marginTop: '4px', fontSize: '0.7rem', color: '#7C3AED', background: '#F5F3FF', padding: '1px 5px', borderRadius: '4px', display: 'inline-block', fontFamily: 'monospace', fontWeight: 700 }}>
                            Txn: {p.testerTransactionId || p.testerTxnId}
                          </div>
                        )}
                      </td>

                      {/* 8. Action: Pay / Settle Button or Settled Badge */}
                      <td style={{ textAlign: 'right' }}>
                        {hasAnyRemaining ? (
                          <button
                            type="button"
                            className="btn-pay-modal"
                            onClick={() => handleOpenPayModal(p)}
                            title="Update client collection, developer payout, or tester payout"
                          >
                            <IndianRupee size={13} />
                            <span>Pay / Settle</span>
                          </button>
                        ) : (
                          <span className="badge-cleared-payout">
                            <CheckCircle2 size={13} color="#10B981" />
                            <span>Settled</span>
                          </span>
                        )}
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
            icon={Wallet}
            title="No project financials found"
            description="No earnings records match your search or selected payment filter."
            actionLabel="Reset Filters"
            onAction={() => {
              setSelectedFilter('All');
              setSelectedClientPayment('All');
              setSelectedDevPayment('All');
              setSelectedTesterPayment('All');
              setSearchQuery('');
            }}
          />
        </div>
      )}

      {/* Payment Settlement Popup Modal */}
      <PaymentSettlementModal
        isOpen={isPayModalOpen}
        project={selectedProjectForPay}
        onClose={handleClosePayModal}
        onUpdatePayment={handleSavePaymentUpdate}
      />
    </div>
  );
}
