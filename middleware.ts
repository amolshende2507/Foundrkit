import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  // Check if User is Authenticated
  const { data: { user } } = await supabase.auth.getUser();

  // SECURITY RULE:
  // If user is NOT logged in AND tries to visit /dashboard...
  if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
    // Redirect them to Login
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If user IS logged in AND tries to visit /login...
  if (user && request.nextUrl.pathname.startsWith('/login')) {
    // Redirect them to Dashboard
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return response;
}

// Apply this rule to these paths
export const config = {
  matcher: [
    '/dashboard/:path*', // Protect all dashboard routes
    '/login',            // Redirect logged-in users away from login
  ],
};