export interface DecisionInput {
  decision: string;
  context: string;
  reasoning: string;
  priorities: string;
}

export type StrengthLevel = 'high' | 'medium' | 'low';
export type EpistemicCategory = 'fact' | 'belief' | 'inference' | 'assumption';
export type PerspectiveType = 'future_self' | 'affected_stakeholder' | 'neutral_observer' | 'skeptic';

export interface AssumptionItem {
  title: string;
  description: string;
  whyItMatters: string;
  strength: StrengthLevel;
  untestedPremise?: string;
}

export interface MissingInformationItem {
  title: string;
  description: string;
  whyItMatters: string;
  impact: StrengthLevel;
  howToAcquire?: string;
}

export interface ReasoningConflictItem {
  title: string;
  description: string;
  tensionType: string;
  whyItMatters: string;
  reconciliationPrompt?: string;
}

export interface SecondOrderEffectItem {
  title: string;
  description: string;
  timeline: 'short-term' | 'medium-term' | 'long-term';
  whyItMatters: string;
  potentialDownsideOrOpportunity?: string;
}

export interface TimeHorizonItem {
  title: string;
  description: string;
  biasType: string;
  whyItMatters: string;
  balancingQuestion?: string;
}

export interface PerspectiveShiftItem {
  perspective: PerspectiveType;
  perspectiveLabel: string;
  title: string;
  critique: string;
  keyBlindSpot: string;
}

export interface EvidenceVsBeliefItem {
  statement: string;
  category: EpistemicCategory;
  groundingStatus: string;
  whyItMatters: string;
}

export interface QuestionItem {
  question: string;
  category: string;
  whyItMatters: string;
  suggestedAction?: string;
}

export interface BlindSpotAuditResult {
  summary: string;
  decisionCore: string;
  criticalBlindSpotHighlight: string;
  assumptions: AssumptionItem[];
  missingInformation: MissingInformationItem[];
  reasoningConflicts: ReasoningConflictItem[];
  secondOrderEffects: SecondOrderEffectItem[];
  timeHorizon: TimeHorizonItem[];
  perspectiveShifts: PerspectiveShiftItem[];
  evidenceVsBelief: EvidenceVsBeliefItem[];
  questions: QuestionItem[];
}
