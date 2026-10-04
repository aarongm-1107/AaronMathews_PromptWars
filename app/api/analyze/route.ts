import { NextRequest, NextResponse } from 'next/server';
import { auditDecision } from '@/lib/ai-auditor';
import { DecisionInput } from '@/types/blindspot';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { decision, context, reasoning, priorities } = body as Partial<DecisionInput>;

    if (!decision || typeof decision !== 'string' || decision.trim().length < 5) {
      return NextResponse.json(
        { error: 'Please provide a clear decision you are considering (at least 5 characters).' },
        { status: 400 }
      );
    }

    if (!reasoning || typeof reasoning !== 'string' || reasoning.trim().length < 10) {
      return NextResponse.json(
        { error: 'Please describe your current reasoning or why you are leaning one way (at least 10 characters).' },
        { status: 400 }
      );
    }

    if (!priorities || typeof priorities !== 'string' || priorities.trim().length < 5) {
      return NextResponse.json(
        { error: 'Please state your core priorities or what matters most to you.' },
        { status: 400 }
      );
    }

    const input: DecisionInput = {
      decision: decision.trim(),
      context: (context || '').trim(),
      reasoning: reasoning.trim(),
      priorities: priorities.trim(),
    };

    const startTime = Date.now();
    const auditResult = await auditDecision(input);
    const durationMs = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      data: auditResult,
      meta: {
        durationMs,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Error during BlindSpot analysis:', error);
    return NextResponse.json(
      {
        error: error?.message || 'Failed to complete reasoning audit. Please try again.',
      },
      { status: 500 }
    );
  }
}
