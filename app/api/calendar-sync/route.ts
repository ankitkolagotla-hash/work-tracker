import { NextResponse } from 'next/server';
import { parseICSFeed } from '@/lib/calendarSync';

const FETCH_TIMEOUT_MS = 12000;

async function fetchAndParse(rawUrl: string | null) {
  const url = rawUrl?.trim();
  if (!url) {
    return NextResponse.json({ error: 'A Canvas calendar feed URL is required.' }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return NextResponse.json({ error: 'That doesn\'t look like a valid URL.' }, { status: 400 });
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return NextResponse.json({ error: 'The feed URL must be http or https.' }, { status: 400 });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(parsed.toString(), {
      signal: controller.signal,
      headers: { Accept: 'text/calendar, text/plain, */*' },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `The calendar feed responded with ${response.status} ${response.statusText}.` },
        { status: 502 }
      );
    }

    const icsText = await response.text();
    const events = parseICSFeed(icsText);
    return NextResponse.json({ events, fetchedAt: new Date().toISOString() });
  } catch (err) {
    const message =
      err instanceof Error && err.name === 'AbortError'
        ? 'Timed out reaching the calendar feed — check the URL and try again.'
        : 'Could not reach that calendar feed. Verify the URL is correct and publicly accessible.';
    return NextResponse.json({ error: message }, { status: 504 });
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    return await fetchAndParse(body?.url ?? null);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unexpected error.' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    return await fetchAndParse(searchParams.get('url'));
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unexpected error.' }, { status: 500 });
  }
}
