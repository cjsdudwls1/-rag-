import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { DocumentChunk } from '../types';

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing via process.env.API_KEY");
  }
  return new GoogleGenAI({ apiKey });
};

/**
 * Generates embeddings for a given text.
 * Uses text-embedding-004 model.
 */
export const generateEmbedding = async (text: string): Promise<number[]> => {
  const ai = getAiClient();
  // Using the newer embedContent structure from @google/genai
  const result = await ai.models.embedContent({
    model: "text-embedding-004",
    contents: text, 
  });

  if (!result.embeddings || result.embeddings.length === 0) {
    throw new Error("Failed to generate embedding");
  }

  // values is the vector array
  return result.embeddings[0].values;
};

/**
 * Generates a chat response using Gemini Flash based on retrieved context.
 */
export const generateRAGResponse = async (
  query: string,
  contextChunks: DocumentChunk[]
): Promise<string> => {
  const ai = getAiClient();
  
  const contextText = contextChunks.map(chunk => chunk.text).join("\n\n---\n\n");
  
  const prompt = `You are an intelligent assistant. Use the following context to answer the user's question. 
If the answer is not available in the context, politely state that you cannot find the answer in the provided document.
Keep your answer concise and helpful.

Context:
${contextText}

User Question:
${query}
`;

  const response: GenerateContentResponse = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      systemInstruction: "You are a helpful AI assistant capable of analyzing PDF documents.",
    }
  });

  return response.text || "I couldn't generate a response.";
};

/**
 * Calculates cosine similarity between two vectors.
 */
export const cosineSimilarity = (vecA: number[], vecB: number[]): number => {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};