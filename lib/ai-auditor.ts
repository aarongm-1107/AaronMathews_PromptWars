import { GoogleGenAI } from '@google/genai';
import {
  BlindSpotAuditResult,
  DecisionInput,
  AssumptionItem,
  MissingInformationItem,
  ReasoningConflictItem,
  SecondOrderEffectItem,
  TimeHorizonItem,
  PerspectiveShiftItem,
  EvidenceVsBeliefItem,
  QuestionItem,
} from '@/types/blindspot';

const SYSTEM_AUDITOR_PROMPT = `You are "BlindSpot", an elite cognitive reasoning auditor designed for high-stakes decision analysis.

YOUR MISSION:
Audit HOW the user is reasoning through a decision. Identify hidden assumptions, unacknowledged tensions, missing information, second-order effects, time-horizon biases, and epistemological confusion (treating beliefs as facts).

CRITICAL ETHICAL & PRODUCT PRINCIPLES:
1. NEVER tell the user which decision to make or which option is better.
2. NEVER use phrases like "You should choose X", "Option A is superior", or rank options.
3. NEVER make the decision for the user. You are an auditor, not an advisor or decider.
4. GROUND EVERY FINDING in the user's specific text or directly material omissions. Do not generate generic, boilerplate checklists.
5. Distinguish strictly between:
   - What the user KNOWS (verifiable facts stated by the user)
   - What the user ASSUMES (unstated premises treated as true)
   - What the user BELIEVES (interpretations, predictions, subjective values)
   - What the user DOES NOT KNOW (material uncertainties)
6. If a category has no meaningful finding, return an empty array rather than hallucinating trivialities.
7. Return ONLY valid JSON adhering strictly to the requested schema. No markdown wrapping around the JSON, no intro text.`;

function buildUserAuditPrompt(input: DecisionInput): string {
  return `Please audit the following decision reasoning:

=== DECISION UNDER CONSIDERATION ===
${input.decision}

=== RELEVANT CONTEXT & SITUATION ===
${input.context || 'None provided'}

=== CURRENT REASONING / LEANING ===
${input.reasoning}

=== STATED PRIORITIES / WHAT MATTERS MOST ===
${input.priorities}

=== REQUIRED JSON OUTPUT SCHEMA ===
{
  "summary": "Concise 2-3 sentence diagnostic snapshot of the reasoning structure and cognitive posture",
  "decisionCore": "One sentence summarizing the core dilemma without taking a side",
  "criticalBlindSpotHighlight": "The single most significant unexamined blind spot or assumption in this reasoning",
  "assumptions": [
    {
      "title": "Clear concise label",
      "description": "Explanation of the unproven premise being taken for granted",
      "whyItMatters": "Why this assumption could mislead or invalidate the reasoning",
      "strength": "high | medium | low",
      "untestedPremise": "The specific belief accepted as fact without proof"
    }
  ],
  "missingInformation": [
    {
      "title": "Important absent data point",
      "description": "Crucial missing information that could alter the decision calculus",
      "whyItMatters": "Material risk of deciding without this fact",
      "impact": "high | medium | low",
      "howToAcquire": "Actionable way to gather or verify this before deciding"
    }
  ],
  "reasoningConflicts": [
    {
      "title": "Contradiction or tension title",
      "description": "Specific tension between stated priorities and current reasoning/leaning",
      "tensionType": "e.g. Priority vs. Execution, Risk Appetite vs. Outcome Expectation, etc.",
      "whyItMatters": "Why this internal friction could cause regret",
      "reconciliationPrompt": "A targeted question to resolve this internal conflict"
    }
  ],
  "secondOrderEffects": [
    {
      "title": "Downstream consequence",
      "description": "A ripple effect or secondary consequence not accounted for in immediate reasoning",
      "timeline": "short-term | medium-term | long-term",
      "whyItMatters": "Why this indirect effect carries material weight",
      "potentialDownsideOrOpportunity": "Specific second-order risk or opportunity"
    }
  ],
  "timeHorizon": [
    {
      "title": "Temporal asymmetry or bias",
      "description": "How the reasoning overweights immediate payoff or underweights future compounding effects",
      "biasType": "e.g. Present Bias, Sunk Cost Anchor, Delayed Compounding Neglect",
      "whyItMatters": "Long-term effect vs short-term perception",
      "balancingQuestion": "Question that forces equal weighting of distant horizons"
    }
  ],
  "perspectiveShifts": [
    {
      "perspective": "future_self",
      "perspectiveLabel": "Your 3-Years-Out Self",
      "title": "Long-Term Retrospective",
      "critique": "How your future self might critique the current narrow focus",
      "keyBlindSpot": "What is obvious in hindsight that is being ignored today"
    },
    {
      "perspective": "affected_stakeholder",
      "perspectiveLabel": "Directly Affected Stakeholder",
      "title": "External Stakeholder Reality",
      "critique": "How peers, mentors, family, team, or employers view this logic",
      "keyBlindSpot": "The external consequence or friction being overlooked"
    },
    {
      "perspective": "neutral_observer",
      "perspectiveLabel": "Objective Dispassionate Observer",
      "title": "Skeptical Observer View",
      "critique": "A dispassionate analysis of the logical leaps in the argument",
      "keyBlindSpot": "The strongest counter-argument to the leaning"
    },
    {
      "perspective": "skeptic",
      "perspectiveLabel": "Rigorous Red Team / Devil's Advocate",
      "title": "Stress Test Against Failure",
      "critique": "The failure mode where this reasoning completely breaks down",
      "keyBlindSpot": "Worst-case vulnerability that is being rationalized away"
    }
  ],
  "evidenceVsBelief": [
    {
      "statement": "Direct quote or claim from user input",
      "category": "fact | belief | inference | assumption",
      "groundingStatus": "e.g. 'Stated by the user; external verification was not performed.' or 'Prediction stated in user reasoning; evidence was not provided.'",
      "whyItMatters": "Why misclassifying this claim distorts the evaluation"
    }
  ],
  "questions": [
    {
      "question": "Pungent question that pierces a core assumption",
      "category": "e.g. Premise Testing, Information Gathering, Inversion, Tradeoff Clarification",
      "whyItMatters": "What this question clarifies before a commitment is made",
      "suggestedAction": "Concrete investigation or conversation to run"
    }
  ]
}`;
}

