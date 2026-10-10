import React from 'react';
import { Lock, ArrowRight, ShieldAlert, Sparkles } from 'lucide-react';
import './FinalCTA.css';

export default function FinalCTA({ onNavigate }) {
  return (
    <section className="final-cta-section">
      <div className="container">
        <div className="final-cta-industrial-card">
          <div className="final-cta-inner">
            <div className="hero-eyebrow-pill" style={{ marginBottom: '18px' }}>
              <Sparkles size={13} color="#F3821D" />
              <span>DAHEJ SUPPORT FREELANCER ONBOARDING</span>
            </div>

            <h2 className="final-cta-heading">
              Ready to Work With <span className="orange-span">Dahej Support?</span>
            </h2>

            <p className="final-cta-subtext">
              If you have a valid reference, apply to join our verified Developer or QA Tester network today.
            </p>

            <div className="final-cta-btns-group">
              <button
                type="button"
                onClick={() => onNavigate('apply-developer')}
                className="btn btn-orange-primary"
                style={{ padding: '13px 26px', fontSize: '1rem' }}
              >
                <span>Apply as Developer</span>
                <ArrowRight size={16} />
              </button>

              <button
                type="button"
                onClick={() => onNavigate('apply-tester')}
                className="btn btn-orange-primary"
                style={{ padding: '13px 26px', fontSize: '1rem', backgroundColor: '#059669', borderColor: '#059669' }}
              >
                <span>Apply as QA Tester</span>
                <ArrowRight size={16} />
              </button>

              <button
                type="button"
                onClick={() => onNavigate('login')}
                className="btn btn-hero-glass"
                style={{ padding: '13px 24px', fontSize: '1rem' }}
              >
                <Lock size={16} />
                <span>Portal Login</span>
              </button>
            </div>

            <div className="final-cta-note">
              <ShieldAlert size={14} color="#F3821D" />
              <span>Access is strictly restricted to referenced Developers & QA Testers.</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
