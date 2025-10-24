export interface Event {
  experiment_id: number;
  title: string;
  summary: string | null;
  image_url: string | null;
  cost_min: number | null;
  cost_max: number | null;
  outcome_text0: string | null;
  outcome_text1: string | null;
  date_completed: string | null;
  date_funding_deadline: string;
  experiment_url: string | null;
  created_at: string;
  updated_at: string;
}

export type EventInsert = Omit<Event, 'created_at' | 'updated_at'>;

export type EventUpdate = Partial<EventInsert>;

export interface Donation {
  id: string;
  experiment_id: number;
  fid: number;
  username: string | null;
  display_name: string | null;
  pfp_url: string | null;
  follower_count: number | null;
  wallet_address: string;
  total_amount_usd: number;
  last_donation_at: string;
  created_at: string;
  updated_at: string;
}

export type DonationInsert = Omit<Donation, 'id' | 'created_at' | 'updated_at'>;

export type DonationUpdate = Partial<DonationInsert>;

export interface Database {
  public: {
    Tables: {
      events: {
        Row: Event;
        Insert: EventInsert;
        Update: EventUpdate;
      };
      donations: {
        Row: Donation;
        Insert: DonationInsert;
        Update: DonationUpdate;
      };
    };
  };
}