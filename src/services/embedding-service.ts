import { GoogleGenAI } from '@google/genai';
import { config } from '../config/index.js';

const ai = new GoogleGenAI({ apiKey: config.gemini.apiKey });

/**
 * Calls the Google Gemini Embedding Model for image inputs.
 */
export const generateImageEmbedding = async (imageBuffer: Buffer): Promise<number[]> => {
  if (!config.gemini.apiKey) {
    throw new Error('GEMINI_API_KEY is not configured.');
  }

  const base64Image = imageBuffer.toString('base64');

  const response = await ai.models.embedContent({
    model: config.gemini.modelName,
    contents: [
      {
        role: 'user',
        parts: [
          {
            inlineData: {
              data: base64Image,
              mimeType: 'image/jpeg'
            }
          }
        ]
      }
    ]
  });

  const embeddingValues = response.embeddings?.[0]?.values;
  if (!embeddingValues) {
    throw new Error('Failed to generate embedding from Gemini API.');
  }

  return embeddingValues;
};
