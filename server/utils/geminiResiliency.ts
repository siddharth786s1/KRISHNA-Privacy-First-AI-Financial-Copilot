import { GoogleGenAI, GenerateContentParameters, GenerateContentResponse } from '@google/genai';

/**
 * Executes a Gemini content generation call with automatic exponential backoff retry on 
 * typical transient API failures (such as HTTP 503 high demand or HTTP 429 rate limit).
 * If all retries for the default model fail, it fails-over to the 'gemini-3.1-flash-lite'
 * low-latency alias to ensure continuous service availability.
 */
export async function generateContentWithRetry(
  ai: GoogleGenAI,
  params: GenerateContentParameters,
  maxRetries = 4,
  initialDelayMs = 600
): Promise<GenerateContentResponse> {
  let attempt = 0;
  let delay = initialDelayMs;

  while (attempt < maxRetries) {
    try {
      const response = await ai.models.generateContent(params);
      return response;
    } catch (err: any) {
      attempt++;
      
      const errorMessage = (err.message || '').toUpperCase();
      const isTransient = 
        err.status === 503 ||
        err.status === 429 ||
        errorMessage.includes('503') ||
        errorMessage.includes('HIGH DEMAND') ||
        errorMessage.includes('UNAVAILABLE') ||
        errorMessage.includes('LIMIT EXCEEDED') ||
        errorMessage.includes('429');

      if (!isTransient || attempt >= maxRetries) {
        // If the model continues to be unavailable, switch to fallback model gemini-3.1-flash-lite
        if (params.model === 'gemini-3.5-flash' && isTransient) {
          console.warn(`[Gemini Resiliency] Model 'gemini-3.5-flash' is overloaded or unavailable. Trying alternative fallback 'gemini-3.1-flash-lite'...`);
          const fallbackParams = { ...params, model: 'gemini-3.1-flash-lite' };
          try {
            const response = await ai.models.generateContent(fallbackParams);
            console.log('[Gemini Resiliency] Successfully completed content generation using fallback model: gemini-3.1-flash-lite.');
            return response;
          } catch (fallbackErr: any) {
            console.error('[Gemini Resiliency] Fallback model gemini-3.1-flash-lite also failed:', fallbackErr);
            throw fallbackErr;
          }
        }
        throw err;
      }

      console.warn(`[Gemini Resiliency] Attempt ${attempt} failed with transient error: "${err.message || 'unknown'}". Retrying in ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay *= 1.8; // gradual exponential expand factor
    }
  }

  throw new Error('Gemini generation request exhausted all retries.');
}

/**
 * Robust JSON parser designed to safely extract, clean, and parse structured 
 * data returned from models. It handles markdown triple-fences, trailing commas, 
 * unescaped newlines, and trailing/leading conversational noise.
 */
export function safeParseJSON<T = any>(text: string): T {
  if (!text) {
    return {} as T;
  }

  let cleaned = text.trim();

  // 1. Strip markdown json block wrappers if they exist
  if (cleaned.startsWith('```')) {
    const match = cleaned.match(/^```(?:json)?\s*([\s\S]*?)\s*```/);
    if (match) {
      cleaned = match[1].trim();
    }
  }

  // 2. Remove leading/trailing conversational junk around the main JSON block '{' or '['
  const firstBrace = cleaned.indexOf('{');
  const firstBracket = cleaned.indexOf('[');

  if (firstBrace !== -1 || firstBracket !== -1) {
    let startIdx = 0;
    if (firstBrace !== -1 && firstBracket !== -1) {
      startIdx = Math.min(firstBrace, firstBracket);
    } else {
      startIdx = firstBrace !== -1 ? firstBrace : firstBracket;
    }

    const lastBrace = cleaned.lastIndexOf('}');
    const lastBracket = cleaned.lastIndexOf(']');
    let endIdx = cleaned.length;

    if (lastBrace !== -1 && lastBracket !== -1) {
      endIdx = Math.max(lastBrace, lastBracket) + 1;
    } else {
      endIdx = (lastBrace !== -1 ? lastBrace : lastBracket) + 1;
    }

    if (endIdx > startIdx) {
      cleaned = cleaned.slice(startIdx, endIdx);
    }
  }

  // 3. Rectify standard trailing commas within objects or arrays: e.g. {"a":1,} or [1,2,]
  cleaned = cleaned.replace(/,(\s*[}\]])/g, '$1');

  try {
    return JSON.parse(cleaned) as T;
  } catch (err: any) {
    console.warn('[JSON Repair Engine] Standard JSON parse failed. Initiating deep string sanitation:', err.message);
    try {
      // Clean up common unescaped control codes and tabs inside string properties
      const secondaryClean = cleaned
        // Replace unescaped double-quotes inside string property values, but this is risky
        // Let's replace raw carriage returns and unescaped linefeeds within strings safely:
        .replace(/[\r\n\t]+/g, ' ')
        .replace(/[\u0000-\u001F]+/g, ' ')
        .trim();
      return JSON.parse(secondaryClean) as T;
    } catch (innerErr: any) {
      console.error('[JSON Repair Engine] Real JSON parsing failed even after deep cleanup. Source text preview:', cleaned.substring(0, 300));
      throw new Error(`Structured JSON parsing failed: ${err.message}. Source: ${cleaned.substring(0, 50)}...`);
    }
  }
}
