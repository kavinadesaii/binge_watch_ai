
import { GoogleGenAI, Type } from "@google/genai";
import { UserPreferences, Recommendation } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

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
  - Return in the exact JSON schema requested.
  `;

  return executeGeminiRequest(prompt);
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
  - Return the response in the exact JSON schema.
  `;

  return executeGeminiRequest(prompt);
};

const executeGeminiRequest = async (prompt: string): Promise<Recommendation[]> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recommendations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  type: { type: Type.STRING },
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

    const data = JSON.parse(response.text || '{"recommendations":[]}');
    return data.recommendations;
  } catch (error) {
    console.error("Gemini Error:", error);
    return [];
  }
};
