export interface Event {
  id: string;
  title: string;
  one_liner: string | null;
  why_study: string | null;
  approach: string | null;
  cost: number | null;
  created_at: string;
  updated_at: string;
}

export type EventInsert = Omit<Event, 'id' | 'created_at' | 'updated_at'>;

export type EventUpdate = Partial<EventInsert>;

export interface Database {
  public: {
    Tables: {
      events: {
        Row: Event;
        Insert: EventInsert;
        Update: EventUpdate;
      };
    };
  };
}