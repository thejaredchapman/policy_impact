import { ai } from "./client";
import { IMPACT_RATING_PROMPT, TRIAGE_PROMPT } from "./prompts";
import { DEMOGRAPHIC_MATRIX } from "../utils/constants";
import type { DemographicCategory } from "@prisma/client";
import type { AIImpactResponse, AITriageResponse } from "@/types";

export async function triageRelevantCategories(
  policyTitle: string,
  policySummary: string
): Promise<DemographicCategory[]> {
  const userMessage = `Policy: ${policyTitle}\n\nSummary: ${policySummary}`;

  const response = await ai.generate(TRIAGE_PROMPT, userMessage, {
    responseFormat: "json",
    temperature: 0.1,
    maxTokens: 256,
  });

  const parsed = JSON.parse(response.content) as AITriageResponse;
  return parsed.relevantCategories;
}

export async function generateImpactRatings(
  policyTitle: string,
  policySummary: string,
  policyText: string,
  categories: DemographicCategory[]
): Promise<{
  ratings: AIImpactResponse[];
  model: string;
  provider: string;
}> {
  // Build the subcategory list for only relevant categories
  const demographicList: { category: string; subcategory: string }[] = [];
  for (const cat of categories) {
    if (cat === "US_STATE") {
      demographicList.push({ category: cat, subcategory: "See policy text for affected states" });
    } else {
      const subcategories = DEMOGRAPHIC_MATRIX[cat];
      for (const sub of subcategories) {
        demographicList.push({ category: cat, subcategory: sub });
      }
    }
  }

  const truncatedText =
    policyText.length > 12000
      ? policyText.slice(0, 12000) + "\n[truncated]"
      : policyText;

  const userMessage = `Policy: ${policyTitle}

Summary: ${policySummary}

Full text:
${truncatedText}

Rate the impact on these demographics:
${JSON.stringify(demographicList, null, 2)}`;

  const response = await ai.generate(IMPACT_RATING_PROMPT, userMessage, {
    responseFormat: "json",
    temperature: 0.2,
    maxTokens: 4096,
  });

  let parsed: AIImpactResponse[];
  const content = response.content.trim();
  // Handle both array and object-wrapped responses
  const data = JSON.parse(content);
  if (Array.isArray(data)) {
    parsed = data;
  } else if (data.ratings && Array.isArray(data.ratings)) {
    parsed = data.ratings;
  } else {
    parsed = [data];
  }

  // Enforce score bounds and confidence bounds
  parsed = parsed.map((r) => ({
    ...r,
    score: Math.max(-2, Math.min(2, Math.round(r.score))),
    confidence: Math.max(0, Math.min(1, r.confidence)),
    // Default low-confidence items to neutral
    ...(r.confidence < 0.2 ? { score: 0 } : {}),
  }));

  return {
    ratings: parsed,
    model: response.model,
    provider: response.provider,
  };
}

export async function analyzePolicy(
  policyTitle: string,
  policySummary: string,
  policyText: string
): Promise<{
  ratings: AIImpactResponse[];
  model: string;
  provider: string;
}> {
  // Phase 1: Triage
  const relevantCategories = await triageRelevantCategories(
    policyTitle,
    policySummary
  );

  if (relevantCategories.length === 0) {
    return { ratings: [], model: "", provider: "" };
  }

  // Phase 2: Detailed ratings for relevant categories only
  return generateImpactRatings(
    policyTitle,
    policySummary,
    policyText,
    relevantCategories
  );
}
