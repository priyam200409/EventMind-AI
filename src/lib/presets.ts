import { EventBrief, IndianCity } from '@/types/blackboard';

export const INDIAN_DEMO_PRESETS: Record<string, EventBrief> = {
  bengaluru: {
    title: 'Bengaluru AI & SaaS Summit 2026',
    city: 'Bengaluru',
    attendees: 450,
    budget: 4500000, // ₹45,00,000
    tracks: ['Agentic AI', 'Cloud & FinOps', 'Enterprise Security'],
    venueType: 'Convention Center',
    dietarySplit: { vegPct: 55, jainPct: 15, nonVegPct: 30 },
    includeGst: true,
  },
  mumbai: {
    title: 'Mumbai FinTech & Digital Payments Conclave',
    city: 'Mumbai',
    attendees: 600,
    budget: 6500000, // ₹65,00,000
    tracks: ['UPI & Embedded Finance', 'RegTech & Compliance', 'AI Risk Engines'],
    venueType: 'Luxury Hotel',
    dietarySplit: { vegPct: 50, jainPct: 25, nonVegPct: 25 },
    includeGst: true,
  },
  delhi: {
    title: 'Delhi NCR GovTech & Sovereign Cloud Forum',
    city: 'Delhi NCR',
    attendees: 350,
    budget: 3500000, // ₹35,00,000
    tracks: ['DPI & Bhashini AI', 'Sovereign Cloud', 'Cyber Resilience'],
    venueType: 'Convention Center',
    dietarySplit: { vegPct: 60, jainPct: 15, nonVegPct: 25 },
    includeGst: true,
  },
};

export const DEMO_PRESET: EventBrief = INDIAN_DEMO_PRESETS.bengaluru;

export interface IndianVendorItem {
  category: 'Venue' | 'Catering' | 'AV & Production';
  city: IndianCity;
  name: string;
  baseCost?: number;
  perHead?: number;
  capacity?: number;
  jainCertified?: boolean;
  highlights: string;
}

