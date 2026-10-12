import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  PlusCircle, 
  Trash2, 
  Upload, 
  Check, 
  ArrowLeft, 
  FileText, 
  Calendar, 
  Clock, 
  IndianRupee, 
  Users, 
  ShieldCheck,
  CheckSquare, 
  Layers, 
  Save, 
  HelpCircle,
  MoveUp,
  MoveDown,
  AlertCircle,
  Key,
  Lock,
  Eye,
  EyeOff,
  Globe,
  Mail,
  Shield,
  UserCheck,
  CheckCircle2,
  Paperclip,
  Briefcase
} from 'lucide-react';
import { initialDevelopers } from '../../data/adminMockData';
import { initialTesters, defaultTestingChecklist } from '../../data/testerMockData';
import { uploadProjectDocument } from '../../services/storageService.js';
import './CreateProjectPage.css';

export default function CreateProjectPage({ 
  onBack, 
  onSaveProject, 
  availableDevelopers = initialDevelopers,
  availableTesters = initialTesters
}) {
  // Today's ISO date (YYYY-MM-DD) for HTML5 Calendar Pickers
  const todayIso = new Date().toISOString().split('T')[0];

  // Helper to format ISO date (YYYY-MM-DD) to Display Date (e.g. 18 Oct 2026)
  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const [year, month, day] = parts;
        const d = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      }
    } catch (e) {
      return dateStr;
    }
    return dateStr;
  };

  // SECTION 1: PROJECT INFORMATION
  const [clientName, setClientName] = useState('');
  const [name, setName] = useState('');
  const [projectId, setProjectId] = useState(`DS-WEB-${Math.floor(1000 + Math.random() * 9000)}`);
  const [projectType, setProjectType] = useState('Corporate Website');
  const [priority, setPriority] = useState('High');

  // SECTION 2: AMOUNT (Internal Project Management Amounts)
  const [totalAmount, setTotalAmount] = useState('50000');
  const [paidAmount, setPaidAmount] = useState('20000');
  const [freelancerAmount, setFreelancerAmount] = useState('15000');
  const [testerAmount, setTesterAmount] = useState('3000');
  const [startingPaymentReceived, setStartingPaymentReceived] = useState(true);

  // Calculated Remaining Amount = Total Amount - Paid Amount
  const totalNum = Number(totalAmount || 0);
  const paidNum = Number(paidAmount || 0);
  const remainingNum = Math.max(0, totalNum - paidNum);

  // SECTION 3: SCHEDULE (ISO format YYYY-MM-DD for native calendar pickers)
  const [assignedDate, setAssignedDate] = useState(todayIso);
  const [submissionDate, setSubmissionDate] = useState('2026-10-18');
  const [testingSubmissionDate, setTestingSubmissionDate] = useState('2026-10-22');
  const [deadlineDate, setDeadlineDate] = useState('2026-10-25');
  const [finalDeliveryDate, setFinalDeliveryDate] = useState('2026-10-30');

  // STRICT AVAILABILITY FILTER: ONLY Approved & Active Developers can be assigned
  const approvedDevelopers = useMemo(() => {
    return (availableDevelopers || []).filter(dev => 
      dev && (dev.status === 'Active' || dev.status === 'Approved') && dev.status !== 'Pending' && dev.status !== 'On Hold' && dev.status !== 'Deactivated' && dev.status !== 'Rejected'
    );
  }, [availableDevelopers]);

  // STRICT AVAILABILITY FILTER: ONLY Approved & Active Testers can be assigned
  const approvedTesters = useMemo(() => {
    return (availableTesters || []).filter(t => 
      t && (t.status === 'Active' || t.status === 'Approved') && t.status !== 'Pending' && t.status !== 'On Hold' && t.status !== 'Deactivated' && t.status !== 'Rejected'
    );
  }, [availableTesters]);

  // SECTION 4 & 5: DEVELOPER & TESTER ASSIGNMENTS (Strictly from approved pool)
  const [selectedDevId, setSelectedDevId] = useState(() => approvedDevelopers[0]?.id || '');
  const [selectedTesterId, setSelectedTesterId] = useState(() => approvedTesters[0]?.id || '');

  // Keep selection strictly synced with approved candidates
  useEffect(() => {
    if (selectedDevId && !approvedDevelopers.some(d => d.id === selectedDevId)) {
      setSelectedDevId(approvedDevelopers[0]?.id || '');
    } else if (!selectedDevId && approvedDevelopers.length > 0) {
      setSelectedDevId(approvedDevelopers[0]?.id || '');
    }
  }, [approvedDevelopers, selectedDevId]);

  useEffect(() => {
    if (selectedTesterId && !approvedTesters.some(t => t.id === selectedTesterId)) {
      setSelectedTesterId(approvedTesters[0]?.id || '');
    } else if (!selectedTesterId && approvedTesters.length > 0) {
      setSelectedTesterId(approvedTesters[0]?.id || '');
    }
  }, [approvedTesters, selectedTesterId]);

  // SECTION 6: DETAILED PROJECT REQUIREMENTS
  const [description, setDescription] = useState('');
  const [clientReqs, setClientReqs] = useState('');

  // SECTION 7: ACCESS CREDENTIALS (Email & Password)
  const [credentials, setCredentials] = useState([
    {
      id: 'cred-1',
      email: '',
      password: ''
    }
  ]);
  const [showPasswordMap, setShowPasswordMap] = useState({});

  // Credentials Handlers
  const handleAddCredential = () => {
    const newCred = {
      id: `cred-${Date.now()}`,
      email: '',
      password: ''
    };
    setCredentials([...credentials, newCred]);
  };

  const handleUpdateCredential = (id, field, value) => {
    setCredentials(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const handleRemoveCredential = (id) => {
    if (credentials.length === 1) {
      setCredentials([{ id: 'cred-1', email: '', password: '' }]);
    } else {
      setCredentials(credentials.filter(c => c.id !== id));
    }
  };

  const toggleShowPassword = (id) => {
    setShowPasswordMap(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // SECTION 8: PROJECT MILESTONES (Heading, Description, Percentage of Work Done)
  const [milestones, setMilestones] = useState([
    {
      id: 'm-1',
      heading: 'Homepage Development & Brand Layout',
      description: 'Complete homepage hero design, typography system, responsive navbar and CTA triggers.',
      percentage: 20
    },
    {
      id: 'm-2',
      heading: 'About Us & Services Catalog',
      description: 'Company history, executive team profiles, and filterable industrial service catalog.',
      percentage: 20
    },
    {
      id: 'm-3',
      heading: 'Interactive Forms & OTP Verification',
      description: 'Customer quotation inquiry form linked with email OTP verification and backend routing.',
      percentage: 20
    },
    {
      id: 'm-4',
      heading: 'Cross-Device Mobile & Tablet Optimization',
      description: 'Viewport breakpoint audits and performance optimization for iOS and Android mobile users.',
      percentage: 20
    },
    {
      id: 'm-5',
      heading: 'QA Audit, Technical SEO & Production Deployment',
      description: '14-item QA checklist verification, schema tags, sitemap generation, and Vercel domain SSL release.',
      percentage: 20
    }
  ]);

  // Milestone Percentage Calculations
  const totalMilestoneWeight = milestones.reduce((sum, m) => sum + Number(m.percentage || 0), 0);
  const isWeightExact = totalMilestoneWeight === 100;
  const isWeightUnder = totalMilestoneWeight < 100;
  const isWeightOver = totalMilestoneWeight > 100;

  // Milestone Handlers
  const handleAddMilestone = () => {
    const nextIdx = milestones.length + 1;
    const numStr = nextIdx < 10 ? `0${nextIdx}` : `${nextIdx}`;
    const newM = {
      id: `m-${Date.now()}`,
      heading: '',
      description: '',
      percentage: 0
    };
    setMilestones([...milestones, newM]);
  };

  const handleUpdateMilestone = (id, field, value) => {
    setMilestones(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  const handleRemoveMilestone = (id) => {
    if (milestones.length === 1) {
      setMilestones([{ id: 'm-1', heading: '', description: '', percentage: 0 }]);
    } else {
      setMilestones(milestones.filter(m => m.id !== id));
    }
  };

  const handleMoveMilestone = (index, direction) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= milestones.length) return;
    const updated = [...milestones];
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;
    setMilestones(updated);
  };

  // SECTION 9: SPECIFICATION DOCUMENT
  const [documents, setDocuments] = useState([]);

  const fileInputRef = useRef(null);

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    for (const file of files) {
      const sizeInMB = file.size / (1024 * 1024);
      if (sizeInMB > 15) {
        alert(`Document "${file.name}" size must be less than 15 MB.`);
        continue;
      }

      const formattedSize = sizeInMB < 0.1 ? `${(file.size / 1024).toFixed(1)} KB` : `${sizeInMB.toFixed(1)} MB`;

      try {
        const { url } = await uploadProjectDocument(projectId || 'general', file);
        if (url) {
          const newDoc = {
            id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
            name: file.name,
            type: file.type || (file.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'Specification Document'),
            size: formattedSize,
            url: url,
            dataUrl: url,
            fileData: url,
            status: 'Uploaded'
          };
          setDocuments(prev => [...prev, newDoc]);
          continue;
        }
      } catch (err) {
        console.warn('Storage doc upload fallback:', err);
      }

      // Fallback
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target.result;
        const newDoc = {
          id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          name: file.name,
          type: file.type || (file.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'Specification Document'),
          size: formattedSize,
          dataUrl: dataUrl,
          fileData: dataUrl,
          url: dataUrl,
          status: 'Uploaded'
        };
        setDocuments(prev => [...prev, newDoc]);
      };
      reader.readAsDataURL(file);
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAddSampleDoc = () => {
    const sampleNames = [
      'Technical_Scope_Dahej_Infra.pdf',
      'API_Integration_Spec_v2.docx',
      'Design_Wireframes_Asset_Pack.zip',
      'Database_Schema_Spec.xlsx'
    ];
    const randomName = sampleNames[Math.floor(Math.random() * sampleNames.length)];
    const newDoc = {
      id: `doc-${Date.now()}`,
      name: randomName,
      type: randomName.endsWith('.pdf') ? 'PDF Document' : randomName.endsWith('.docx') ? 'Word Document' : randomName.endsWith('.zip') ? 'ZIP Archive' : 'Spreadsheet',
      size: `${(1.2 + Math.random() * 3.5).toFixed(1)} MB`,
      status: 'Uploaded'
    };
    setDocuments(prev => [...prev, newDoc]);
  };

  const handleRemoveDoc = (id) => {
    setDocuments(prev => prev.filter(d => d.id !== id));
  };

  // FORM VALIDATION & SUBMISSION
  const [validationErrors, setValidationErrors] = useState([]);
  const [formAttempted, setFormAttempted] = useState(false);

  const handleFormSubmit = (e) => {
    e.preventDefault();
    setFormAttempted(true);

    const errors = [];
    if (!clientName.trim()) errors.push('Client Name is required.');
    if (!name.trim()) errors.push('Project Name is required.');
    if (!projectType) errors.push('Please select a project type.');
    if (!priority) errors.push('Please select a priority.');
    if (approvedDevelopers.length === 0) {
      errors.push('No approved developers available. You must approve a developer from Developer Directory first before creating a project.');
    } else if (!selectedDevId) {
      errors.push('Please select an approved developer.');
    }

    if (approvedTesters.length === 0) {
      errors.push('No approved QA testers available. You must approve a tester from QA Tester Directory first before creating a project.');
    } else if (!selectedTesterId) {
      errors.push('Please select an approved QA tester.');
    }

    if (!description.trim()) errors.push('Project Description is required.');
    if (!clientReqs.trim()) errors.push('Client Requirement is required.');
    if (totalMilestoneWeight !== 100) errors.push('Milestone percentage must total exactly 100%.');

    if (errors.length > 0) {
      setValidationErrors(errors);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setValidationErrors([]);

    const dev = approvedDevelopers.find(d => d.id === selectedDevId);
    const tester = approvedTesters.find(t => t.id === selectedTesterId);

    const validCreds = credentials
      .filter(c => c.email || c.password)
      .map((c, i) => ({
        id: `c-${i + 1}`,
        type: 'Access Key',
        platform: 'Project Portal',
        service: 'Project Environment Access',
        username: c.email || 'Not specified',
        secret: c.password || '••••••••',
        status: 'Provided',
        notes: 'Credentials provided by admin on assignment'
      }));

    const newProject = {
      id: projectId,
      name: name,
      clientName: clientName,
      client: clientName || 'Corporate Client',
      developer: dev ? dev.name : 'Unassigned',
      developerId: dev ? dev.id : null,
      developerEmail: dev ? dev.email : '',
      developerSkill: dev ? dev.primarySkill : 'To Be Assigned',
      developerAvatar: dev ? dev.avatar : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=160',
      tester: tester ? tester.name : 'Unassigned',
      testerId: tester ? tester.id : null,
      testerEmail: tester ? tester.email : '',
      testerSpecialization: tester ? (tester.specialization || tester.role) : 'To Be Assigned',
      testerAvatar: tester ? tester.avatar : 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=160',
      projectType: projectType,
      category: projectType,
      priority: priority,
      // Internal Amounts & Financial Structure
      totalAmount: `₹${Number(totalAmount || 0).toLocaleString('en-IN')}`,
      totalAmountNum: totalNum,
      totalClientPrice: `₹${totalNum.toLocaleString('en-IN')}`,
      totalClientPriceNum: totalNum,
      clientTotalAmount: totalNum,
      paidAmount: `₹${paidNum.toLocaleString('en-IN')}`,
      paidAmountNum: paidNum,
      collectedClientAmount: `₹${paidNum.toLocaleString('en-IN')}`,
      collectedClientAmountNum: paidNum,
      clientPaidAmount: paidNum,
      remainingAmount: `₹${remainingNum.toLocaleString('en-IN')}`,
      remainingAmountNum: remainingNum,
      remainingClientAmount: `₹${remainingNum.toLocaleString('en-IN')}`,
      remainingClientAmountNum: remainingNum,
      clientRemainingAmount: remainingNum,
      
      freelancerPayout: `₹${Number(freelancerAmount || 0).toLocaleString('en-IN')}`,
      freelancerPayoutNum: Number(freelancerAmount || 0),
      developerPayment: `₹${Number(freelancerAmount || 0).toLocaleString('en-IN')}`,
      developerPaymentNum: Number(freelancerAmount || 0),
      developerAssignedAmount: Number(freelancerAmount || 0),
      developerPaymentPaid: '₹0',
      developerPaymentPaidNum: 0,
      developerPaidAmount: 0,
      developerPaymentRemaining: `₹${Number(freelancerAmount || 0).toLocaleString('en-IN')}`,
      developerPaymentRemainingNum: Number(freelancerAmount || 0),
      developerRemainingAmount: Number(freelancerAmount || 0),
      developerPaymentStatus: 'Pending',

      testerPayout: `₹${Number(testerAmount || 0).toLocaleString('en-IN')}`,
      testerPayoutNum: Number(testerAmount || 0),
      testerPayment: `₹${Number(testerAmount || 0).toLocaleString('en-IN')}`,
      testerPaymentNum: Number(testerAmount || 0),
      testerAssignedAmount: Number(testerAmount || 0),
      testerPaymentPaid: '₹0',
      testerPaymentPaidNum: 0,
      testerPaidAmount: 0,
      testerPaymentRemaining: `₹${Number(testerAmount || 0).toLocaleString('en-IN')}`,
      testerPaymentRemainingNum: Number(testerAmount || 0),
      testerRemainingAmount: Number(testerAmount || 0),
      testerPaymentStatus: 'Pending',

      startingPaymentReceived: startingPaymentReceived,
      clientPaymentReceived: startingPaymentReceived,
      clientPaymentStatus: paidNum >= totalNum ? 'Full Payment Received' : paidNum > 0 ? 'Partial Payment' : 'Pending',
      
      // Schedule Dates
      assignedDate: formatDateDisplay(assignedDate),
      submissionDate: formatDateDisplay(submissionDate),
      testingSubmissionDate: formatDateDisplay(testingSubmissionDate),
      deadline: formatDateDisplay(deadlineDate),
      deadlineDate: formatDateDisplay(deadlineDate),
      finalDeliveryDate: formatDateDisplay(finalDeliveryDate),
      assignedDateIso: assignedDate,
      submissionDateIso: submissionDate,
      testingSubmissionDateIso: testingSubmissionDate,
      deadlineDateIso: deadlineDate,
      finalDeliveryDateIso: finalDeliveryDate,

      // Canonical Lifecycle Flags
      developerStarted: false,
      developerStartedAt: null,
      developerSubmitted: false,
      developerSubmittedAt: null,
      testerStarted: false,
      testerStartedAt: null,
      testerFinalized: false,
      testerFinalizedAt: null,
      adminApproved: false,
      adminApprovedAt: null,
      adminRejected: false,
      adminRejectedAt: null,
      adminRejectionComment: '',
      adminRejectionDocument: null,

      // Status & Progress
      progress: 0,
      freelancerProgress: 0,
      developerProgress: 0,
      testingProgress: 0,
      status: 'In Progress',
      testingStatus: 'Awaiting Testing',
      completedTasksCount: 0,
      totalTasksCount: milestones.length,
      description: description,
      requirements: {
        description: description,
        clientReqs: clientReqs ? clientReqs.split('\n').filter(Boolean) : []
      },
      clientRequirements: clientReqs ? clientReqs.split('\n').filter(Boolean) : [],
      milestones: milestones.map((m, i) => ({
        id: m.id || `m-${i + 1}`,
        number: i + 1 < 10 ? `0${i + 1}` : `${i + 1}`,
        heading: m.heading,
        name: m.heading,
        description: m.description,
        desc: m.description,
        percentage: Number(m.percentage || 0),
        weight: Number(m.percentage || 0),
        adminPercentage: Number(m.percentage || 0),
        status: 'Pending',
        qaStatus: 'Pending',
        progress: 0,
        deadline: formatDateDisplay(submissionDate)
      })),
      tasks: milestones.map((m, i) => ({
        id: `t-${i + 1}`,
        number: i + 1 < 10 ? `0${i + 1}` : `${i + 1}`,
        name: m.heading,
        desc: m.description,
        percentage: Number(m.percentage || 0),
        weight: Number(m.percentage || 0),
        adminPercentage: Number(m.percentage || 0),
        status: 'Pending',
        qaStatus: 'Pending',
        progress: 0,
        deadline: formatDateDisplay(submissionDate)
      })),
      documents: documents.map(d => ({ ...d, date: formatDateDisplay(assignedDate) })),
      credentials: validCreds,
      testingIssues: [],
      testingNotes: '',
      testingDocuments: [],
      testingActivity: [
        { event: 'Project Created by Master Admin', time: formatDateDisplay(assignedDate), by: 'Admin' },
        { event: `Developer Assigned: ${dev ? dev.name : 'Unassigned'}`, time: formatDateDisplay(assignedDate), by: 'System' },
        { event: `QA Tester Assigned: ${tester ? tester.name : 'Unassigned'}`, time: formatDateDisplay(assignedDate), by: 'System' }
      ],
      assignmentHistory: [
        { developer: dev ? dev.name : 'Unassigned', tester: tester ? tester.name : 'Unassigned', assignedDate: formatDateDisplay(assignedDate), status: 'Project Created & Assigned', updated: 'Created by Admin' }
      ],
      submissionNotes: ''
    };

    onSaveProject(newProject);
  };

  const currentDev = approvedDevelopers.find(d => d.id === selectedDevId) || null;
  const currentTester = approvedTesters.find(t => t.id === selectedTesterId) || null;

  return (
    <div className="create-project-container">
      {/* Top Header & Back Button */}
      <div className="create-project-header">
        <button
          type="button"
          onClick={onBack}
          className="btn-back-link"
        >
          <ArrowLeft size={16} />
          <span>Back to Projects</span>
        </button>

        <div className="create-header-title-box">
          <h1 className="create-page-title">Create New Project</h1>
          <p className="create-page-desc">
            Define project information, internal amounts, schedule, assignments, requirements, credentials, milestones, and specification documents.
          </p>
        </div>
      </div>

      {/* Validation Alert Banner */}
      {validationErrors.length > 0 && (
        <div className="form-validation-alert">
          <AlertCircle size={20} color="#DC2626" style={{ marginTop: '2px', flexShrink: 0 }} />
          <div className="form-validation-alert-content">
            <div className="form-validation-alert-title">Please complete all required fields:</div>
            <ul className="form-validation-alert-list">
              {validationErrors.map((err, idx) => (
                <li key={idx}>{err}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <form onSubmit={handleFormSubmit} className="create-project-form-body">
        {/* ========================================================================= */}
        {/* SECTION 1 — PROJECT INFORMATION */}
        {/* ========================================================================= */}
        <div className="portal-card">
          <div className="portal-card-header">
            <h2 className="portal-card-title">
              <FileText size={18} color="#0A3D75" />
              <span>1. Project Information</span>
            </h2>
            <span className="create-section-step">Step 1 of 9</span>
          </div>

          <div className="form-fields-grid">
            {/* 1. Client Name */}
            <div className="form-field-item">
              <label className="field-label">Client Name *</label>
              <input
                type="text"
                required
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="e.g. Dahej Petrochem Industries"
                className={`portal-input ${formAttempted && !clientName.trim() ? 'input-has-error' : ''}`}
              />
              {formAttempted && !clientName.trim() && (
                <span className="field-error-text">Client Name is required.</span>
              )}
            </div>

            {/* 2. Project Name */}
            <div className="form-field-item">
              <label className="field-label">Project Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Corporate Website & Product Catalog"
                className={`portal-input ${formAttempted && !name.trim() ? 'input-has-error' : ''}`}
              />
              {formAttempted && !name.trim() && (
                <span className="field-error-text">Project Name is required.</span>
              )}
            </div>

            {/* 3. Project ID */}
            <div className="form-field-item">
              <label className="field-label">Project ID</label>
              <input
                type="text"
                required
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="portal-input"
                style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0A3D75' }}
              />
              <span className="field-help-text">Unique system reference code</span>
            </div>

            {/* 4. Project Type */}
            <div className="form-field-item">
              <label className="field-label">Project Type *</label>
              <select
                value={projectType}
                onChange={(e) => setProjectType(e.target.value)}
                className="portal-select"
              >
                <option value="Business Website">Business Website</option>
                <option value="Corporate Website">Corporate Website</option>
                <option value="E-commerce Website">E-commerce Website</option>
                <option value="Landing Page">Landing Page</option>
                <option value="Web Application">Web Application</option>
                <option value="SaaS Platform">SaaS Platform</option>
                <option value="Portfolio Website">Portfolio Website</option>
                <option value="WordPress Website">WordPress Website</option>
                <option value="Custom Website">Custom Website</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* 5. Priority */}
            <div className="form-field-item">
              <label className="field-label">Priority *</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="portal-select"
              >
                <option value="Low">Low</option>
                <option value="Normal">Normal</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 2 — AMOUNT */}
        {/* ========================================================================= */}
        <div className="portal-card" style={{ borderLeft: '4px solid #F3821D' }}>
          <div className="portal-card-header">
            <div>
              <h2 className="portal-card-title">
                <IndianRupee size={18} color="#F3821D" />
                <span>2. Amount</span>
              </h2>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.825rem', color: '#64748B' }}>
                Internal project financial allocations and payout distribution.
              </p>
            </div>
            <span className="create-section-step">Step 2 of 9</span>
          </div>

          <div className="form-fields-grid">
            {/* 1. Total Amount */}
            <div className="form-field-item">
              <label className="field-label">Total Amount (₹) *</label>
              <div className="currency-input-wrap">
                <span className="currency-symbol">₹</span>
                <input
                  type="number"
                  required
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                  placeholder="50000"
                  className="portal-input currency-input"
                />
              </div>
              <span className="field-help-text">Total project amount recorded internally</span>
            </div>

            {/* 2. Paid Amount */}
            <div className="form-field-item">
              <label className="field-label">Paid Amount (₹) *</label>
              <div className="currency-input-wrap">
                <span className="currency-symbol">₹</span>
                <input
                  type="number"
                  required
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  placeholder="20000"
                  className="portal-input currency-input"
                />
              </div>
              <span className="field-help-text">Amount already received / paid</span>
            </div>

            {/* 3. Remaining Amount (Auto-Calculated) */}
            <div className="form-field-item">
              <label className="field-label">Remaining Amount (₹)</label>
              <div className="currency-input-wrap">
                <span className="currency-symbol" style={{ color: '#0F766E' }}>₹</span>
                <input
                  type="text"
                  readOnly
                  value={remainingNum.toLocaleString('en-IN')}
                  className="portal-input currency-input readonly-calc"
                />
              </div>
              <span className="field-help-text">Auto-calculated: Total Amount - Paid Amount</span>
            </div>

            {/* 4. Freelancer Amount */}
            <div className="form-field-item">
              <label className="field-label">Freelancer Amount (₹) *</label>
              <div className="currency-input-wrap">
                <span className="currency-symbol">₹</span>
                <input
                  type="number"
                  required
                  value={freelancerAmount}
                  onChange={(e) => setFreelancerAmount(e.target.value)}
                  placeholder="15000"
                  className="portal-input currency-input"
                />
              </div>
              <span className="field-help-text">Amount allocated to assigned developer</span>
            </div>

            {/* 5. Tester Amount */}
            <div className="form-field-item">
              <label className="field-label">Tester Amount (₹) *</label>
              <div className="currency-input-wrap">
                <span className="currency-symbol">₹</span>
                <input
                  type="number"
                  required
                  value={testerAmount}
                  onChange={(e) => setTesterAmount(e.target.value)}
                  placeholder="3000"
                  className="portal-input currency-input"
                />
              </div>
              <span className="field-help-text">Amount allocated to assigned QA tester</span>
            </div>
          </div>

          {/* Starting Payment Received Checkbox */}
          <div className="starting-payment-check-banner">
            <label className="starting-payment-check-label" htmlFor="starting-payment-toggle">
              <input
                type="checkbox"
                id="starting-payment-toggle"
                checked={startingPaymentReceived}
                onChange={(e) => setStartingPaymentReceived(e.target.checked)}
                className="starting-payment-real-checkbox"
              />
              <span className={`starting-payment-custom-checkbox ${startingPaymentReceived ? 'checked' : ''}`}>
                {startingPaymentReceived && <Check size={16} strokeWidth={3} />}
              </span>
              <div className="starting-payment-check-info">
                <div className="starting-payment-check-top">
                  <span className="starting-payment-title">Starting Payment Received</span>
                  <span className={`starting-payment-badge ${startingPaymentReceived ? 'received' : 'pending'}`}>
                    {startingPaymentReceived ? '✓ Payment Received' : 'Payment Pending'}
                  </span>
                </div>
                <p className="starting-payment-desc">
                  Check this box if the initial advance / token payment from the client has been received.
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 3 — SCHEDULE */}
        {/* ========================================================================= */}
        <div className="portal-card">
          <div className="portal-card-header">
            <div>
              <h2 className="portal-card-title">
                <Calendar size={18} color="#0A3D75" />
                <span>3. Schedule</span>
              </h2>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.825rem', color: '#64748B' }}>
                Key project timeline milestones and delivery deadlines.
              </p>
            </div>
            <span className="create-section-step">Step 3 of 9</span>
          </div>

          <div className="form-fields-grid">
            {/* 1. Assigned Date (Today's Date Auto-Populated) */}
            <div className="form-field-item">
              <label className="field-label">Assigned Date</label>
              <div className="date-input-wrap">
                <Calendar size={15} className="date-input-icon" />
                <input
                  type="date"
                  min={todayIso}
                  value={assignedDate}
                  onChange={(e) => setAssignedDate(e.target.value)}
                  onClick={(e) => e.target.showPicker && e.target.showPicker()}
                  className="portal-input date-input"
                  title="Click to select date from calendar (Auto-populated with today's date)"
                />
              </div>
              <span className="field-help-text">Auto-populated with today ({formatDateDisplay(assignedDate)})</span>
            </div>

            {/* 2. Submission Date */}
            <div className="form-field-item">
              <label className="field-label">Submission Date *</label>
              <div className="date-input-wrap">
                <Clock size={15} className="date-input-icon" />
                <input
                  type="date"
                  required
                  min={assignedDate || todayIso}
                  value={submissionDate}
                  onChange={(e) => setSubmissionDate(e.target.value)}
                  onClick={(e) => e.target.showPicker && e.target.showPicker()}
                  className="portal-input date-input"
                  title="Click to select date from calendar"
                />
              </div>
              <span className="field-help-text">Selected: {formatDateDisplay(submissionDate)}</span>
            </div>

            {/* 3. Testing Submission Date */}
            <div className="form-field-item">
              <label className="field-label">Testing Submission Date *</label>
              <div className="date-input-wrap">
                <ShieldCheck size={15} className="date-input-icon" />
                <input
                  type="date"
                  required
                  min={submissionDate || assignedDate || todayIso}
                  value={testingSubmissionDate}
                  onChange={(e) => setTestingSubmissionDate(e.target.value)}
                  onClick={(e) => e.target.showPicker && e.target.showPicker()}
                  className="portal-input date-input"
                  title="Click to select date from calendar"
                />
              </div>
              <span className="field-help-text">Selected: {formatDateDisplay(testingSubmissionDate)}</span>
            </div>

            {/* 4. Deadline Date */}
            <div className="form-field-item">
              <label className="field-label">Deadline Date *</label>
              <div className="date-input-wrap">
                <Calendar size={15} className="date-input-icon" />
                <input
                  type="date"
                  required
                  min={testingSubmissionDate || submissionDate || todayIso}
                  value={deadlineDate}
                  onChange={(e) => setDeadlineDate(e.target.value)}
                  onClick={(e) => e.target.showPicker && e.target.showPicker()}
                  className="portal-input date-input"
                  title="Click to select date from calendar"
                />
              </div>
              <span className="field-help-text">Selected: {formatDateDisplay(deadlineDate)}</span>
            </div>

            {/* 5. Final Delivery Date */}
            <div className="form-field-item">
              <label className="field-label">Final Delivery Date *</label>
              <div className="date-input-wrap">
                <CheckSquare size={15} className="date-input-icon" />
                <input
                  type="date"
                  required
                  min={deadlineDate || todayIso}
                  value={finalDeliveryDate}
                  onChange={(e) => setFinalDeliveryDate(e.target.value)}
                  onClick={(e) => e.target.showPicker && e.target.showPicker()}
                  className="portal-input date-input"
                  title="Click to select date from calendar"
                />
              </div>
              <span className="field-help-text">Selected: {formatDateDisplay(finalDeliveryDate)}</span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 4 — DEVELOPER ASSIGNMENT */}
        {/* ========================================================================= */}
        <div className="portal-card" style={{ borderLeft: '4px solid #0A3D75' }}>
          <div className="portal-card-header">
            <div>
              <h2 className="portal-card-title">
                <Users size={18} color="#0A3D75" />
                <span>4. Developer Assignment</span>
              </h2>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.825rem', color: '#64748B' }}>
                Select exactly one verified developer to build the project.
              </p>
            </div>
            <span className="create-section-step">Step 4 of 9</span>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label className="field-label">
              Select Developer {approvedDevelopers.length > 0 ? '*' : '(Approval Required)'}
            </label>
            {approvedDevelopers.length > 0 ? (
              <div className="dev-selection-grid">
                {approvedDevelopers.map((dev) => {
                  const isSelected = selectedDevId === dev.id;
                  const activeCount = dev.activeProjectsCount || 0;
                  const statusClass = activeCount > 2 
                    ? 'busy' 
                    : activeCount > 0 
                      ? 'working' 
                      : 'available';
                  
                  const displayStatus = activeCount > 2
                    ? 'Busy'
                    : activeCount > 0
                      ? 'Currently Working'
                      : 'Available';

                  const formattedCount = activeCount < 10 ? `0${activeCount}` : `${activeCount}`;

                  return (
                    <div
                      key={dev.id}
                      onClick={() => setSelectedDevId(dev.id)}
                      className={`dev-select-card ${isSelected ? 'selected' : ''}`}
                    >
                      <img
                        src={dev.avatar}
                        alt={dev.name}
                        className="dev-card-avatar"
                      />
                      <div className="dev-card-info">
                        <div className="dev-card-name">{dev.name}</div>
                        <div className="dev-card-skill">{dev.primarySkill || 'Full Stack Developer'}</div>
                        <div className="dev-card-meta">
                          <span>Active Projects: <strong>{formattedCount}</strong></span>
                          <span>•</span>
                          <span className={`dev-avail-tag ${statusClass}`}>
                            ● {displayStatus}
                          </span>
                        </div>
                      </div>
                      {isSelected && (
                        <div className="dev-check-icon">
                          <Check size={12} strokeWidth={3} />
                          <span>Selected</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="empty-approved-box warning">
                <Clock size={28} color="#D97706" style={{ marginBottom: '8px' }} />
                <h4>No Approved Developers Available</h4>
                <p>
                  {(availableDevelopers || []).some(d => d.status === 'Pending') ? (
                    <>
                      There are <strong>{(availableDevelopers || []).filter(d => d.status === 'Pending').length} registered developer(s)</strong> awaiting Admin approval in the Developer Directory.
                      Developers must be reviewed & approved before they can be assigned to new projects.
                    </>
                  ) : (
                    <>
                      No developers are registered on the platform yet. Once developers apply and are approved by Admin, they will appear here.
                    </>
                  )}
                </p>
                <button
                  type="button"
                  className="btn-link-action"
                  onClick={() => {
                    window.history.pushState({}, '', '/admin/developers');
                    window.dispatchEvent(new PopStateEvent('popstate'));
                  }}
                >
                  <UserCheck size={14} />
                  <span>Go to Developer Directory to Approve Developers</span>
                </button>
              </div>
            )}

            {approvedDevelopers.length > 0 && (
              <div style={{ marginTop: '12px', fontSize: '0.825rem', color: '#64748B' }}>
                Selected Developer: <strong style={{ color: '#0A3D75' }}>{currentDev?.name || 'None'}</strong> {currentDev ? `(${currentDev.primarySkill})` : ''}
              </div>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 5 — TESTER ASSIGNMENT */}
        {/* ========================================================================= */}
        <div className="portal-card" style={{ borderLeft: '4px solid #F3821D' }}>
          <div className="portal-card-header">
            <div>
              <h2 className="portal-card-title">
                <ShieldCheck size={18} color="#F3821D" />
                <span>5. Tester Assignment</span>
              </h2>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.825rem', color: '#64748B' }}>
                Select exactly one QA tester for comprehensive quality assurance review.
              </p>
            </div>
            <span className="create-section-step">Step 5 of 9</span>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label className="field-label">
              Select Tester {approvedTesters.length > 0 ? '*' : '(Approval Required)'}
            </label>
            {approvedTesters.length > 0 ? (
              <div className="dev-selection-grid">
                {approvedTesters.map((t) => {
                  const isSelected = selectedTesterId === t.id;
                  const count = t.activeTestingProjects || 0;
                  const statusClass = count > 2 
                    ? 'busy' 
                    : count > 0 
                      ? 'testing' 
                      : 'available';

                  const displayStatus = count > 2
                    ? 'Busy'
                    : count > 0
                      ? 'Currently Testing'
                      : 'Available';

                  const formattedCount = count < 10 ? `0${count}` : `${count}`;

                  return (
                    <div
                      key={t.id}
                      onClick={() => setSelectedTesterId(t.id)}
                      className={`dev-select-card ${isSelected ? 'selected tester-selected' : ''}`}
                    >
                      <img
                        src={t.avatar}
                        alt={t.name}
                        className="dev-card-avatar"
                      />
                      <div className="dev-card-info">
                        <div className="dev-card-name">{t.name}</div>
                        <div className="dev-card-skill">{t.specialization || t.role || 'QA Tester'}</div>
                        <div className="dev-card-meta">
                          <span>Active Testing Projects: <strong>{formattedCount}</strong></span>
                          <span>•</span>
                          <span className={`dev-avail-tag ${statusClass}`}>
                            ● {displayStatus}
                          </span>
                        </div>
                      </div>
                      {isSelected && (
                        <div className="dev-check-icon tester-check">
                          <Check size={12} strokeWidth={3} />
                          <span>Selected</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="empty-approved-box warning">
                <Clock size={28} color="#D97706" style={{ marginBottom: '8px' }} />
                <h4>No Approved QA Testers Available</h4>
                <p>
                  {(availableTesters || []).some(t => t.status === 'Pending') ? (
                    <>
                      There are <strong>{(availableTesters || []).filter(t => t.status === 'Pending').length} registered QA tester(s)</strong> awaiting Admin approval in the QA Tester Directory.
                      Testers must be reviewed & approved by Admin before they can be assigned to new projects.
                    </>
                  ) : (
                    <>
                      No QA testers are registered on the platform yet. Once testers apply and are approved by Admin, they will appear here.
                    </>
                  )}
                </p>
                <button
                  type="button"
                  className="btn-link-action tester"
                  onClick={() => {
                    window.history.pushState({}, '', '/admin/testers');
                    window.dispatchEvent(new PopStateEvent('popstate'));
                  }}
                >
                  <ShieldCheck size={14} />
                  <span>Go to QA Tester Directory to Approve Testers</span>
                </button>
              </div>
            )}

            {approvedTesters.length > 0 && (
              <div style={{ marginTop: '12px', fontSize: '0.825rem', color: '#64748B' }}>
                Selected Tester: <strong style={{ color: '#F3821D' }}>{currentTester?.name || 'None'}</strong> {currentTester ? `(${currentTester.specialization || currentTester.role})` : ''}
              </div>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 6 — DETAILED PROJECT REQUIREMENTS */}
        {/* ========================================================================= */}
        <div className="portal-card">
          <div className="portal-card-header">
            <div>
              <h2 className="portal-card-title">
                <Layers size={18} color="#0A3D75" />
                <span>6. Detailed Project Requirements</span>
              </h2>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.825rem', color: '#64748B' }}>
                Spacious inputs for project description and client expectations.
              </p>
            </div>
            <span className="create-section-step">Step 6 of 9</span>
          </div>

          <div className="requirements-form-stack">
            {/* 1. Description */}
            <div className="form-field-item">
              <label className="field-label">Description *</label>
              <textarea
                rows={5}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter a detailed description of the project..."
                className={`portal-textarea ${formAttempted && !description.trim() ? 'input-has-error' : ''}`}
              />
              {formAttempted && !description.trim() && (
                <span className="field-error-text">Project Description is required.</span>
              )}
            </div>

            {/* 2. Client Requirement */}
            <div className="form-field-item">
              <label className="field-label">Client Requirement *</label>
              <textarea
                rows={5}
                required
                value={clientReqs}
                onChange={(e) => setClientReqs(e.target.value)}
                placeholder="Enter the client's requirements..."
                className={`portal-textarea ${formAttempted && !clientReqs.trim() ? 'input-has-error' : ''}`}
              />
              {formAttempted && !clientReqs.trim() && (
                <span className="field-error-text">Client Requirement is required.</span>
              )}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 7 — ACCESS CREDENTIALS */}
        {/* ========================================================================= */}
        <div className="portal-card" style={{ borderLeft: '4px solid #0A3D75' }}>
          <div className="portal-card-header">
            <div>
              <h2 className="portal-card-title">
                <Key size={18} color="#0A3D75" />
                <span>7. Access Credentials</span>
              </h2>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.84rem', color: '#64748B' }}>
                Add project-related logins (Email & Password) with masked secret keys and show/hide controls.
              </p>
            </div>
            <span className="create-section-step">Step 7 of 9</span>
          </div>

          <div className="credentials-builder-stack">
            {credentials.map((cred, idx) => (
              <div key={cred.id} className="cred-card-item">
                <div className="cred-card-top">
                  <div className="cred-badge-tag">
                    <Key size={13} />
                    <span>Credential #{idx + 1}</span>
                  </div>
                  {credentials.length > 1 && (
                    <button 
                      type="button" 
                      onClick={() => handleRemoveCredential(cred.id)}
                      className="btn-remove-cred"
                      title="Remove this credential"
                    >
                      <Trash2 size={13} />
                      <span>Remove</span>
                    </button>
                  )}
                </div>

                <div className="cred-two-fields-grid">
                  <div className="form-field-item">
                    <label className="field-label">Email</label>
                    <div className="cred-input-wrap">
                      <Mail size={16} className="cred-input-icon" />
                      <input 
                        type="text" 
                        placeholder="client@example.com"
                        value={cred.email}
                        onChange={(e) => handleUpdateCredential(cred.id, 'email', e.target.value)}
                        className="portal-input cred-input"
                      />
                    </div>
                  </div>

                  <div className="form-field-item">
                    <label className="field-label">Password</label>
                    <div className="cred-input-wrap">
                      <Lock size={16} className="cred-input-icon" />
                      <input 
                        type={showPasswordMap[cred.id] ? "text" : "password"}
                        placeholder="••••••••••"
                        value={cred.password}
                        onChange={(e) => handleUpdateCredential(cred.id, 'password', e.target.value)}
                        className="portal-input cred-input password-input"
                      />
                      <button 
                        type="button" 
                        className="btn-toggle-eye"
                        onClick={() => toggleShowPassword(cred.id)}
                        tabIndex={-1}
                        title={showPasswordMap[cred.id] ? "Hide password" : "Show password"}
                      >
                        {showPasswordMap[cred.id] ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <button 
              type="button" 
              onClick={handleAddCredential}
              className="btn-add-credential"
            >
              <PlusCircle size={16} />
              <span>+ Add Credential</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 8 — PROJECT MILESTONES */}
        {/* ========================================================================= */}
        <div className="portal-card" style={{ borderLeft: '4px solid #0A3D75' }}>
          <div className="portal-card-header">
            <div>
              <h2 className="portal-card-title">
                <CheckSquare size={18} color="#0A3D75" />
                <span>8. Project Milestones ({milestones.length})</span>
              </h2>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.84rem', color: '#64748B' }}>
                Define milestone headings, descriptions, and contribution percentages totaling exactly 100%.
              </p>
            </div>
            <span className="create-section-step">Step 8 of 9</span>
          </div>

          <div className="milestones-builder-stack">
            {milestones.map((m, idx) => {
              const numStr = idx + 1 < 10 ? `0${idx + 1}` : `${idx + 1}`;

              return (
                <div key={m.id} className="milestone-card-item">
                  <div className="milestone-card-top">
                    <div className="milestone-badge-group">
                      <span className="milestone-badge-num">Milestone {numStr}</span>
                      <span className="milestone-badge-pct">{Number(m.percentage || 0)}% Weight</span>
                    </div>

                    <div className="milestone-card-actions">
                      <button
                        type="button"
                        onClick={() => handleMoveMilestone(idx, -1)}
                        disabled={idx === 0}
                        className="btn-icon-move"
                        title="Move Up"
                      >
                        <MoveUp size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveMilestone(idx, 1)}
                        disabled={idx === milestones.length - 1}
                        className="btn-icon-move"
                        title="Move Down"
                      >
                        <MoveDown size={13} />
                      </button>
                      {milestones.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMilestone(m.id)}
                          className="btn-remove-milestone"
                          title="Remove milestone"
                        >
                          <Trash2 size={13} />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="milestone-fields-grid">
                    {/* 1. Heading */}
                    <div className="form-field-item">
                      <label className="field-label">Heading *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Homepage Development"
                        value={m.heading}
                        onChange={(e) => handleUpdateMilestone(m.id, 'heading', e.target.value)}
                        className="portal-input"
                      />
                    </div>

                    {/* 3. Percentage of Work Done */}
                    <div className="form-field-item">
                      <label className="field-label">Percentage of Work Done (%) *</label>
                      <div className="pct-input-wrap">
                        <input
                          type="number"
                          min="1"
                          max="100"
                          required
                          placeholder="20"
                          value={m.percentage}
                          onChange={(e) => handleUpdateMilestone(m.id, 'percentage', e.target.value)}
                          className="portal-input pct-input"
                        />
                        <span className="pct-symbol">%</span>
                      </div>
                    </div>
                  </div>

                  {/* 2. Description */}
                  <div className="form-field-item">
                    <label className="field-label">Description</label>
                    <textarea
                      rows={2}
                      placeholder="Complete homepage design and responsive development."
                      value={m.description}
                      onChange={(e) => handleUpdateMilestone(m.id, 'description', e.target.value)}
                      className="portal-textarea"
                    />
                  </div>
                </div>
              );
            })}

            <button
              type="button"
              onClick={handleAddMilestone}
              className="btn-add-milestone"
            >
              <PlusCircle size={16} />
              <span>+ Add Milestone</span>
            </button>

            {/* Milestone Weight Summary Box */}
            <div className="milestone-weight-summary-box">
              <div className="milestone-summary-header">
                <span className="milestone-summary-label">Total Milestone Weight</span>
                <div className="milestone-summary-metrics">
                  <span className="milestone-count-chip">
                    Total Milestones: <strong>{milestones.length < 10 ? `0${milestones.length}` : milestones.length}</strong>
                  </span>
                  <span className={`milestone-total-weight-chip ${isWeightExact ? 'exact' : isWeightUnder ? 'under' : 'over'}`}>
                    Total Weight: {totalMilestoneWeight}%
                  </span>
                </div>
              </div>

              {/* Progress track */}
              <div className="milestone-progress-track">
                <div
                  className={`milestone-progress-bar ${isWeightExact ? 'exact' : isWeightUnder ? 'under' : 'over'}`}
                  style={{ width: `${Math.min(100, totalMilestoneWeight)}%` }}
                />
              </div>

              {/* Dynamic validation messages */}
              <div className={`milestone-validation-message ${isWeightExact ? 'exact' : isWeightUnder ? 'under' : 'over'}`}>
                {isWeightExact && (
                  <>
                    <CheckCircle2 size={16} color="#16A34A" />
                    <span>✓ Total Milestone Weight is 100%. Ready for creation.</span>
                  </>
                )}
                {isWeightUnder && (
                  <>
                    <AlertCircle size={16} color="#D97706" />
                    <span>Milestone percentage must total 100%. (Current: {totalMilestoneWeight}%, {100 - totalMilestoneWeight}% remaining).</span>
                  </>
                )}
                {isWeightOver && (
                  <>
                    <AlertCircle size={16} color="#DC2626" />
                    <span>Milestone percentage cannot exceed 100%. (Current: {totalMilestoneWeight}%, exceeds by {totalMilestoneWeight - 100}%).</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 9 — SPECIFICATION DOCUMENT */}
        {/* ========================================================================= */}
        <div className="portal-card">
          <div className="portal-card-header">
            <div>
              <h2 className="portal-card-title">
                <Upload size={18} color="#0A3D75" />
                <span>9. Specification Document ({documents.length})</span>
              </h2>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.825rem', color: '#64748B' }}>
                Upload the document containing complete project specifications.
              </p>
            </div>
            <span className="create-section-step">Step 9 of 9</span>
          </div>

          <div className="spec-builder-section">
            {/* Hidden native file input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              multiple
              style={{ display: 'none' }}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,image/*"
            />

            {/* Clickable Dropzone Area */}
            <div 
              className="spec-upload-dropzone"
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
            >
              <div className="spec-upload-icon-circle">
                <Upload size={24} color="#0A3D75" />
              </div>
              <h3 className="spec-upload-title">Upload Specification Document</h3>
              <p className="spec-upload-subtext">
                Upload the document containing complete project specifications.
              </p>
              <span className="spec-upload-formats">
                Supported Formats: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, ZIP
              </span>
            </div>

            {/* Uploaded Documents List */}
            {documents.length > 0 && (
              <div className="spec-docs-list-grid">
                {documents.map((doc) => (
                  <div key={doc.id} className="spec-doc-card">
                    <div className="spec-doc-icon-box">
                      <FileText size={22} color="#F3821D" />
                    </div>
                    <div className="spec-doc-info">
                      <strong className="spec-doc-name">{doc.name}</strong>
                      <div className="spec-doc-meta">
                        <span>{doc.type} • {doc.size}</span>
                        <span>•</span>
                        <span className="spec-status-pill">✓ {doc.status || 'Uploaded'}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveDoc(doc.id)}
                      className="btn-spec-doc-delete"
                      title="Remove document"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={handleAddSampleDoc}
              className="btn-add-credential"
              style={{ background: '#FFF7ED', borderColor: '#F3821D', color: '#F3821D' }}
            >
              <Paperclip size={16} />
              <span>+ Attach Sample Specification Document (Mock)</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* FINAL CTA — CREATE PROJECT */}
        {/* ========================================================================= */}
        <div className="create-form-submit-bar">
          <div className="submit-summary-info">
            <strong>Ready to publish project?</strong>
            <span>
              Client: <strong>{clientName || 'Not Set'}</strong> • Dev: <strong>{currentDev?.name}</strong> • QA: <strong>{currentTester?.name}</strong> • Total: <strong>₹{totalNum.toLocaleString('en-IN')}</strong> • Weight: <strong style={{ color: isWeightExact ? '#16A34A' : '#DC2626' }}>{totalMilestoneWeight}%</strong>
            </span>
          </div>

          <div className="submit-buttons-row">
            <button
              type="button"
              onClick={onBack}
              className="btn-cancel-create"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={!isWeightExact}
              className="btn-publish-project"
              title={!isWeightExact ? "Total milestone weight must equal 100% to create project." : "Create and publish project"}
            >
              <Save size={17} />
              <span>Create Project</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
