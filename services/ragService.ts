import { DocumentChunk } from '../types';
import { generateEmbedding, cosineSimilarity } from './geminiService';

/**
 * Extracts text from a PDF file using PDF.js
 */
export const extractTextFromPDF = async (file: File): Promise<{ text: string; page: number }[]> => {
  const arrayBuffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);

  const loadingTask = pdfjsLib.getDocument(uint8Array);
  const pdf = await loadingTask.promise;
  
  const pages: { text: string; page: number }[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const text = textContent.items.map((item) => item.str).join(' ');
    if (text.trim().length > 0) {
      pages.push({ text, page: i });
    }
  }

  return pages;
};

/**
 * Splits text into chunks with overlap
 */
export const createChunks = (
  pages: { text: string; page: number }[],
  chunkSize: number = 800,
  overlap: number = 100
): Omit<DocumentChunk, 'embedding'>[] => {
  const chunks: Omit<DocumentChunk, 'embedding'>[] = [];

  pages.forEach(({ text, page }) => {
    let start = 0;
    while (start < text.length) {
      const end = start + chunkSize;
      const chunkText = text.slice(start, end);
      
      // Avoid splitting words in half if possible (simple heuristic)
      const lastSpace = chunkText.lastIndexOf(' ');
      let cleanText = chunkText;
      let nextStart = start + chunkSize - overlap;

      if (lastSpace > chunkSize * 0.8 && end < text.length) {
         cleanText = chunkText.slice(0, lastSpace);
         nextStart = start + lastSpace - overlap; // Backtrack overlap from the space
      }

      chunks.push({
        id: `page-${page}-${start}`,
        text: cleanText,
        pageNumber: page,
        // Embedding will be added later
      });
      
      start = Math.max(start + 1, nextStart); 
      // Ensure we always move forward at least 1 char to prevent loops 
      // although logical nextStart is overlap based
    }
  });

  return chunks;
};

/**
 * Processes the document: Extract -> Chunk -> Embed
 */
export const processDocument = async (
  file: File,
  onProgress: (status: string, progress: number) => void
): Promise<DocumentChunk[]> => {
  
  // 1. Parsing
  onProgress('Parsing PDF...', 10);
  const pages = await extractTextFromPDF(file);
  
  // 2. Chunking
  onProgress('Splitting text...', 30);
  const rawChunks = createChunks(pages);
  
  // 3. Embedding
  onProgress(`Embedding ${rawChunks.length} chunks...`, 40);
  const chunksWithEmbeddings: DocumentChunk[] = [];
  
  // Process in batches to avoid hitting API rate limits too hard/fast
  const BATCH_SIZE = 5; 
  for (let i = 0; i < rawChunks.length; i += BATCH_SIZE) {
    const batch = rawChunks.slice(i, i + BATCH_SIZE);
    const promises = batch.map(async (chunk) => {
        try {
            const embedding = await generateEmbedding(chunk.text);
            return { ...chunk, embedding };
        } catch (e) {
            console.error("Embedding error for chunk", chunk.id, e);
            return null;
        }
    });

    const results = await Promise.all(promises);
    results.forEach(r => {
        if(r) chunksWithEmbeddings.push(r);
    });

    const currentProgress = 40 + Math.floor(((i + BATCH_SIZE) / rawChunks.length) * 50);
    onProgress(`Embedding... (${Math.min(i + BATCH_SIZE, rawChunks.length)}/${rawChunks.length})`, currentProgress);
  }

  onProgress('Finalizing index...', 95);
  return chunksWithEmbeddings;
};

/**
 * Retrieves the most relevant chunks for a query
 */
export const retrieveRelevantChunks = async (
  query: string,
  chunks: DocumentChunk[],
  topK: number = 4
): Promise<DocumentChunk[]> => {
  const queryEmbedding = await generateEmbedding(query);
  
  const scoredChunks = chunks.map(chunk => ({
    chunk,
    score: cosineSimilarity(queryEmbedding, chunk.embedding)
  }));

  // Sort by score descending
  scoredChunks.sort((a, b) => b.score - a.score);

  return scoredChunks.slice(0, topK).map(item => item.chunk);
};