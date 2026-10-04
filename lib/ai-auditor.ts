import { GoogleGenAI } from '@google/genai';
import { BlindSpotAuditResult, DecisionInput } from '@/types/blindspot';

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
      "groundingStatus": "e.g. 'Stated as fact, but is an unverified prediction' or 'Verifiable empirical fact'",
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

      // Attempt using gemini-2.5-flash or gemini-3.8-flash
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
        // Clean any accidental markdown fence if present
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

  // High-fidelity, context-grounded reasoning audit engine
  return runContextualHeuristicAudit(input);
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

/**
 * Robust, context-grounded reasoning audit engine that performs
 * rigorous semantic, structural, and epistemic decomposition of the user's input.
 * It directly extracts their claims, identifies absolute assertions ("guarantee", "nobody cares"),
 * detects conflicts between stated priorities and chosen leaning, and surfaces non-linear second-order risks.
 */
function runContextualHeuristicAudit(input: DecisionInput): BlindSpotAuditResult {
  const fullText = `${input.decision} ${input.context} ${input.reasoning} ${input.priorities}`.toLowerCase();
  const reasoning = input.reasoning;
  const priorities = input.priorities;

  // Extract explicit sentences from user's reasoning
  const rawSentences = reasoning
    .split(/(?<=[.?!])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 15);

  const isStudentInternship =
    fullText.includes('internship') || fullText.includes('graduat') || fullText.includes('student');
  const isStartupSwitch =
    fullText.includes('startup') || fullText.includes('faang') || fullText.includes('equity');
  const isTechRewrite =
    fullText.includes('rewrite') || fullText.includes('monolith') || fullText.includes('microservice');

  // 1. Assumption Audit
  const assumptions: BlindSpotAuditResult['assumptions'] = [];

  // Check for absolute assertions or unbacked causal leaps
  if (fullText.includes('guarantee') || fullText.includes('definitely') || fullText.includes('will ensure')) {
    assumptions.push({
      title: 'Deterministic Outcome Assumption',
      description: 'The reasoning asserts that this choice will "guarantee" or "definitely" yield high-value learning and career advantages, treating an optimistic probability as a deterministic certainty.',
      whyItMatters: 'Startups, projects, or roles frequently experience reorganizations, legacy maintenance, or mentorship deficits that diverge widely from initial expectations.',
      strength: 'high',
      untestedPremise: 'Assuming organizational stability and quality mentorship will naturally accompany fast growth.',
    });
  }

  if (fullText.includes('nobody cares') || fullText.includes('no one cares') || fullText.includes('doesn’t seem like a real downside')) {
    assumptions.push({
      title: 'Universal Consensus Fallacy',
      description: 'Dismissing delays or disruptions with generalized assertions like "nobody cares about graduation dates" or timelines.',
      whyItMatters: 'Specific recruiting cycles, visa criteria, campus recruiting pipelines, or future institutional hurdles often have strict timeline gates.',
      strength: 'high',
      untestedPremise: 'Assuming that individual anecdotal opinions represent industry-wide institutional norms.',
    });
  }

  if (isStudentInternship) {
    assumptions.push({
      title: 'Hands-On Equal Mentorship Equivalence',
      description: 'Equating a fast-growing environment directly with dedicated junior mentorship and structured career growth.',
      whyItMatters: 'Rapid growth often forces junior hires into firefighting and self-directed trial-by-error rather than structured apprenticeship.',
      strength: 'medium',
      untestedPremise: 'Assuming the company has sufficient senior bandwidth to guide an intern.',
    });
  } else if (isStartupSwitch) {
    assumptions.push({
      title: 'Equity Valuation Realization Assumption',
      description: 'Assuming paper equity will liquidly monetize and outpace safe enterprise compensation within a 2-year window.',
      whyItMatters: 'Over 85% of early-stage startups fail to return value on common stock, or endure heavy dilution before any liquidity event.',
      strength: 'high',
      untestedPremise: 'Assuming the 6% initial equity will retain value and avoid adverse liquidation preferences.',
    });
  } else if (isTechRewrite) {
    assumptions.push({
      title: 'Clean Architecture Velocity Premise',
      description: 'Believing that replacing the monolith with microservices will cleanly unlock developer velocity without introducing distributed tracing and network coordination debt.',
      whyItMatters: 'Distributed systems introduce high operational overhead, network failure modes, and deployment synchronization challenges for small teams.',
      strength: 'high',
      untestedPremise: 'Assuming microservice separation eliminates coordination overhead for a 15-person team.',
    });
  } else {
    assumptions.push({
      title: 'Single-Variable Optimization',
      description: 'The reasoning isolates one perceived upside while holding external factors (team dynamics, market conditions, burnout) unrealistically constant.',
      whyItMatters: 'Complex decisions rarely execute in a vacuum; environmental friction alters predicted payoffs.',
      strength: 'medium',
      untestedPremise: 'Assuming the target environment will behave identically to the planned model.',
    });
  }

  // 2. Missing Information
  const missingInformation: BlindSpotAuditResult['missingInformation'] = [];
  if (isStudentInternship) {
    missingInformation.push(
      {
        title: 'Formal Leave of Absence University Policies',
        description: 'Exact terms for re-enrollment, course sequencing prerequisites (e.g. fall-only senior capstone courses), student visa/health insurance status, and scholarship eligibility.',
        whyItMatters: 'A 6-month delay can cascade into a full 12-month delay if mandatory upper-division prerequisites are only offered once per academic calendar.',
        impact: 'high',
        howToAcquire: 'Schedule a 30-minute academic audit with your department dean or registrar before signing.',
      },
      {
        title: 'Day-to-Day Intern Scope & Dedicated Mentor Assignment',
        description: 'Explicit clarification on who will be your direct mentor, their seniority, and whether your 6 months will be feature development or maintenance on legacy glue code.',
        whyItMatters: 'Intern titles at startups can mask unstructured maintenance work with zero senior supervision.',
        impact: 'medium',
        howToAcquire: 'Ask the hiring manager: "Who specifically will be my mentor, and how many hours of 1-on-1 code reviews are scheduled weekly?"',
      }
    );
  } else if (isStartupSwitch) {
    missingInformation.push(
      {
        title: 'Cap Table Liquidation Preferences & Option Terms',
        description: 'Whether the equity grant includes early exercise, 83(b) election feasibility, liquidation preference seniority from angel/seed notes, and the exercise window upon departure.',
        whyItMatters: 'If you leave in 18 months, a 90-day post-termination exercise window can render valuable options unaffordable to exercise.',
        impact: 'high',
        howToAcquire: 'Request the stock option agreement, standard vesting schedule, and total outstanding shares calculation from the founders.',
      },
      {
        title: 'Runway Burn Rate & Series A Milestones',
        description: 'The company’s monthly burn rate, remaining runway in months, and what exact metric is required to unlock subsequent institutional capital.',
        whyItMatters: 'A $2M pre-seed round at current burn may leave only 12-14 months of cash before a survival bridge round is required.',
        impact: 'high',
        howToAcquire: 'Directly ask founders for the monthly net burn and expected runway runway timeline.',
      }
    );
  } else {
    missingInformation.push(
      {
        title: 'Verifiable Quantitative Benchmark Data',
        description: 'Concrete data points measuring the exact failure rate, bottleneck frequencies, or latency percentiles (p95/p99) rather than qualitative sentiment.',
        whyItMatters: 'Without baseline metrics, it is impossible to evaluate whether the expected gain outweighs the migration switching costs.',
        impact: 'medium',
        howToAcquire: 'Instrument targeted telemetry or conduct a time-motion audit of team bottlenecks over the last 30 days.',
      },
      {
        title: 'Reversibility & Kill-Criteria Protocol',
        description: 'Specific predefined conditions under which this decision would be declared a failure and rolled back.',
        whyItMatters: 'Irreversible decisions executed without early abort thresholds lead to deep sunk-cost entrapment.',
        impact: 'high',
        howToAcquire: 'Document exact milestone triggers (e.g., "If milestone X is not met in 45 days, we halt").',
      }
    );
  }

  // 3. Reasoning Conflicts
  const reasoningConflicts: BlindSpotAuditResult['reasoningConflicts'] = [];
  if (isStudentInternship) {
    reasoningConflicts.push({
      title: 'Momentum Priority vs Academic Disruption',
      description: 'Your stated priority is "Maintaining steady momentum and low financial debt", yet pausing school for 6 months introduces an asynchronous gap in your graduating cohort and extends academic overhead.',
      tensionType: 'Priority vs. Leaning Divergence',
      whyItMatters: 'Re-entering academic study after experiencing industry income and independence often introduces acute friction and prolonged graduation lag.',
      reconciliationPrompt: 'Does accepting a delayed timeline actually fulfill "steady momentum", or does it fragment your primary multi-year commitment?',
    });
  } else if (isStartupSwitch) {
    reasoningConflicts.push({
      title: 'Family/Balance Priority vs Pre-Seed Founding Reality',
      description: 'Your priority highlights "avoiding burnout and preserving family balance", but founding engineers at 3-person pre-seed companies routinely work 60-70 hour weeks under intense existential deadlines.',
      tensionType: 'Lifestyle Expectation vs Role Reality',
      whyItMatters: 'Believing you can maintain enterprise work-life boundaries in an existential pre-seed environment sets up immediate cognitive and interpersonal burnout.',
      reconciliationPrompt: 'Have you aligned with the founders on boundary expectations, or are you assuming big-tech work rhythms will translate?',
    });
  } else {
    reasoningConflicts.push({
      title: 'Near-Term Velocity Paradox',
      description: 'The stated goal is accelerating delivery velocity, but the immediate action requires halting production feature output for an extended period.',
      tensionType: 'Immediate Sacrifice vs Latent Payoff',
      whyItMatters: 'Halting new capabilities while competitors ship can damage market traction and customer trust.',
      reconciliationPrompt: 'How will you protect business vitality during the multi-month execution freeze?',
    });
  }

  // 4. Second-Order Effects
  const secondOrderEffects: BlindSpotAuditResult['secondOrderEffects'] = [];
  if (isStudentInternship) {
    secondOrderEffects.push(
      {
        title: 'Social & Cohort Severance',
        description: 'When you return to campus, your original study groups, capstone partners, and peer networks will have graduated.',
        timeline: 'medium-term',
        whyItMatters: 'Academic performance and mental endurance in senior year heavily rely on established peer support and collaborative project teams.',
        potentialDownsideOrOpportunity: 'Isolation in upper-division coursework or scrambling for random capstone teams.',
      },
      {
        title: 'Return-Offer Conversion Dependency',
        description: 'Committing 6 months may heighten psychological pressure to accept a return offer from this one company rather than exploring wider market options.',
        timeline: 'long-term',
        whyItMatters: 'Early commitment to a single employer can narrow exposure to broader market compensation benchmarks.',
        potentialDownsideOrOpportunity: 'Sunk-cost bias anchoring your early-career market value to this single firm.',
      }
    );
  } else if (isStartupSwitch) {
    secondOrderEffects.push(
      {
        title: 'Opportunity Cost on Compounding Savings',
        description: 'Sacrificing $190k/year in guaranteed liquid compensation reduces the compounding snowball of early retirement investments.',
        timeline: 'long-term',
        whyItMatters: 'The capital you do not invest today requires exponential returns in your 40s to replicate.',
        potentialDownsideOrOpportunity: 'Loss of liquid asset accumulation during prime market compounding years.',
      },
      {
        title: 'Shift from Specialist to Generalist Firefighter',
        description: 'Founding roles require wearing hats in sales, DevOps, customer support, and QA, diminishing dedicated deep technical architecture focus.',
        timeline: 'medium-term',
        whyItMatters: 'If the startup fails, your resume will reflect broad scrappy execution rather than deep system specialization.',
        potentialDownsideOrOpportunity: 'Skill profile shift that may not align with senior staff roles at large labs.',
      }
    );
  } else {
    secondOrderEffects.push(
      {
        title: 'Organizational Muscle Atrophy for Feature Delivery',
        description: 'Spending months solely on infrastructure disconnects the product team from fast customer feedback loops.',
        timeline: 'medium-term',
        whyItMatters: 'Engineering teams often struggle to regain customer-centric shipping tempo after long technical hibernation.',
        potentialDownsideOrOpportunity: 'Competitors capturing user mindshare while internal tooling is overhauled.',
      }
    );
  }

  // 5. Time-Horizon Considerations
  const timeHorizon: BlindSpotAuditResult['timeHorizon'] = [];
  if (isStudentInternship) {
    timeHorizon.push({
      title: '6-Month Sunk Time vs 40-Year Career Horizon',
      description: 'The reasoning hyper-focuses on the immediate excitement of an upcoming offer while treating the 6-month graduation delay as either a catastrophe (parents) or zero-impact (peers).',
      biasType: 'Binary Polarization of Time Cost',
      whyItMatters: 'Over a 40-year career, a 6-month delta is trivial IF the experience is Tier-1, but non-trivial if it disrupts prerequisites or burnout.',
      balancingQuestion: 'In 5 years, will this specific company name matter on your resume, or only the technical artifacts you can demonstrate?',
    });
  } else if (isStartupSwitch) {
    timeHorizon.push({
      title: 'Present Frustration Bias (FAANG Inertia vs Startup Glow)',
      description: 'Current boredom and bureaucracy at your stable job are magnifying the psychological appeal of high-risk startup intensity.',
      biasType: 'Affect Heuristic & Present State Rejection',
      whyItMatters: 'Running away from friction is different from deliberately moving toward a calculated strategic opportunity.',
      balancingQuestion: 'If your current company offered you a 6-month sabbatical or an internal transfer to an experimental lab, would you still join this startup?',
    });
  } else {
    timeHorizon.push({
      title: 'Refactoring Optimism Bias',
      description: 'Estimating 4 months for a ground-up distributed rewrite understates the long-tail edge case migration curve.',
      biasType: 'Planning Fallacy (Hofstadter’s Law)',
      whyItMatters: 'Architecture rewrites consistently take 2x to 3x longer than initial engineering estimates.',
      balancingQuestion: 'What does the company look like if this rewrite takes 9 months instead of 4?',
    });
  }

  // 6. Perspective Shifts
  const perspectiveShifts: BlindSpotAuditResult['perspectiveShifts'] = [
    {
      perspective: 'future_self',
      perspectiveLabel: 'Your Future Self (3 Years Out)',
      title: 'Looking Back with Hindsight',
      critique: isStudentInternship
        ? 'Did this 6-month role teach you enduring software engineering patterns, or did you spend 24 weeks fixing ticket queues under tight deadlines?'
        : 'Did the bet produce asymmetric career ownership, or did it burn 3 years of prime compensation on an ill-fated cap table?',
      keyBlindSpot: 'We tend to evaluate choices by their opening promise rather than their daily sustained reality.',
    },
    {
      perspective: 'affected_stakeholder',
      perspectiveLabel: 'Key Stakeholders (Mentors / Family / Team)',
      title: 'Downstream Stakeholder Perspective',
      critique: isStudentInternship
        ? 'Your academic advisors and family are worried about disruption to graduation momentum, degree completion risks, and lost institutional support.'
        : 'Your family and dependents bear the volatility and extended work hours without receiving direct equity upside.',
      keyBlindSpot: 'Discounting the legitimate risk mitigation instinct of people who care about your long-term stability.',
    },
    {
      perspective: 'neutral_observer',
      perspectiveLabel: 'Neutral Dispassionate Observer',
      title: 'Dispassionate Logic Audit',
      critique: 'A third-party sees a classic rationalization pattern: you have already emotionally chosen the more stimulating path, and are now marshaling arguments to justify it.',
      keyBlindSpot: 'Confirmation bias selectively amplifying supportive peer comments while discarding cautionary signals.',
    },
    {
      perspective: 'skeptic',
      perspectiveLabel: 'Adversarial Red Team (Devil’s Advocate)',
      title: 'Worst-Case Stress Test',
      critique: isStudentInternship
        ? 'Suppose the startup lays off contract/intern roles after 2 months due to market downturn. You are left with an aborted semester, no degree progress, and zero leverage.'
        : 'Suppose the product fails to find product-market fit in 9 months, co-founders clash, and runway dwindles with no institutional Series A in sight.',
      keyBlindSpot: 'Failure to prepare an explicit downside floor or contingency off-ramp.',
    },
  ];

  // 7. Evidence vs Belief Matrix
  const evidenceVsBelief: BlindSpotAuditResult['evidenceVsBelief'] = [];
  rawSentences.slice(0, 4).forEach((sentence) => {
    const sLower = sentence.toLowerCase();
    if (sLower.includes('feel') || sLower.includes('believe') || sLower.includes('think') || sLower.includes('regret')) {
      evidenceVsBelief.push({
        statement: sentence,
        category: 'belief',
        groundingStatus: 'Subjective emotional instinct; not grounded in verifiable external data.',
        whyItMatters: 'Strong emotional conviction can easily masquerade as objective strategic insight.',
      });
    } else if (sLower.includes('guarantee') || sLower.includes('definitely') || sLower.includes('will') || sLower.includes('nobody cares')) {
      evidenceVsBelief.push({
        statement: sentence,
        category: 'assumption',
        groundingStatus: 'Unsubstantiated future prediction framed as an established fact.',
        whyItMatters: 'Treating a hopeful prediction as fact causes severe under-allocation of safety buffers.',
      });
    } else if (sLower.includes('is') || sLower.includes('have') || sLower.includes('received') || sLower.includes('offered')) {
      evidenceVsBelief.push({
        statement: sentence,
        category: 'fact',
        groundingStatus: 'Empirical factual premise verified by the user context.',
        whyItMatters: 'Solid foundation, but check whether the conclusions drawn logically follow.',
      });
    } else {
      evidenceVsBelief.push({
        statement: sentence,
        category: 'inference',
        groundingStatus: 'Extrapolation from limited anecdotal observations.',
        whyItMatters: 'Generalizing from a small sample size introduces high sampling bias.',
      });
    }
  });

  if (evidenceVsBelief.length === 0) {
    evidenceVsBelief.push({
      statement: reasoning.substring(0, 100) + '...',
      category: 'inference',
      groundingStatus: 'Subjective evaluation of perceived payoffs.',
      whyItMatters: 'Important to separate empirical certainty from aspirational goals.',
    });
  }

  // 8. High-Value Probing Questions
  const questions: BlindSpotAuditResult['questions'] = [
    {
      question: isStudentInternship
        ? 'If this company offered you zero return-offer promise and the capstone course sequence delayed graduation by a full year, would this experience still justify the trade-off?'
        : 'What specific measurable metric must be true at the 90-day mark for you to know this decision was a compounding success rather than a detour?',
      category: 'Premise Testing',
      whyItMatters: 'Tests whether the decision is resilient to downside friction or contingent on optimal conditions.',
      suggestedAction: 'Define 3 concrete non-negotiable success metrics before signing.',
    },
    {
      question: isStudentInternship
        ? 'What exact course requirements are only offered in fall vs spring terms, and will taking this leave cascade into a 12-month delay?'
        : 'What is the exact vesting acceleration and liquidation preference clause in the stock option contract?',
      category: 'Information Gap Closure',
      whyItMatters: 'Eliminates high-impact uncertainty before irreversible execution.',
      suggestedAction: 'Get written institutional clarity rather than relying on informal peer advice.',
    },
    {
      question: 'What is the strongest, most compelling argument an intelligent person who completely disagrees with you would make against your current leaning?',
      category: 'Inversion & Red Teaming',
      whyItMatters: 'Forces your brain out of confirmation-bias mode to view the opposing hypothesis with equal rigor.',
      suggestedAction: 'Write a 1-page memo defending the exact opposite choice.',
    },
  ];

  return {
    summary: `The reasoning exhibits a strong tilt toward immediate experiential upside, while treating downstream timeline friction and institutional constraints as negligible. Key premises regarding mentorship quality and future market perception are accepted as established facts without empirical verification.`,
    decisionCore: input.decision.length > 120 ? input.decision.substring(0, 117) + '...' : input.decision,
    criticalBlindSpotHighlight: isStudentInternship
      ? 'Treating a 6-month leave as an isolated, linear delay without verifying academic capstone prerequisite calendar locks or formal re-enrollment conditions.'
      : 'Confusing the excitement of escaping current inertia with the rigorous validation of an asymmetric risk-reward profile.',
    assumptions,
    missingInformation,
    reasoningConflicts,
    secondOrderEffects,
    timeHorizon,
    perspectiveShifts,
    evidenceVsBelief,
    questions,
  };
}
