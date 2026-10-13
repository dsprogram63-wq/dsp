import React, { useState } from 'react';
import { ExternalLink, Lock, Menu, X, ArrowRight } from 'lucide-react';
import Logo from './Logo';
import './Navbar.css';

export default function Navbar({ onNavigate, currentPage = 'home' }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('home');

  const handleNavClick = (e, sectionId) => {
    e.preventDefault();
    setActiveTab(sectionId);
    setIsMobileMenuOpen(false);
    if (currentPage !== 'home') {
      onNavigate('home', sectionId);
    } else {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      } else if (sectionId === 'hero' || sectionId === 'home') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  return (
    <header className="navbar-wrapper">
      {/* Top Navbar */}
      <div className="navbar-main">
        <div className="container">
          <div className="navbar-inner">
            {/* Logo */}
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                setActiveTab('home');
                onNavigate('home');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="navbar-brand-link"
              aria-label="Dahej Support Freelancer Network"
            >
              <Logo />
            </a>

            {/* Navigation Pills */}
            <nav aria-label="Main Navigation">
              <ul className="navbar-nav">
                <li>
                  <button
                    type="button"
                    onClick={(e) => handleNavClick(e, 'home')}
                    className={`nav-link-btn ${activeTab === 'home' && currentPage === 'home' ? 'active' : ''}`}
                  >
                    Home
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={(e) => handleNavClick(e, 'how-it-works')}
                    className={`nav-link-btn ${activeTab === 'how-it-works' ? 'active' : ''}`}
                  >
                    How It Works
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={(e) => handleNavClick(e, 'workspace')}
                    className={`nav-link-btn ${activeTab === 'workspace' ? 'active' : ''}`}
                  >
                    Workspace
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={(e) => handleNavClick(e, 'faq')}
                    className={`nav-link-btn ${activeTab === 'faq' ? 'active' : ''}`}
                  >
                    FAQ
                  </button>
                </li>
              </ul>
            </nav>

            {/* Actions */}
            <div className="navbar-actions">
              <button
                onClick={() => onNavigate('admin/dashboard')}
                className="btn-visit-link"
                type="button"
                style={{ cursor: 'pointer', background: 'transparent' }}
                title="Open Admin Operations Console"
              >
                <span>Admin Console</span>
              </button>

              <button
                onClick={() => onNavigate('login')}
                className="btn-nav-orange"
                type="button"
              >
                <Lock size={14} />
                <span>Portal Login</span>
              </button>
            </div>

            {/* Mobile Menu Toggle */}
            <button
              type="button"
              className="mobile-menu-btn"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Notification Strip Ribbon */}
      <div className="navbar-notification-bar">
        <div className="container">
          <div className="notification-bar-inner">
            <span className="badge-new-notice">✨ NOTICE</span>
            <span className="notification-text">
              Dahej Support Freelancer Network • Access is <strong>Restricted to Referenced Developers & QA Testers</strong>
            </span>
            <button
              type="button"
              onClick={() => onNavigate('apply')}
              className="btn-ribbon-cta"
            >
              <span>Apply with Referral</span>
              <ArrowRight size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      <div className={`mobile-drawer ${isMobileMenuOpen ? 'open' : ''}`}>
        <ul className="mobile-drawer-links">
          <li>
            <button
              type="button"
              onClick={(e) => handleNavClick(e, 'home')}
              className="nav-link-btn"
            >
              Home
            </button>
          </li>
          <li>
            <button
              type="button"
              onClick={(e) => handleNavClick(e, 'how-it-works')}
              className="nav-link-btn"
            >
              How It Works
            </button>
          </li>
          <li>
            <button
              type="button"
              onClick={(e) => handleNavClick(e, 'workspace')}
              className="nav-link-btn"
            >
              Workspace
            </button>
          </li>
          <li>
            <button
              type="button"
              onClick={(e) => handleNavClick(e, 'faq')}
              className="nav-link-btn"
            >
              FAQ
            </button>
          </li>
        </ul>

        <div className="mobile-drawer-actions">
          <button
            onClick={() => {
              setIsMobileMenuOpen(false);
              onNavigate('login');
            }}
            className="btn btn-orange-primary"
            type="button"
          >
            <Lock size={15} />
            <span>Freelancer Login</span>
          </button>

          <button
            onClick={() => {
              setIsMobileMenuOpen(false);
              onNavigate('apply');
            }}
            className="btn btn-navy-action"
            type="button"
          >
            <span>Apply with Referral</span>
          </button>

          <a
            href="https://www.dahejsupport.com"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-visit-link"
          >
            <span>Visit Dahej Support</span>
            <ExternalLink size={14} />
          </a>
        </div>
      </div>
    </header>
  );
}
