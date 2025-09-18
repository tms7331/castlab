import { NextResponse } from 'next/server';
import { EventsService } from '@/lib/supabase/events';

export async function GET() {
  try {
    const { data, error } = await EventsService.getAllEvents();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}