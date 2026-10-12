import React, { useState, useEffect } from 'react';
import { 
  X, 
  UserCheck, 
  Search, 
  Check, 
  AlertCircle, 
  IndianRupee, 
  Clock, 
  Calendar,
  Briefcase,
  Layers,
  ArrowRight
} from 'lucide-react';
import { initialDevelopers } from '../../data/adminMockData';
import './ChangeAssignmentModal.css';

export default function AssignmentModal({ 
  isOpen, 
  project, 
  developers = initialDevelopers,
  onClose, 
  onAssign 
}) {
  const [selectedDevId, setSelectedDevId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [assignmentNote, setAssignmentNote] = useState('');

  const getDevActiveCount = (dev) => {
    if (dev.activeProjectsCount !== undefined) return dev.activeProjectsCount;
    if (Array.isArray(dev.currentProjects)) {
      return dev.currentProjects.filter(p => p.status !== 'Completed').length;
    }
    return 0;
  };

  const getDevAvailability = (dev) => {
    if (dev.status === 'Deactivated') return 'Inactive';
    if (dev.status === 'On Hold') return 'On Hold';
    if (dev.status === 'Pending') return 'Pending Approval';
    const activeCount = getDevActiveCount(dev);
    return activeCount > 0 ? 'Busy' : 'Available';
  };

  // Determine currently assigned developer
  const currentDev = (developers || initialDevelopers).find(
    d => d.id === project?.developerId || d.name === project?.developer
  ) || {
    id: project?.developerId || '',
    name: project?.developer || 'Unassigned',
    primarySkill: 'Developer',
    experience: '—',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=160',
    activeProjectsCount: 0,
    availability: 'Available'
  };

  const currentDevActiveCount = getDevActiveCount(currentDev);
  const currentDevAvailability = getDevAvailability(currentDev);

  // Filter out the currently assigned developer AND only allow Approved & Active developers
  const availableCandidates = (developers || initialDevelopers).filter(d => {
    // Only approved and active developers can be assigned
    if (d.status !== 'Active' && d.status !== 'Approved') {
      return false;
    }
    // Exclude if matches current assigned developer by ID or by Name
    if (d.id === currentDev.id || d.name.toLowerCase() === currentDev.name.toLowerCase()) {
      return false;
    }
    return true;
  });

  // Filter by search query
  const filteredCandidates = availableCandidates.filter(d => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      d.name.toLowerCase().includes(q) ||
      (d.primarySkill && d.primarySkill.toLowerCase().includes(q)) ||
      (d.id && d.id.toLowerCase().includes(q))
    );
  });

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedDevId(null);
      setSearchQuery('');
      setAssignmentNote('');
    }
  }, [isOpen, project?.developer, project?.developerId]);

  if (!isOpen || !project) return null;

  const selectedCandidate = (developers || initialDevelopers).find(d => d.id === selectedDevId);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedCandidate) return;

    onAssign({
      developer: selectedCandidate.name,
      developerId: selectedCandidate.id,
      developerSkill: selectedCandidate.primarySkill,
      developerAvatar: selectedCandidate.avatar,
      assignedDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      note: assignmentNote || `Reassigned from ${currentDev.name} to ${selectedCandidate.name}`
    });
    onClose();
  };

  return (
    <div className="modal-backdrop-change" onClick={onClose}>
      <div className="modal-dialog-change" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-head-change">
          <div className="head-title-wrap-change">
            <div className="modal-icon-badge-change dev">
              <UserCheck size={22} />
            </div>
            <div>
              <h2 className="modal-title-change">Change Developer</h2>
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
          {/* SECTION 1: CURRENTLY ASSIGNED DEVELOPER */}
          <div className="current-person-card dev-card">
            <div className="current-card-header">
              <span className="current-badge-label">Currently Assigned Developer</span>
              <span className="current-status-tag">
                <span className="status-dot"></span>
                Active on Project
              </span>
            </div>

            <div className="current-person-content">
              <img 
                src={currentDev.avatar} 
                alt={currentDev.name} 
                className="current-person-avatar"
              />
              <div className="current-person-info">
                <h4 className="current-person-name">{currentDev.name}</h4>
                <span className="current-person-role">
                  {currentDev.primarySkill || 'Frontend Developer'} • {currentDev.experience || '3+ Years'} Exp
                </span>
                <div className="current-person-meta-pills">
                  <span className="meta-pill-sm">{currentDevActiveCount} Active Projects</span>
                  <span className="meta-pill-sm" style={{ color: currentDevAvailability === 'Available' ? '#16A34A' : '#D97706', fontWeight: 700 }}>
                    {currentDevAvailability}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: CANDIDATE SELECTION LIST (EXCLUDING CURRENT) */}
          <div className="candidate-selection-section">
            <div className="selection-section-header">
              <label className="selection-section-title">
                <Layers size={14} color="#0A3D75" />
                <span>Select New Developer</span>
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
                placeholder="Search developer by name or skill..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Candidates List */}
            <div className="candidates-scroll-list">
              {filteredCandidates.length > 0 ? (
                filteredCandidates.map((dev) => {
                  const isSelected = selectedDevId === dev.id;
                  const devActiveCount = getDevActiveCount(dev);
                  const devAvail = getDevAvailability(dev);
                  const isAvailable = devAvail === 'Available';

                  return (
                    <div
                      key={dev.id}
                      className={`candidate-item-card ${isSelected ? 'selected-dev' : ''}`}
                      onClick={() => setSelectedDevId(dev.id)}
                    >
                      <div className="candidate-card-left">
                        <img 
                          src={dev.avatar} 
                          alt={dev.name} 
                          className="candidate-card-avatar"
                        />
                        <div className="candidate-card-details">
                          <div className="candidate-card-name">{dev.name}</div>
                          <span className="candidate-card-role">{dev.primarySkill || 'Developer'}</span>
                          <div className="candidate-card-meta">
                            <span>{dev.experience || '3+ Years'}</span>
                            <span>•</span>
                            <span>{devActiveCount} Active Projects</span>
                          </div>
                        </div>
                      </div>

                      <div className="candidate-card-right">
                        <span className={`candidate-avail-chip ${isAvailable ? 'avail' : devAvail === 'Busy' ? 'busy' : 'hold'}`}>
                          {devAvail}
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
                  No other developers match your search.
                </div>
              )}
            </div>
          </div>

          {/* SECTION 3: REASSIGNMENT NOTE (OPTIONAL) */}
          <div className="notes-input-group">
            <label className="notes-input-label">
              Handover Note / Reassignment Instructions (Optional)
            </label>
            <textarea
              rows={2}
              className="notes-textarea-change"
              placeholder="e.g. Please take over milestone 2 and review responsive layout for client handover..."
              value={assignmentNote}
              onChange={(e) => setAssignmentNote(e.target.value)}
            />
          </div>

          {/* SECTION 4: FOOTER ACTIONS */}
          <div className="modal-footer-change">
            <div className="footer-selection-preview">
              {selectedCandidate ? (
                <>
                  <span>Selected:</span>
                  <strong>{selectedCandidate.name}</strong>
                  <span>({selectedCandidate.primarySkill})</span>
                </>
              ) : (
                <span style={{ color: '#94A3B8' }}>Select a developer to continue</span>
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
