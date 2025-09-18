import { NextResponse } from 'next/server';
import { EventsService } from '@/lib/supabase/events';
import { EventInsert } from '@/lib/supabase/types';

export async function POST(request: Request) {
  try {
    const body: EventInsert = await request.json();

    if (!body.title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    const { data, error } = await EventsService.createEvent(body);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}