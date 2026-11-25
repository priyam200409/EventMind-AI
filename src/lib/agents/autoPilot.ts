import type {
  AgentLog,
  ApprovalGate,
  EventBrief,
  Session,
  VendorQuote,
} from '@/types/blackboard';
import type { RoiResult } from '@/lib/agents/roiMatch';
import {
  runAutonomousCrisisAgent,
  runAutonomousPlanAgent,
  runAutonomousRoiAgent,
} from '@/lib/agents/autonomousOrchestrator';

export interface AutoPilotResult {
  quotes: VendorQuote[];
  sessions: Session[];
  conflictsResolved: number;
  approvalGate: ApprovalGate | null;
  alertMessage?: string;
  whatsappBroadcast?: string;
  roi: RoiResult;
  logs: AgentLog[];
}

export async function runFullAutoPilot(params: {
  brief: EventBrief;
  autoCrisisLabel?: string;
}): Promise<AutoPilotResult> {
  const { brief, autoCrisisLabel } = params;
  const city = brief.city ?? 'Bengaluru';
  const collectedLogs: AgentLog[] = [];

  collectedLogs.push({
    agent: 'Orchestrator',
    message: `Auto-Pilot engaged for "${brief.title}" in ${city}. Running full autonomous chain...`,
    status: 'info',
    timestamp: new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }),
  });

  // 1. Run Autonomous Procurement + GST + IST Scheduler Agent
  const plan = await runAutonomousPlanAgent(brief);
  collectedLogs.push(...plan.logs);

  // 2. Run Autonomous LiveOps Crisis Agent (if scenario provided)
  let sessions = plan.sessions;
  let alertMessage: string | undefined;
  let whatsappBroadcast: string | undefined;
  let approvalGate: ApprovalGate | null = plan.approvalGate;

  if (autoCrisisLabel && autoCrisisLabel.trim().length > 0) {
    const crisisRun = await runAutonomousCrisisAgent({
      city,
      crisis: autoCrisisLabel.trim(),
      sessions,
    });
    sessions = crisisRun.sessions;
    alertMessage = crisisRun.alertMessage;
    whatsappBroadcast = crisisRun.whatsappBroadcast;
    approvalGate = crisisRun.approvalGate ?? approvalGate;
    collectedLogs.push(...crisisRun.logs);
  }

  // 3. Run Autonomous ROEI & B2B Sponsor Matchmaking Agent
  const roiRun = await runAutonomousRoiAgent({
    brief,
    quotes: plan.quotes,
    sessions,
  });
  collectedLogs.push(...roiRun.logs);

  const normalizedRoi: RoiResult = {
    ...roiRun.roi,
    roiMultiplier:
      typeof roiRun.roi.roiMultiplier === 'string'
        ? roiRun.roi.roiMultiplier
        : `${roiRun.roi.roiMultiplier}x`,
  };

  return {
    quotes: plan.quotes,
    sessions,
    conflictsResolved: plan.conflictsResolved,
    approvalGate,
    alertMessage,
    whatsappBroadcast,
    roi: normalizedRoi,
    logs: collectedLogs,
  };
}