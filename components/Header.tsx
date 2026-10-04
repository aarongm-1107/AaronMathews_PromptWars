'use client';

import React from 'react';
import { Target, ShieldAlert, Sparkles } from 'lucide-react';

interface HeaderProps {
  onReset?: () => void;
  hasResults?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onReset, hasResults }) => {
  return (
    <header className="header">
      <div className="header-inner">
        <div className="logo-badge" onClick={onReset} role="button" tabIndex={0}>
          <div className="logo-icon-wrapper">
            <Target size={22} color="#ffffff" strokeWidth={2.5} />
          </div>
          <div>
            <div className="brand-name">BlindSpot</div>
            <div className="brand-tagline">See what you&apos;re missing.</div>
          </div>
        </div>

        <div className="header-actions">
          <div className="badge-tag">
            <Sparkles size={13} />
            <span>Reasoning Auditor</span>
          </div>

          <div className="badge-tag" style={{ background: 'rgba(244, 63, 94, 0.1)', borderColor: 'rgba(244, 63, 94, 0.25)', color: '#fda4af' }}>
            <ShieldAlert size={13} />
            <span>Never decides for you</span>
          </div>
        </div>
      </div>
    </header>
  );
};
