import React, { useState, useCallback } from 'react';
import FileUpload from './components/FileUpload';
import ChatInterface from './components/ChatInterface';
import { Message, Sender, ProcessingStatus, DocumentChunk } from './types';
import { processDocument, retrieveRelevantChunks } from './services/ragService';
import { generateRAGResponse } from './services/geminiService';
import { BrainCircuit, Sparkles, AlertTriangle } from 'lucide-react';

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [chunks, setChunks] = useState<DocumentChunk[]>([]);
  const [status, setStatus] = useState<ProcessingStatus>(ProcessingStatus.IDLE);
  const [progressMsg, setProgressMsg] = useState<string>('');
  const [progressVal, setProgressVal] = useState<number>(0);
  const [isChatProcessing, setIsChatProcessing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFileUpload = useCallback(async (file: File) => {
    try {
      setStatus(ProcessingStatus.PARSING);
      setErrorMsg(null);
      setMessages([]); // Clear chat on new file
      
      const processedChunks = await processDocument(file, (msg, val) => {
        setProgressMsg(msg);
        setProgressVal(val);
        // Simple state mapping for visuals
        if (val < 20) setStatus(ProcessingStatus.PARSING);
        else if (val < 40) setStatus(ProcessingStatus.CHUNKING);
        else if (val < 100) setStatus(ProcessingStatus.EMBEDDING);
      });

      setChunks(processedChunks);
      setStatus(ProcessingStatus.READY);
      setProgressMsg('Document processed successfully!');
      setProgressVal(100);

    } catch (error) {
      console.error("Error processing document:", error);
      setStatus(ProcessingStatus.ERROR);
      setErrorMsg("Failed to process the PDF. Please ensure the API key is valid and the PDF is readable.");
    }
  }, []);

  const handleSendMessage = useCallback(async (text: string) => {
    const newUserMsg: Message = {
      id: Date.now().toString(),
      text,
      sender: Sender.USER,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, newUserMsg]);
    setIsChatProcessing(true);

    try {
      if (chunks.length === 0) {
          // If no doc loaded, just chat normally or warn
          // For this app, we assume we need RAG
          throw new Error("No document loaded.");
      }

      // 1. Retrieve relevant chunks
      const relevantChunks = await retrieveRelevantChunks(text, chunks);
      
      // 2. Generate Response
      const aiResponseText = await generateRAGResponse(text, relevantChunks);

      const newAiMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponseText,
        sender: Sender.AI,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, newAiMsg]);

    } catch (error) {
      console.error("Chat error:", error);
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: "Sorry, I encountered an error while processing your request. Please check the console or try again.",
        sender: Sender.AI,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorResponse]);
    } finally {
      setIsChatProcessing(false);
    }
  }, [chunks]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col font-sans selection:bg-indigo-500/30">
      
      {/* Navbar */}
      <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg">
                <BrainCircuit className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
              Gemini RAG
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm text-slate-400">
             <div className="hidden md:flex items-center gap-1">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Powered by Gemini 2.5 Flash</span>
             </div>
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-6 lg:p-8 flex flex-col lg:flex-row gap-6">
        
        {/* Left Sidebar: Upload & Status */}
        <aside className="w-full lg:w-1/3 flex flex-col gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
             <h2 className="text-lg font-semibold text-white mb-4">Document Source</h2>
             <FileUpload 
                onFileUpload={handleFileUpload} 
                status={status}
                progressMessage={progressMsg}
                progressValue={progressVal}
             />
             
             {status === ProcessingStatus.READY && (
               <div className="mt-6 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
                  <h3 className="text-sm font-medium text-slate-300 mb-2">RAG Pipeline Active</h3>
                  <ul className="space-y-2 text-xs text-slate-400">
                     <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        {chunks.length} text chunks indexed
                     </li>
                     <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Embedding model: text-embedding-004
                     </li>
                     <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Chat model: gemini-2.5-flash
                     </li>
                  </ul>
               </div>
             )}

             {errorMsg && (
               <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex gap-3 text-red-400 text-sm">
                 <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                 <p>{errorMsg}</p>
               </div>
             )}
          </div>

          <div className="flex-1 bg-gradient-to-br from-indigo-900/20 to-purple-900/20 rounded-2xl p-6 border border-white/5 flex flex-col justify-end relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
             <div className="relative z-10">
                <h3 className="text-xl font-bold text-white mb-2">How it works</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                   Upload a PDF to process it locally. The text is split into chunks, embedded using Google's models, and stored in memory. When you ask a question, we find the relevant chunks and let Gemini answer based on that context.
                </p>
             </div>
          </div>
        </aside>

        {/* Right Area: Chat */}
        <section className="flex-1 h-[600px] lg:h-auto min-h-[500px]">
          <ChatInterface 
             messages={messages} 
             onSendMessage={handleSendMessage}
             isProcessing={isChatProcessing} 
          />
        </section>

      </main>
    </div>
  );
}

export default App;