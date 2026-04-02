import { NextResponse } from 'next/server';

// OAuth callback is no longer used — backend handles JWT auth directly.
export async function GET(request: Request) {
  const { origin } = new URL(request.url);
  return NextResponse.redirect(`${origin}/workspaces`);
}