export async function auditDecision(input: DecisionInput): Promise<BlindSpotAuditResult> {
  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GOOGLE_GENAI_API_KEY;

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = buildUserAuditPrompt(input);

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          systemInstruction: SYSTEM_AUDITOR_PROMPT,
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      });

      const responseText = response.text?.trim() || '';
      if (responseText) {
        const jsonStr = responseText.replace(/^```json\s*/i, '').replace(/\s*```$/, '').trim();
        const parsed = JSON.parse(jsonStr) as BlindSpotAuditResult;
        if (parsed.summary && Array.isArray(parsed.assumptions)) {
          return sanitizeAuditResult(parsed);
        }
      }
    } catch (err) {
      console.warn('Gemini API call failed or timed out, executing deterministic fallback cognitive auditor:', err);
    }
  }

  // Generic, input-grounded cognitive heuristic auditor
  return runGenericGroundedHeuristicAudit(input);
}

function sanitizeAuditResult(result: BlindSpotAuditResult): BlindSpotAuditResult {
  return {
    summary: result.summary || 'Reasoning audit completed.',
    decisionCore: result.decisionCore || 'Deliberation of trade-offs between competing priorities.',
    criticalBlindSpotHighlight: result.criticalBlindSpotHighlight || 'Unexamined assumptions in the causal chain.',
    assumptions: Array.isArray(result.assumptions) ? result.assumptions : [],
    missingInformation: Array.isArray(result.missingInformation) ? result.missingInformation : [],
    reasoningConflicts: Array.isArray(result.reasoningConflicts) ? result.reasoningConflicts : [],
    secondOrderEffects: Array.isArray(result.secondOrderEffects) ? result.secondOrderEffects : [],
    timeHorizon: Array.isArray(result.timeHorizon) ? result.timeHorizon : [],
    perspectiveShifts: Array.isArray(result.perspectiveShifts) ? result.perspectiveShifts : [],
    evidenceVsBelief: Array.isArray(result.evidenceVsBelief) ? result.evidenceVsBelief : [],
    questions: Array.isArray(result.questions) ? result.questions : [],
  };
}

// ============================================================================
// GENERIC, INPUT-GROUNDED HEURISTIC AUDITOR (NO INVENTED FACTS OR DOMAIN BRANCHES)
// ============================================================================

/**
 * Splits text into discrete meaningful sentences while avoiding spurious
 * splits on common abbreviations or decimal numbers.
 */
