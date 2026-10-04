'use client';

import React, { useState } from 'react';
import { Header } from '@/components/Header';
import { DecisionForm } from '@/components/DecisionForm';
import { ScanningLoader } from '@/components/ScanningLoader';
import { ResultsDashboard } from '@/components/ResultsDashboard';
import { BlindSpotAuditResult, DecisionInput } from '@/types/blindspot';
import { AlertCircle, Target, Sparkles, ShieldAlert } from 'lucide-react';

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<BlindSpotAuditResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRunAudit = async (input: DecisionInput) => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to complete analysis. Please try again.');
      }

      setResult(data.data);
      // Smooth scroll to top of results
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      console.error('Audit execution error:', err);
      setError(err?.message || 'Network error or service unavailable. Please check input and retry.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="app-container">
      <Header onReset={handleReset} hasResults={!!result} />

      <main className="main-wrapper">
        {/* Hero Section */}
        {!result && !isLoading && (
          <section className="hero-banner">
            <div className="hero-pill">
              <span className="hero-pill-dot" />
              <span>Cognitive Reasoning Auditor • PromptWars Hackathon</span>
            </div>

            <h1 className="hero-title">
              See what you&apos;re missing before you decide.
            </h1>

            <p className="hero-subtitle">
              People often decide based on the information most visible to them, overlooking unstated assumptions,
              second-order traps, and conflicts within their own logic.
            </p>

            <div className="principle-banner">
              &ldquo;BlindSpot doesn&apos;t tell you what to choose.{' '}
              <span className="principle-highlight">It audits how you&apos;re choosing.</span>&rdquo;
            </div>
          </section>
        )}

        {/* Error Alert */}
        {error && (
          <div
            style={{
              maxWidth: '800px',
              margin: '0 auto 2rem',
              background: 'rgba(244, 63, 94, 0.12)',
              border: '1px solid rgba(244, 63, 94, 0.35)',
              borderRadius: '12px',
              padding: '1rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              color: '#fda4af',
            }}
          >
            <AlertCircle size={20} color="#f43f5e" style={{ flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Audit Encountered an Issue</div>
              <div style={{ fontSize: '0.85rem' }}>{error}</div>
            </div>
          </div>
        )}

        {/* View 1: Input Form */}
        {!result && !isLoading && (
          <DecisionForm onSubmit={handleRunAudit} isLoading={isLoading} />
        )}

        {/* View 2: Active Scanning Loader */}
        {isLoading && <ScanningLoader />}

        {/* View 3: Complete Results Dashboard */}
        {result && !isLoading && (
          <ResultsDashboard result={result} onReset={handleReset} />
        )}
      </main>

      <footer className="app-footer">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
          <Target size={16} color="#6366f1" />
          <strong style={{ color: '#e2e8f0' }}>BlindSpot</strong>
          <span>— PromptWars Challenge: &quot;The Blind Spot&quot;</span>
        </div>
        <div>
          An impartial cognitive auditor designed to eliminate unexamined assumptions without ever making the choice for you.
        </div>
      </footer>
    </div>
  );
}
