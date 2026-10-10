import React from 'react';
import { 
  KeyRound, 
  FolderGit2, 
  CheckSquare2, 
  TrendingUp, 
  ArrowRight, 
  MapPin, 
  Sparkles,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import './HowItWorks.css';

export default function HowItWorks({ onNavigate }) {
  const cards = [
    {
      step: 'CARD 01',
      title: 'Get Access',
      subtitle: 'VERIFIED ONBOARDING',
      tag: 'Developer & Tester Check',
      desc: 'Apply through a valid reference with dual-OTP authorization and receive Admin approval for your skill track.',
      location: 'Dahej Support Network',
      icon: <KeyRound size={14} />
    },
    {
      step: 'CARD 02',
      title: 'Receive Tasks & Queue',
      subtitle: 'PROJECT & QA ALLOCATION',
      tag: 'Coding & Testing Queue',
      desc: 'Developers receive full-stack website builds; QA Testers receive projects in testing queue for inspection.',
      location: 'Direct Assignment',
      icon: <FolderGit2 size={14} />
    },
    {
      step: 'CARD 03',
      title: 'Execute & Validate',
      subtitle: 'MILESTONES & 14-POINT QA',
      tag: 'Live Workspace Tracking',
      desc: 'Developers build features; Testers execute rigorous QA checklists, verify responsiveness, and report issues.',
      location: 'Unified Workspace',
      icon: <CheckSquare2 size={14} />
    },
    {
      step: 'CARD 04',
      title: 'Approve & Earn',
      subtitle: 'VERIFIED PAYOUTS',
      tag: 'Guaranteed Clearance',
      desc: 'Upon QA approval and Admin clearance, milestones are marked complete with guaranteed direct payouts.',
      location: 'Professional Growth',
      icon: <TrendingUp size={14} />
    }
  ];

  return (
    <section id="how-it-works" className="how-it-works-section">
      <div className="container">
        {/* Section Header Row (Screenshot 2) */}
        <div className="section-header-row">
          <div>
            <div className="badge-featured">
              <Sparkles size={13} className="badge-icon" />
              <span>Structured Workflow</span>
            </div>
            <h2 className="heading-section">How It Works</h2>
            <p style={{ color: '#5F6B76', marginTop: '6px', fontSize: '0.98rem' }}>
              From project assignment to final delivery — everything stays organized.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigate && onNavigate('apply')}
            className="btn-navy-pill"
          >
            <span>Apply with Referral</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {/* 4 Cards Grid (Screenshot 2) */}
        <div className="cards-grid-industrial">
          {cards.map((card, idx) => (
            <div key={idx} className="business-card-item">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Top Row: Title + Verified Badge */}
                <div className="card-top-row">
                  <div className="card-title-group">
                    <span className="card-main-title">{card.title}</span>
                    <span className="card-sub-lead">{card.subtitle}</span>
                  </div>
                  <span className="badge-verified-pill">Verified</span>
                </div>

                {/* Tag Row (Screenshot 2 blue category tag) */}
                <div className="card-tags-row">
                  <span className="tag-blue-category">
                    {card.icon}
                    <span>{card.tag}</span>
                  </span>
                </div>

                {/* Description */}
                <p className="card-description-text">{card.desc}</p>
              </div>

              <div>
                {/* Location / Meta row */}
                <div className="card-location-meta" style={{ marginBottom: '14px' }}>
                  <MapPin size={13} />
                  <span>{card.location}</span>
                </div>

                {/* Card Dual Button Footer (Screenshot 2) */}
                <div className="card-actions-footer">
                  <button
                    type="button"
                    onClick={() => onNavigate && onNavigate('apply')}
                    className="btn btn-navy-action"
                    style={{ width: '100%' }}
                  >
                    <ShieldCheck size={13} />
                    <span>Apply</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onNavigate && onNavigate('login')}
                    className="btn btn-outline-action"
                    style={{ width: '100%' }}
                  >
                    <span>Login</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Large Centered Orange Action Button (Screenshot 2 bottom) */}
        <div className="bottom-cta-center">
          <button
            type="button"
            onClick={() => onNavigate && onNavigate('apply')}
            className="btn btn-orange-primary"
            style={{ padding: '12px 32px', fontSize: '1rem' }}
          >
            <span>Apply with Referral (Verified Process) →</span>
          </button>
        </div>
      </div>
    </section>
  );
}
