import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/src/core/supabase';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(new URL(`/?error=${error}`, request.url));
  }

  if (code) {
    try {
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      
      if (exchangeError) {
        return NextResponse.redirect(new URL('/?error=auth_error', request.url));
      }

      return NextResponse.redirect(new URL('/', request.url));
    } catch (err) {
      return NextResponse.redirect(new URL('/?error=callback_error', request.url));
    }
  }

  return NextResponse.redirect(new URL('/?error=no_code', request.url));
}
