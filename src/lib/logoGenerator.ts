import { GoogleGenAI } from "@google/genai";

export async function generatePlumbingLogo() {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('Gemini API Key missing, skipping logo generation');
    return null;
  }
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          text: 'A professional and modern logo for a plumbing business named "Eric Soluzioni Idraulici". The logo should feature a stylized wrench and a water drop in a minimalist, clean design. Colors: Professional deep blue and silver. White background. High resolution, vector style.',
        },
      ],
    },
    config: {
      imageConfig: {
        aspectRatio: "1:1",
      },
    },
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  return null;
}