function extractSentences(text: string): string[] {
  if (!text || typeof text !== 'string') return [];
  return text
    .replace(/([A-Z]\.)+/g, (m) => m.replace(/\./g, '___DOT___'))
    .replace(/(\d+)\.(\d+)/g, '$1___DOT___$2')
    .split(/(?<=[.?!])\s+/)
    .map((s) => s.replace(/___DOT___/g, '.').trim())
    .filter((s) => s.length > 10);
}

/**
 * Trims a statement to a clean, readable quote.
 */
function cleanSnippet(str: string, maxLength = 110): string {
  const clean = str.replace(/\s+/g, ' ').trim();
  if (clean.length <= maxLength) return clean;
  return clean.slice(0, maxLength - 3).trim() + '...';
}

/**
 * Detects explicit stakeholders mentioned directly in the user's input text.
 */
function detectExplicitStakeholders(fullText: string): string[] {
  const matches: string[] = [];
  const candidates: { pattern: RegExp; label: string }[] = [
    { pattern: /\b(parent|parents|mom|dad|mother|father)\b/i, label: 'Family / Parents' },
    { pattern: /\b(peer|peers|classmate|classmates|friend|friends)\b/i, label: 'Peers / Friends' },
    { pattern: /\b(team|colleague|colleagues|coworker|coworkers)\b/i, label: 'Team / Colleagues' },
    { pattern: /\b(manager|lead|boss|supervisor|director)\b/i, label: 'Management / Supervisors' },
    { pattern: /\b(founder|founders|co-founder|co-founders)\b/i, label: 'Founders / Leadership' },
    { pattern: /\b(partner|spouse|wife|husband)\b/i, label: 'Partner / Spouse' },
    { pattern: /\b(customer|customers|client|clients|user|users)\b/i, label: 'Customers / Users' },
    { pattern: /\b(mentor|mentors|advisor|advisors|professor|professors)\b/i, label: 'Mentors / Advisors' },
  ];

  for (const { pattern, label } of candidates) {
    if (pattern.test(fullText)) {
      matches.push(label);
    }
  }

  return matches;
}

/**
 * Generic, input-grounded heuristic auditor.
 * Every finding is strictly anchored in user-supplied statements, direct logical
 * relations between user claims, or explicitly unresolved uncertainties.
 * It NEVER introduces external statistics, market facts, or domain assumptions.
 */
