import { z } from 'zod';

export const EventBriefSchema = z.object({
  title: z.string().min(3),
  attendees: z.number().min(50).max(5000),
  budget: z.number().min(5000),
  tracks: z.array(z.string()).min(1),
  venueType: z.enum(['Convention Center', 'Luxury Hotel', 'Tech Campus']),
});

export const VendorQuoteSchema = z.object({
  category: z.enum(['Venue', 'Catering', 'AV & Production']),
  vendorName: z.string(),
  cost: z.number(),
  rationale: z.string(),
});

export const SessionSchema = z.object({
  id: z.string(),
  title: z.string(),
  speaker: z.string(),
  track: z.string(),
  room: z.string(),
  roomCapacity: z.number(),
  startTime: z.string(), // e.g., "09:00"
  endTime: z.string(),   // e.g., "10:00"
  expectedAttendance: z.number(),
});

export const AgentLogSchema = z.object({
  agent: z.enum(['Orchestrator', 'Procurement', 'Scheduler', 'Critic', 'LiveOps', 'ROI']),
  message: z.string(),
  status: z.enum(['info', 'warning', 'success']),
  timestamp: z.string(),
});

export type EventBrief = z.infer<typeof EventBriefSchema>;
export type VendorQuote = z.infer<typeof VendorQuoteSchema>;
export type Session = z.infer<typeof SessionSchema>;
export type AgentLog = z.infer<typeof AgentLogSchema>;

export interface EventBlackboard {
  brief: EventBrief;
  quotes: VendorQuote[];
  sessions: Session[];
  conflictsResolved: number;
  activeCrisis?: string;
  logs: AgentLog[];
}