import { google } from '@ai-sdk/google';
import { generateText, Output } from 'ai';
import { z } from 'zod';
import { ToolCallTrace } from '@/types/blackboard';

const MODELS = ['gemini-3.8-flash', 'gemini-3.5-flash-lite', 'gemini-3.6-flash'];

export async function generateStructured<T extends z.ZodTypeAny>(
  schema: T,
  prompt: string
): Promise<z.infer<T>> {
  let lastError: unknown;

  for (const modelId of MODELS) {
    try {
      const { output } = await generateText({
        model: google(modelId),
        output: Output.object({ schema }),
        prompt,
        maxRetries: 1,
      });
      return output;
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError;
}

export interface AgentToolDefinition<TInput extends z.ZodTypeAny = z.ZodTypeAny> {
  description: string;
  inputSchema: TInput;
  execute: (args: z.infer<TInput>) => Promise<unknown> | unknown;
}

export async function runReActToolAgent<TOutput extends z.ZodTypeAny>(options: {
  systemPrompt: string;
  userPrompt: string;
  tools: Record<string, AgentToolDefinition>;
  outputSchema: TOutput;
  maxSteps?: number;
}): Promise<{ result: z.infer<TOutput>; traces: ToolCallTrace[] }> {
  const { systemPrompt, userPrompt, tools, outputSchema, maxSteps = 4 } = options;
  const traces: ToolCallTrace[] = [];
  const history: string[] = [`USER GOAL:\n${userPrompt}`];

  const toolDescriptions = Object.entries(tools)
    .map(([name, def]) => `- ${name}: ${def.description}`)
    .join('\n');

  const stepSchema = z.object({
    thought: z.string(),
    toolCall: z
      .object({
        name: z.string(),
        argsJson: z.string(),
      })
      .optional(),
    finalResult: outputSchema.optional(),
  });

  for (let step = 1; step <= maxSteps; step++) {
    const prompt = `${systemPrompt}

AVAILABLE TOOLS:
${toolDescriptions}

RULES:
- First call tools to gather real facts and verify exact numbers before producing finalResult.
- When calling a tool, set "toolCall" with exact tool "name" and valid JSON string "argsJson", and leave "finalResult" empty.
- Once all required tools have been executed and verified, leave "toolCall" empty and populate "finalResult".

EXECUTION TRACE SO FAR:
${history.join('\n\n')}`;

    const decision = await generateStructured(stepSchema, prompt);

    if (decision.finalResult !== undefined) {
      return { result: decision.finalResult, traces };
    }

    if (decision.toolCall && tools[decision.toolCall.name]) {
      const toolName = decision.toolCall.name;
      const toolDef = tools[toolName];
      const start = Date.now();

      try {
        const rawArgs = JSON.parse(decision.toolCall.argsJson);
        const parsedArgs = toolDef.inputSchema.parse(rawArgs);
        const observation = await toolDef.execute(parsedArgs);
        const durationMs = Math.max(1, Date.now() - start);
        const obsJson = JSON.stringify(observation);

        traces.push({
          toolName,
          inputSummary: decision.toolCall.argsJson,
          outputSummary: obsJson.length > 180 ? `${obsJson.slice(0, 177)}...` : obsJson,
          durationMs,
        });

        history.push(
          `STEP ${step} THOUGHT: ${decision.thought}\nACTION: Called ${toolName}(${decision.toolCall.argsJson})\nOBSERVATION: ${obsJson}`
        );
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : 'Tool execution error';
        history.push(
          `STEP ${step} THOUGHT: ${decision.thought}\nACTION ERROR (${toolName}): ${errMsg}. Fix arguments and retry.`
        );
      }
    }
  }

  const fallback = await generateStructured(
    outputSchema,
    `${systemPrompt}\n\nBased on these observations, produce the final structured output:\n${history.join('\n\n')}`
  );
  return { result: fallback, traces };
}