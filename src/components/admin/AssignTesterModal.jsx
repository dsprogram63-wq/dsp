import React, { useState, useEffect } from 'react';
import { 
  X, 
  ShieldCheck, 
  Search, 
  Check, 
  AlertCircle, 
  Layers,
  Sparkles
} from 'lucide-react';
import { initialTesters } from '../../data/testerMockData';
import './ChangeAssignmentModal.css';

export default function AssignTesterModal({ 
  isOpen, 
  project, 
  testers = initialTesters,
  onClose, 
  onAssignTester 
}) {
  const [selectedTesterId, setSelectedTesterId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [testingNote, setTestingNote] = useState('');

  const getTesterActiveCount = (tester) => {
    if (tester.activeTestingProjects !== undefined) return tester.activeTestingProjects;
    if (Array.isArray(tester.currentProjects)) {
      return tester.currentProjects.filter(p => p.status !== 'Completed').length;
    }
    return 0;
  };

  const getTesterAvailability = (tester) => {
    if (tester.status === 'Deactivated') return 'Inactive';
    if (tester.status === 'On Hold') return 'On Hold';
    if (tester.status === 'Pending') return 'Pending Approval';
    const activeCount = getTesterActiveCount(tester);
    return activeCount > 0 ? 'Busy' : 'Available';
  };

  // Determine currently assigned tester
  const currentTester = (testers || initialTesters).find(
    t => t.id === project?.testerId || t.name === project?.tester
  ) || {
    id: project?.testerId || '',
    name: project?.tester || 'Unassigned',
    specialization: project?.testerSpecialization || 'QA Tester',
    experience: '—',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=160',
    activeTestingProjects: 0,
    availability: 'Available'
  };

  const currentTesterActiveCount = getTesterActiveCount(currentTester);
  const currentTesterAvailability = getTesterAvailability(currentTester);

  // Filter out the currently assigned tester AND only allow Approved & Active testers
  const availableCandidates = (testers || initialTesters).filter(t => {
    // Only approved and active testers can be assigned
    if (t.status !== 'Active' && t.status !== 'Approved') {
      return false;
    }
    if (t.id === currentTester.id || t.name.toLowerCase() === currentTester.name.toLowerCase()) {
      return false;
    }
    return true;
  });

  // Filter by search query
  const filteredCandidates = availableCandidates.filter(t => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.name.toLowerCase().includes(q) ||
      (t.specialization && t.specialization.toLowerCase().includes(q)) ||
      (t.role && t.role.toLowerCase().includes(q)) ||
      (t.id && t.id.toLowerCase().includes(q))
    );
  });

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedTesterId(null);
      setSearchQuery('');
      setTestingNote('');
    }
  }, [isOpen, project?.tester, project?.testerId]);

  if (!isOpen || !project) return null;

  const selectedCandidate = (testers || initialTesters).find(t => t.id === selectedTesterId);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedCandidate) return;

    onAssignTester({
      tester: selectedCandidate.name,
      testerId: selectedCandidate.id,
      testerEmail: selectedCandidate.email || '',
      testerSpecialization: selectedCandidate.specialization || selectedCandidate.role || 'QA Specialist',
      testerAvatar: selectedCandidate.avatar,
      note: testingNote || `QA responsibility transferred to ${selectedCandidate.name}`
    });
    onClose();
  };

  return (
    <div className="modal-backdrop-change" onClick={onClose}>
      <div className="modal-dialog-change" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-head-change">
          <div className="head-title-wrap-change">
            <div className="modal-icon-badge-change tester">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h2 className="modal-title-change">Change QA Tester</h2>
              <p className="modal-sub-change">
                <span>Project:</span>
                <strong>{project.name}</strong>
                <span>({project.id})</span>
              </p>
            </div>
          </div>

          <button 
            type="button" 
            onClick={onClose} 
            className="modal-close-btn-change"
            title="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="modal-body-change">
          {/* SECTION 1: CURRENTLY ASSIGNED QA TESTER */}
          <div className="current-person-card tester-card">
            <div className="current-card-header">
              <span className="current-badge-label">Currently Assigned QA Tester</span>
              <span className="current-status-tag">
                <span className="status-dot" style={{ backgroundColor: '#F3821D' }}></span>
                Assigned Inspector
              </span>
            </div>

            <div className="current-person-content">
              <img 
                src={currentTester.avatar} 
                alt={currentTester.name} 
                className="current-person-avatar"
              />
              <div className="current-person-info">
                <h4 className="current-person-name">{currentTester.name}</h4>
                <span className="current-person-role">
                  {currentTester.specialization || currentTester.role || 'Lead QA Engineer'} • {currentTester.experience || '3+ Years'} Exp
                </span>
                <div className="current-person-meta-pills">
                  <span className="meta-pill-sm">{currentTesterActiveCount} Active QA Tasks</span>
                  <span className="meta-pill-sm" style={{ color: currentTesterAvailability === 'Available' ? '#16A34A' : '#D97706', fontWeight: 700 }}>
                    {currentTesterAvailability}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: CANDIDATE SELECTION LIST (EXCLUDING CURRENT) */}
          <div className="candidate-selection-section">
            <div className="selection-section-header">
              <label className="selection-section-title">
                <Layers size={14} color="#F3821D" />
                <span>Select New QA Tester</span>
              </label>
              <span className="candidate-count-badge">
                {availableCandidates.length} Available
              </span>
            </div>

            {/* Search Input */}
            <div className="candidate-search-wrap">
              <Search size={16} className="candidate-search-icon" />
              <input
                type="text"
                className="candidate-search-input"
                placeholder="Search QA tester by name or specialization..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Candidates List */}
            <div className="candidates-scroll-list">
              {filteredCandidates.length > 0 ? (
                filteredCandidates.map((tester) => {
                  const isSelected = selectedTesterId === tester.id;
                  const testerActiveCount = getTesterActiveCount(tester);
                  const testerAvail = getTesterAvailability(tester);
                  const isAvailable = testerAvail === 'Available';

                  return (
                    <div
                      key={tester.id}
                      className={`candidate-item-card ${isSelected ? 'selected-tester' : ''}`}
                      onClick={() => setSelectedTesterId(tester.id)}
                    >
                      <div className="candidate-card-left">
                        <img 
                          src={tester.avatar} 
                          alt={tester.name} 
                          className="candidate-card-avatar"
                        />
                        <div className="candidate-card-details">
                          <div className="candidate-card-name">{tester.name}</div>
                          <span className="candidate-card-role">{tester.specialization || tester.role}</span>
                          <div className="candidate-card-meta">
                            <span>{tester.experience || '3+ Years'}</span>
                            <span>•</span>
                            <span>{testerActiveCount} Active QA</span>
                          </div>
                        </div>
                      </div>

                      <div className="candidate-card-right">
                        <span className={`candidate-avail-chip ${isAvailable ? 'avail' : testerAvail === 'Busy' ? 'busy' : 'hold'}`}>
                          {testerAvail}
                        </span>
                        <div className="candidate-radio-circle">
                          {isSelected && <Check size={13} strokeWidth={3} />}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="candidate-empty-state">
                  No other QA testers match your search.
                </div>
              )}
            </div>
          </div>

          {/* SECTION 3: QA HANDOVER NOTE (OPTIONAL) */}
          <div className="notes-input-group">
            <label className="notes-input-label">
              Testing Instructions / Handover Note (Optional)
            </label>
            <textarea
              rows={2}
              className="notes-textarea-change"
              placeholder="e.g. Please verify 14-item audit checklist and contact form responsive validations..."
              value={testingNote}
              onChange={(e) => setTestingNote(e.target.value)}
            />
          </div>

          {/* SECTION 4: FOOTER ACTIONS */}
          <div className="modal-footer-change">
            <div className="footer-selection-preview">
              {selectedCandidate ? (
                <>
                  <span>Selected:</span>
                  <strong>{selectedCandidate.name}</strong>
                  <span>({selectedCandidate.specialization || selectedCandidate.role})</span>
                </>
              ) : (
                <span style={{ color: '#94A3B8' }}>Select a tester to continue</span>
              )}
            </div>

            <div className="footer-actions-group">
              <button
                type="button"
                onClick={onClose}
                className="btn-cancel-change"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!selectedCandidate}
                className="btn-save-change"
              >
                <Check size={16} strokeWidth={2.5} />
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
