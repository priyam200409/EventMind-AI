import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const SESSION_COOKIE_NAME = 'eventmind_session_v1';
const SECRET =
  process.env.AUTH_SESSION_SECRET || 'eventmind-local-dev-secret-change-in-prod';

function getSupabaseAdmin() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    ?.trim()
    .replace(/^["']|["']$/g, '');
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    ?.trim()
    .replace(/^["']|["']$/g, '');

  if (!rawUrl || !serviceKey) return null;

  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error(
      'Invalid NEXT_PUBLIC_SUPABASE_URL. Use https://<project-ref>.supabase.co from Supabase Connect / Data API.'
    );
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL must start with https://');
  }

  return createClient(parsed.origin, serviceKey, {
    auth: { persistSession: false },
  });
}

const DATA_DIR = path.join(process.cwd(), '.data');
const USERS_FILE = path.join(DATA_DIR, 'eventmind-users.json');

export type AuthProvider = 'email' | 'google' | 'github';

export interface AccountRecord {
  id: string;
  name: string;
  email: string;
  role: string;
  organization: string;
  provider: AuthProvider;
  passwordHash: string;
  createdAt: string;
  lastLogin: string;
}

export type SafeUserProfile = Omit<AccountRecord, 'passwordHash'>;

export function hashPassword(password: string, salt?: string): string {
  const actualSalt = salt ?? crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, actualSalt, 64).toString('hex');
  return `${actualSalt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;
  const [salt, keyHex] = parts;
  const keyBuf = Buffer.from(keyHex, 'hex');
  const candidateBuf = crypto.scryptSync(password, salt, 64);
  if (keyBuf.length !== candidateBuf.length) return false;
  return crypto.timingSafeEqual(keyBuf, candidateBuf);
}

function getDefaultDemoAccount(): AccountRecord {
  const now = new Date().toLocaleString([], {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
  return {
    id: 'usr_demo_01',
    name: 'Priyam Srivastava',
    email: 'priyam@eventmind.ai',
    role: 'Lead Event Architect',
    organization: 'EventMind India Labs',
    provider: 'email',
    passwordHash: hashPassword('EventMind@2026'),
    createdAt: now,
    lastLogin: now,
  };
}

function loadLocalUsers(): Map<string, AccountRecord> {
  const map = new Map<string, AccountRecord>();
  const demo = getDefaultDemoAccount();
  map.set(demo.email, demo);

  try {
    if (fs.existsSync(USERS_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8')) as AccountRecord[];
      for (const acc of parsed) {
        if (acc?.email) {
          map.set(acc.email.toLowerCase(), {
            ...acc,
            provider: acc.provider ?? 'email',
          });
        }
      }
    }
  } catch {
    // ignore read error in serverless
  }
  return map;
}

function saveLocalUsers(map: Map<string, AccountRecord>): void {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(USERS_FILE, JSON.stringify(Array.from(map.values()), null, 2), 'utf8');
  } catch {
    // ignore write error on read-only serverless disk
  }
}

export async function findUserByEmail(email: string): Promise<AccountRecord | null> {
  const normalized = email.trim().toLowerCase();
  const supabase = getSupabaseAdmin();

  if (supabase) {
    const { data, error } = await supabase
      .from('app_users')
      .select('*')
      .eq('email', normalized)
      .maybeSingle();

    if (!error && data) {
      return {
        id: data.id,
        name: data.name,
        email: data.email,
        role: data.role,
        organization: data.organization,
        provider: (data.provider as AuthProvider) || 'email',
        passwordHash: data.password_hash,
        createdAt: data.created_at,
        lastLogin: data.last_login,
      };
    }

    if (normalized === 'priyam@eventmind.ai') {
      const demo = getDefaultDemoAccount();
      await upsertUserRecord(demo);
      return demo;
    }

    return null;
  }

  return loadLocalUsers().get(normalized) ?? null;
}

export async function upsertUserRecord(record: AccountRecord): Promise<void> {
  const normalized = record.email.trim().toLowerCase();
  const cleanRecord: AccountRecord = {
    ...record,
    email: normalized,
    provider: record.provider ?? 'email',
  };
  const supabase = getSupabaseAdmin();

  if (supabase) {
    const { error } = await supabase.from('app_users').upsert({
      id: cleanRecord.id,
      name: cleanRecord.name,
      email: cleanRecord.email,
      role: cleanRecord.role,
      organization: cleanRecord.organization,
      provider: cleanRecord.provider,
      password_hash: cleanRecord.passwordHash,
      created_at: cleanRecord.createdAt,
      last_login: cleanRecord.lastLogin,
    });
    if (error) {
      throw new Error(`Supabase user save failed: ${error.message}`);
    }
    return;
  }

  const map = loadLocalUsers();
  map.set(normalized, cleanRecord);
  saveLocalUsers(map);
}

export async function listProviderAccounts(): Promise<SafeUserProfile[]> {
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { data, error } = await supabase
      .from('app_users')
      .select('id, name, email, role, organization, provider, created_at, last_login')
      .in('provider', ['google', 'github']);

    if (!error && Array.isArray(data)) {
      return data.map((row) => ({
        id: row.id,
        name: row.name,
        email: row.email,
        role: row.role,
        organization: row.organization,
        provider: (row.provider as AuthProvider) || 'google',
        createdAt: row.created_at,
        lastLogin: row.last_login,
      }));
    }
    return [];
  }

  return Array.from(loadLocalUsers().values())
    .filter((u) => u.provider === 'google' || u.provider === 'github')
    .map(({ passwordHash: _omitted, ...safe }) => safe);
}

export function signSessionToken(payload: {
  userId: string;
  email: string;
  exp: number;
}): string {
  const dataB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto
    .createHmac('sha256', SECRET)
    .update(dataB64)
    .digest('base64url');
  return `${dataB64}.${sig}`;
}

export function verifySessionToken(
  token: string | undefined
): { userId: string; email: string; exp: number } | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [dataB64, sig] = parts;
  const expectedSig = crypto
    .createHmac('sha256', SECRET)
    .update(dataB64)
    .digest('base64url');
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }
  try {
    const parsed = JSON.parse(
      Buffer.from(dataB64, 'base64url').toString('utf8')
    );
    if (!parsed || typeof parsed.exp !== 'number' || Date.now() > parsed.exp) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function getAuthenticatedUser(
  req: NextRequest
): Promise<SafeUserProfile | null> {
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = verifySessionToken(token);
  if (!session) return null;
  const user = await findUserByEmail(session.email);
  if (!user) return null;
  const { passwordHash: _omitted, ...safeUser } = user;
  return safeUser;
}