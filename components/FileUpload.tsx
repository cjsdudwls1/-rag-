import React from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { ProcessingStatus } from '../types';

interface FileUploadProps {
  onFileUpload: (file: File) => void;
  status: ProcessingStatus;
  progressMessage: string;
  progressValue: number;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload, status, progressMessage, progressValue }) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type === 'application/pdf') {
        onFileUpload(file);
      } else {
        alert("Please upload a PDF file.");
      }
    }
  };

  const isProcessing = status === ProcessingStatus.PARSING || status === ProcessingStatus.CHUNKING || status === ProcessingStatus.EMBEDDING;
  const isReady = status === ProcessingStatus.READY;

  return (
    <div className="w-full">
      <div className="relative group">
        <label
          htmlFor="file-upload"
          className={`
            relative flex flex-col items-center justify-center w-full h-48 rounded-xl border-2 border-dashed 
            transition-all duration-300 cursor-pointer overflow-hidden
            ${isReady 
              ? 'border-emerald-500/50 bg-emerald-500/10' 
              : isProcessing 
                ? 'border-indigo-500/50 bg-indigo-500/10 cursor-not-allowed'
                : 'border-slate-600 hover:border-indigo-500 hover:bg-slate-800'
            }
          `}
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center z-10 p-4">
            {isReady ? (
              <>
                <CheckCircle2 className="w-10 h-10 mb-3 text-emerald-400" />
                <p className="mb-2 text-sm text-emerald-200 font-semibold">Document Ready</p>
                <p className="text-xs text-emerald-400/70">You can now chat with your document</p>
              </>
            ) : isProcessing ? (
               <>
                 <div className="w-10 h-10 mb-3 relative flex items-center justify-center">
                    <div className="absolute w-full h-full border-4 border-indigo-500/30 rounded-full"></div>
                    <div className="absolute w-full h-full border-4 border-t-indigo-500 rounded-full animate-spin"></div>
                 </div>
                 <p className="mb-2 text-sm text-indigo-200 font-semibold animate-pulse">{progressMessage}</p>
                 
                 {/* Progress Bar */}
                 <div className="w-48 h-1.5 bg-slate-700 rounded-full mt-2 overflow-hidden">
                    <div 
                        className="h-full bg-indigo-500 transition-all duration-500 ease-out"
                        style={{ width: `${progressValue}%` }}
                    />
                 </div>
               </>
            ) : (
              <>
                <Upload className="w-10 h-10 mb-3 text-slate-400 group-hover:text-indigo-400 transition-colors" />
                <p className="mb-2 text-sm text-slate-300">
                  <span className="font-semibold text-indigo-400">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-slate-500">PDF documents only (Max 10MB)</p>
              </>
            )}
          </div>
          <input 
            id="file-upload" 
            type="file" 
            accept="application/pdf"
            className="hidden" 
            onChange={handleFileChange}
            disabled={isProcessing}
          />
        </label>
      </div>
      
      {/* Stats/Info Footer */}
      {isReady && (
        <div className="mt-4 flex items-center justify-between text-xs text-slate-500 px-2">
            <span className="flex items-center gap-1">
                <FileText className="w-3 h-3" /> PDF Loaded
            </span>
            <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20">
                Indexed
            </span>
        </div>
      )}
    </div>
  );
};

export default FileUpload;