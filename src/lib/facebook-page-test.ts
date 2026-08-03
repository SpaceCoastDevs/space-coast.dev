import { EncryptJWT, jwtDecrypt } from 'jose';

const GRAPH_API_VERSION = 'v26.0';
const STATE_COOKIE = 'facebook_oauth_state';
const TEST_SESSION_COOKIE = 'facebook_test_session';
const TEN_MINUTES = 60 * 10;

interface FacebookPage {
  id: string;
  name: string;
  access_token: string;
}

interface TestSession {
  ownerDiscordId: string;
  pageId: string;
  pageName: string;
  pageAccessToken: string;
}

function isProduction(): boolean {
  return import.meta.env.MODE !== 'development';
}

function cookie(name: string, value: string, maxAge: number, path: string): string {
  return `${name}=${encodeURIComponent(value)}; HttpOnly; Path=${path}; Max-Age=${maxAge}; SameSite=Lax${
    isProduction() ? '; Secure' : ''
  }`;
}

function readCookie(request: Request, name: string): string | null {
  const match = request.headers.get('cookie')?.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function requiredEnv(name: string): string {
  const environment = {
    FACEBOOK_APP_ID: import.meta.env.FACEBOOK_APP_ID,
    FACEBOOK_APP_SECRET: import.meta.env.FACEBOOK_APP_SECRET,
    FACEBOOK_OAUTH_REDIRECT_URI: import.meta.env.FACEBOOK_OAUTH_REDIRECT_URI,
    FACEBOOK_PAGE_ID: import.meta.env.FACEBOOK_PAGE_ID,
    SESSION_SECRET: import.meta.env.SESSION_SECRET,
  };
  const value = environment[name as keyof typeof environment];
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

async function encryptionKey(): Promise<Uint8Array> {
  const secret = new TextEncoder().encode(requiredEnv('SESSION_SECRET'));
  return new Uint8Array(await crypto.subtle.digest('SHA-256', secret));
}

export function facebookRedirectUri(): string {
  return requiredEnv('FACEBOOK_OAUTH_REDIRECT_URI');
}

export function beginFacebookAuthorization(ownerDiscordId: string): { location: string; cookie: string } {
  const state = crypto.randomUUID();
  const appId = requiredEnv('FACEBOOK_APP_ID');
  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: facebookRedirectUri(),
    response_type: 'code',
    state,
    scope: 'pages_show_list,pages_read_engagement,pages_manage_posts',
  });

  return {
    location: `https://www.facebook.com/${GRAPH_API_VERSION}/dialog/oauth?${params}`,
    cookie: cookie(STATE_COOKIE, `${ownerDiscordId}:${state}`, TEN_MINUTES, '/api/social/facebook/callback'),
  };
}

export async function createFacebookTestSession(
  request: Request,
  ownerDiscordId: string,
  returnedState: string,
  code: string
): Promise<string> {
  const expectedState = readCookie(request, STATE_COOKIE);
  if (!expectedState) throw new Error('The Facebook authorization request expired. Please try again.');

  const [stateOwnerId, expectedStateValue] = expectedState.split(':');
  if (stateOwnerId !== ownerDiscordId || returnedState !== expectedStateValue) {
    throw new Error('The Facebook authorization request is invalid.');
  }

  const redirectUri = facebookRedirectUri();
  const tokenParams = new URLSearchParams({
    client_id: requiredEnv('FACEBOOK_APP_ID'),
    client_secret: requiredEnv('FACEBOOK_APP_SECRET'),
    redirect_uri: redirectUri,
    code,
  });
  const tokenResponse = await fetch(
    `https://graph.facebook.com/${GRAPH_API_VERSION}/oauth/access_token?${tokenParams}`
  );
  if (!tokenResponse.ok) throw new Error('Facebook did not return a usable authorization token.');

  const { access_token: userAccessToken } = (await tokenResponse.json()) as { access_token?: string };
  if (!userAccessToken) throw new Error('Facebook did not return an authorization token.');

  const pagesResponse = await fetch(
    `https://graph.facebook.com/${GRAPH_API_VERSION}/me/accounts?fields=id,name,access_token`,
    { headers: { Authorization: `Bearer ${userAccessToken}` } }
  );
  const pages = pagesResponse.ok ? (((await pagesResponse.json()) as { data?: FacebookPage[] }).data ?? []) : [];
  const pageId = requiredEnv('FACEBOOK_PAGE_ID');
  let page = pages.find((candidate) => candidate.id === pageId);

  // Some Page-management accounts do not list the Page via /me/accounts even
  // though Facebook will issue its Page token from the Page node directly.
  if (!page?.access_token) {
    const pageResponse = await fetch(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${pageId}?fields=id,name,access_token`,
      { headers: { Authorization: `Bearer ${userAccessToken}` } }
    );
    if (pageResponse.ok) page = (await pageResponse.json()) as FacebookPage;
  }

  if (!page?.access_token)
    throw new Error('The authorized Facebook account does not have access to the configured Page.');

  return new EncryptJWT({
    ownerDiscordId,
    pageId: page.id,
    pageName: page.name,
    pageAccessToken: page.access_token,
  })
    .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
    .setIssuedAt()
    .setExpirationTime('10m')
    .encrypt(await encryptionKey());
}

export function clearFacebookStateCookie(): string {
  return cookie(STATE_COOKIE, '', 0, '/api/social/facebook/callback');
}

export function testSessionCookie(session: string): string {
  return cookie(TEST_SESSION_COOKIE, session, TEN_MINUTES, '/');
}

export function clearTestSessionCookie(): string {
  return cookie(TEST_SESSION_COOKIE, '', 0, '/');
}

export async function getFacebookTestSession(request: Request, ownerDiscordId: string): Promise<TestSession | null> {
  const encryptedSession = readCookie(request, TEST_SESSION_COOKIE);
  if (!encryptedSession) return null;

  try {
    const { payload } = await jwtDecrypt(encryptedSession, await encryptionKey());
    const session = payload as unknown as TestSession;
    if (!session.ownerDiscordId || session.ownerDiscordId !== ownerDiscordId || !session.pageAccessToken) return null;
    return session;
  } catch {
    return null;
  }
}

export async function publishFacebookTestPost(request: Request, ownerDiscordId: string): Promise<string> {
  const session = await getFacebookTestSession(request, ownerDiscordId);
  if (!session) throw new Error('Your Facebook test session has expired. Connect the Page again.');

  const body = new URLSearchParams({
    message: `App Review test post from Space Coast Devs (${new Date().toISOString()}). This verifies that the Space Coast Devs app can publish weekly event announcements to its own Facebook Page.`,
    link: 'https://space-coast.dev/events',
    access_token: session.pageAccessToken,
  });
  const response = await fetch(`https://graph.facebook.com/${GRAPH_API_VERSION}/${session.pageId}/feed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const data = (await response.json()) as { id?: string; error?: { message?: string } };
  if (!response.ok || !data.id) throw new Error(data.error?.message ?? 'Facebook did not create the test post.');

  return data.id;
}
