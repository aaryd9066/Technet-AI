import { GoogleGenAI, Modality, Type, ThinkingLevel } from "@google/genai";

const getAI = () => new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const chatWithGemini = async (message: string, history: any[] = []) => {
  const ai = getAI();
  const chat = ai.chats.create({
    model: "gemini-3.1-flash-lite-preview",
    config: {
      systemInstruction: "You are Technet AI, a helpful and minimalist assistant. Keep responses concise and professional.",
    },
  });

  const response = await chat.sendMessage({ message });
  return response.text;
};

export const generateImage = async (prompt: string) => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-image-preview",
    contents: { parts: [{ text: prompt }] },
    config: {
      imageConfig: {
        aspectRatio: "1:1",
        imageSize: "1K",
      },
    },
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("No image generated");
};

export const editImage = async (base64Image: string, prompt: string) => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: {
      parts: [
        {
          inlineData: {
            data: base64Image.split(",")[1],
            mimeType: "image/png",
          },
        },
        { text: prompt },
      ],
    },
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("No edited image generated");
};

export const startVideoGeneration = async (prompt: string) => {
  const ai = getAI();
  let operation = await ai.models.generateVideos({
    model: "veo-3.1-fast-generate-preview",
    prompt,
    config: {
      numberOfVideos: 1,
      resolution: "720p",
      aspectRatio: "16:9",
    },
  });
  return operation;
};

export const pollVideoOperation = async (operation: any) => {
  const ai = getAI();
  let currentOp = operation;
  while (!currentOp.done) {
    await new Promise((resolve) => setTimeout(resolve, 5000));
    currentOp = await ai.operations.getVideosOperation({ operation: currentOp });
  }
  return currentOp.response?.generatedVideos?.[0]?.video?.uri;
};
