import React, { useState } from 'react';
import { ChevronDown, Sparkles } from 'lucide-react';
import './FAQSection.css';

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState(0);

  const faqs = [
    {
      q: 'Who can apply to the Dahej Support Developer & Tester Network?',
      a: 'Access is restricted exclusively to referenced Developers and QA / Software Testers. You must provide a valid referral code or reference name from an existing verified member or authorized Dahej Support team member during application.'
    },
    {
      q: 'How does the QA Tester Program work?',
      a: 'QA Testers receive web projects submitted by Developers into the Testing Queue. Testers execute 14-point functional and responsiveness checklists, test API endpoints, raise detailed bug tickets with repro steps, and either approve the project or request developer revisions.'
    },
    {
      q: 'How does the Dual-OTP referral verification process work?',
      a: 'During application, two separate OTP verifications are performed: first to verify your email address, and second to authorize the referral code with your reference. Once submitted, your application enters the Admin Pending Queue for final approval.'
    },
    {
      q: 'How are projects assigned to Developers and QA Testers?',
      a: 'Projects are structured with predetermined scopes and assigned directly through the platform based on verified skill sets, developer availability, and QA testing schedules. There is no bidding or race-to-the-bottom pricing.'
    },
    {
      q: 'How do I access my Workspace after Admin approval?',
      a: 'Once your application is approved by the Admin, you can sign in via the Portal Login page (selecting Developer or QA Tester track) to access your dashboard, active projects, testing queues, and earnings.'
    }
  ];

  return (
    <section id="faq" className="faq-section">
      <div className="container">
        <div className="section-header-center">
          <div className="badge-featured">
            <Sparkles size={13} className="badge-icon" />
            <span>Got Questions?</span>
          </div>
          <h2 className="heading-section">Frequently Asked Questions</h2>
          <p className="section-subtitle">
            Essential information regarding our referral-based model, workspace access, and project workflow.
          </p>
        </div>

        <div className="faq-container-box">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div key={idx} className={`faq-item-card ${isOpen ? 'open' : ''}`}>
                <button
                  type="button"
                  className="faq-toggle-button"
                  onClick={() => setOpenIndex(isOpen ? -1 : idx)}
                  aria-expanded={isOpen}
                >
                  <span className="faq-q-text">{faq.q}</span>
                  <div className="faq-chevron-icon">
                    <ChevronDown size={14} />
                  </div>
                </button>

                {isOpen && (
                  <div className="faq-a-body">
                    <p style={{ margin: 0 }}>{faq.a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
