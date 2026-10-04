'use client';

import React, { useState } from 'react';
import { DecisionInput } from '@/types/blindspot';
import { DEMO_SCENARIOS, DemoScenario } from '@/lib/scenarios';
import {
  Compass,
  FileText,
  Scale,
  ListOrdered,
  ScanEye,
  CheckCircle2,
  Sparkles,
  RotateCcw,
} from 'lucide-react';

interface DecisionFormProps {
  onSubmit: (input: DecisionInput) => void;
  isLoading: boolean;
}

export const DecisionForm: React.FC<DecisionFormProps> = ({ onSubmit, isLoading }) => {
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null);

  const [decision, setDecision] = useState('');
  const [context, setContext] = useState('');
  const [reasoning, setReasoning] = useState('');
  const [priorities, setPriorities] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSelectScenario = (scenario: DemoScenario) => {
    setActiveScenarioId(scenario.id);
    setDecision(scenario.data.decision);
    setContext(scenario.data.context);
    setReasoning(scenario.data.reasoning);
    setPriorities(scenario.data.priorities);
    setValidationError(null);
  };

  const handleClear = () => {
    setActiveScenarioId(null);
    setDecision('');
    setContext('');
    setReasoning('');
    setPriorities('');
    setValidationError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!decision.trim() || decision.trim().length < 5) {
      setValidationError('Please specify the decision you are considering.');
      return;
    }

    if (!reasoning.trim() || reasoning.trim().length < 10) {
      setValidationError('Please explain your current reasoning or why you lean one way.');
      return;
    }

    if (!priorities.trim() || priorities.trim().length < 5) {
      setValidationError('Please enter your primary priorities or what matters most.');
      return;
    }

    setValidationError(null);
    onSubmit({
      decision: decision.trim(),
      context: context.trim(),
      reasoning: reasoning.trim(),
      priorities: priorities.trim(),
    });
  };

  return (
    <div className="form-card">
      {/* Demo Scenario Selector */}
      <div className="presets-section">
        <div className="presets-header">
          <div className="presets-title">
            <Sparkles size={15} color="#06b6d4" />
            <span>Try an Example Decision Scenario</span>
          </div>
          {(decision || reasoning) && (
            <button
              type="button"
              className="btn-secondary"
              onClick={handleClear}
              style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
            >
              <RotateCcw size={12} />
              <span>Clear Form</span>
            </button>
          )}
        </div>

        <div className="presets-grid">
          {DEMO_SCENARIOS.map((sc) => {
            const isActive = activeScenarioId === sc.id;
            return (
              <button
                key={sc.id}
                type="button"
                className={`preset-btn ${isActive ? 'active' : ''}`}
                onClick={() => handleSelectScenario(sc)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="preset-meta">{sc.badge}</span>
                  {isActive && <CheckCircle2 size={14} color="#06b6d4" />}
                </div>
                <div className="preset-label">{sc.label}</div>
              </button>
            );
          })}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="form-grid">
        {/* Field 1: Decision */}
        <div className="field-group">
          <div className="field-label-row">
            <label htmlFor="decision" className="field-label">
              <Compass size={17} color="#6366f1" />
              <span>1. Decision Under Consideration</span>
            </label>
            <span className="field-hint">Required • {decision.length} chars</span>
          </div>
          <input required aria-required="true" id="decision"
            type="text"
            className="input-text"
            placeholder="e.g. Whether to accept a 6-month off-cycle startup internship vs graduate on time"
            value={decision}
            onChange={(e) => setDecision(e.target.value)}
            disabled={isLoading}
          />
        </div>

        {/* Field 2: Context */}
        <div className="field-group">
          <div className="field-label-row">
            <label htmlFor="context" className="field-label">
              <FileText size={17} color="#06b6d4" />
              <span>2. Relevant Context &amp; Situation</span>
            </label>
            <span className="field-hint">Background, constraints, stakeholders</span>
          </div>
          <textarea aria-label="Relevant context and situation" id="context"
            className="textarea-input"
            rows={3}
            placeholder="e.g. Third-year student. Received offer from Series B fintech (90 people). Requires 1-semester leave of absence. Parents are cautious, peers encourage taking it."
            value={context}
            onChange={(e) => setContext(e.target.value)}
            disabled={isLoading}
          />
        </div>

        {/* Field 3: Current Reasoning */}
        <div className="field-group">
          <div className="field-label-row">
            <label htmlFor="reasoning" className="field-label">
              <Scale size={17} color="#f59e0b" />
              <span>3. Current Reasoning / Leaning</span>
            </label>
            <span className="field-hint">Required • Why you lean one way</span>
          </div>
          <textarea required aria-required="true" id="reasoning"
            className="textarea-input"
            rows={3}
            placeholder="e.g. I am leaning toward accepting. Hands-on startup experience will guarantee I stand out, and delay doesn't matter because nobody in tech cares about graduation dates."
            value={reasoning}
            onChange={(e) => setReasoning(e.target.value)}
            disabled={isLoading}
          />
        </div>

        {/* Field 4: Priorities */}
        <div className="field-group">
          <div className="field-label-row">
            <label htmlFor="priorities" className="field-label">
              <ListOrdered size={17} color="#10b981" />
              <span>4. Your Stated Priorities</span>
            </label>
            <span className="field-hint">Required • What matters most</span>
          </div>
          <textarea required aria-required="true" id="priorities"
            className="textarea-input"
            rows={3}
            placeholder="e.g. 1. Maximizing future career prospects&#10;2. High quality learning &amp; mentorship&#10;3. Maintaining steady momentum &amp; low debt"
            value={priorities}
            onChange={(e) => setPriorities(e.target.value)}
            disabled={isLoading}
          />
        </div>

        {validationError && (
          <div role="alert" aria-live="assertive" style={{ padding: '0.75rem 1rem',
              borderRadius: '8px',
              background: 'rgba(244, 63, 94, 0.15)',
              border: '1px solid rgba(244, 63, 94, 0.4)',
              color: '#fda4af',
              fontSize: '0.88rem',
            }}
          >
            {validationError}
          </div>
        )}

        <div className="submit-row">
          <div className="submit-guarantee">
            <ShieldAlertIcon />
            <span>BlindSpot audits your cognitive structure—it never picks a choice for you.</span>
          </div>

          <button
            type="submit"
            className="btn-scan"
            disabled={isLoading || !decision.trim() || !reasoning.trim()}
          >
            <ScanEye size={20} />
            <span>{isLoading ? 'Scanning Reasoning...' : 'Run Blind Spot Scan'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

function ShieldAlertIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

