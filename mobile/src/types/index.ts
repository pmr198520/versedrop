export interface Drop {
  id: string;
  user_token: string;
  verse_reference: string;
  verse_text: string;
  verse_translation: string;
  custom_message?: string;
  latitude: number;
  longitude: number;
  distance_meters?: number;
  pickup_count: number;
  is_picked_up?: boolean;
  reactions: {
    amen: number;
    heart: number;
    pray: number;
    user_reaction?: string | null;
  };
  created_at: string;
}

export interface DropCreate {
  verse_reference: string;
  verse_text: string;
  verse_translation?: string;
  custom_message?: string;
  latitude: number;
  longitude: number;
}

export interface BibleTranslation {
  id: string;
  name: string;
  year?: number;
  language: string;
  license: string;
  attribution: string;
  default?: boolean;
  loaded: boolean;
  verseCount: number;
}

export interface UserStats {
  user_token: string;
  is_plus_subscriber: boolean;
  total_pickups: number;
  total_drops: number;
  streak_days: number;
}

export interface Note {
  id: string;
  user_token: string;
  drop_id: string;
  text: string;
  created_at: string;
}

export interface VerseResult {
  reference: string;
  text: string;
  book?: string;
  translation?: string;
}
