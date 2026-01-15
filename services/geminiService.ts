
import { GoogleGenAI, Type } from "@google/genai";
import { UserPreferences, Recommendation } from "../types";

export const getRecommendations = async (prefs: UserPreferences): Promise<Recommendation[]> => {
  const eraContext = prefs.era_preference.map(e => {
    if (e === 'Retro vibe') return 'released before year 2000';
    if (e === 'Millennial choice') return 'released between 2000 and 2020';
    if (e === 'GenZ rizz') return 'released from 2020 onwards';
    return '';
  }).join(' or ');

  const prompt = `Based on the following user preferences, recommend 10-15 movie or series titles. 
  
  User Input:
  - Vibes: ${prefs.vibes.join(', ')}
  - Content Types: ${prefs.content_type.join(', ')}
  - Language Preference: ${prefs.language_preference.join(', ')}
  - Era Preference: ${prefs.era_preference.join(', ')} (Target content ${eraContext})
  - Context (Magic Text): ${prefs.magic_text || "None provided"}

  Rules:
  - Only recommend ALREADY RELEASED content.
  - Strictly respect content type filters.
  - Respect the era preference if provided.
  - Provide a balanced mix of hits and hidden gems.
  - Internal relevance_score should be 0-100.
  - Sort results by relevance_score descending.
  - The "type" field MUST be either 'movie' or 'series'.
  - Return in the exact JSON schema requested.
  `;

  return executeGeminiRequest(prompt, 'gemini-3-flash-preview');
};

export const getRecommendationsByMovies = async (movieList: string): Promise<Recommendation[]> => {
  const prompt = `Deeply analyze the user's taste based on these movies they love: "${movieList}".
  
  Identify hidden similarities: primary/secondary genres, mood, themes, narrative structure, pacing, director sensibilities, and cultural context.
  Understand the "taste profile" behind these picks.

  Rules:
  - Recommend exactly 5 high-quality recommendations.
  - ❌ Do NOT recommend any movie already listed in the user input.
  - ❌ Do NOT recommend unreleased or upcoming movies.
  - ❌ Avoid ultra-generic picks (e.g., Inception, Shawshank, Avengers) unless essential.
  - Respect the original language/vibe if evident but feel free to suggest global gems.
  - The "type" field MUST be either 'movie' or 'series'.
  - Return the response in the exact JSON schema.
  `;

  return executeGeminiRequest(prompt, 'gemini-3-pro-preview', true);
};

const executeGeminiRequest = async (prompt: string, model: string, useThinking: boolean = false): Promise<Recommendation[]> => {
  // CRITICAL: Vite ONLY injects variables if they use 'import.meta.env'
  // @ts-ignore
  const apiKey = import.meta.env?.VITE_API_KEY || (process.env as any).VITE_API_KEY;
  
  if (!apiKey || apiKey === "undefined" || apiKey === "null" || apiKey.trim() === "") {
    console.error("API_KEY is missing. In Vercel, ensure you renamed it to VITE_API_KEY and triggered a NEW deployment.");
    throw new Error("API_KEY_MISSING");
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        thinkingConfig: useThinking ? { thinkingBudget: 4000 } : undefined,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recommendations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  type: { 
                    type: Type.STRING,
                    description: "Must be 'movie' or 'series'"
                  },
                  language: { type: Type.STRING },
                  release_year: { type: Type.INTEGER },
                  relevance_score: { type: Type.INTEGER },
                  one_line_reason: { type: Type.STRING },
                },
                required: ["title", "type", "language", "release_year", "relevance_score", "one_line_reason"]
              }
            }
          },
          required: ["recommendations"]
        }
      }
    });

    const text = response.text;
    if (!text) return [];

    const data = JSON.parse(text);
    return data.recommendations || [];
  } catch (error: any) {
    if (error?.message?.includes("API Key must be set")) {
      throw new Error("API_KEY_MISSING");
    }
    console.error("Gemini Execution Error:", error);
    throw error;
  }
};
