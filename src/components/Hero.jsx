import React, { useState } from 'react';
import { 
  Lock, 
  ArrowRight, 
  Search, 
  Code2, 
  FlaskConical, 
  GitBranch,
  ShieldCheck,
  Sparkles,
  Check
} from 'lucide-react';
import './Hero.css';

export default function Hero({ onNavigate }) {
  const [referralInput, setReferralInput] = useState('');
  const [activeTrack, setActiveTrack] = useState('developer'); // 'developer' or 'tester'

  const handleVerifySubmit = (e) => {
    e.preventDefault();
    if (activeTrack === 'tester') {
      onNavigate('apply-tester');
    } else {
      onNavigate('apply-developer');
    }
  };

  const toggleTrack = () => {
    setActiveTrack(prev => prev === 'developer' ? 'tester' : 'developer');
  };

  return (
    <section id="hero" className="hero-connectly-section">
      {/* Background Soft Glow */}
      <div className="hero-connectly-ambient" />

      {/* 4 Floating 3D/Glass App Cards (Inspired by Reference Design) */}
      <div className="hero-floating-decorations" aria-hidden="true">
        {/* Card 1: Top-Left (Developer / Full-Stack Track) */}
        <div 
          className="hero-floating-card card-top-left"
          title="Developer Track: Full-Stack Web Development"
          onClick={() => { setActiveTrack('developer'); onNavigate('apply-developer'); }}
        >
          <div className="card-glass-body dev-card-glow">
            <div className="card-icon-surface dev-bg">
              <Code2 size={24} color="#FFFFFF" strokeWidth={2.4} />
            </div>
          </div>
        </div>

        {/* Card 2: Top-Right (Git / Structured Milestones) */}
        <div 
          className="hero-floating-card card-top-right"
          title="Structured Repositories & Git Delivery"
        >
          <div className="card-glass-body git-card-glow">
            <div className="card-icon-surface git-bg">
              <GitBranch size={24} color="#FFFFFF" strokeWidth={2.4} />
            </div>
          </div>
        </div>

        {/* Card 3: Mid-Left (QA Tester Track / Quality) */}
        <div 
          className="hero-floating-card card-mid-left"
          title="QA Tester Track: Bug Detection & Quality Assurance"
          onClick={() => { setActiveTrack('tester'); onNavigate('apply-tester'); }}
        >
          <div className="card-glass-body qa-card-glow">
            <div className="card-icon-surface qa-bg">
              <FlaskConical size={24} color="#FFFFFF" strokeWidth={2.4} />
            </div>
          </div>
        </div>

        {/* Card 4: Mid-Right (Dual-OTP Security / Verified Network) */}
        <div 
          className="hero-floating-card card-mid-right"
          title="Dual-OTP Authorization & Verified Security"
        >
          <div className="card-glass-body auth-card-glow">
            <div className="card-icon-surface auth-bg">
              <ShieldCheck size={24} color="#FFFFFF" strokeWidth={2.4} />
            </div>
          </div>
        </div>
      </div>

      <div className="container hero-content-container">
        {/* Top Pill Badge (matching Connectly "New Next-Gen SaaS Solution" badge) */}
        <div className="hero-eyebrow-container">
          <div className="hero-eyebrow-pill" onClick={toggleTrack} role="button" tabIndex={0} title="Click to toggle track">
            <span className="pill-status-chip">
              {activeTrack === 'developer' ? 'Dev Track' : 'QA Track'}
            </span>
            <span className="pill-label-text">
              Dual-Track Developer & QA Tester Network
            </span>
          </div>
        </div>

        {/* Main Headline with Inline Illuminated Toggle Switch (matching reference image) */}
        <h1 className="hero-connectly-heading">
          <span className="heading-line-1">
            Build. Test.{' '}
            <button
              type="button"
              className={`hero-inline-toggle ${activeTrack === 'tester' ? 'toggle-qa' : 'toggle-dev'}`}
              onClick={toggleTrack}
              title={`Switch track (currently ${activeTrack === 'developer' ? 'Developer' : 'QA Tester'})`}
              aria-label="Toggle Developer or QA Tester track"
            >
              <span className="hero-inline-toggle-knob" />
            </button>{' '}
            Deliver.
          </span>
          <span className="heading-line-2">
            Grow with <span className="brand-navy-highlight">Dahej Support.</span>
          </span>
        </h1>

        {/* Refined Subtitle */}
        <p className="hero-connectly-sub">
          Work on real digital projects through a trusted Developer & Software Tester network.
        </p>

        {/* Central Primary CTA Button (matching Connectly "Start Connecting" glowing pill button) */}
        <div className="hero-actions-center">
          <button
            type="button"
            onClick={() => onNavigate(activeTrack === 'tester' ? 'apply-tester' : 'apply-developer')}
            className="hero-btn-connectly-primary"
          >
            <span>{activeTrack === 'tester' ? 'Start as QA Tester' : 'Start Connecting'}</span>
            <ArrowRight size={16} />
          </button>

          <button
            type="button"
            onClick={() => onNavigate('login')}
            className="hero-btn-connectly-secondary"
          >
            <Lock size={15} />
            <span>Portal Login</span>
          </button>
        </div>

        {/* Sleek Referral Code Search / Entry Bar */}
        <form onSubmit={handleVerifySubmit} className="hero-connectly-search-card">
          <Search size={18} className="hero-search-icon" />
          <input
            type="text"
            className="hero-search-input"
            placeholder="Enter Referral Code (e.g. DS-REF-8902 or DS-TST-201) to apply..."
            value={referralInput}
            onChange={(e) => setReferralInput(e.target.value)}
          />
          <button type="submit" className="hero-search-submit-btn">
            Apply with Referral
          </button>
        </form>

        {/* Restricted Access Information Card */}
        <div className="hero-notice-pill-card">
          <span className="hero-notice-chip">⚡ RESTRICTED ACCESS</span>
          <p className="hero-notice-text">
            Joining the network is referral-based with dual-OTP authorization. Reference required from an existing verified member.
          </p>
        </div>
      </div>

      {/* Concentric Spherical Domes at the Bottom (Signature 3D Horizon from Reference Screenshot) */}
      <div className="hero-concentric-domes-container" aria-hidden="true">
        <svg
          className="hero-concentric-domes-svg"
          viewBox="0 0 1440 620"
          preserveAspectRatio="xMidYMax meet"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Outer Translucent Ring Dome */}
            <radialGradient id="domeGradOuter" cx="50%" cy="85%" r="65%">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.5" />
              <stop offset="40%" stopColor="#2563EB" stopOpacity="0.32" />
              <stop offset="75%" stopColor="#60A5FA" stopOpacity="0.15" />
              <stop offset="95%" stopColor="#BFDBFE" stopOpacity="0.04" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </radialGradient>

            {/* Middle Bright Ring Dome */}
            <radialGradient id="domeGradMiddle" cx="50%" cy="85%" r="55%">
              <stop offset="0%" stopColor="#2563EB" stopOpacity="0.75" />
              <stop offset="45%" stopColor="#3B82F6" stopOpacity="0.58" />
              <stop offset="80%" stopColor="#60A5FA" stopOpacity="0.32" />
              <stop offset="98%" stopColor="#DBEAFE" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </radialGradient>

            {/* Inner Vibrant Core Dome */}
            <radialGradient id="domeGradInner" cx="50%" cy="85%" r="45%">
              <stop offset="0%" stopColor="#1D4ED8" stopOpacity="0.9" />
              <stop offset="40%" stopColor="#2563EB" stopOpacity="0.8" />
              <stop offset="75%" stopColor="#3B82F6" stopOpacity="0.6" />
              <stop offset="95%" stopColor="#93C5FD" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </radialGradient>

            {/* Center Luminous Bulb */}
            <radialGradient id="domeGradCenter" cx="50%" cy="85%" r="35%">
              <stop offset="0%" stopColor="#93C5FD" stopOpacity="0.95" />
              <stop offset="40%" stopColor="#60A5FA" stopOpacity="0.88" />
              <stop offset="80%" stopColor="#3B82F6" stopOpacity="0.65" />
              <stop offset="100%" stopColor="#2563EB" stopOpacity="0.2" />
            </radialGradient>

            {/* Soft Ambient Horizon Filter */}
            <filter id="softGlowHorizon" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="20" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Layer 3: Outer Dome Arc */}
          <ellipse cx="720" cy="560" rx="700" ry="430" fill="url(#domeGradOuter)" />

          {/* Layer 2: Middle Dome Arc */}
          <ellipse cx="720" cy="560" rx="530" ry="320" fill="url(#domeGradMiddle)" />

          {/* Layer 1: Inner Core Dome Arc */}
          <ellipse cx="720" cy="560" rx="380" ry="225" fill="url(#domeGradInner)" />

          {/* Core Horizon Light */}
          <ellipse cx="720" cy="560" rx="250" ry="145" fill="url(#domeGradCenter)" filter="url(#softGlowHorizon)" />
        </svg>
      </div>

      {/* Bottom Metric Stats Strip */}
      <div className="hero-connectly-stats-strip">
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
