import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { UserRole } from '@/types/user';

const PROTECTED_ROUTE_PREFIXES: Record<string, UserRole> = {
  '/student': 'student',
  '/dashboard': 'student',
  '/progress': 'student',
  '/support': 'student',
  '/courses': 'student',
  '/calendar': 'student',
  '/certificates': 'student',
  '/instructor': 'instructor',
  '/admin': 'admin',
};

const LOGIN_PATH = '/login';
const REQUIRED_SUPABASE_ENV_VARS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
] as const;

const getSupabaseEnv = (): {
  supabaseUrl: string | null;
  supabaseAnonKey: string | null;
  missing: string[];
  invalid: string[];
} => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? null;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? null;

  const missing = REQUIRED_SUPABASE_ENV_VARS.filter((envVar) => {
    const value = process.env[envVar];
    return typeof value !== 'string' || value.trim().length === 0;
  });

  const invalid: string[] = [];

  if (supabaseUrl && supabaseUrl.trim().length > 0) {
    try {
      const parsedUrl = new URL(supabaseUrl);
      const isHttpUrl = parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';

      if (!isHttpUrl) {
        invalid.push('NEXT_PUBLIC_SUPABASE_URL (must start with http:// or https://)');
      }

      if (supabaseUrl.includes('your-project-url')) {
        invalid.push('NEXT_PUBLIC_SUPABASE_URL (placeholder value detected)');
      }
    } catch {
      invalid.push('NEXT_PUBLIC_SUPABASE_URL (must be a valid HTTP or HTTPS URL)');
    }
  }

  return {
    supabaseUrl,
    supabaseAnonKey,
    missing,
    invalid,
  };
};

const isCourseDiscussionPath = (pathname: string): boolean =>
  /^\/courses\/[^/]+\/discuss(?:\/.*)?$/.test(pathname);

const getRequiredRoles = (pathname: string): UserRole[] | null => {
  if (isCourseDiscussionPath(pathname)) {
    return ['student', 'instructor'];
  }

  for (const [prefix, role] of Object.entries(PROTECTED_ROUTE_PREFIXES)) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      return [role];
    }
  }

  return null;
};

export async function middleware(request: NextRequest) {
  const { supabaseUrl, supabaseAnonKey, missing, invalid } = getSupabaseEnv();

  if (missing.length > 0 || invalid.length > 0 || !supabaseUrl || !supabaseAnonKey) {
    const missingMessage =
      missing.length > 0 ? `Missing ${missing.join(', ')}` : null;
    const invalidMessage =
      invalid.length > 0 ? `Invalid ${invalid.join(', ')}` : null;
    const detail = [missingMessage, invalidMessage].filter(Boolean).join('. ');

    return new NextResponse(
      `Supabase environment variable error: ${detail}. Add real values to .env.local and restart the server.`,
      {
        status: 500,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
        },
      },
    );
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const requiredRoles = getRequiredRoles(request.nextUrl.pathname);

  if (!requiredRoles) {
    return response;
  }

  if (!user) {
    const loginUrl = new URL(LOGIN_PATH, request.url);
    loginUrl.searchParams.set('next', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (
    profileError ||
    !profile ||
    !requiredRoles.includes(profile.role as UserRole)
  ) {
    const loginUrl = new URL(LOGIN_PATH, request.url);
    loginUrl.searchParams.set('next', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
