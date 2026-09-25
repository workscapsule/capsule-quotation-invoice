import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { prisma } from './prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'capsule_interiors_jwt_super_secret_2026_production_key';

export interface AuthSession {
  userId: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'STAFF';
}

export function signAuthToken(payload: AuthSession): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyAuthToken(token: string): AuthSession | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthSession;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<AuthSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('capsule_auth')?.value;
  if (!token) return null;
  return verifyAuthToken(token);
}

export async function requireAuth(allowedRoles?: ('ADMIN' | 'STAFF')[]): Promise<AuthSession> {
  const session = await getSession();
  if (!session) {
    throw new Error('UNAUTHORIZED');
  }
  if (allowedRoles && !allowedRoles.includes(session.role)) {
    throw new Error('FORBIDDEN');
  }
  return session;
}
