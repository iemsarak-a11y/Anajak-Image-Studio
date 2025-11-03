import { GoogleGenAI, Modality } from "@google/genai";
import { GenerativePart } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

async function fileToGenerativePart(file: File): Promise<GenerativePart> {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: {
      data: await base64EncodedDataPromise,
      mimeType: file.type,
    },
  };
}

export async function fileToDataUrl(file: File): Promise<string> {
  return new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
  });
}

export async function generateTextFromImageAndText(prompt: string, image: File): Promise<string> {
  const imagePart = await fileToGenerativePart(image);
  const textPart = { text: prompt };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ parts: [textPart, imagePart] }],
    });
    return response.text;
  } catch (error) {
    console.error("Error generating text from image:", error);
    throw new Error("Failed to get a response from the AI. Please check the console for details.");
  }
}

export async function generateImageFromText(prompt: string): Promise<string[]> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    const images: string[] = [];
    response.candidates?.forEach(candidate => {
        candidate.content?.parts?.forEach(part => {
            if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
                const base64ImageBytes = part.inlineData.data;
                const mimeType = part.inlineData.mimeType;
                images.push(`data:${mimeType};base64,${base64ImageBytes}`);
            }
        });
    });

    if (images.length === 0) {
      throw new Error("No image data found in the response.");
    }
    return images;

  } catch (error) {
    console.error("Error generating image:", error);
    throw new Error("Failed to generate the image. Please check your prompt and try again.");
  }
}

export async function editImageWithText(prompt: string, image: File): Promise<string[]> {
  const imagePart = await fileToGenerativePart(image);
  const textPart = { text: prompt };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [{ parts: [imagePart, textPart] }],
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    const images: string[] = [];
    response.candidates?.forEach(candidate => {
        candidate.content?.parts?.forEach(part => {
            if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
                const base64ImageBytes = part.inlineData.data;
                const mimeType = part.inlineData.mimeType;
                images.push(`data:${mimeType};base64,${base64ImageBytes}`);
            }
        });
    });

    if (images.length === 0) {
      throw new Error("No edited image data found in the response.");
    }
    return images;
    
  } catch (error) {
    console.error("Error editing image:", error);
    throw new Error("Failed to edit the image. Please check your prompt and image and try again.");
  }
}
