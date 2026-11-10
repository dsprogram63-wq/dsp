import React from 'react';
import { 
  Lock, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles, 
  Code2, 
  FlaskConical, 
  CheckCircle2, 
  Zap, 
  Shield 
} from 'lucide-react';
import './FinalCTA.css';

export default function FinalCTA({ onNavigate }) {
  return (
    <section className="final-cta-section" id="apply">
      <div className="container">
        <div className="final-cta-card">
          {/* Ambient Lighting Gradients */}
          <div className="cta-ambient-glow cta-glow-orange" aria-hidden="true" />
          <div className="cta-ambient-glow cta-glow-emerald" aria-hidden="true" />
          <div className="cta-grid-pattern" aria-hidden="true" />

          <div className="final-cta-content">
            {/* Top Pill Badge */}
            <div className="cta-eyebrow-pill">
              <span className="cta-pulsing-dot" />
              <Sparkles size={13} className="cta-sparkle-icon" />
              <span>INVITE-ONLY TALENT NETWORK • VERIFIED ACCESS</span>
            </div>

            {/* Main Headline */}
            <h2 className="final-cta-heading">
              Ready to Work With <span className="cta-heading-highlight">Dahej Support?</span>
            </h2>

            {/* Subtitle */}
            <p className="final-cta-subtext">
              If you hold an active referral reference, apply to join our verified developer & QA network. Deliver structured industrial projects with guaranteed milestone disbursements.
            </p>

            {/* Dual Track Cards */}
            <div className="cta-tracks-grid">
              {/* Track 1: Developer Track */}
              <div className="cta-track-card cta-dev-card">
                <div className="cta-track-top">
                  <div className="cta-track-badge dev-badge">
                    <Code2 size={13} />
                    <span>Engineering</span>
                  </div>
                  <div className="cta-track-icon-wrapper dev-icon-glow">
                    <Code2 size={24} className="cta-track-icon" />
                  </div>
                </div>

                <h3 className="cta-track-title">Developer Network</h3>
                <p className="cta-track-desc">
                  Build full-stack web applications, APIs, and modern responsive UI solutions with direct milestone tracking.
                </p>

                <div className="cta-track-perks">
                  <div className="cta-perk-item">
                    <CheckCircle2 size={14} className="perk-check-icon dev-perk-check" />
                    <span>Fixed Milestone Payouts</span>
                  </div>
                  <div className="cta-perk-item">
                    <CheckCircle2 size={14} className="perk-check-icon dev-perk-check" />
                    <span>Dedicated Project Workspace</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onNavigate('apply-developer')}
                  className="cta-btn cta-btn-dev"
                >
                  <span>Apply as Developer</span>
                  <ArrowRight size={16} className="btn-arrow" />
                </button>
              </div>

              {/* Track 2: QA Tester Track */}
              <div className="cta-track-card cta-tester-card">
                <div className="cta-track-top">
                  <div className="cta-track-badge tester-badge">
                    <FlaskConical size={13} />
                    <span>Quality Assurance</span>
                  </div>
                  <div className="cta-track-icon-wrapper tester-icon-glow">
                    <FlaskConical size={24} className="cta-track-icon" />
                  </div>
                </div>

                <h3 className="cta-track-title">QA Tester Network</h3>
                <p className="cta-track-desc">
                  Execute 14-point checklists, audit responsive UI, log bug tickets with repro steps, and sign off client releases.
                </p>

                <div className="cta-track-perks">
                  <div className="cta-perk-item">
                    <CheckCircle2 size={14} className="perk-check-icon tester-perk-check" />
                    <span>Per-Project QA Bounties</span>
                  </div>
                  <div className="cta-perk-item">
                    <CheckCircle2 size={14} className="perk-check-icon tester-perk-check" />
                    <span>Independent Sign-off Authority</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onNavigate('apply-tester')}
                  className="cta-btn cta-btn-tester"
                >
                  <span>Apply as QA Tester</span>
                  <ArrowRight size={16} className="btn-arrow" />
                </button>
              </div>
            </div>

            {/* Portal Login Dock for Existing Members */}
            <div className="cta-existing-member-bar">
              <div className="cta-member-info">
                <div className="cta-member-avatar-stack">
                  <div className="mini-avatar dev-mini-avatar" title="Developer Track">
                    <Code2 size={12} />
                  </div>
                  <div className="mini-avatar tester-mini-avatar" title="QA Tester Track">
                    <FlaskConical size={12} />
                  </div>
                </div>
                <div className="cta-member-text">
                  <span className="member-label">Already an approved member?</span>
                  <span className="member-subtext">Access your projects, queues, and earnings.</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('login')}
                className="cta-login-btn"
              >
                <Lock size={15} />
                <span>Portal Login</span>
                <ArrowRight size={14} className="btn-arrow" />
              </button>
            </div>

            {/* Trust and Verification Notes */}
            <div className="cta-footer-trust-pills">
              <div className="cta-trust-pill">
                <ShieldCheck size={14} className="cta-trust-icon" />
                <span>Strict Referral & Trust ID Verification</span>
              </div>
              <span className="cta-trust-dot">•</span>
              <div className="cta-trust-pill">
                <Zap size={14} className="cta-trust-icon" />
                <span>Escrow Secured Milestone Releases</span>
              </div>
              <span className="cta-trust-dot">•</span>
              <div className="cta-trust-pill">
                <Shield size={14} className="cta-trust-icon" />
                <span>Geo & Real-time Audit Authenticated</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
