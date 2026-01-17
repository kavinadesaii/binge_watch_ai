
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

// --- Tracking Schema ---

export type ElementType = 'button' | 'link' | 'card' | 'icon' | 'input';

export interface PromptSubmittedEvent {
  input_id: string;
  text_length: number;
  word_count: number;
  time_to_submit_ms: number;
  page_url: string;
  timestamp: string;
}

export interface PromptTypingStartedEvent {
  input_id: string;
  page_url: string;
  timestamp: string;
}

export interface ClickEvent {
  element_type: ElementType;
  element_id: string;
  page_url: string;
  timestamp: string;
}

export type TrackingPayload = 
  | { event: 'prompt_submitted'; params: PromptSubmittedEvent }
  | { event: 'prompt_typing_started'; params: PromptTypingStartedEvent }
  | { event: 'click_event'; params: ClickEvent };
