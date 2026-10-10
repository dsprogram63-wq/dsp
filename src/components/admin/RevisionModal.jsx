import React, { useState, useRef } from 'react';
import { X, ShieldAlert, Send, Upload, FileText, Trash2 } from 'lucide-react';
import './AdminModals.css';

export default function RevisionModal({ 
  isOpen, 
  project, 
  onClose, 
  onRequestRevision 
}) {
  const [reason, setReason] = useState('');
  const [selectedTask, setSelectedTask] = useState('General Project Revision');
  const [documentFile, setDocumentFile] = useState(null);
  const fileInputRef = useRef(null);

  if (!isOpen || !project) return null;

  const handleFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      const sizeInMB = file.size / (1024 * 1024);
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target.result;
        setDocumentFile({
          name: file.name,
          size: sizeInMB < 0.1 ? `${(file.size / 1024).toFixed(1)} KB` : `${sizeInMB.toFixed(1)} MB`,
          type: file.type || 'PDF Document',
          dataUrl: dataUrl,
          fileData: dataUrl,
          url: dataUrl,
          date: new Date().toLocaleDateString('en-GB')
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!reason.trim()) return;

    if (onRequestRevision) {
      onRequestRevision({
        revisionReason: reason.trim(),
        adminRejectionComment: reason.trim(),
        adminFeedback: reason.trim(),
        adminRejectionDocument: documentFile,
        revisionTask: selectedTask,
        date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      });
    }
    setReason('');
    setDocumentFile(null);
    onClose();
  };

  return (
    <div 
      className="portal-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="portal-modal-card" style={{ maxWidth: '580px' }}>
        {/* Header */}
        <div className="portal-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', background: '#FEE2E2', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <ShieldAlert size={22} color="#DC2626" />
            </div>
            <div>
              <h3 className="portal-modal-title" style={{ color: '#991B1B' }}>Reject & Request Changes</h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748B' }}>
                Notify developer and QA tester with required corrections
              </p>
            </div>
          </div>

          <button type="button" onClick={onClose} className="portal-modal-close">
            <X size={18} />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div className="portal-modal-body">
            {/* Project Target Box */}
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '12px 14px', marginBottom: '16px', fontSize: '0.85rem', color: '#7F1D1D' }}>
              Target Project: <strong>{project.name}</strong> ({project.id}) • Assigned to <strong>{project.developer}</strong>
            </div>

            {/* Specific Task (Optional) */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>
                Specific Milestone Task (Optional)
              </label>
              <select
                value={selectedTask}
                onChange={(e) => setSelectedTask(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1.5px solid #CBD5E1',
                  fontSize: '0.9rem',
                  color: '#0F172A',
                  background: '#FFFFFF'
                }}
              >
                <option value="General Project Revision">General Project Scope</option>
                {(project.tasks || []).map((t) => (
                  <option key={t.id || t.number} value={`${t.number} ${t.name}`}>
                    {t.number} {t.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Reason Textarea */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>
                What changes are required? *
              </label>
              <textarea
                required
                rows={4}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain what needs to be corrected. Example: Homepage banner needs to be redesigned. Mobile navigation is still incorrect. Please fix the login validation..."
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1.5px solid #FCA5A5',
                  fontSize: '0.9rem',
                  color: '#0F172A',
                  boxSizing: 'border-box',
                  resize: 'vertical',
                  lineHeight: 1.5,
                  fontFamily: 'inherit'
                }}
              />
            </div>

            {/* Optional Document Attachment */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>
                Optional Revision / Guideline Document
              </label>
              <input 
                type="file" 
                ref={fileInputRef} 
                style={{ display: 'none' }} 
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.zip" 
              />

              {documentFile ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F1F5F9', border: '1px solid #CBD5E1', padding: '10px 14px', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileText size={18} color="#0A3D75" />
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A' }}>{documentFile.name}</span>
                    <span style={{ fontSize: '0.75rem', color: '#64748B' }}>({documentFile.size})</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDocumentFile(null)}
                    style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer' }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current && fileInputRef.current.click()}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1.5px dashed #CBD5E1',
                    background: '#F8FAFC',
                    color: '#475569',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    fontSize: '0.85rem',
                    fontWeight: 600
                  }}
                >
                  <Upload size={16} />
                  <span>Upload Specification / Feedback Document (PDF, ZIP, DOCX)</span>
                </button>
              )}
            </div>
          </div>

          {/* Modal Footer */}
          <div className="portal-modal-footer">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-navy-action"
              style={{ background: '#F1F5F9', color: '#475569', border: '1px solid #CBD5E1', cursor: 'pointer', padding: '8px 18px' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-navy-action"
              style={{ background: '#DC2626', color: '#FFFFFF', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 20px', fontWeight: 700 }}
            >
              <Send size={15} />
              <span>Send Request Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

