import React, { useState } from 'react';
import { 
  Lock, 
  ArrowRight, 
  KeyRound, 
  ShieldAlert,
  Search,
  Code2,
  FlaskConical,
  Sparkles
} from 'lucide-react';
import './Hero.css';

export default function Hero({ onNavigate }) {
  const [referralInput, setReferralInput] = useState('');

  const handleVerifySubmit = (e) => {
    e.preventDefault();
    onNavigate('apply');
  };

  return (
    <section id="hero" className="hero-industrial-wrapper">
      <div className="hero-industrial-bg-ambient" />

      <div className="container">
        <div className="hero-main-layout">
          {/* Track Eyebrow Pills */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '16px' }}>
            <button
              type="button"
              onClick={() => onNavigate('apply-developer')}
              className="hero-role-pill dev"
              title="Apply as Full Stack or Frontend Developer"
            >
              <Code2 size={14} />
              <span>Developer Track (Web & Software)</span>
            </button>
            
            <button
              type="button"
              onClick={() => onNavigate('apply-tester')}
              className="hero-role-pill qa"
              title="Apply as QA Tester or Automation Specialist"
            >
              <FlaskConical size={14} />
              <span>QA Tester Track (Bug & Quality QA)</span>
            </button>
          </div>

          {/* Main Headline */}
          <h1 className="hero-industrial-heading">
            <span className="text-white-bold">Build. Test. Deliver. </span>
            <span className="text-orange-bold">Grow with</span>
            <br />
            <span className="text-orange-bold">Dahej Support.</span>
          </h1>

          <p className="hero-support-subtitle">
            Work on real digital projects through a trusted Developer & Software Tester network.
          </p>

          <p className="hero-industrial-desc">
            Build full-stack web applications and conduct rigorous QA testing to earn <span className="highlight-income-glow">💰 Direct Income</span> from home.
            <br />
            Whether you are a developer or a QA tester — receive structured project assignments, clear test cycles, and grow with us.
          </p>

          {/* Search / Referral Input Bar */}
          <form onSubmit={handleVerifySubmit} className="hero-search-card">
            <Search size={20} className="hero-search-icon" />
            <input
              type="text"
              className="hero-search-input"
              placeholder="Enter Referral Code (e.g. DS-REF-8902 or DS-TST-201) to apply as Developer or Tester..."
              value={referralInput}
              onChange={(e) => setReferralInput(e.target.value)}
            />
            <button type="submit" className="hero-search-btn">
              Apply with Referral
            </button>
          </form>

          {/* Prominent Referral Notice Box on Dark Navy */}
          <div className="hero-notice-banner-dark">
            <span className="hero-notice-badge">⚡ RESTRICTED</span>
            <div className="hero-notice-content">
              <span className="hero-notice-headline">Access is restricted to referenced Developers & QA Testers.</span>
              <p className="hero-notice-subtext">
                Joining the network is referral-based with dual-OTP authorization. You must have a valid reference from an existing developer, tester, or authorized Dahej Support team member.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="hero-buttons-row">
            <button
              type="button"
              onClick={() => onNavigate('apply-developer')}
              className="btn hero-btn-orange"
            >
              <Code2 size={16} />
              <span>Apply as Developer</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('apply-tester')}
              className="btn hero-btn-orange"
              style={{ backgroundColor: '#059669', borderColor: '#059669' }}
            >
              <FlaskConical size={16} />
              <span>Apply as QA Tester</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('login')}
              className="btn hero-btn-glass"
            >
              <Lock size={16} />
              <span>Portal Login</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Orange Metric Stats Strip */}
      <div className="hero-stats-strip">
        <div className="container">
          <div className="hero-stats-grid">
            <div className="hero-stat-item">
              <span className="hero-stat-number">100%</span>
              <span className="hero-stat-label">Referral Verified</span>
            </div>
            <div className="hero-stat-item">
              <span className="hero-stat-number">Dual Track</span>
              <span className="hero-stat-label">Developers & Testers</span>
            </div>
            <div className="hero-stat-item">
              <span className="hero-stat-number">24/7</span>
              <span className="hero-stat-label">Structured Workflow</span>
            </div>
            <div className="hero-stat-item">
              <span className="hero-stat-number">Direct</span>
              <span className="hero-stat-label">Project Allocation</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
