import React from 'react';
import { Laptop, GitMerge, Users, Award, Sparkles, MapPin, CheckCircle2 } from 'lucide-react';
import './Benefits.css';

export default function Benefits({ onNavigate }) {
  const benefits = [
    {
      title: 'Real Projects',
      subtitle: 'VERIFIED OPPORTUNITY',
      tag: 'Website & Digital',
      desc: 'Work on actual website and digital projects delivered for established businesses.',
      meta: 'Direct Client Work',
      icon: <Laptop size={14} />
    },
    {
      title: 'Organized Flow',
      subtitle: 'CLEAR REQUIREMENTS',
      tag: 'Structured Sprints',
      desc: 'Clear project requirements, structured milestones, assignments and delivery tracking.',
      meta: 'Managed Process',
      icon: <GitMerge size={14} />
    },
    {
      title: 'Pro Network',
      subtitle: 'STRUCTURED ECOSYSTEM',
      tag: 'Industry Backed',
      desc: 'Be part of a structured freelancer ecosystem backed by Dahej Support quality standards.',
      meta: 'Verified Community',
      icon: <Users size={14} />
    },
    {
      title: 'Skill Growth',
      subtitle: 'CONTINUOUS VALUE',
      tag: 'Portfolio Growth',
      desc: 'Build hands-on experience and professional reputation through consistent project execution.',
      meta: 'Career Elevation',
      icon: <Award size={14} />
    }
  ];

  return (
    <section id="why-join" className="benefits-section">
      <div className="container">
        <div className="section-header-row">
          <div>
            <div className="badge-featured">
              <Sparkles size={13} className="badge-icon" />
              <span>Platform Advantages</span>
            </div>
            <h2 className="heading-section">Why Work With Dahej Support?</h2>
            <p style={{ color: '#5F6B76', marginTop: '6px', fontSize: '0.98rem' }}>
              A structured ecosystem engineered for Developers and Software QA Testers to deliver quality digital work and earn directly from home.
            </p>
          </div>
        </div>

        <div className="benefits-grid-cards">
          {benefits.map((item, idx) => (
            <div key={idx} className="business-card-item">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="card-top-row">
                  <div className="card-title-group">
                    <span className="card-main-title">{item.title}</span>
                    <span className="card-sub-lead">{item.subtitle}</span>
                  </div>
                  <span className="badge-verified-pill">Verified</span>
                </div>

                <div className="card-tags-row">
                  <span className="tag-blue-category">
                    {item.icon}
                    <span>{item.tag}</span>
                  </span>
                </div>

                <p className="card-description-text">{item.desc}</p>
              </div>

              <div>
                <div className="card-location-meta" style={{ marginBottom: '14px' }}>
                  <MapPin size={13} />
                  <span>{item.meta}</span>
                </div>

                <div className="card-actions-footer">
                  <button
                    type="button"
                    onClick={() => onNavigate && onNavigate('apply')}
                    className="btn btn-navy-action"
                    style={{ width: '100%' }}
                  >
                    <CheckCircle2 size={13} />
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
      </div>
    </section>
  );
}
