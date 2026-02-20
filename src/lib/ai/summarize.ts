import { ai } from "./client";
import { SUMMARY_PROMPT, CUSTOM_SUMMARY_PROMPT } from "./prompts";
import { LOADED_WORDS } from "../utils/constants";
import type { AISummaryResponse } from "@/types";

function validateNeutrality(text: string): {
  isNeutral: boolean;
  issues: string[];
} {
  const found = LOADED_WORDS.filter((w) =>
    text.toLowerCase().includes(w.toLowerCase())
  );
  return { isNeutral: found.length === 0, issues: found };
}

export async function generateSummary(
  rawText: string
): Promise<{ summary: AISummaryResponse; model: string; provider: string }> {
  const truncated =
    rawText.length > 15000 ? rawText.slice(0, 15000) + "\n[truncated]" : rawText;

  let response = await ai.generate(SUMMARY_PROMPT, truncated, {
    responseFormat: "json",
    temperature: 0.2,
  });

  // Validate neutrality and retry once if needed
  const check = validateNeutrality(response.content);
  if (!check.isNeutral) {
    const correctionMessage = `${truncated}\n\nIMPORTANT: Your previous response contained loaded words (${check.issues.join(", ")}). Rewrite without any of these words. Be strictly factual and neutral.`;
    response = await ai.generate(SUMMARY_PROMPT, correctionMessage, {
      responseFormat: "json",
      temperature: 0.1,
    });
  }

  const parsed = JSON.parse(response.content) as AISummaryResponse;
  return {
    summary: parsed,
    model: response.model,
    provider: response.provider,
  };
}

export async function generateCustomSummary(
  topic: string,
  policyTexts: string[]
): Promise<string> {
  const combined = policyTexts
    .map((t, i) => `--- Policy ${i + 1} ---\n${t}`)
    .join("\n\n");

  const truncated =
    combined.length > 20000
      ? combined.slice(0, 20000) + "\n[truncated]"
      : combined;

  const userMessage = `Topic: ${topic}\n\nRelevant policy changes:\n${truncated}`;

  const response = await ai.generate(CUSTOM_SUMMARY_PROMPT, userMessage, {
    responseFormat: "text",
    temperature: 0.3,
    maxTokens: 2048,
  });

  return response.content;
}
