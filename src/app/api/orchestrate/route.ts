import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { z } from 'zod';
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

const BriefInputSchema = z.object({
  title: z.string().min(1).default('Enterprise Summit 2026'),
  city: z.string().min(1).default('Bengaluru'),
  venueType: z
    .enum(['Convention Center', 'Luxury Hotel', 'Tech Campus'])
    .default('Convention Center'),
  attendees: z.coerce.number().int().min(10).default(300),
  budget: z.coerce.number().min(500000, 'Minimum event budget is ₹5,00,000.'),
  tracks: z.array(z.string()).min(1).default(['Agentic AI', 'Cloud']),
  includeGst: z.boolean().optional().default(true),
});

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
  const safeUser: SafeUserProfile = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    organization: user.organization,
    provider: user.provider,
    createdAt: user.createdAt,
    lastLogin: user.lastLogin,
  };
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

    if (action === 'plan' || action === 'autopilot') {
      const parsedBrief = BriefInputSchema.safeParse(brief);
      if (!parsedBrief.success) {
        return NextResponse.json(
          { error: parsedBrief.error.issues[0]?.message || 'Invalid event brief.' },
          { status: 400 }
        );
      }

      const normalizedBrief: EventBrief = {
        title: parsedBrief.data.title,
        city: parsedBrief.data.city as EventBrief['city'],
        venueType: parsedBrief.data.venueType,
        attendees: parsedBrief.data.attendees,
        budget: parsedBrief.data.budget,
        tracks: parsedBrief.data.tracks,
        includeGst: parsedBrief.data.includeGst,
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

      const result = await runAutonomousPlanAgent(normalizedBrief);
      await logEventRunToSupabase({
        userEmail: user.email,
        brief: normalizedBrief,
        quotes: result.quotes,
      });
      return NextResponse.json(result);
    }

    const venueType: EventBrief['venueType'] =
      brief?.venueType === 'Luxury Hotel' || brief?.venueType === 'Tech Campus'
        ? brief.venueType
        : 'Convention Center';

    const normalizedBrief: EventBrief = {
      title: typeof brief?.title === 'string' && brief.title.trim() ? brief.title : 'Enterprise Summit 2026',
      city: (typeof brief?.city === 'string' && brief.city.trim() ? brief.city : 'Bengaluru') as EventBrief['city'],
      venueType,
      attendees: Number(brief?.attendees) || 300,
      budget: Number(brief?.budget) || 4500000,
      tracks: Array.isArray(brief?.tracks) ? brief.tracks : ['Agentic AI', 'Cloud'],
      includeGst: brief?.includeGst ?? true,
    };

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