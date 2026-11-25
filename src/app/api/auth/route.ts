import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { z } from 'zod';
import {
  SESSION_COOKIE_NAME,
  AccountRecord,
  findUserByEmail,
  getAuthenticatedUser,
  hashPassword,
  listProviderAccounts,
  signSessionToken,
  upsertUserRecord,
  verifyPassword,
} from '@/lib/authSession';

const AuthBodySchema = z.discriminatedUnion('mode', [
  z.object({
    mode: z.literal('login'),
    email: z.string().email(),
    password: z.string().min(1),
  }),
  z.object({
    mode: z.literal('register'),
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    role: z.string().optional(),
    organization: z.string().optional(),
  }),
  z.object({
    mode: z.literal('oauth'),
    provider: z.enum(['google', 'github']),
    email: z.string().email(),
    name: z.string().optional(),
  }),
]);

const ProfilePatchSchema = z.object({
  name: z.string().min(2).max(100),
  role: z.string().min(2).max(100),
  organization: z.string().min(2).max(120),
});

function issueSessionResponse(record: AccountRecord, status = 200) {
  const token = signSessionToken({
    userId: record.id,
    email: record.email,
    exp: Date.now() + 1000 * 60 * 60 * 24 * 7,
  });
  const { passwordHash: _omitted, ...safeUser } = record;
  const res = NextResponse.json({ authenticated: true, user: safeUser }, { status });
  res.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}

export async function GET(req: NextRequest) {
  const [user, providerAccounts] = await Promise.all([
    getAuthenticatedUser(req),
    listProviderAccounts(),
  ]);

  if (!user) {
    return NextResponse.json(
      { authenticated: false, user: null, providerAccounts },
      { status: 200 }
    );
  }
  return NextResponse.json(
    { authenticated: true, user, providerAccounts },
    { status: 200 }
  );
}

export async function POST(req: NextRequest) {
  try {
    const raw = await req.json();
    const parsed = AuthBodySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid authentication input.' },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const nowLabel = new Date().toLocaleString([], {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    if (data.mode === 'oauth') {
      const providerEmail = data.email.trim().toLowerCase();
      const existing = await findUserByEmail(providerEmail);

      if (existing) {
        existing.lastLogin = nowLabel;
        existing.provider = data.provider;
        if (data.name?.trim()) existing.name = data.name.trim();
        await upsertUserRecord(existing);
        return issueSessionResponse(existing, 200);
      }

      const derivedName =
        data.name?.trim() ||
        providerEmail
          .split('@')[0]
          .replace(/[._-]+/g, ' ')
          .replace(/\b\w/g, (c) => c.toUpperCase());

      const oauthRecord: AccountRecord = {
        id: `usr_${data.provider}_${crypto.randomBytes(4).toString('hex')}`,
        name: derivedName,
        email: providerEmail,
        role: 'Event Architect',
        organization:
          data.provider === 'google' ? 'Google Account' : 'GitHub Account',
        provider: data.provider,
        passwordHash: hashPassword(crypto.randomBytes(24).toString('hex')),
        createdAt: nowLabel,
        lastLogin: nowLabel,
      };
      await upsertUserRecord(oauthRecord);
      return issueSessionResponse(oauthRecord, 201);
    }

    const normalizedEmail = data.email.trim().toLowerCase();

    if (data.mode === 'login') {
      const existing = await findUserByEmail(normalizedEmail);
      if (!existing || !verifyPassword(data.password, existing.passwordHash)) {
        return NextResponse.json(
          { error: 'Invalid email or password. Access denied.' },
          { status: 401 }
        );
      }

      existing.lastLogin = nowLabel;
      await upsertUserRecord(existing);
      return issueSessionResponse(existing, 200);
    }

    const existing = await findUserByEmail(normalizedEmail);
    if (existing) {
      return NextResponse.json(
        { error: 'An account with this email already exists. Please sign in.' },
        { status: 409 }
      );
    }

    const newRecord: AccountRecord = {
      id: `usr_${crypto.randomBytes(6).toString('hex')}`,
      name: data.name.trim(),
      email: normalizedEmail,
      role: data.role?.trim() || 'Event Architect',
      organization: data.organization?.trim() || 'EventMind Enterprise',
      provider: 'email',
      passwordHash: hashPassword(data.password),
      createdAt: nowLabel,
      lastLogin: nowLabel,
    };

    await upsertUserRecord(newRecord);
    return issueSessionResponse(newRecord, 201);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Authentication service error.' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const current = await getAuthenticatedUser(req);
    if (!current) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await req.json();
    const parsed = ProfilePatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid profile fields.' },
        { status: 400 }
      );
    }
    const existing = await findUserByEmail(current.email);
    if (!existing) {
      return NextResponse.json({ error: 'Account not found.' }, { status: 404 });
    }
    const updated: AccountRecord = {
      ...existing,
      name: parsed.data.name.trim(),
      role: parsed.data.role.trim(),
      organization: parsed.data.organization.trim(),
    };
    await upsertUserRecord(updated);
    const { passwordHash: _omitted, ...safeUser } = updated;
    return NextResponse.json({ user: safeUser }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to update profile.' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const res = NextResponse.json({ authenticated: false });
  res.cookies.set(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
  return res;
}