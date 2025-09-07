export interface Event {
  experiment_id: number;
  title: string;
  summary: string | null;
  image_url: string | null;
  cost_min: number | null;
  cost_max: number | null;
  created_at: string;
  updated_at: string;
}

export type EventInsert = Omit<Event, 'created_at' | 'updated_at'>;

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