import React from 'react';

export default function StatusBadge({ status, size = 'normal' }) {
  const s = (status || '').toLowerCase().trim();

  let bg = '#E2E8F0';
  let color = '#334155';
  let border = '#CBD5E1';
  let dotColor = '#64748B';
  let label = status;

  if (s === 'active' || s === 'in progress') {
    bg = '#EBF3FA';
    color = '#0A3D75';
    border = '#C7DCF0';
    dotColor = '#F3821D';
  } else if (s === 'submitted') {
    bg = '#E0F2FE';
    color = '#0369A1';
    border = '#BAE6FD';
    dotColor = '#0284C7';
  } else if (s === 'under review' || s === 'in testing' || s === 'testing') {
    bg = '#FEF3C7';
    color = '#92400E';
    border = '#FDE68A';
    dotColor = '#D97706';
  } else if (s === 'finalized') {
    bg = '#EEF2FF';
    color = '#4338CA';
    border = '#C7D2FE';
    dotColor = '#6366F1';
  } else if (s === 'approved') {
    bg = '#ECFDF5';
    color = '#065F46';
    border = '#A7F3D0';
    dotColor = '#10B981';
  } else if (s === 'completed' || s === 'paid' || s === 'full payment received') {
    bg = '#F0FDF4';
    color = '#15803D';
    border = '#BBF7D0';
    dotColor = '#16A34A';
  } else if (s === 'starting payment received') {
    bg = '#EBF3FA';
    color = '#0A3D75';
    border = '#C7DCF0';
    dotColor = '#0A3D75';
  } else if (s === 'partial payment' || s === 'partial' || s === 'remaining' || s === 'on hold') {
    bg = '#FEF3C7';
    color = '#92400E';
    border = '#FDE68A';
    dotColor = '#D97706';
  } else if (s === 'changes assigned' || s === 'revision required' || s === 'deactivated' || s === 'rejected') {
    bg = '#FEE2E2';
    color = '#991B1B';
    border = '#FECACA';
    dotColor = '#EF4444';
  } else if (s === 'assigned' || s === 'pending' || s === 'pending starting payment' || s === 'pending approval' || s === 'not yet approved') {
    bg = '#F1F5F9';
    color = '#475569';
    border = '#E2E8F0';
    dotColor = '#94A3B8';
  }

  const isSmall = size === 'small';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: isSmall ? '4px' : '6px',
        padding: isSmall ? '2px 8px' : '4px 10px',
        borderRadius: '9999px',
        fontSize: isSmall ? '0.72rem' : '0.78rem',
        fontWeight: 700,
        backgroundColor: bg,
        color: color,
        border: `1px solid ${border}`,
        whiteSpace: 'nowrap',
        lineHeight: 1.2
      }}
    >
      <span
        style={{
          width: isSmall ? '5px' : '6px',
          height: isSmall ? '5px' : '6px',
          borderRadius: '50%',
          backgroundColor: dotColor,
          flexShrink: 0
        }}
      />
      <span>{label}</span>
    </span>
  );
}
