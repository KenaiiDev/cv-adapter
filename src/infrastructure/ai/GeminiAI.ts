import type { Profile } from "../../domain/entities/Profile.js";
import type { CVData } from "../../domain/entities/CVData.js";
import type { Language } from "../../interfaces/IAIProvider.js";
import { BaseAIProvider } from "./base.js";
import { PromptBuilder, type PromptOptions } from "./PromptBuilder.js";
import { DomainError } from "../../domain/errors/DomainError.js";

const promptBuilder = new PromptBuilder();

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
}

export class GeminiAI extends BaseAIProvider {
  getProviderName(): string {
    return "gemini";
  }

  getModel(): string {
    return "gemini-2.5-flash";
  }

  getEndpoint(): string {
    return "https://generativelanguage.googleapis.com/v1beta";
  }

  protected getAPIKey(): string {
    const key = process.env.AI_API_KEY;
    if (!key) {
      throw new DomainError(
        "Gemini API key not configured",
        "AI_ERROR",
        "Set AI_API_KEY in your .env file",
      );
    }
    return key;
  }

  protected buildPrompt(
    profile: Profile,
    vacancy: string,
    language: Language,
    options: PromptOptions,
  ): string {
    return promptBuilder.build(profile, vacancy, language, options);
  }

  protected async callAPI(prompt: string): Promise<string> {
    const url = `${this.getEndpoint()}/models/${this.getModel()}:generateContent?key=${this.getAPIKey()}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 4096,
          responseMimeType: "application/json",
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new DomainError(
        `Gemini API error: ${response.status} - ${error}`,
        "AI_ERROR",
        "Check your AI_API_KEY and try again",
      );
    }

    const data = (await response.json()) as GeminiResponse;
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  }

  protected parseResponse(content: string): Partial<CVData> {
    try {
      return JSON.parse(content.trim());
    } catch {
      throw new DomainError(
        "Failed to parse Gemini response as JSON",
        "AI_ERROR",
        "The AI returned an invalid format. Try regenerating.",
      );
    }
  }
}

export const geminiAI = new GeminiAI();
