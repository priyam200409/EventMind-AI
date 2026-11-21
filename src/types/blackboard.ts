import { z } from 'zod';

export const IndianCitySchema = z.enum([
  // North India (42)
  'Delhi NCR',
  'Lucknow',
  'Prayagraj',
  'Jaipur',
  'Chandigarh',
  'Varanasi',
  'Kanpur',
  'Agra',
  'Noida',
  'Gurugram',
  'Ghaziabad',
  'Meerut',
  'Gorakhpur',
  'Bareilly',
  'Dehradun',
  'Amritsar',
  'Ludhiana',
  'Jodhpur',
  'Udaipur',
  'Shimla',
  'Srinagar',
  'Faridabad',
  'Aligarh',
  'Moradabad',
  'Mathura-Vrindavan',
  'Jhansi',
  'Ayodhya',
  'Saharanpur',
  'Muzaffarnagar',
  'Haridwar',
  'Rishikesh',
  'Haldwani',
  'Jalandhar',
  'Patiala',
  'Mohali',
  'Panipat',
  'Karnal',
  'Rohtak',
  'Kota',
  'Ajmer',
  'Bikaner',
  'Jammu',
  // South India (27)
  'Bengaluru',
  'Hyderabad',
  'Chennai',
  'Kochi',
  'Coimbatore',
  'Madurai',
  'Visakhapatnam',
  'Vijayawada',
  'Thiruvananthapuram',
  'Kozhikode',
  'Mysuru',
  'Mangaluru',
  'Tiruchirappalli',
  'Salem',
  'Tiruppur',
  'Vellore',
  'Erode',
  'Thanjavur',
  'Puducherry',
  'Warangal',
  'Tirupati',
  'Guntur',
  'Nellore',
  'Hubballi-Dharwad',
  'Belagavi',
  'Thrissur',
  'Kannur',
  // West India (17)
  'Mumbai',
  'Pune',
  'Ahmedabad',
  'Surat',
  'Vadodara',
  'Nagpur',
  'Nashik',
  'Goa (Panaji)',
  'Rajkot',
  'Thane',
  'Navi Mumbai',
  'Chhatrapati Sambhajinagar',
  'Kolhapur',
  'Solapur',
  'Bhavnagar',
  'Jamnagar',
  'Gandhinagar',
  // Central & East India (15)
  'Indore',
  'Bhopal',
  'Raipur',
  'Kolkata',
  'Patna',
  'Ranchi',
  'Bhubaneswar',
  'Jamshedpur',
  'Gwalior',
  'Jabalpur',
  'Ujjain',
  'Bilaspur',
  'Durg-Bhilai',
  'Siliguri',
  'Durgapur',
  // Northeast India (4)
  'Guwahati',
  'Shillong',
  'Agartala',
  'Imphal',
]);
export type IndianCity = z.infer<typeof IndianCitySchema>;

export const DietarySplitSchema = z.object({
  vegPct: z.number().min(0).max(100),
  jainPct: z.number().min(0).max(100),
  nonVegPct: z.number().min(0).max(100),
});
export type DietarySplit = z.infer<typeof DietarySplitSchema>;

export const EventBriefSchema = z.object({
  title: z.string().min(3),
  city: IndianCitySchema.optional(),
  attendees: z.number().min(20).max(10000),
  budget: z.number().min(50000), // Budget in INR (₹)
  tracks: z.array(z.string()).min(1),
  venueType: z.enum(['Convention Center', 'Luxury Hotel', 'Tech Campus']),
  dietarySplit: DietarySplitSchema.optional(),
  includeGst: z.boolean().optional(),
});
export type EventBrief = z.infer<typeof EventBriefSchema>;

export const VendorQuoteSchema = z.object({
  category: z.enum(['Venue', 'Catering', 'AV & Production']),
  vendorName: z.string(),
  cost: z.number(), // Base cost in INR (₹)
  gstAmount: z.number().optional(), // 18% GST in INR
  totalWithGst: z.number().optional(),
  rationale: z.string(),
});
export type VendorQuote = z.infer<typeof VendorQuoteSchema>;

export const SessionSchema = z.object({
  id: z.string(),
  title: z.string(),
  track: z.string(),
  speaker: z.string(),
  room: z.string(),
  startTime: z.string(), // "09:00"
  endTime: z.string(),   // "10:30"
  expectedAttendance: z.number(),
  roomCapacity: z.number(),
});
export type Session = z.infer<typeof SessionSchema>;

export const ToolCallTraceSchema = z.object({
  toolName: z.string(),
  inputSummary: z.string(),
  outputSummary: z.string(),
  durationMs: z.number(),
});
export type ToolCallTrace = z.infer<typeof ToolCallTraceSchema>;

export const ApprovalGateSchema = z.object({
  id: z.string(),
  agent: z.enum(['Procurement', 'LiveOps']),
  reason: z.string(),
  impactSummary: z.string(),
  status: z.enum(['pending', 'approved', 'rejected']),
});
export type ApprovalGate = z.infer<typeof ApprovalGateSchema>;

export const AgentLogSchema = z.object({
  agent: z.enum(['Orchestrator', 'Procurement', 'Scheduler', 'Critic', 'LiveOps', 'ROI']),
  message: z.string(),
  status: z.enum(['info', 'warning', 'success']),
  timestamp: z.string(),
  toolTraces: z.array(ToolCallTraceSchema).optional(),
});
export type AgentLog = z.infer<typeof AgentLogSchema>;