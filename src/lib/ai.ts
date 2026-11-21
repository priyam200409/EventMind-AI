import { google } from '@ai-sdk/google';
import { generateText, Output } from 'ai';
import { z } from 'zod';

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