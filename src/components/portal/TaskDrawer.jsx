import React, { useState } from 'react';
import { X, Calendar, CheckSquare, Clock, FileText, CheckCircle2 } from 'lucide-react';
import StatusBadge from './StatusBadge';

export default function TaskDrawer({ task, project, isOpen, onClose, onSave, onUpdateStatus }) {
  if (!isOpen || !task) return null;

  const [notes, setNotes] = useState(task.notes || task.developerNotes || '');
  const [currentStatus, setCurrentStatus] = useState(task.status || 'Pending');

  // Derive Admin-assigned weight for this task
  const taskWeight = task.weight !== undefined 
    ? task.weight 
    : (task.adminPercentage !== undefined 
        ? task.adminPercentage 
        : (task.percentage !== undefined ? task.percentage : (project?.tasks?.length ? Math.round(100 / project.tasks.length) : 20)));

  // Automatic progress based on exact status: Pending (0%), In Progress (50%), Completed (100%)
  const computedProgress = currentStatus === 'Completed' ? 100 : currentStatus === 'In Progress' ? 50 : 0;
  const computedContribution = ((taskWeight * computedProgress) / 100).toFixed(1).replace('.0', '');

  const handleSave = () => {
    const updatedTask = {
      ...task,
      status: currentStatus,
      progress: computedProgress,
      notes: notes.trim(),
      developerNotes: notes.trim(),
      freelancerNotes: notes.trim(),
      weight: taskWeight,
      adminPercentage: taskWeight,
      updatedAt: new Date().toISOString()
    };
    if (onSave) {
      onSave(updatedTask);
    } else if (onUpdateStatus) {
      onUpdateStatus(task.id, currentStatus, notes.trim());
    }
    onClose();
  };

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(7, 34, 61, 0.55)',
        backdropFilter: 'blur(4px)',
        zIndex: 2000,
        display: 'flex',
        justifyContent: 'flex-end',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={onClose}
    >
      <div 
        style={{
          width: '100%',
          maxWidth: '520px',
          height: '100%',
          backgroundColor: '#FFFFFF',
          boxShadow: '-10px 0 30px rgba(0, 0, 0, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          overflowY: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div style={{ padding: '24px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', backgroundColor: '#FAFCFE' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#F3821D', textTransform: 'uppercase' }}>
                TASK #{task.number || '01'}
              </span>
              <StatusBadge status={currentStatus} size="small" />
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0A3D75', margin: 0 }}>
              {task.name}
            </h2>
            <span style={{ fontSize: '0.8rem', color: '#64748B' }}>
              Project: {project ? project.name : 'Corporate Website'}
            </span>
          </div>

          <button 
            type="button" 
            onClick={onClose}
            style={{ padding: '6px', borderRadius: '6px', color: '#64748B', cursor: 'pointer', background: 'none', border: 'none' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Drawer Body */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
          {/* Description */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#17212B', textTransform: 'uppercase' }}>
              Task Description
            </span>
            <p style={{ fontSize: '0.925rem', color: '#475569', lineHeight: 1.55, margin: 0 }}>
              {task.desc || 'Complete the deliverables according to the verified project milestone specifications.'}
            </p>
          </div>

          {/* Meta (Admin Weight & Progress) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', backgroundColor: '#F8FAFC', padding: '14px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
            <div>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckSquare size={12} />
                Admin Weight
              </span>
              <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0A3D75' }}>
                {taskWeight}%
              </span>
            </div>

            <div>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={12} />
                Task Progress
              </span>
              <span style={{ fontSize: '0.95rem', fontWeight: 800, color: currentStatus === 'Completed' ? '#10B981' : currentStatus === 'In Progress' ? '#F3821D' : '#64748B' }}>
                {computedProgress}% <small style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748B' }}>({computedContribution}%)</small>
              </span>
            </div>
          </div>

          {/* Change Status Selector */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#17212B', textTransform: 'uppercase' }}>
              Update Task Status
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
              {[
                { label: 'Pending', prog: '0%' },
                { label: 'In Progress', prog: '50%' },
                { label: 'Completed', prog: '100%' }
              ].map(({ label, prog }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setCurrentStatus(label)}
                  style={{
                    padding: '10px 8px',
                    borderRadius: '8px',
                    fontSize: '0.825rem',
                    fontWeight: 700,
                    border: currentStatus === label ? '2px solid #0A3D75' : '1px solid #CBD5E1',
                    backgroundColor: currentStatus === label ? '#EBF3FA' : '#FFFFFF',
                    color: currentStatus === label ? '#0A3D75' : '#475569',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '2px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span>{label}</span>
                  <span style={{ fontSize: '0.72rem', color: currentStatus === label ? '#F3821D' : '#94A3B8' }}>{prog}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Reference Requirements Checklist */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#17212B', textTransform: 'uppercase' }}>
              Key Task Standards
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.86rem', color: '#334155' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={15} color="#10B981" />
                <span>Follow clean code and responsive viewport standards</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={15} color="#10B981" />
                <span>Verify UI components, form validation & error states</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={15} color="#10B981" />
                <span>Ensure cross-browser compatibility and smooth interactions</span>
              </div>
            </div>
          </div>

          {/* Freelancer Notes */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#17212B', textTransform: 'uppercase' }}>
              Freelancer Task Notes (Visible to Admin & QA Tester)
            </span>
            <textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add your progress notes, completed features, or blocker details for this task..."
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1.5px solid #CBD5E1',
                borderRadius: '8px',
                fontSize: '0.9rem',
                outline: 'none',
                resize: 'vertical',
                boxSizing: 'border-box'
              }}
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{ padding: '18px 24px', borderTop: '1px solid #E2E8F0', display: 'flex', gap: '10px', justifyContent: 'flex-end', backgroundColor: '#FAFCFE' }}>
          <button 
            type="button" 
            onClick={onClose}
            className="btn btn-outline-action"
            style={{ padding: '9px 18px', background: '#F1F5F9', color: '#475569', border: '1px solid #CBD5E1', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
          >
            Cancel
          </button>
          <button 
            type="button" 
            onClick={handleSave}
            className="btn btn-orange-primary"
            style={{ padding: '9px 20px', cursor: 'pointer' }}
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
