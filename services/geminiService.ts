
import { GoogleGenAI, Modality } from "@google/genai";

export const identifyPokemonFromImage = async (base64Data: string): Promise<string | null> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [
      {
        inlineData: {
          mimeType: 'image/jpeg',
          data: base64Data,
        },
      },
      {
        text: "Identify the Pokemon in this image. Return ONLY the name of the Pokemon in lowercase English. If you cannot find a Pokemon, return the word 'unknown'.",
      },
    ],
  });

  const name = response.text?.trim().toLowerCase();
  return name === 'unknown' ? null : name;
};

export const generatePokemonSpeech = async (text: string): Promise<string | undefined> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const sanitizedText = text.substring(0, 500);
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: `Read this Pokedex entry clearly: ${sanitizedText}` }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' },
        },
      },
    },
  });

  return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
};
