import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { SESSION_COOKIE_NAME, signSessionToken } from '@/lib/authSession';

const mockUser = {
  id: 'usr_test_01',
  name: 'Priyam Srivastava',
  email: 'priyam@eventmind.ai',
  role: 'Lead Event Architect',
  organization: 'EventMind India Labs',
  provider: 'email' as const,
  passwordHash: 'salt:hash',
  createdAt: '2026-11-25',
  lastLogin: '2026-11-25',
};

vi.mock('@/lib/authSession', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/authSession')>();
  return {
    ...actual,
    findUserByEmail: vi.fn(async () => mockUser),
  };
});

import { POST } from '@/app/api/orchestrate/route';

function createAuthedRequest(body: unknown): NextRequest {
  const token = signSessionToken({
    userId: mockUser.id,
    email: mockUser.email,
    exp: Date.now() + 1000 * 60 * 60,
  });

  return new NextRequest('http://localhost:3000/api/orchestrate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}`,
    },
    body: JSON.stringify(body),
  });
}

describe('Orchestrator API Route (/api/orchestrate)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects invalid event briefs below minimum INR budget with HTTP 400', async () => {
    const req = createAuthedRequest({
      action: 'plan',
      brief: {
        title: 'Low Budget Event',
        city: 'Bengaluru',
        venueType: 'Convention Center',
        attendees: 100,
        budget: 100,
        tracks: ['Agentic AI'],
        includeGst: true,
      },
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('orchestrates procurement and scheduling cleanly for valid Indian briefs', async () => {
    const req = createAuthedRequest({
      action: 'plan',
      brief: {
        title: 'Bengaluru AI Summit',
        city: 'Bengaluru',
        venueType: 'Convention Center',
        attendees: 300,
        budget: 4500000,
        tracks: ['Agentic AI', 'Cloud'],
        includeGst: true,
      },
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(Array.isArray(data.quotes)).toBe(true);
    expect(Array.isArray(data.sessions)).toBe(true);
  });
});