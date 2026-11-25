import { google } from '@ai-sdk/google';
import { generateText, Output } from 'ai';
import { z } from 'zod';
import type { ToolCallTrace } from '@/types/blackboard';

const PRIMARY_MODEL = 'gemini-2.5-flash';

export interface AgentToolDefinition<TInput extends z.ZodTypeAny = z.ZodTypeAny> {
  description: string;
  inputSchema: TInput;
  execute: (args: z.infer<TInput>) => Promise<unknown> | unknown;
}

export async function generateStructured<T extends z.ZodTypeAny>(
  schema: T,
  prompt: string,
  modelId: string = PRIMARY_MODEL
): Promise<z.infer<T>> {
  const { output } = await generateText({
    model: google(modelId),
    output: Output.object({ schema }),
    prompt,
    maxRetries: 1,
    abortSignal: AbortSignal.timeout(12000),
  });
  return output;
}

export async function runReActToolAgent<TOutput extends z.ZodTypeAny>(options: {
  systemPrompt: string;
  userPrompt: string;
  tools: Record<string, AgentToolDefinition>;
  outputSchema: TOutput;
  maxSteps?: number;
  modelId?: string;
}): Promise<{ result: z.infer<TOutput>; traces: ToolCallTrace[] }> {
  const {
    systemPrompt,
    userPrompt,
    tools,
    outputSchema,
    maxSteps = 3,
    modelId = PRIMARY_MODEL,
  } = options;

  const traces: ToolCallTrace[] = [];
  const history: string[] = [`GOAL:\n${userPrompt}`];

  const toolCatalogText = Object.entries(tools)
    .map(([name, def]) => `- ${name}: ${def.description}`)
    .join('\n');

  const stepDecisionSchema = z.object({
    thought: z.string().describe('Concise reasoning step before choosing a tool or concluding'),
    toolCall: z
      .object({
        name: z.string(),
        argsJson: z.string().describe('Valid JSON string matching the tool inputSchema'),
      })
      .optional(),
    finalOutput: outputSchema.optional(),
  });

  for (let step = 1; step <= maxSteps; step++) {
    const mustCallTool = traces.length === 0 && step < maxSteps;

    const prompt = `${systemPrompt}

AVAILABLE TOOLS:
${toolCatalogText}

EXECUTION RULES:
1. ${
      mustCallTool
        ? 'You have NOT executed any tool yet. You MUST set "toolCall" in this step and omit "finalOutput".'
        : 'Once tool observations are gathered, omit "toolCall" and return "finalOutput".'
    }
2. Keep "argsJson" as a valid JSON string.

TRACE SO FAR:
${history.join('\n\n')}`;

    const decision = await generateStructured(stepDecisionSchema, prompt, modelId);

    if (decision.finalOutput !== undefined && !mustCallTool) {
      return { result: decision.finalOutput, traces };
    }

    if (decision.toolCall && tools[decision.toolCall.name]) {
      const toolName = decision.toolCall.name;
      const toolDef = tools[toolName];
      const start = Date.now();

      try {
        const parsedRaw = JSON.parse(decision.toolCall.argsJson);
        const validArgs = toolDef.inputSchema.parse(parsedRaw);
        const observation = await toolDef.execute(validArgs);
        const durationMs = Math.max(1, Date.now() - start);
        const obsString = JSON.stringify(observation);

        traces.push({
          toolName,
          inputSummary:
            decision.toolCall.argsJson.length > 140
              ? `${decision.toolCall.argsJson.slice(0, 137)}...`
              : decision.toolCall.argsJson,
          outputSummary:
            obsString.length > 180 ? `${obsString.slice(0, 177)}...` : obsString,
          durationMs,
        });

        history.push(
          `STEP ${step} THOUGHT: ${decision.thought}\nTOOL: ${toolName}(${decision.toolCall.argsJson})\nOBSERVATION: ${obsString}`
        );
      } catch (toolErr) {
        const errMessage =
          toolErr instanceof Error ? toolErr.message : 'Invalid tool arguments or execution failure';
        traces.push({
          toolName,
          inputSummary: decision.toolCall.argsJson.slice(0, 120),
          outputSummary: `ERROR: ${errMessage}`,
          durationMs: Math.max(1, Date.now() - start),
        });
        history.push(
          `STEP ${step} THOUGHT: ${decision.thought}\nTOOL ERROR (${toolName}): ${errMessage}`
        );
      }
    }
  }

  const finalResult = await generateStructured(
    outputSchema,
    `${systemPrompt}\n\nSynthesize finalOutput from this trace:\n${history.join('\n\n')}`,
    modelId
  );

  return { result: finalResult, traces };
}