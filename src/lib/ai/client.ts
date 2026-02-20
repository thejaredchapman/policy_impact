import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";

export interface AIResponse {
  content: string;
  model: string;
  provider: string;
  usage: { inputTokens: number; outputTokens: number };
}

interface GenerateOptions {
  maxTokens?: number;
  temperature?: number;
  responseFormat?: "text" | "json";
}

interface AIClient {
  generate(
    systemPrompt: string,
    userMessage: string,
    options?: GenerateOptions
  ): Promise<AIResponse>;
}

function createOpenAIClient(): AIClient {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const defaultModel = process.env.AI_MODEL || "gpt-4o";

  return {
    async generate(systemPrompt, userMessage, options = {}) {
      const response = await client.chat.completions.create({
        model: defaultModel,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        max_tokens: options.maxTokens ?? 4096,
        temperature: options.temperature ?? 0.3,
        ...(options.responseFormat === "json" && {
          response_format: { type: "json_object" },
        }),
      });

      return {
        content: response.choices[0]?.message?.content ?? "",
        model: defaultModel,
        provider: "openai",
        usage: {
          inputTokens: response.usage?.prompt_tokens ?? 0,
          outputTokens: response.usage?.completion_tokens ?? 0,
        },
      };
    },
  };
}

function createAnthropicClient(): AIClient {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const defaultModel = process.env.AI_MODEL || "claude-sonnet-4-20250514";

  return {
    async generate(systemPrompt, userMessage, options = {}) {
      const response = await client.messages.create({
        model: defaultModel,
        max_tokens: options.maxTokens ?? 4096,
        temperature: options.temperature ?? 0.3,
        system: systemPrompt,
        messages: [{ role: "user", content: userMessage }],
      });

      const textBlock = response.content.find((b) => b.type === "text");
      return {
        content: textBlock?.text ?? "",
        model: defaultModel,
        provider: "anthropic",
        usage: {
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
        },
      };
    },
  };
}

export function createAIClient(): AIClient {
  const provider = process.env.AI_PROVIDER || "anthropic";
  if (provider === "openai") {
    return createOpenAIClient();
  }
  return createAnthropicClient();
}

export const ai = createAIClient();
