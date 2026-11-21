import { EventBrief } from '@/types/blackboard';

export const DEMO_PRESET: EventBrief = {
  title: 'Global AI & Cloud Summit 2026',
  attendees: 450,
  budget: 85000,
  tracks: ['Agentic AI', 'Cloud Infrastructure', 'Enterprise Security'],
  venueType: 'Convention Center',
};

export const VENDOR_CATALOG = [
  { category: 'Venue', name: 'Metro Convention Hub (Capacity 600)', baseCost: 32000 },
  { category: 'Venue', name: 'Grand Horizon Atrium (Capacity 500)', baseCost: 26000 },
  { category: 'Catering', name: 'Artisan Corporate Dining ($45/head)', perHead: 45 },
  { category: 'Catering', name: 'Express Tech Bistro ($32/head)', perHead: 32 },
  { category: 'AV & Production', name: 'ProStage 4K & Multi-Room Audio', baseCost: 14000 },
  { category: 'AV & Production', name: 'CoreStream Standard AV', baseCost: 9500 },
];

export const VENUE_ROOMS = [
  { name: 'Main Keynote Hall', capacity: 500 },
  { name: 'Innovation Theater B', capacity: 200 },
  { name: 'Workshop Studio C', capacity: 120 },
];