export const VENDOR_CATALOG: IndianVendorItem[] = [
  // Bengaluru
  { category: 'Venue', city: 'Bengaluru', name: 'BIEC Convention Hall 3 (Tumkur Rd)', baseCost: 1450000, capacity: 600, highlights: 'Dedicated metro access & 500 KVA DG backup' },
  { category: 'Venue', city: 'Bengaluru', name: 'Sheraton Grand Whitefield Ballroom', baseCost: 1180000, capacity: 500, highlights: 'ITPL corridor proximity & VIP green rooms' },
  { category: 'Catering', city: 'Bengaluru', name: 'Sattvam & Dakshin Corporate Kitchen', perHead: 1850, jainCertified: true, highlights: 'Separate Jain kitchen, South Indian & Pan-Asian spread' },
  { category: 'Catering', city: 'Bengaluru', name: 'Blr Tech Bistro Express Buffet', perHead: 1350, jainCertified: false, highlights: 'Fast-service Veg/Non-Veg executive lunch & filter coffee' },
  { category: 'AV & Production', city: 'Bengaluru', name: 'StageCraft India 4K LED & Line-Array', baseCost: 620000, highlights: 'P2.6 LED backdrop, dual-language live captioning' },
  { category: 'AV & Production', city: 'Bengaluru', name: 'CineAudio Pro Conference Rig', baseCost: 420000, highlights: 'HD projection & multi-track wireless mics' },

  // Mumbai
  { category: 'Venue', city: 'Mumbai', name: 'Jio World Convention Centre — Jasmine Hall', baseCost: 2400000, capacity: 700, highlights: 'BKC flagship venue with subterranean VIP entry' },
  { category: 'Venue', city: 'Mumbai', name: 'Sahara Star Emerald Ballroom (Vile Parle)', baseCost: 1750000, capacity: 550, highlights: '5 mins from T2 Airport, pillarless hall' },
  { category: 'Catering', city: 'Mumbai', name: 'Rajdhani & Maharaja Jain-First Banquets', perHead: 2200, jainCertified: true, highlights: '100% certified Jain counter + Mumbai gourmet live stations' },
  { category: 'Catering', city: 'Mumbai', name: 'BKC Executive Culinary Services', perHead: 1650, jainCertified: false, highlights: 'Continental & North Indian corporate buffet' },
  { category: 'AV & Production', city: 'Mumbai', name: 'Wizcraft Technical Production Setup', baseCost: 850000, highlights: 'Broadcast-grade switching & stage lighting' },
  { category: 'AV & Production', city: 'Mumbai', name: 'MetroAV Mumbai Conference Package', baseCost: 540000, highlights: 'Dual screens, lapel mics & recording' },

  // Delhi NCR
  { category: 'Venue', city: 'Delhi NCR', name: 'Yashobhoomi IICC — Hall 2A (Dwarka)', baseCost: 1350000, capacity: 600, highlights: 'Airport Express Line connected, modern acoustic panels' },
  { category: 'Venue', city: 'Delhi NCR', name: 'Pullman Aerocity Peacock Ballroom', baseCost: 1150000, capacity: 450, highlights: 'IGI Airport proximity & diplomatic security readiness' },
  { category: 'Catering', city: 'Delhi NCR', name: 'Haldiram’s & Bikanervala Royal Corporate', perHead: 1600, jainCertified: true, highlights: 'Dedicated Jain & Satvik counters + chaat lounge' },
  { category: 'Catering', city: 'Delhi NCR', name: 'NCR Summit Hospitality', perHead: 1250, jainCertified: false, highlights: 'North Indian & Continental buffet' },
  { category: 'AV & Production', city: 'Delhi NCR', name: 'Apex Live Events NCR Rig', baseCost: 580000, highlights: '4K LED wall & simultaneous translation booths' },
  { category: 'AV & Production', city: 'Delhi NCR', name: 'Capital Sound & Vision', baseCost: 390000, highlights: 'Standard multi-room PA & projection' },

  // Hyderabad
  { category: 'Venue', city: 'Hyderabad', name: 'HICC Novotel — Hall 4 (HITEC City)', baseCost: 1300000, capacity: 600, highlights: 'Connected to HITEC City tech hub' },
  { category: 'Catering', city: 'Hyderabad', name: 'Deccan Royal & Satvik Banquets', perHead: 1550, jainCertified: true, highlights: 'Authentic Hyderabadi + separate Jain/Veg counters' },
  { category: 'AV & Production', city: 'Hyderabad', name: 'Cyberabad Stage & AV Systems', baseCost: 480000, highlights: 'Full conference LED & audio suite' },
];

export const VENUE_ROOMS = [
  { name: 'Main Keynote Hall', capacity: 500 },
  { name: 'Innovation Theater B', capacity: 200 },
  { name: 'Workshop Studio C', capacity: 120 },
];

export const INDIAN_CRISIS_PRESETS: Record<IndianCity, string[]> = {
  Bengaluru: [
    'Outer Ring Road (Silk Board) gridlock delaying Keynote Speaker by 45 mins',
    'Heavy evening thunderstorm causing +120 walk-ins to crowd Main Keynote Hall',
    'Projector & audio matrix failure in Innovation Theater B',
  ],
  Mumbai: [
    'Western Express Highway waterlogging delaying Keynote Speaker by 45 mins',
    'VIP FinTech delegation (+130 attendees) causing Main Keynote Hall overflow',
    'Wireless mic & LED wall sync failure in Innovation Theater B',
  ],
  'Delhi NCR': [
    'IGI Airport fog advisory delaying Keynote Speaker flight by 50 mins',
    'Unexpected ministerial delegation (+110 guests) overflowing Main Keynote Hall',
    'AV switcher failure in Innovation Theater B',
  ],
  Hyderabad: [
    'HITEC City flyover congestion delaying Keynote Speaker by 40 mins',
    'Main Keynote Hall overflow (+120 unexpected walk-ins)',
    'Projector & audio failure in Innovation Theater B',
  ],
};