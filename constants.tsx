
import React from 'react';
import { VibeType, LanguageType, ContentType, EraType } from './types';

export const VIBES: { label: VibeType; emoji: string }[] = [
  { label: 'Light & Funny', emoji: '😂' },
  { label: 'Comfort / Feel-good', emoji: '😊' },
  { label: 'Smart & Thought-provoking', emoji: '🧠' },
  { label: 'Edge-of-seat / Addictive', emoji: '😮' },
  { label: 'Emotional / Deep', emoji: '💔' },
  { label: 'Mind-bending', emoji: '🌌' },
  { label: 'Dark / Intense', emoji: '🌑' },
];

export const LANGUAGES: LanguageType[] = [
  'English',
  'Hindi',
  'Tamil',
  'Telugu',
  'Malayalam',
  'Other',
  'Any'
];

export const CONTENT_TYPES: { label: ContentType; emoji: string }[] = [
  { label: 'Movie', emoji: '🎬' },
  { label: 'Series', emoji: '📺' }
];

export const ERA_OPTIONS: { label: EraType; description: string; emoji: string }[] = [
  { label: 'Retro vibe', description: 'Classic era (Older than 2000)', emoji: '📼' },
  { label: 'Millennial choice', description: 'The golden age (2000-2020)', emoji: '💿' },
  { label: 'GenZ rizz', description: 'Fresh & Modern (2020+)', emoji: '📱' },
];

// Using a vibrant cinematic placeholder as requested
export const PLACEHOLDER_POSTER = 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=2070&auto=format&fit=crop';

export const NETFLIX_RED = '#E50914';
