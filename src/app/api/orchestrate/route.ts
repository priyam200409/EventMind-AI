import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import {
  runAutonomousCrisisAgent,
  runAutonomousPlanAgent,
  runAutonomousRoiAgent,
} from '@/lib/agents/autonomousOrchestrator';
import { runFullAutoPilot } from '@/lib/agents/autoPilot';
import {
  SESSION_COOKIE_NAME,
  findUserByEmail,
  verifySessionToken,
  type SafeUserProfile,
} from '@/lib/authSession';
import { checkBudget } from '@/lib/guardrails';
import type { EventBrief, VendorQuote } from '@/types/blackboard';

async function getRequestUser(req: Request | NextRequest): Promise<SafeUserProfile | null> {
  const nextCookies = (req as NextRequest).cookies;
  let token = nextCookies?.get?.(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    const cookieHeader = req.headers.get('cookie') || '';
    const match = cookieHeader
      .split(';')
      .map((part) => part.trim())
      .find((part) => part.startsWith(`${SESSION_COOKIE_NAME}=`));
    if (match) {
      token = decodeURIComponent(match.slice(SESSION_COOKIE_NAME.length + 1));
    }
  }

  const session = verifySessionToken(token);
  if (!session) return null;
  const user = await findUserByEmail(session.email);
  if (!user) return null;
  const { passwordHash: _omitted, ...safeUser } = user;
  return safeUser;
}

async function logEventRunToSupabase(params: {
  userEmail: string;
  brief: EventBrief;
  quotes: VendorQuote[];
}) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return;

  try {
    const supabase = createClient(url, key, { auth: { persistSession: false } });
    const budgetAudit = checkBudget(
      params.quotes,
      params.brief.budget,
      params.brief.includeGst ?? true
    );

    await supabase.from('event_runs').insert({
      id: `run_${crypto.randomBytes(5).toString('hex')}`,
      user_email: params.userEmail,
      event_title: params.brief.title,
      city: params.brief.city ?? 'Bengaluru',
      budget_inr: Math.round(params.brief.budget),
      net_payable_inr: Math.round(budgetAudit.total),
    });
  } catch {
    // non-blocking telemetry write
  }
}

export async function POST(req: Request | NextRequest) {
  const user = await getRequestUser(req);
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized: please sign in before running orchestration.' },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const { action, brief, sessions, crisis, city, quotes } = body ?? {};

    const normalizedBrief: EventBrief = {
      title: brief?.title ?? 'Enterprise Summit 2026',
      city: brief?.city ?? 'Bengaluru',
      venueType: brief?.venueType ?? 'Convention Center',
      attendees: Number(brief?.attendees) || 300,
      budget: Number(brief?.budget) || 4500000,
      tracks: Array.isArray(brief?.tracks) ? brief.tracks : ['Agentic AI', 'Cloud'],
      includeGst: brief?.includeGst ?? true,
    };

    if (action === 'autopilot') {
      const result = await runFullAutoPilot({
        brief: normalizedBrief,
        autoCrisisLabel:
          typeof body?.autoCrisisLabel === 'string' ? body.autoCrisisLabel : undefined,
      });
      await logEventRunToSupabase({
        userEmail: user.email,
        brief: normalizedBrief,
        quotes: result.quotes,
      });
      return NextResponse.json(result);
    }

    if (action === 'plan') {
      const result = await runAutonomousPlanAgent(normalizedBrief);
      await logEventRunToSupabase({
        userEmail: user.email,
        brief: normalizedBrief,
        quotes: result.quotes,
      });
      return NextResponse.json(result);
    }

    if (action === 'crisis') {
      const result = await runAutonomousCrisisAgent({
        city: city ?? normalizedBrief.city,
        crisis: String(crisis || 'Operational disruption'),
        sessions: Array.isArray(sessions) ? sessions : [],
      });
      return NextResponse.json(result);
    }

    if (action === 'roi') {
      const result = await runAutonomousRoiAgent({
        brief: normalizedBrief,
        quotes: Array.isArray(quotes) ? quotes : [],
        sessions: Array.isArray(sessions) ? sessions : [],
      });
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: 'Unknown orchestration action.' }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Orchestration server error.' },
      { status: 500 }
    );
  }
}