import { CheckCircle2, Download, FileText, Loader2, UploadCloud, X } from 'lucide-react';
import { useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import { uploadAndAnalyzePdf } from '../api.ts';
import type { PaperRecord } from '../types.ts';

interface UploadPageProps {
  onAnalysisComplete: (paper: PaperRecord) => void;
}

const MAX_SIZE_BYTES = 20 * 1024 * 1024;

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function UploadPage({ onAnalysisComplete }: UploadPageProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [stageIndex, setStageIndex] = useState(0);

  const stages = [
    'Validating PDF structure and extracting page text',
    'Building overlapping chunks for retrieval indexing',
    'Synthesizing 11 structured research sections with AI',
  ];

  const validateAndSelect = (file: File | null) => {
    setError(null);
    if (!file) return;

    const isPdf =
      file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      setSelectedFile(null);
      setError('Invalid file format. Please select a valid PDF document (.pdf).');
      return;
    }

    if (file.size > MAX_SIZE_BYTES) {
      setSelectedFile(null);
      setError('File size exceeds the 20 MB upload limit.');
      return;
    }

    if (file.size === 0) {
      setSelectedFile(null);
      setError('The selected PDF file is empty.');
      return;
    }

    setSelectedFile(file);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    validateAndSelect(e.target.files?.[0] ?? null);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    validateAndSelect(e.dataTransfer.files?.[0] ?? null);
  };

  const handleAnalyze = async () => {
    if (!selectedFile) {
      setError('Please select a PDF research paper first.');
      return;
    }

    setError(null);
    setAnalyzing(true);
    setStageIndex(0);

    const timer1 = window.setTimeout(() => setStageIndex(1), 1600);
    const timer2 = window.setTimeout(() => setStageIndex(2), 3400);

    try {
      const paper = await uploadAndAnalyzePdf(selectedFile);
      onAnalysisComplete(paper);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Analysis failed. Please verify the PDF is readable and try again.'
      );
    } finally {
      window.clearTimeout(timer1);
      window.clearTimeout(timer2);
      setAnalyzing(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900">
          Upload Research Paper PDF
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Upload any academic PDF up to 20 MB to extract structured insights, index passages for Q&A,
          and generate a downloadable report.
        </p>
      </div>

      {/* Drag and Drop Area */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`rounded-2xl border-2 border-dashed p-8 sm:p-12 text-center transition-colors ${
            isDragging
              ? 'border-blue-700 bg-blue-50/70'
              : 'border-slate-300 bg-slate-50/60 hover:border-blue-400'
          }`}
        >
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-900">
            <UploadCloud className="h-6 w-6" aria-hidden="true" />
          </div>

          <h3 className="mt-4 font-display text-base font-bold text-slate-900">
            Drag and drop your PDF research paper here
          </h3>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Supports standard academic PDFs up to 20 MB
          </p>

          <input
            ref={inputRef}
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              disabled={analyzing}
              onClick={() => inputRef.current?.click()}
              className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-100 disabled:opacity-50 whitespace-nowrap"
            >
              Browse Files
            </button>

            <a
              href="/api/sample-paper"
              download="HybridMed_RAG_Clinical_Summarization.pdf"
              className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-900 transition-colors hover:bg-blue-100 whitespace-nowrap"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              <span>Download Sample Research PDF</span>
            </a>
          </div>
        </div>

        {/* Selected File Preview */}
        {selectedFile && (
          <div className="mt-6 flex items-center justify-between gap-4 rounded-xl border border-blue-200 bg-blue-50/50 px-4 py-3.5">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-900 text-white">
                <FileText className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-slate-600 font-mono tabular-nums">
                  {formatFileSize(selectedFile.size)} · Valid PDF format
                </p>
              </div>
            </div>

            {!analyzing && (
              <button
                type="button"
                onClick={() => {
                  setSelectedFile(null);
                  if (inputRef.current) inputRef.current.value = '';
                }}
                aria-label="Remove selected file"
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-200 hover:text-slate-900"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          >
            {error}
          </div>
        )}

        {/* Loading Progress Stepper */}
        {analyzing && (
          <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50/40 p-5 space-y-3">
            <div className="flex items-center gap-2.5 text-sm font-semibold text-blue-900">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              <span>Processing PDF and running AI research extraction...</span>
            </div>
            <div className="space-y-2 pt-1">
              {stages.map((label, idx) => {
                const done = idx < stageIndex;
                const active = idx === stageIndex;
                return (
                  <div
                    key={label}
                    className={`flex items-center gap-2.5 text-xs ${
                      done
                        ? 'text-emerald-700 font-medium'
                        : active
                          ? 'text-blue-900 font-semibold'
                          : 'text-slate-400'
                    }`}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    <span>{label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            disabled={!selectedFile || analyzing}
            onClick={() => void handleAnalyze()}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-900 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50 whitespace-nowrap"
          >
            {analyzing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                <span>Analyzing Manuscript...</span>
              </>
            ) : (
              <span>Upload and Analyze</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
