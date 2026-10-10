import React from 'react';

export default function Logo({ variant = 'default', size = 'normal', showSubtitle = false }) {
  const isLight = variant === 'light';
  const isLarge = size === 'large';
  const isCompact = size === 'compact';

  const iconHeight = isLarge ? 38 : isCompact ? 26 : 30;
  const wordmarkHeight = isLarge ? 26 : isCompact ? 17 : 20;

  return (
    <div className={`brand-logo-root ${isLarge ? 'brand-logo-large' : ''} ${isLight ? 'brand-logo-light' : ''}`}>
      {/* Official Emblem Icon */}
      <img
        src="/assets/logo-icon.png"
        alt="Dahej Support Icon"
        className="brand-icon-img"
        style={{ height: `${iconHeight}px`, width: 'auto' }}
      />

      {/* Wordmark */}
      <div className="brand-text-stack">
        <div className="brand-wordmark-container">
          {isLight ? (
            /* On dark footer: Crisp DAHEJ (White) + SUPPORT (Orange) with swoosh */
            <div className="brand-text-fallback light-mode-text">
              <span className="brand-name-dahej">DAHEJ </span>
              <span className="brand-name-support">
                SUPPORT
                <span className="brand-swoosh-underline" />
              </span>
            </div>
          ) : (
            /* On light navbar/cards: Official High-Res Wordmark Image */
            <img
              src="/assets/logo-wordmark.png"
              alt="Dahej Support"
              className="brand-wordmark-img"
              style={{ height: `${wordmarkHeight}px`, width: 'auto' }}
            />
          )}
        </div>

        {showSubtitle && (
          <span className={`brand-subtitle-badge ${isLight ? 'sub-light' : 'sub-navy'}`}>
            Freelancer Network
          </span>
        )}
      </div>

      <style>{`
        .brand-logo-root {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          user-select: none;
          text-decoration: none;
          transition: transform 0.15s ease;
        }

        .brand-logo-root:hover {
          transform: translateY(-1px);
        }

        .brand-icon-img {
          object-fit: contain;
          flex-shrink: 0;
          border-radius: 50%;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.08));
        }

        .brand-text-stack {
          display: flex;
          flex-direction: column;
          justify-content: center;
          line-height: 1;
        }

        .brand-wordmark-container {
          display: flex;
          align-items: center;
        }

        .brand-wordmark-img {
          object-fit: contain;
          display: block;
          max-width: 100%;
        }

        .brand-text-fallback {
          font-weight: 900;
          font-size: ${isLarge ? '1.35rem' : '1.15rem'};
          letter-spacing: 0.02em;
          display: flex;
          align-items: center;
          text-transform: uppercase;
        }

        .brand-text-fallback.light-mode-text .brand-name-dahej {
          color: #FFFFFF;
        }

        .brand-text-fallback .brand-name-support {
          color: #F3821D;
          position: relative;
        }

        .brand-swoosh-underline {
          position: absolute;
          bottom: -4px;
          left: 0;
          right: -6px;
          height: 3px;
          background: linear-gradient(90deg, #F3821D 0%, rgba(243, 130, 29, 0) 100%);
          border-radius: 2px;
        }

        .brand-subtitle-badge {
          font-size: 0.65rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-top: 2px;
        }

        .sub-navy {
          color: #5F6B76;
        }

        .sub-light {
          color: #B2CCE5;
        }
      `}</style>
    </div>
  );
}
