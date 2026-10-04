'use client';

import React, { useEffect, useState } from 'react';
import { Target } from 'lucide-react';

const SCAN_STEPS = [
  'Parsing decision context and explicit claims...',
  'Auditing hidden assumptions & certainty bias...',
  'Detecting contradictions between stated priorities and reasoning...',
  'Surfacing non-linear second-order ripple effects...',
  'Analyzing temporal focus & time-horizon blind spots...',
  'Simulating perspective shifts (future self, stakeholder, skeptic)...',
  'Synthesizing high-value diagnostic probe questions...',
];

export const ScanningLoader: React.FC = () => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStepIndex((prev) => (prev + 1) % SCAN_STEPS.length);
    }, 1200);

    return () => clearInterval(interval);
  }, []);

  const progressPercent = Math.min(95, Math.round(((currentStepIndex + 1) / SCAN_STEPS.length) * 100));

  return (
    <div className="loading-box">
      <div className="scanner-radar-wrapper">
        <div className="radar-ring" />
        <div className="radar-pulse" />
        <Target size={38} className="radar-icon" strokeWidth={2.2} />
      </div>

      <div className="loading-title">Auditing Decision Reasoning</div>
      <div className="loading-step-msg">{SCAN_STEPS[currentStepIndex]}</div>

      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
      </div>

      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
        Evaluating epistemic rigor • Grounding against user claims
      </div>
    </div>
  );
};
