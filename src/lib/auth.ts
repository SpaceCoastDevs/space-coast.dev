import { SignJWT, jwtVerify } from 'jose';

export interface SessionUser {
  discordId: string;
  discordUsername: string;
  displayName: string;
  avatarUrl: string;
}

const SESSION_COOKIE = 'session';
const DISPLAY_COOKIE = 'user_display';
const SEVEN_DAYS = 60 * 60 * 24 * 7;

function getSecret(): Uint8Array {
  const secret = import.meta.env.SESSION_SECRET;
  if (!secret) throw new Error('SESSION_SECRET environment variable is not set');
  return new TextEncoder().encode(secret);
}

export async function createSession(user: SessionUser): Promise<string> {
  return new SignJWT({ ...user })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getSecret());
}

export async function getSession(request: Request): Promise<SessionUser | null> {
  const cookie = request.headers.get('cookie') ?? '';
  const token = parseCookie(cookie, SESSION_COOKIE);
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as unknown as SessionUser;
  } catch {
    return null;
  }
}

export function buildSessionCookies(token: string, user: SessionUser): string[] {
  const secure = import.meta.env.MODE !== 'development' ? '; Secure' : '';
  const shared = `; Path=/; Max-Age=${SEVEN_DAYS}; SameSite=Lax${secure}`;
  return [
    `${SESSION_COOKIE}=${token}; HttpOnly${shared}`,
    `${DISPLAY_COOKIE}=${encodeURIComponent(JSON.stringify({ displayName: user.displayName, avatarUrl: user.avatarUrl }))}${shared}`,
  ];
}

export function clearSessionCookies(): string[] {
  return [
    `${SESSION_COOKIE}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`,
    `${DISPLAY_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`,
  ];
}

function parseCookie(cookieHeader: string, name: string): string | null {
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}
