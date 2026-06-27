import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { type NextRequest, type NextResponse } from 'next/server';

type CookieToSet = { name: string; value: string; options: CookieOptions };

/**
 * Refresh the Supabase auth session on every request and copy the resulting
 * cookies onto the response produced by the next-intl middleware.
 *
 * We deliberately reuse the `response` from next-intl (which may already carry
 * a locale rewrite/redirect) instead of creating a new one, so the two
 * middlewares compose cleanly.
 */
export async function updateSession(
  request: NextRequest,
  response: NextResponse
) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: refreshes the auth token and writes updated cookies. Do not run
  // any logic between creating the client and calling getUser().
  await supabase.auth.getUser();

  return response;
}