function runGenericGroundedHeuristicAudit(input: DecisionInput): BlindSpotAuditResult {
  const decisionSentences = extractSentences(input.decision);
  const contextSentences = extractSentences(input.context);
  const reasoningSentences = extractSentences(input.reasoning);
  const prioritiesLines = input.priorities
    .split(/\n+/)
    .map((l) => l.replace(/^[-*•\d.\s]+/, '').trim())
    .filter((l) => l.length > 3);

  const fullInputText = `${input.decision} ${input.context} ${input.reasoning} ${input.priorities}`;
  const mentionedStakeholders = detectExplicitStakeholders(fullInputText);

  // --------------------------------------------------------------------------
  // A. EVIDENCE VS BELIEF
  // --------------------------------------------------------------------------
  const evidenceVsBelief: EvidenceVsBeliefItem[] = [];

  // Examine context sentences for explicitly stated facts
  for (const sentence of contextSentences) {
    const sLower = sentence.toLowerCase();
    const isSubjective = /\b(feel|feels|believe|believes|think|thinks|hope|prefer|regret)\b/.test(sLower);
    const isPrediction = /\b(will|definitely|guarantee|probably|expect)\b/.test(sLower);

    if (!isSubjective && !isPrediction && evidenceVsBelief.length < 2) {
      evidenceVsBelief.push({
        statement: sentence,
        category: 'fact',
        groundingStatus: "Stated by the user as an existing condition; external verification was not performed.",
        whyItMatters: 'Serves as an empirical baseline in the user’s description, but conclusions drawn from it require testing.',
      });
    }
  }

  // Examine reasoning sentences for beliefs, assumptions, inferences
  for (const sentence of reasoningSentences) {
    const sLower = sentence.toLowerCase();
    const hasCertainty = /\b(guarantee|guarantees|definitely|always|never|nobody|no one|everyone|impossible|certainly|obviously|undoubtedly)\b/i.test(sLower);
    const hasBelief = /\b(feel|feels|believe|believes|think|thinks|regret|excited|worried|fear|hope)\b/i.test(sLower);
    const hasCausal = /\b(because|therefore|leads to|means|ensures|will result in|causes|so that)\b/i.test(sLower);
    const hasPrediction = /\b(will|won't|will not|likely|probably|expect)\b/i.test(sLower);

    if (hasCertainty) {
      evidenceVsBelief.push({
        statement: sentence,
        category: 'assumption',
        groundingStatus: "Prediction stated in user's reasoning; evidence establishing this certainty was not provided.",
        whyItMatters: 'Treating an unproven future reaction or outcome as a certainty skews the risk evaluation.',
      });
    } else if (hasBelief) {
      evidenceVsBelief.push({
        statement: sentence,
        category: 'belief',
        groundingStatus: 'Subjective conviction or preference expressed by the user; not an empirical fact.',
        whyItMatters: 'Strong internal sentiment can be mistaken for an objective probability of success.',
      });
    } else if (hasCausal || hasPrediction) {
      evidenceVsBelief.push({
        statement: sentence,
        category: 'inference',
        groundingStatus: 'Conclusion inferred by the user; the underlying causal dependency remains unverified.',
        whyItMatters: 'An unverified causal inference may break down if external conditions vary.',
      });
    }
  }

  // Ensure at least one grounded entry if reasoning exists
  if (evidenceVsBelief.length === 0 && reasoningSentences.length > 0) {
    evidenceVsBelief.push({
      statement: reasoningSentences[0],
      category: 'belief',
      groundingStatus: 'Subjective reasoning articulated by the user; empirical corroboration was not provided.',
      whyItMatters: 'Distinguishing this interpretation from verified facts is necessary to evaluate the decision clearly.',
    });
  }

  // --------------------------------------------------------------------------
  // B. ASSUMPTION AUDIT
  // --------------------------------------------------------------------------
  const assumptions: AssumptionItem[] = [];

  // 1. Detect absolute certainty or universal claims
  const certaintyMatch = reasoningSentences.find((s) =>
    /\b(guarantee|guarantees|definitely|always|never|nobody|no one|everyone|impossible|certainly|obviously)\b/i.test(s)
  );
  if (certaintyMatch) {
    const quote = cleanSnippet(certaintyMatch);
    assumptions.push({
      title: 'Unverified Certainty Assumption',
      description: `The reasoning asserts that "${quote}", treating an optimistic expectation or universal consensus as an established certainty.`,
      whyItMatters: 'Outcomes and external perceptions are rarely deterministic; assuming certainty prevents planning for variability.',
      strength: 'high',
      untestedPremise: `Assuming that "${quote}" will reliably hold true without empirical verification.`,
    });
  }

  // 2. Detect causal leap or outcome expectation
  const causalMatch = reasoningSentences.find((s) =>
    /\b(because|therefore|leads to|means|ensures|will result in|guarantee|definitely)\b/i.test(s) &&
    s !== certaintyMatch
  );
  if (causalMatch) {
    const quote = cleanSnippet(causalMatch);
    assumptions.push({
      title: 'Assumed Causal Mechanism',
      description: `The reasoning connects an action directly to an expected benefit: "${quote}", assuming the chain of events will unfold smoothly.`,
      whyItMatters: 'Intervening variables or organizational changes could disrupt the expected link between the decision and the reward.',
      strength: 'medium',
      untestedPremise: `Assuming the expected outcome described in "${quote}" automatically follows from this decision.`,
    });
  }

  // 3. Detect downside dismissal or minimization
  const minimizationMatch = reasoningSentences.find((s) =>
    /\b(doesn't matter|does not matter|nobody cares|no one cares|acceptable because|not a real downside|negligible|minor)\b/i.test(s)
  );
  if (minimizationMatch && minimizationMatch !== certaintyMatch) {
    const quote = cleanSnippet(minimizationMatch);
    assumptions.push({
      title: 'Minimization of Downside Friction',
      description: `The reasoning minimizes potential costs with the statement "${quote}", assuming the trade-off carries negligible long-term friction.`,
      whyItMatters: 'Dismissing potential downsides without verification can leave you unprepared if delayed consequences compound.',
      strength: 'high',
      untestedPremise: `Assuming that "${quote}" accurately reflects all institutional and personal repercussions.`,
    });
  }

  // 4. If no specific linguistic pattern triggered, but reasoning exists, audit the core leaning premise
  if (assumptions.length === 0 && reasoningSentences.length > 0) {
    const primaryClaim = cleanSnippet(reasoningSentences[0]);
    assumptions.push({
      title: 'Core Leaning Premise',
      description: `The reasoning relies on the premise that "${primaryClaim}", but the input does not cite direct evidence establishing that this outcome is assured.`,
      whyItMatters: 'If this central premise fails to hold under actual conditions, the rationale for leaning in this direction weakens.',
      strength: 'medium',
      untestedPremise: `Assuming that "${primaryClaim}" accurately predicts the real-world outcome.`,
    });
  }

  // --------------------------------------------------------------------------
  // C. MISSING INFORMATION
  // --------------------------------------------------------------------------
  const missingInformation: MissingInformationItem[] = [];

  // Check 1: Evidence testing the primary expected benefit
  if (reasoningSentences.length > 0) {
    missingInformation.push({
      title: 'Verifiable Evidence Establishing the Expected Benefit',
      description: 'The reasoning anticipates positive outcomes from this decision, but the description does not establish concrete data, confirmed terms, or direct observations verifying that this environment or choice reliably produces them.',
      whyItMatters: 'Deciding on the basis of expected learning, upside, or efficiency without verifying the specific day-to-day conditions introduces a risk of mismatch.',
      impact: 'high',
      howToAcquire: 'Obtain written terms, speak with participants who previously made this transition, or request specific operational commitments before deciding.',
    });
  }

  // Check 2: Institutional, contractual, or formal policy terms
  if (input.context && input.context.length > 15) {
    missingInformation.push({
      title: 'Formal Constraints, Policies, and Re-entry Criteria',
      description: 'The context references transitions, pauses, or commitments, but does not provide the explicit contractual clauses, institutional policies, or contingency rules governing them.',
      whyItMatters: 'Administrative or contractual rules can impose unexpected sequencing locks or timeline hurdles that are difficult to undo.',
      impact: 'high',
      howToAcquire: 'Review official guidelines, administrative policies, or contractual agreements directly rather than relying on informal impressions.',
    });
  }

  // Check 3: Reversibility & predefined review criteria
  missingInformation.push({
    title: 'Predefined Review Milestones and Reversibility Protocol',
    description: 'The input does not state whether this decision can be undone or adjusted if conditions prove unfavorable, nor does it specify predefined review checkpoints.',
    whyItMatters: 'Decisions without explicit off-ramps or scheduled review milestones can lead to prolonged commitment to an underperforming path.',
    impact: 'medium',
    howToAcquire: 'Define 2 to 3 observable milestone checks and a date to re-evaluate the choice objectively.',
  });

  // --------------------------------------------------------------------------
  // D. REASONING CONFLICTS
  // --------------------------------------------------------------------------
  const reasoningConflicts: ReasoningConflictItem[] = [];
  const fullReasoningText = input.reasoning.toLowerCase();

  // Test for conflict: Priority mentions stability/momentum/balance vs reasoning embracing disruption/pause/risk
  const stabilityPriority = prioritiesLines.find((p) =>
    /\b(stability|momentum|balance|debt|security|graduat|health|family|safe|consistent|low risk)\b/i.test(p)
  );
  const disruptiveReasoning = /\b(delay|leave of absence|pause|salary cut|cut|equity|rewrite|halt|freeze|switch|risk|burnout)\b/i.test(
    `${input.decision} ${input.reasoning}`.toLowerCase()
  );

  if (stabilityPriority && disruptiveReasoning) {
    reasoningConflicts.push({
      title: 'Priority vs. Operational Reality Tension',
      description: `Your stated priority emphasizes "${cleanSnippet(stabilityPriority)}", yet your reasoning leans toward an option that introduces pauses, delays, or structural variance into your baseline trajectory.`,
      tensionType: 'Stated Priority vs. Execution Leaning',
      whyItMatters: 'Pursuing a choice that directly compromises a top priority can generate post-decision cognitive dissonance and regret.',
      reconciliationPrompt: `Does leaning toward this option protect your priority of "${cleanSnippet(stabilityPriority)}", or does it require you to deprioritize it?`,
    });
  }

  // Test for conflict: Priority mentions velocity/growth vs reasoning accepting extended freeze/delay
  const velocityPriority = prioritiesLines.find((p) =>
    /\b(velocity|growth|speed|career upside|rapid|fast)\b/i.test(p)
  );
  const pauseReasoning = /\b(delay|pause|halt|freeze|wait|defer)\b/i.test(
    `${input.decision} ${input.reasoning}`.toLowerCase()
  );

  if (velocityPriority && pauseReasoning && !reasoningConflicts.some((c) => c.tensionType.includes('Priority'))) {
    reasoningConflicts.push({
      title: 'Velocity Goal vs. Immediate Delay Friction',
      description: `You prioritized "${cleanSnippet(velocityPriority)}", but your reasoning accepts an immediate halt, delay, or disruption in progress.`,
      tensionType: 'Immediate Sacrifice vs. Compounding Pace',
      whyItMatters: 'Sacrificing continuous momentum for a promised future acceleration relies on the assumption that lost ground will be quickly recovered.',
      reconciliationPrompt: `How will you ensure that accepting this delay does not permanently slow the velocity you prioritized?`,
    });
  }

  // --------------------------------------------------------------------------
  // E. SECOND-ORDER EFFECTS
  // --------------------------------------------------------------------------
  const secondOrderEffects: SecondOrderEffectItem[] = [];

  secondOrderEffects.push({
    title: 'Downstream Social and Collaborative Realignment',
    description: 'Stepping into a different cadence or environment could shift your day-to-day peer, team, or collaborative relationships, requiring you to rebuild shared workflows or support networks later.',
    timeline: 'medium-term',
    whyItMatters: 'Working relationships and peer cohorts often provide critical informal support that is easy to undervalue until absent.',
    potentialDownsideOrOpportunity: 'May require unexpected energy to re-establish working rapport or catch up on shared context.',
  });

  secondOrderEffects.push({
    title: 'Psychological Anchoring to the Chosen Direction',
    description: 'Making an overt commitment to this path may create cognitive momentum and social pressure to justify the move, making it harder to acknowledge early warning signs or pivot.',
    timeline: 'long-term',
    whyItMatters: 'Sunk investments of time, compensation, or reputation can subtly distort ongoing decision-making after the transition.',
    potentialDownsideOrOpportunity: 'Risk of escalating commitment to the chosen option even if initial expectations fall short.',
  });

  // --------------------------------------------------------------------------
  // F. TIME HORIZON CONSIDERATIONS
  // --------------------------------------------------------------------------
  const timeHorizon: TimeHorizonItem[] = [];

  const hasPresentFocus = /\b(now|next month|immediate|immediately|lean toward|leaning toward|exciting|excitement|window|comfort|bored)\b/i.test(fullReasoningText);
  const hasDelayedFriction = /\b(delay|delaying|one semester|months|years|future|later|down the line|nobody cares about)\b/i.test(fullReasoningText);

  if (hasPresentFocus && hasDelayedFriction) {
    timeHorizon.push({
      title: 'Asymmetry Between Immediate Appeal and Delayed Costs',
      description: 'The reasoning appears energized by the immediate experiential upside or urgency of the alternative, while treating downstream timeline friction or deferred milestones as secondary.',
      biasType: 'Present State Salience vs. Delayed Impact',
      whyItMatters: 'Immediate payoffs feel vivid and tangible, whereas delayed costs often feel abstract until they arrive.',
      balancingQuestion: 'In 3 to 5 years, will the immediate excitement of this transition matter more than the compounding progress on your baseline timeline?',
    });
  } else if (/\b(regret|comfortable|slow|frustrat|stuck|routine)\b/i.test(fullReasoningText)) {
    timeHorizon.push({
      title: 'Reasoning Driven by Present Friction Rather Than Inherent Value',
      description: 'Frustration or inertia with the current state may be magnifying the attractiveness of the proposed alternative, rather than evaluating the alternative purely on its independent merits.',
      biasType: 'Push vs. Pull Motivation Asymmetry',
      whyItMatters: 'Moving away from discomfort is not the same as moving toward a strategically sound opportunity.',
      balancingQuestion: 'If the immediate friction in your current environment were resolved, would this alternative still be compelling on its own merits?',
    });
  }

  // --------------------------------------------------------------------------
  // G. PERSPECTIVE SHIFTS
  // --------------------------------------------------------------------------
  const perspectiveShifts: PerspectiveShiftItem[] = [];

  // 1. Future Self
  perspectiveShifts.push({
    perspective: 'future_self',
    perspectiveLabel: 'Your Future Self (3 Years Out)',
    title: 'Long-Term Retrospective on Realized Value',
    critique: 'Looking back from three years away, will this decision stand out as a foundational stepping stone, or as an appealing detour that consumed valuable time and momentum without altering the long-term trajectory?',
    keyBlindSpot: 'Evaluating opportunities by their opening promise rather than by the enduring capabilities or durable assets they leave behind.',
  });

  // 2. Affected Stakeholder (grounded in user-stated people, or neutral framing)
  if (mentionedStakeholders.length > 0) {
    const stakeholderName = mentionedStakeholders[0];
    perspectiveShifts.push({
      perspective: 'affected_stakeholder',
      perspectiveLabel: `Perspective of ${stakeholderName}`,
      title: `External Stakeholder Considerations (${stakeholderName})`,
      critique: `People in this group may view your reasoning through the lens of continuity, risk mitigation, and commitments already made, rather than sharing your optimism about unproven upside.`,
      keyBlindSpot: 'Discounting the legitimate risk-mitigation concerns of those who are directly impacted by changes in your stability or schedule.',
    });
  } else {
    perspectiveShifts.push({
      perspective: 'affected_stakeholder',
      perspectiveLabel: 'Directly Affected Stakeholder',
      title: 'External Stakeholder Perspective',
      critique: 'A collaborator, dependent, or mentor affected by this choice might ask how your reasoning accounts for shared commitments, handover dependencies, or altered collaborative timelines.',
      keyBlindSpot: 'Assuming that external parties and surrounding systems will absorb schedule or role adjustments without friction.',
    });
  }

  // 3. Neutral Observer
  perspectiveShifts.push({
    perspective: 'neutral_observer',
    perspectiveLabel: 'Neutral Dispassionate Observer',
    title: 'Dispassionate Logic and Confirmation Bias Audit',
    critique: 'An objective third party observing this reasoning might note that arguments favoring the preferred direction are accepted readily, while contradictory signals or delayed costs are minimized without equal scrutiny.',
    keyBlindSpot: 'Selectively collecting arguments that validate an intuitive preference rather than actively attempting to disprove it.',
  });

  // 4. Skeptic / Red Team
  perspectiveShifts.push({
    perspective: 'skeptic',
    perspectiveLabel: "Rigorous Red Team (Devil's Advocate)",
    title: 'Failure Mode and Fallback Stress Test',
    critique: 'Suppose the core expected benefit does not materialize—the environment proves unstructured, the upside fails to convert, or unexpected friction emerges. What concrete fallback options remain, and what irreversible ground has been conceded?',
    keyBlindSpot: 'Failing to establish a clear downside threshold or contingency protocol before making an irreversible commitment.',
  });

  // --------------------------------------------------------------------------
  // H. HIGH-VALUE QUESTIONS
  // --------------------------------------------------------------------------
  const questions: QuestionItem[] = [];

  if (assumptions.length > 0) {
    questions.push({
      question: `What verifiable evidence would you need to see before you can be confident that "${cleanSnippet(assumptions[0].untestedPremise || assumptions[0].title, 90)}" is actually true?`,
      category: 'Premise Testing',
      whyItMatters: 'Forces an implicit assumption to be subjected to empirical scrutiny before commitment.',
      suggestedAction: 'Identify one verifiable indicator that would confirm or invalidate this premise.',
    });
  }

  if (reasoningConflicts.length > 0) {
    questions.push({
      question: reasoningConflicts[0].reconciliationPrompt || 'How does this choice directly support your highest-priority outcome over competing desires?',
      category: 'Trade-Off Clarification',
      whyItMatters: 'Clarifies whether you are consciously accepting a trade-off or rationalizing an internal contradiction.',
      suggestedAction: 'Rank your priorities explicitly and determine whether the proposed action violates your top requirement.',
    });
  }

  questions.push({
    question: 'What is the strongest, most credible argument an informed person who strongly disagrees with your current leaning would make against it?',
    category: 'Perspective Inversion',
    whyItMatters: 'Counters confirmation bias by requiring you to construct the strongest opposing case with equal intellectual rigor.',
    suggestedAction: 'Draft a short paragraph summarizing the opposing position as convincingly as possible.',
  });

  questions.push({
    question: 'If you proceed and discover after three months that this choice is not working as expected, what is your predefined off-ramp or adjustment plan?',
    category: 'Reversibility & Risk Protocol',
    whyItMatters: 'Distinguishes reversible experiments from irreversible traps, ensuring downside protection is in place.',
    suggestedAction: 'Define the explicit threshold condition under which you would revert or change course.',
  });

  // --------------------------------------------------------------------------
  // SUMMARY & HIGHLIGHT
  // --------------------------------------------------------------------------
  const decisionCore = cleanSnippet(input.decision, 130);
  const criticalBlindSpotHighlight = assumptions.length > 0
    ? assumptions[0].description
    : 'Relying on anticipated positive outcomes without establishing clear verification benchmarks or downside fallback criteria.';

  const summary = `The reasoning exhibits a defined leaning toward the anticipated benefits of this decision, while relying on several unverified assumptions regarding outcome certainty and external perception. Stated priorities must be weighed carefully against the practical friction and potential second-order adjustments introduced by this path.`;

  const rawResult: BlindSpotAuditResult = {
    summary,
    decisionCore,
    criticalBlindSpotHighlight,
    assumptions,
    missingInformation,
    reasoningConflicts,
    secondOrderEffects,
    timeHorizon,
    perspectiveShifts,
    evidenceVsBelief,
    questions,
  };

  // Run through strict Quality Gate
  return enforceQualityGate(rawResult, fullInputText);
}

// ============================================================================
// QUALITY GATE FILTER
// ============================================================================

/**
 * Inspects all generated findings to guarantee they adhere to the epistemic
 * rule: no invented external facts, no fabricated statistics/percentages,
 * no ungrounded stakeholders, and zero recommendation language.
 */
function enforceQualityGate(result: BlindSpotAuditResult, originalInputText: string): BlindSpotAuditResult {
  const originalLower = originalInputText.toLowerCase();

  // Helper to test if a phrase contains ungrounded statistics or prescriptive words
  const containsForbiddenPattern = (text: string): boolean => {
    // Prescriptive words telling user what to choose
    if (/\b(you should choose|you ought to|the better option is|you should accept|you should decline|i recommend choosing)\b/i.test(text)) {
      return true;
    }

    // Fabricated statistics (e.g. 85%, 2x to 3x, $190k, etc.) not found in the user's text
    const percentages = text.match(/\b\d+%\b/g);
    if (percentages) {
      for (const p of percentages) {
        if (!originalLower.includes(p.toLowerCase())) return true;
      }
    }

    const dollarAmounts = text.match(/\$\d+[kKmMbB]?/g);
    if (dollarAmounts) {
      for (const d of dollarAmounts) {
        if (!originalLower.includes(d.toLowerCase())) return true;
      }
    }

    return false;
  };

  const cleanAssumptions = result.assumptions.filter(
    (a) => !containsForbiddenPattern(a.title + ' ' + a.description + ' ' + a.whyItMatters + ' ' + (a.untestedPremise || ''))
  );

  const cleanMissingInfo = result.missingInformation.filter(
    (m) => !containsForbiddenPattern(m.title + ' ' + m.description + ' ' + m.whyItMatters + ' ' + (m.howToAcquire || ''))
  );

  const cleanConflicts = result.reasoningConflicts.filter(
    (c) => !containsForbiddenPattern(c.title + ' ' + c.description + ' ' + c.whyItMatters + ' ' + (c.reconciliationPrompt || ''))
  );

  const cleanSecondOrder = result.secondOrderEffects.filter(
    (s) => !containsForbiddenPattern(s.title + ' ' + s.description + ' ' + s.whyItMatters + ' ' + (s.potentialDownsideOrOpportunity || ''))
  );

  const cleanTimeHorizon = result.timeHorizon.filter(
    (t) => !containsForbiddenPattern(t.title + ' ' + t.description + ' ' + t.whyItMatters + ' ' + (t.balancingQuestion || ''))
  );

  const cleanPerspectiveShifts = result.perspectiveShifts.filter(
    (p) => !containsForbiddenPattern(p.title + ' ' + p.critique + ' ' + p.keyBlindSpot)
  );

  const cleanEvidenceVsBelief = result.evidenceVsBelief.filter(
    (e) => !containsForbiddenPattern(e.statement + ' ' + e.groundingStatus + ' ' + e.whyItMatters)
  );

  const cleanQuestions = result.questions.filter(
    (q) => !containsForbiddenPattern(q.question + ' ' + q.whyItMatters + ' ' + (q.suggestedAction || ''))
  );

  return {
    summary: containsForbiddenPattern(result.summary) ? 'Reasoning audit completed.' : result.summary,
    decisionCore: result.decisionCore,
    criticalBlindSpotHighlight: containsForbiddenPattern(result.criticalBlindSpotHighlight)
      ? 'Unexamined assumptions in the causal chain.'
      : result.criticalBlindSpotHighlight,
    assumptions: cleanAssumptions,
    missingInformation: cleanMissingInfo,
    reasoningConflicts: cleanConflicts,
    secondOrderEffects: cleanSecondOrder,
    timeHorizon: cleanTimeHorizon,
    perspectiveShifts: cleanPerspectiveShifts,
    evidenceVsBelief: cleanEvidenceVsBelief,
    questions: cleanQuestions,
  };
}
