import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { InspectorUser, SafeInspector, AuthSessionPayload, RegisterInspectorInput } from '@/types/auth';

const DATA_DIR = path.join(process.cwd(), 'data');
const INSPECTORS_FILE = path.join(DATA_DIR, 'inspectors.json');

export const AUTH_COOKIE_NAME = 'metrology_inspector_session';
const SESSION_SECRET = process.env.SESSION_SECRET || 'metrology-ai-secret-key-pcr-2011-statutory-enforcement-jwt-session-token';
const encodedSecret = new TextEncoder().encode(SESSION_SECRET);

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(INSPECTORS_FILE)) {
    // Seed with initial inspector if not present
    const seedInspector: InspectorUser = {
      id: 'ins-seed-001',
      officerId: 'INS-402',
      name: 'Inspector S. K. Verma',
      email: 'officer@metrology.gov.in',
      passwordHash: '$2b$10$Y21CJkc5Ig0tmp6NYT2ot.QQgoIvLp5uOHN9XoDTa560QnFMFrwD.',
      designation: 'Legal Metrology Inspector',
      jurisdiction: 'Zone-1 Enforcement Division',
      role: 'INSPECTOR',
      createdAt: '2026-01-01T00:00:00.000Z'
    };
    fs.writeFileSync(INSPECTORS_FILE, JSON.stringify([seedInspector], null, 2), 'utf-8');
  }
}

export function getInspectors(): InspectorUser[] {
  ensureDataDir();
  try {
    const raw = fs.readFileSync(INSPECTORS_FILE, 'utf-8');
    const list = JSON.parse(raw);
    if (Array.isArray(list)) {
      return list;
    }
    return [];
  } catch (err) {
    console.error('Error reading inspectors:', err);
    return [];
  }
}

export function toSafeInspector(user: InspectorUser): SafeInspector {
  const { passwordHash, ...safe } = user;
  return safe;
}

export function findInspectorByEmail(email: string): InspectorUser | null {
  const all = getInspectors();
  const normalized = email.trim().toLowerCase();
  return all.find(i => i.email.toLowerCase() === normalized) || null;
}

export function findInspectorByOfficerId(officerId: string): InspectorUser | null {
  const all = getInspectors();
  const normalized = officerId.trim().toUpperCase();
  return all.find(i => i.officerId.toUpperCase() === normalized) || null;
}

export function findInspectorByName(name: string): InspectorUser | null {
  const all = getInspectors();
  const normalized = name.trim().toLowerCase();
  return all.find(i => i.name.trim().toLowerCase() === normalized) || null;
}

export function findInspectorById(id: string): InspectorUser | null {
  const all = getInspectors();
  return all.find(i => i.id === id) || null;
}

export function deleteInspector(id: string): boolean {
  ensureDataDir();
  const all = getInspectors();
  const target = all.find(i => i.id === id || i.officerId === id);
  if (!target) return false;
  
  // Protect the root admin from deletion
  if (target.name.toLowerCase() === 'smit' || target.role === 'ADMIN') {
    return false;
  }

  const filtered = all.filter(i => i.id !== target.id);
  fs.writeFileSync(INSPECTORS_FILE, JSON.stringify(filtered, null, 2), 'utf-8');
  return true;
}

export function saveInspector(user: InspectorUser): InspectorUser {
  ensureDataDir();
  const all = getInspectors();
  const existingIdx = all.findIndex(i => i.id === user.id);
  if (existingIdx >= 0) {
    all[existingIdx] = user;
  } else {
    all.push(user);
  }
  fs.writeFileSync(INSPECTORS_FILE, JSON.stringify(all, null, 2), 'utf-8');
  return user;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSessionToken(inspector: SafeInspector): Promise<string> {
  const payload: AuthSessionPayload = {
    inspectorId: inspector.id,
    officerId: inspector.officerId,
    email: inspector.email,
    name: inspector.name,
    designation: inspector.designation,
    jurisdiction: inspector.jurisdiction,
    role: inspector.role || 'INSPECTOR'
  };

  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(encodedSecret);
}

export async function verifySessionToken(token: string): Promise<AuthSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, encodedSecret, {
      algorithms: ['HS256']
    });
    return payload as unknown as AuthSessionPayload;
  } catch {
    return null;
  }
}

export async function setAuthCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 // 7 days
  });
}

export async function clearAuthCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0
  });
}

export async function getAuthSessionToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(AUTH_COOKIE_NAME)?.value;
}

export async function getCurrentInspector(): Promise<SafeInspector | null> {
  try {
    const token = await getAuthSessionToken();
    if (!token) return null;

    const payload = await verifySessionToken(token);
    if (!payload || !payload.inspectorId) return null;

    const inspector = findInspectorById(payload.inspectorId);
    if (!inspector) {
      // Fall back to token payload if user record was created in session
      return {
        id: payload.inspectorId,
        officerId: payload.officerId,
        name: payload.name,
        email: payload.email,
        designation: payload.designation,
        jurisdiction: payload.jurisdiction,
        role: payload.role || 'INSPECTOR',
        createdAt: new Date().toISOString()
      };
    }

    return toSafeInspector(inspector);
  } catch (err) {
    console.error('Error getting current inspector:', err);
    return null;
  }
}

export async function registerInspector(input: RegisterInspectorInput): Promise<{ success: boolean; inspector?: SafeInspector; error?: string }> {
  const { name, officerId, designation, jurisdiction, email, password } = input;

  if (!name?.trim() || !officerId?.trim() || !email?.trim() || !password) {
    return { success: false, error: 'All fields are required.' };
  }

  if (password.length < 6) {
    return { success: false, error: 'Password must be at least 6 characters long.' };
  }

  // Disallow registering with reserved admin name
  if (name.trim().toLowerCase() === 'smit') {
    return { success: false, error: 'This username is reserved and cannot be registered.' };
  }

  if (findInspectorByEmail(email)) {
    return { success: false, error: 'An inspector with this email address already exists.' };
  }

  if (findInspectorByOfficerId(officerId)) {
    return { success: false, error: `An inspector with Officer ID "${officerId}" already exists.` };
  }

  const passwordHash = await hashPassword(password);
  const newInspector: InspectorUser = {
    id: `ins-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    officerId: officerId.trim().toUpperCase(),
    name: name.trim(),
    email: email.trim().toLowerCase(),
    passwordHash,
    designation: designation?.trim() || 'Legal Metrology Inspector',
    jurisdiction: jurisdiction?.trim() || 'District Enforcement Branch',
    role: 'INSPECTOR',
    createdAt: new Date().toISOString()
  };

  saveInspector(newInspector);
  const safe = toSafeInspector(newInspector);
  const token = await createSessionToken(safe);
  await setAuthCookie(token);

  return { success: true, inspector: safe };
}
