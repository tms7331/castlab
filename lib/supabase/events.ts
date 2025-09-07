import { supabase } from './client';
import { Event, EventInsert, EventUpdate } from './types';

export class EventsService {
  /**
   * Create a new event
   */
  static async createEvent(event: EventInsert): Promise<{ data: Event | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('events')
        .insert(event)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error creating event:', error);
      return { data: null, error: error as Error };
    }
  }

  /**
   * Get all events
   */
  static async getAllEvents(): Promise<{ data: Event[] | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error fetching events:', error);
      return { data: null, error: error as Error };
    }
  }

  /**
   * Get a single event by experiment ID
   */
  static async getEventByExperimentId(experimentId: number): Promise<{ data: Event | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('experiment_id', experimentId)
        .single();

      if (error) {
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error fetching event:', error);
      return { data: null, error: error as Error };
    }
  }

  /**
   * Update an event
   */
  static async updateEvent(experimentId: number, updates: EventUpdate): Promise<{ data: Event | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('events')
        .update(updates)
        .eq('experiment_id', experimentId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error updating event:', error);
      return { data: null, error: error as Error };
    }
  }

  /**
   * Delete an event
   */
  static async deleteEvent(experimentId: number): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('experiment_id', experimentId);

      if (error) {
        throw error;
      }

      return { error: null };
    } catch (error) {
      console.error('Error deleting event:', error);
      return { error: error as Error };
    }
  }
}