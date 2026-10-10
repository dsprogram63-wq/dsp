import React from 'react';
import { FolderOpen } from 'lucide-react';

export default function EmptyState({ 
  icon: Icon = FolderOpen, 
  title = 'No items found', 
  description = 'There are no records to display at this moment.', 
  actionLabel, 
  onAction 
}) {
  return (
    <div 
      style={{
        backgroundColor: '#FFFFFF',
        border: '1px dashed #CBD5E1',
        borderRadius: '14px',
        padding: '56px 24px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        margin: '16px 0'
      }}
    >
      <div 
        style={{
          width: '54px',
          height: '54px',
          borderRadius: '50%',
          backgroundColor: '#F0F6FB',
          color: '#0A3D75',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '4px'
        }}
      >
        <Icon size={26} strokeWidth={1.8} />
      </div>

      <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#17212B', margin: 0 }}>
        {title}
      </h3>

      <p style={{ fontSize: '0.9rem', color: '#5F6B76', maxWidth: '420px', margin: 0, lineHeight: 1.5 }}>
        {description}
      </p>

      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="btn btn-navy-action"
          style={{ marginTop: '8px', padding: '9px 20px' }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
