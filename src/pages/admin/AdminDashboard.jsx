import React from 'react';
import { 
  FolderKanban, 
  Clock, 
  CheckCircle, 
  Users, 
  AlertTriangle, 
  PlusCircle, 
  IndianRupee, 
  TrendingUp, 
  ShieldCheck, 
  CheckSquare2, 
  AlertOctagon,
  CheckCheck,
  FileCheck2
} from 'lucide-react';
import StatsCard from '../../components/portal/StatsCard';
import { initialAdminProjects, initialDevelopers } from '../../data/adminMockData';
import { initialTesters } from '../../data/testerMockData';
import './AdminDashboard.css';

export default function AdminDashboard({ 
  projects = initialAdminProjects,
  developers = initialDevelopers,
  testers = initialTesters,
  onNavigate 
}) {
  const formatINR = (num) => '₹' + (num || 0).toLocaleString('en-IN');

  // ==========================================
  // FINANCIAL EXTRACTION HELPERS (SEPARATE CONCEPTS)
  // ==========================================

  // 1. Client Deal / Revenue Amounts
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

  // 2. Developer Payout Amounts
  const getDevTotal = (p) => {
    if (p.developerPaymentNum !== undefined) return p.developerPaymentNum;
    if (p.freelancerPayoutNum !== undefined) return p.freelancerPayoutNum;
    if (p.developerAmountNum !== undefined) return p.developerAmountNum;
    const num = parseInt((p.developerPayment || p.freelancerPayout || p.developerAmount || '0').replace(/[^0-9]/g, ''), 10);
    return isNaN(num) ? 0 : num;
  };

  const getDevPaid = (p) => {
    if (p.developerPaymentPaidNum !== undefined) return p.developerPaymentPaidNum;
    if (p.developerPaymentStatus === 'Paid') return getDevTotal(p);
    const num = parseInt((p.developerPaymentPaid || '0').replace(/[^0-9]/g, ''), 10);
    return isNaN(num) ? 0 : num;
  };

  const getDevRemaining = (p) => {
    if (p.developerPaymentRemainingNum !== undefined) return p.developerPaymentRemainingNum;
    if (p.developerPaymentStatus === 'Paid') return 0;
    const total = getDevTotal(p);
    const paid = getDevPaid(p);
    return Math.max(0, total - paid);
  };

  // 3. Tester Payout Amounts
  const getTesterTotal = (p) => {
    if (p.testerPaymentNum !== undefined) return p.testerPaymentNum;
    if (p.testerAmountNum !== undefined) return p.testerAmountNum;
    const num = parseInt((p.testerPayment || p.testerAmount || '0').replace(/[^0-9]/g, ''), 10);
    return isNaN(num) ? 0 : num;
  };

  const getTesterPaid = (p) => {
    if (p.testerPaymentPaidNum !== undefined) return p.testerPaymentPaidNum;
    if (p.testerPaymentStatus === 'Paid') return getTesterTotal(p);
    const num = parseInt((p.testerPaymentPaid || '0').replace(/[^0-9]/g, ''), 10);
    return isNaN(num) ? 0 : num;
  };

  const getTesterRemaining = (p) => {
    if (p.testerPaymentRemainingNum !== undefined) return p.testerPaymentRemainingNum;
    if (p.testerPaymentStatus === 'Paid') return 0;
    const total = getTesterTotal(p);
    const paid = getTesterPaid(p);
    return Math.max(0, total - paid);
  };

  // ==========================================
  // PROJECT LIFECYCLE STAGE CLASSIFICATION
  // ==========================================
  // Lifecycle:
  // CREATE -> DEVELOPER ASSIGNED -> ACTIVE -> DEVELOPER SUBMITS -> UNDER REVIEW -> TESTER COMPLETES REVIEW -> TESTER SUBMITS / FINALIZES -> PENDING APPROVALS -> ADMIN APPROVES -> APPROVED -> CLIENT PAYMENT CLEARED -> DEVELOPER PAYMENT CLEARED -> TESTER PAYMENT CLEARED -> COMPLETED
  const getProjectLifecycleStage = (p) => {
    const s = (p.status || '').toLowerCase().trim();
    const ts = (p.testingStatus || '').toLowerCase().trim();

    const clientRem = getClientRemaining(p);
    const devRem = getDevRemaining(p);
    const testerRem = getTesterRemaining(p);

    // 1. Completed:
    // Approved AND Client payment fully received AND Developer payment fully paid AND Tester payment fully paid
    const isFinanciallyCleared = (clientRem === 0 && devRem === 0 && testerRem === 0 && getClientTotal(p) > 0);
    const isMarkedCompleted = (s === 'completed' || s === 'paid');

    if (isFinanciallyCleared && (isMarkedCompleted || s === 'approved' || ts === 'tester approved' || ts === 'completed')) {
      return 'Completed';
    }

    // 2. Approved:
    // Admin approved after Tester submission, but financial payments may still be pending
    if (
      s === 'approved' || 
      s === 'finalized' || 
      ts === 'tester approved' || 
      (ts === 'approved' && s !== 'submitted')
    ) {
      return 'Approved';
    }

    // 3. Pending Approvals:
    // Developer submitted AND Tester has completed review and submitted/finalized review, WAITING FOR ADMIN APPROVAL
    if (
      ts === 'tester submitted' ||
      ts === 'submitted' ||
      ts === 'finalized' ||
      s === 'pending approval' ||
      s === 'submitted for approval' ||
      (p.testingProgress === 100 && ts !== 'in testing' && ts !== 'changes requested')
    ) {
      return 'Pending Approvals';
    }

    // 4. Under Review:
    // Developer submitted, QA Tester is actively reviewing / testing / defect checks
    if (
      s === 'under review' || 
      s === 'submitted' || 
      s === 'revision required' || 
      ts === 'in testing' || 
      ts === 'testing' || 
      ts === 'in-testing' || 
      ts === 'changes requested' || 
      ts === 'changes assigned' ||
      ts === 'awaiting testing' ||
      p.developerProgress === 100
    ) {
      return 'Under Review';
    }

    // 5. Active:
    // Developer is assigned and actively working (0% to 99% progress, not submitted yet)
    return 'Active';
  };

  // ==========================================
  // 1. GROUP 1: PROJECT OVERVIEW (6 Metrics in Exact Order)
  // ==========================================
  // 1.1 Total Projects: All projects ever created in system
  const totalProjectsCount = projects.length;

  // 1.2 Active Projects: Projects currently being worked on by Developer (0%-99%, not submitted)
  const activeProjectsCount = projects.filter(p => getProjectLifecycleStage(p) === 'Active').length;

  // 1.3 Under Review: Projects currently being tested/reviewed by QA/Tester
  const underReviewProjectsCount = projects.filter(p => getProjectLifecycleStage(p) === 'Under Review').length;

  // 1.4 Pending Approvals (NEW): Tester completed review, waiting for Admin approval
  const pendingApprovalsCount = projects.filter(p => getProjectLifecycleStage(p) === 'Pending Approvals').length;

  // 1.5 Approved Projects: Admin approved after QA review, pending financial settlements
  const approvedProjectsCount = projects.filter(p => getProjectLifecycleStage(p) === 'Approved').length;

  // 1.6 Completed Projects: Client fully paid + Dev fully paid + Tester fully paid
  const completedProjectsCount = projects.filter(p => getProjectLifecycleStage(p) === 'Completed').length;

  // ==========================================
  // 2. GROUP 2: TEAM OVERVIEW (2 Metrics)
  // ==========================================
  const totalDevelopersCount = new Set((developers || []).map(d => d.id)).size;
  const totalTestersCount = new Set((testers || []).map(t => t.id)).size;

  // ==========================================
  // 3. GROUP 3: PAYMENT STATUS (4 Metrics - Project Counts)
  // ==========================================
  // 3.1 Projects Paid: Both Developer payment fully paid AND Tester payment fully paid
  const projectsPaidCount = projects.filter(p => {
    const devRem = getDevRemaining(p);
    const testerRem = getTesterRemaining(p);
    const hasDevAllocation = getDevTotal(p) > 0;
    return hasDevAllocation && devRem === 0 && testerRem === 0;
  }).length;

  // 3.2 Projects Remaining to Pay: Developer payment pending OR Tester payment pending
  const projectsRemainingToPayCount = projects.filter(p => {
    const devRem = getDevRemaining(p);
    const testerRem = getTesterRemaining(p);
    return devRem > 0 || testerRem > 0;
  }).length;

  // 3.3 Got Payment From Client: Client payment is fully received (Remaining = 0)
  const gotPaymentFromClientCount = projects.filter(p => {
    const clientRem = getClientRemaining(p);
    const clientTotal = getClientTotal(p);
    return clientTotal > 0 && clientRem === 0;
  }).length;

  // 3.4 Pending Payment From Client: Client payment still has outstanding balance (Remaining > 0)
  const pendingPaymentFromClientCount = projects.filter(p => {
    const clientRem = getClientRemaining(p);
    return clientRem > 0;
  }).length;

  // ==========================================
  // 4. GROUP 4: FINANCIAL OVERVIEW (6 Metrics - INR Amounts)
  // ==========================================
  // 4.1 Total Revenue: Total value of all created projects
  const totalRevenueAmount = projects.reduce((sum, p) => sum + getClientTotal(p), 0);

  // 4.2 Pending to Collect: Total client amount still outstanding
  const pendingToCollectAmount = projects.reduce((sum, p) => sum + getClientRemaining(p), 0);

  // 4.3 Total Amount to Developers: Total Developer payout assigned
  const totalAmountToDevelopers = projects.reduce((sum, p) => sum + getDevTotal(p), 0);

  // 4.4 Remaining Amount to Pay Developers: Developer payout still unpaid
  const remainingAmountToPayDevelopers = projects.reduce((sum, p) => sum + getDevRemaining(p), 0);

  // 4.5 Total Amount to Testers: Total Tester payout assigned
  const totalAmountToTesters = projects.reduce((sum, p) => sum + getTesterTotal(p), 0);

  // 4.6 Remaining Amount to Pay Testers: Tester payout still unpaid
  const remainingAmountToPayTesters = projects.reduce((sum, p) => sum + getTesterRemaining(p), 0);

  return (
    <div className="admin-dashboard-container">
      {/* Quick Actions Bar */}
      <div className="admin-quick-actions-bar">
        <div className="quick-action-label">Quick Management Actions:</div>
        <div className="quick-action-btns">
          <button
            type="button"
            className="btn btn-orange-primary"
            onClick={() => onNavigate('admin/create-project')}
          >
            <PlusCircle size={16} />
            <span>Create New Project</span>
          </button>

          <button
            type="button"
            className="btn btn-navy-action"
            onClick={() => onNavigate('admin/projects')}
          >
            <FolderKanban size={15} />
            <span>All Projects</span>
          </button>

          <button
            type="button"
            className="btn btn-navy-action"
            onClick={() => onNavigate('admin/developers')}
          >
            <Users size={15} />
            <span>Manage Developers</span>
          </button>

          <button
            type="button"
            className="btn btn-navy-action"
            onClick={() => onNavigate('admin/testers')}
          >
            <ShieldCheck size={15} />
            <span>Manage Testers</span>
          </button>

          <button
            type="button"
            className="btn btn-navy-action"
            onClick={() => onNavigate('admin/earnings')}
          >
            <IndianRupee size={15} />
            <span>Earnings & Financials</span>
          </button>
        </div>
      </div>

      {/* GROUP 1 — PROJECT OVERVIEW (EXACTLY 6 BOXES IN EXACT ORDER) */}
      <div className="dashboard-section-group">
        <div className="dashboard-group-header">
          <div className="dashboard-group-title">
            <FolderKanban size={17} color="#0A3D75" />
            <span>Project Overview</span>
          </div>
          <span className="dashboard-group-badge">6 Metrics</span>
        </div>

        <div className="admin-stats-grid grid-6">
          {/* 1. Total Projects */}
          <StatsCard
            title="Total Projects"
            value={totalProjectsCount}
            icon={FolderKanban}
            subtitle="All projects created"
            accentColor="#0A3D75"
            onClick={() => onNavigate('admin/projects')}
          />

          {/* 2. Active Projects */}
          <StatsCard
            title="Active Projects"
            value={activeProjectsCount}
            icon={Clock}
            subtitle="Currently in progress"
            accentColor="#0A3D75"
            onClick={() => onNavigate('admin/active-projects')}
          />

          {/* 3. Under Review */}
          <StatsCard
            title="Under Review"
            value={underReviewProjectsCount}
            icon={AlertOctagon}
            subtitle="QA testing / review"
            accentColor="#F3821D"
            onClick={() => onNavigate('admin/testing-queue')}
          />

          {/* 4. Pending Approvals (NEW BOX) */}
          <StatsCard
            title="Pending Approvals"
            value={pendingApprovalsCount}
            icon={FileCheck2}
            subtitle="Awaiting admin approval"
            accentColor="#D97706"
            onClick={() => onNavigate('admin/testing-queue')}
          />

          {/* 5. Approved Projects */}
          <StatsCard
            title="Approved Projects"
            value={approvedProjectsCount}
            icon={CheckCheck}
            subtitle="QA approved & ready"
            accentColor="#0D9488"
            onClick={() => onNavigate('admin/testing-queue')}
          />

          {/* 6. Completed Projects */}
          <StatsCard
            title="Completed Projects"
            value={completedProjectsCount}
            icon={CheckCircle}
            subtitle="Successfully completed"
            accentColor="#10B981"
            onClick={() => onNavigate('admin/completed-projects')}
          />
        </div>
      </div>

      {/* GROUP 2 — TEAM OVERVIEW */}
      <div className="dashboard-section-group">
        <div className="dashboard-group-header">
          <div className="dashboard-group-title">
            <Users size={17} color="#0A3D75" />
            <span>Team Overview</span>
          </div>
          <span className="dashboard-group-badge">2 Metrics</span>
        </div>

        <div className="admin-stats-grid grid-2">
          <StatsCard
            title="Total Developers"
            value={totalDevelopersCount}
            icon={Users}
            subtitle="Registered freelance developers"
            accentColor="#0A3D75"
            onClick={() => onNavigate('admin/developers')}
          />

          <StatsCard
            title="Total Testers"
            value={totalTestersCount}
            icon={ShieldCheck}
            subtitle="Dedicated QA specialists"
            accentColor="#6366F1"
            onClick={() => onNavigate('admin/testers')}
          />
        </div>
      </div>

      {/* GROUP 3 — DEVELOPER / TESTER & CLIENT PAYMENT STATUS */}
      <div className="dashboard-section-group">
        <div className="dashboard-group-header">
          <div className="dashboard-group-title">
            <CheckSquare2 size={17} color="#0A3D75" />
            <span>Payment Status</span>
          </div>
          <span className="dashboard-group-badge">4 Metrics (Project Counts)</span>
        </div>

        <div className="admin-stats-grid grid-4">
          <StatsCard
            title="Projects Paid"
            value={`${projectsPaidCount} Projects`}
            icon={CheckCircle}
            subtitle="Internal team payouts cleared"
            accentColor="#10B981"
            onClick={() => onNavigate('admin/earnings')}
          />

          <StatsCard
            title="Projects Remaining to Pay"
            value={`${projectsRemainingToPayCount} Projects`}
            icon={Clock}
            subtitle="Internal team payout pending"
            accentColor="#F3821D"
            onClick={() => onNavigate('admin/earnings')}
          />

          <StatsCard
            title="Got Payment From Client"
            value={`${gotPaymentFromClientCount} Projects`}
            icon={CheckCircle}
            subtitle="Client payments received"
            accentColor="#10B981"
            onClick={() => onNavigate('admin/projects')}
          />

          <StatsCard
            title="Pending Payment From Client"
            value={`${pendingPaymentFromClientCount} Projects`}
            icon={AlertTriangle}
            subtitle="Client payment pending"
            accentColor="#DC2626"
            onClick={() => onNavigate('admin/projects')}
          />
        </div>
      </div>

      {/* GROUP 4 — FINANCIAL OVERVIEW */}
      <div className="dashboard-section-group">
        <div className="dashboard-group-header">
          <div className="dashboard-group-title">
            <IndianRupee size={17} color="#0A3D75" />
            <span>Financial Overview</span>
          </div>
          <span className="dashboard-group-badge">6 Metrics (INR Amounts)</span>
        </div>

        <div className="admin-stats-grid grid-3">
          <StatsCard
            title="Total Revenue"
            value={formatINR(totalRevenueAmount)}
            icon={IndianRupee}
            subtitle="Total project revenue recorded"
            accentColor="#0A3D75"
            onClick={() => onNavigate('admin/earnings')}
          />

          <StatsCard
            title="Pending to Collect"
            value={formatINR(pendingToCollectAmount)}
            icon={TrendingUp}
            subtitle="Outstanding amount from clients"
            accentColor="#DC2626"
            onClick={() => onNavigate('admin/earnings')}
          />

          <StatsCard
            title="Total Amount to Developers"
            value={formatINR(totalAmountToDevelopers)}
            icon={Users}
            subtitle="Total developer budget allocation"
            accentColor="#0A3D75"
            onClick={() => onNavigate('admin/earnings')}
          />

          <StatsCard
            title="Remaining Amount to Pay Developers"
            value={formatINR(remainingAmountToPayDevelopers)}
            icon={Clock}
            subtitle="Pending developer disbursements"
            accentColor="#F3821D"
            onClick={() => onNavigate('admin/earnings')}
          />

          <StatsCard
            title="Total Amount to Testers"
            value={formatINR(totalAmountToTesters)}
            icon={ShieldCheck}
            subtitle="Total tester budget allocation"
            accentColor="#6366F1"
            onClick={() => onNavigate('admin/earnings')}
          />

          <StatsCard
            title="Remaining Amount to Pay Testers"
            value={formatINR(remainingAmountToPayTesters)}
            icon={AlertOctagon}
            subtitle="Pending tester disbursements"
            accentColor="#F3821D"
            onClick={() => onNavigate('admin/earnings')}
          />
        </div>
      </div>
    </div>
  );
}
