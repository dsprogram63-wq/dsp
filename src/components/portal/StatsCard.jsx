import React from 'react';

export default function StatsCard({ 
  title, 
  value, 
  icon: Icon, 
  subtitle, 
  accentColor = '#0A3D75', 
  trend,
  onClick
}) {
  return (
    <div 
      className="portal-stat-card"
      onClick={onClick}
      style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: '12px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
        transition: 'all 0.15s ease',
        cursor: onClick ? 'pointer' : 'default',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#5F6B76', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {title}
        </span>
        {Icon && (
          <div 
            style={{ 
              width: '36px', 
              height: '36px', 
              borderRadius: '8px', 
              backgroundColor: `${accentColor}12`, 
              color: accentColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Icon size={18} />
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '2px' }}>
        <span style={{ fontSize: '1.75rem', fontWeight: 800, color: '#111827', lineHeight: 1.1 }}>
          {value}
        </span>
        {trend && (
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#10B981' }}>
            {trend}
          </span>
        )}
      </div>

      {subtitle && (
        <span style={{ fontSize: '0.78rem', color: '#64748B' }}>
          {subtitle}
        </span>
      )}
    </div>
  );
}
