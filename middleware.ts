import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return request.cookies.get(name)?.value; },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  // 1. Check Auth
  const { data: { user } } = await supabase.auth.getUser();

  // If NOT logged in, block access to private pages
  if (!user) {
    if (request.nextUrl.pathname.startsWith('/dashboard') || request.nextUrl.pathname.startsWith('/onboarding')) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return response;
  }

  // If Logged in & Trying to access Login page -> Go to Dashboard
  if (request.nextUrl.pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // 2. CHECK ONBOARDING STATUS (The Security Fix)
  // Only run this check if accessing dashboard or onboarding to save performance
  if (request.nextUrl.pathname.startsWith('/dashboard') || request.nextUrl.pathname.startsWith('/onboarding')) {
    
    // Check if brand_settings exist for this user
    const { data: brand } = await supabase
      .from('brand_settings')
      .select('id')
      .eq('user_id', user.id)
      .single();

    const hasCompletedOnboarding = !!brand;
    const isOnboardingPage = request.nextUrl.pathname.startsWith('/onboarding');

    // Scenario A: User tries to go to Dashboard but hasn't finished Onboarding
    if (!hasCompletedOnboarding && !isOnboardingPage) {
      return NextResponse.redirect(new URL('/onboarding', request.url));
    }

    // Scenario B: User finished Onboarding but tries to go back to Onboarding page
    if (hasCompletedOnboarding && isOnboardingPage) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/onboarding/:path*',
    '/login',
  ],
};