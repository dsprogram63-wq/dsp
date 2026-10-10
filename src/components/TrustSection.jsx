import React from 'react';
import { Check, ShieldCheck, Sparkles } from 'lucide-react';
import './TrustSection.css';

export default function TrustSection() {
  const points = [
    'Reference-based access',
    'Structured project assignments',
    'Professional project workflow'
  ];

  return (
    <section className="trust-section">
      <div className="container">
        <div className="trust-card-wrapper">
          <div className="trust-left-content">
            <div className="badge-featured">
              <Sparkles size={13} className="badge-icon" />
              <span>Reliability Standard</span>
            </div>
            <h2 className="trust-title">Built Around Trust</h2>
            <p className="trust-paragraph">
              Dahej Support uses a referral-based model to maintain a reliable and professional freelancer network.
            </p>
          </div>

          <div className="trust-points-grid">
            {points.map((pt, idx) => (
              <div key={idx} className="trust-pill-check">
                <ShieldCheck size={16} color="#0A3D75" />
                <span>{pt}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
