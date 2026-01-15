
export type VibeType = 
  | 'Light & Funny'
  | 'Comfort / Feel-good'
  | 'Smart & Thought-provoking'
  | 'Edge-of-seat / Addictive'
  | 'Emotional / Deep'
  | 'Mind-bending'
  | 'Dark / Intense';

export type ContentType = 'Movie' | 'Series';

export type LanguageType = 'English' | 'Hindi' | 'Tamil' | 'Telugu' | 'Malayalam' | 'Other' | 'Any';

export type EraType = 'Retro vibe' | 'Millennial choice' | 'GenZ rizz';

export interface UserPreferences {
  vibes: VibeType[];
  content_type: ContentType[];
  language_preference: LanguageType[];
  era_preference: EraType[];
  magic_text: string;
  input_movies?: string; // For Fun / Tile Mode
}

export interface Recommendation {
  title: string;
  type: 'movie' | 'series';
  language: string;
  release_year: number;
  relevance_score: number;
  one_line_reason: string;
  poster?: string;
  rating?: string;
}

export enum AppStep {
  ENTRY = 'entry',
  VIBE = 'vibe',
  CONTENT_TYPE = 'content_type',
  LANGUAGE = 'language',
  ERA = 'era',
  MAGIC_TEXT = 'magic_text',
  FUN_MODE_INPUT = 'fun_mode_input',
  RESULTS = 'results'
}

export interface TrackingEvent {
  event: string;
  params?: Record<string, any>;
}
