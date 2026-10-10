import React from 'react';
import { Globe, Mail, Phone, ExternalLink } from 'lucide-react';
import Logo from './Logo';
import './Footer.css';

export default function Footer({ onNavigate }) {
  const handleScrollTo = (sectionId) => {
    onNavigate('home', sectionId);
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else if (sectionId === 'hero') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <footer className="footer">
      <div className="container">
        {/* Exact Dark Contact Ribbon from Screenshot 3 */}
        <div className="footer-contact-ribbon">
          <div className="ribbon-contact-item">
            <Globe size={16} color="#F3821D" />
            <a href="https://www.dahejsupport.com" target="_blank" rel="noopener noreferrer">
              www.dahejsupport.com
            </a>
          </div>

          <div className="ribbon-contact-item">
            <Mail size={16} color="#F3821D" />
            <a href="mailto:info@dahejsupport.com">
              info@dahejsupport.com
            </a>
          </div>

          <div className="ribbon-contact-item">
            <Phone size={16} color="#F3821D" />
            <a href="tel:+919601574966">
              +91 96015 74966
            </a>
          </div>
        </div>

        {/* Footer Columns */}
        <div className="footer-main-grid">
          {/* Brand Col */}
          <div className="footer-col-brand">
            <Logo variant="light" size="large" />
            <p className="footer-tagline-text">
              A structured ecosystem for building and quality testing digital projects through trusted Developers & QA Testers.
            </p>
          </div>

          {/* Platform Links */}
          <div>
            <h4 className="footer-col-heading">Platform</h4>
            <ul className="footer-nav-list">
              <li>
                <button
                  type="button"
                  onClick={() => handleScrollTo('hero')}
                  className="footer-nav-link"
                >
                  Home
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleScrollTo('faq')}
                  className="footer-nav-link"
                >
                  FAQ
                </button>
              </li>
            </ul>
          </div>

          {/* Freelancers & Testers Links */}
          <div>
            <h4 className="footer-col-heading">Network Access</h4>
            <ul className="footer-nav-list">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('login')}
                  className="footer-nav-link"
                >
                  Developer & QA Login
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('apply-developer')}
                  className="footer-nav-link"
                >
                  Apply as Developer
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('apply-tester')}
                  className="footer-nav-link"
                >
                  Apply as QA Tester
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('admin/dashboard')}
                  className="footer-nav-link"
                  style={{ color: '#F3821D' }}
                >
                  Admin Console
                </button>
              </li>
            </ul>
          </div>

          {/* Company Link */}
          <div>
            <h4 className="footer-col-heading">Company</h4>
            <ul className="footer-nav-list">
              <li>
                <a
                  href="https://www.dahejsupport.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer-nav-link"
                >
                  <span>Visit Dahej Support</span>
                  <ExternalLink size={13} />
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="footer-bottom-bar">
          <p>© 2026 Dahej Support. All rights reserved.</p>
          <span style={{ fontSize: '0.8rem', color: '#6A8CA7' }}>
            Verified Freelancer Network Infrastructure
          </span>
        </div>
      </div>
    </footer>
  );
}
