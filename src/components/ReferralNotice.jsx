import React from 'react';
import { KeyRound, FileCheck, Rocket, Sparkles, TrendingUp } from 'lucide-react';
import './ReferralNotice.css';

export default function ReferralNotice() {
  const steps = [
    {
      num: '01',
      title: 'Get a Reference',
      desc: 'Receive a valid referral code from an existing developer, QA tester, or authorized Dahej Support member.',
      icon: <KeyRound size={16} color="#0A3D75" />
    },
    {
      num: '02',
      title: 'Apply & Dual-OTP Verify',
      desc: 'Submit your technical details and complete instant Email + Reference OTP authorization.',
      icon: <FileCheck size={16} color="#F3821D" />
    },
    {
      num: '03',
      title: 'Admin Approval & Workspace',
      desc: 'Once approved by Admin, sign in to your dedicated Developer or QA Tester Workspace.',
      icon: <Rocket size={16} color="#0A3D75" />
    }
  ];

  return (
    <section className="referral-notice-section">
      <div className="container">
        <div className="ref-document-card">
          {/* Header Row */}
          <div className="ref-doc-header">
            <div>
              <div className="badge-featured">
                <Sparkles size={13} className="badge-icon" />
                <span>Verification Policy</span>
              </div>
              <h2 className="ref-doc-title-main">Access is Strictly Referral-Based</h2>
            </div>
            <span className="badge-verified-pill">Protected Network</span>
          </div>

          {/* Body Text (Screenshot 3 typography style) */}
          <p className="ref-doc-body-text">
            <strong>Dahej Support</strong> maintains a trusted, high-standard network of Developers and QA Testers. New applicants cannot directly join without a verified reference. We ensure that every digital project is built and quality-tested by approved professionals — <span className="highlight-orange-text">all through one verified platform.</span>
          </p>

          {/* Highlight Peach Box (Screenshot 3) */}
          <div className="highlight-peach-box">
            ✨ With a combination of <strong>Reference Verification + Structured Project Assignments + Professional Delivery</strong>, Dahej Support ensures reliable project execution for all parties.
          </div>

          {/* 3 Step Visual Cards */}
          <div className="ref-steps-doc-grid">
            {steps.map((step) => (
              <div key={step.num} className="ref-step-doc-card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span className="ref-step-num">{step.num}</span>
                  {step.icon}
                </div>
                <h3 className="ref-step-name">{step.title}</h3>
                <p className="ref-step-desc">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
