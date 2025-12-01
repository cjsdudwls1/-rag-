export enum Sender {
  USER = 'user',
  AI = 'ai'
}

export interface Message {
  id: string;
  text: string;
  sender: Sender;
  timestamp: number;
  isStreaming?: boolean;
}

export interface DocumentChunk {
  id: string;
  text: string;
  embedding: number[];
  pageNumber: number;
}

export enum ProcessingStatus {
  IDLE = 'idle',
  PARSING = 'parsing',
  CHUNKING = 'chunking',
  EMBEDDING = 'embedding',
  READY = 'ready',
  ERROR = 'error'
}

// PDF.js global types shim since we are loading via CDN
declare global {
  const pdfjsLib: {
    getDocument: (data: Uint8Array) => {
      promise: Promise<{
        numPages: number;
        getPage: (pageNumber: number) => Promise<{
          getTextContent: () => Promise<{
            items:Array<{ str: string; hasEOL: boolean }>;
          }>;
        }>;
      }>;
    };
    GlobalWorkerOptions: {
      workerSrc: string;
    };
  };
}