import { Loader2, Send, UploadCloud } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { fetchChatHistory, listPapers, sendChatQuestion } from '../api.ts';
import type { ChatMessageRecord, PageRoute, PaperRecord } from '../types.ts';

interface AskAiPageProps {
  selectedPaper: PaperRecord | null;
  onSelectPaper: (paper: PaperRecord) => void;
  onNavigate: (page: PageRoute) => void;
}

const STARTER_QUESTIONS = [
  'Explain the methodology in simple words.',
  'Which algorithm is used?',
  'What are the research limitations?',
  'Explain the results.',
  'What improvements can be made?',
];

export function AskAiPage({
  selectedPaper,
  onSelectPaper,
  onNavigate,
}: AskAiPageProps) {
  const [papers, setPapers] = useState<PaperRecord[]>([]);
  const [messages, setMessages] = useState<ChatMessageRecord[]>([]);
  const [question, setQuestion] = useState('');
  const [loadingPapers, setLoadingPapers] = useState(true);
  const [loadingChat, setLoadingChat] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoadingPapers(true);
      try {
        const list = await listPapers();
        if (!active) return;
        setPapers(list);
        if (!selectedPaper && list.length > 0) {
          onSelectPaper(list[0]);
        }
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Unable to load papers.');
      } finally {
        if (active) setLoadingPapers(false);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [selectedPaper, onSelectPaper]);

  const currentPaper = selectedPaper ?? papers[0] ?? null;

  useEffect(() => {
    if (!currentPaper) return;
    let active = true;
    const loadHistory = async () => {
      setLoadingChat(true);
      setError(null);
      try {
        const hist = await fetchChatHistory(currentPaper.id);
        if (active) setMessages(hist);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Unable to load conversation.');
      } finally {
        if (active) setLoadingChat(false);
      }
    };
    void loadHistory();
    return () => {
      active = false;
    };
  }, [currentPaper]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const askQuestion = async (textToAsk: string) => {
    if (!currentPaper) return;
    const clean = textToAsk.trim();
    if (!clean || sending) return;

    setError(null);
    setSending(true);
    setQuestion('');
    try {
      const { userMessage, assistantMessage } = await sendChatQuestion(currentPaper.id, clean);
      setMessages((prev) => [...prev, userMessage, assistantMessage]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to answer question.');
    } finally {
      setSending(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    void askQuestion(question);
  };

  if (loadingPapers && papers.length === 0) {
    return (
      <div className="h-96 rounded-2xl border border-slate-200 bg-white p-6 animate-pulse" />
    );
  }

  if (!currentPaper) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
        <h2 className="font-display text-xl font-bold text-slate-900">
          Upload a Paper to Start Asking Questions
        </h2>
        <p className="mt-2 text-sm text-slate-600 max-w-md mx-auto">
          Our RAG assistant answers questions strictly from the extracted passages of your uploaded
          PDF manuscripts.
        </p>
        <button
          type="button"
          onClick={() => onNavigate('upload')}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 whitespace-nowrap"
        >
          <UploadCloud className="h-4 w-4" aria-hidden="true" />
          <span>Upload Research Paper</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Paper Context Selector */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-blue-800">Active Paper Context</p>
          <h2 className="mt-0.5 font-display text-lg font-bold text-slate-900 truncate">
            {currentPaper.title}
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            <span>{currentPaper.domain}</span>
            <span aria-hidden="true"> · </span>
            <span className="font-mono tabular-nums">{currentPaper.pageCount} pages indexed</span>
          </p>
        </div>

        {papers.length > 1 && (
          <div className="w-full sm:w-72 shrink-0">
            <label htmlFor="ask-paper-select" className="sr-only">
              Switch Research Paper
            </label>
            <select
              id="ask-paper-select"
              value={currentPaper.id}
              onChange={(e) => {
                const found = papers.find((p) => p.id === e.target.value);
                if (found) onSelectPaper(found);
              }}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm font-medium text-slate-900 focus:border-blue-700 focus:bg-white focus:outline-none"
            >
              {papers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Starter Prompt Buttons */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <p className="text-xs font-semibold text-slate-600 mb-3">
          Suggested Research Questions
        </p>
        <div className="flex flex-wrap gap-2">
          {STARTER_QUESTIONS.map((q) => (
            <button
              key={q}
              type="button"
              disabled={sending}
              onClick={() => void askQuestion(q)}
              className="rounded-xl border border-blue-200 bg-blue-50/70 px-3.5 py-2 text-xs font-medium text-blue-900 transition-colors hover:bg-blue-100 disabled:opacity-50 text-left"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Viewport */}
      <div className="rounded-2xl border border-slate-200 bg-white flex flex-col min-h-[440px] max-h-[620px]">
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {loadingChat ? (
            <div className="py-12 text-center text-sm text-slate-500">
              Loading conversation history...
            </div>
          ) : messages.length === 0 ? (
            <div className="py-12 text-center max-w-md mx-auto">
              <p className="font-display text-base font-semibold text-slate-900">
                Ask anything about this paper
              </p>
              <p className="mt-1.5 text-sm text-slate-600">
                Select one of the suggested questions above or type your own question below. Answers
                are grounded in retrieved PDF pages.
              </p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.role === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`max-w-3xl rounded-2xl px-4 py-3.5 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-blue-900 text-white'
                      : 'border border-slate-200 bg-slate-50 text-slate-800'
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.content}</p>
                </div>

                {msg.role === 'assistant' && msg.citations && msg.citations.length > 0 && (
                  <div className="mt-2 max-w-3xl space-y-1.5 pl-1">
                    <p className="text-xs font-semibold text-slate-500">
                      Retrieved Source Passages
                    </p>
                    {msg.citations.map((cite, idx) => (
                      <p key={idx} className="text-xs text-slate-600 leading-relaxed">
                        <span className="font-mono font-semibold text-blue-900 tabular-nums">
                          Page {cite.pageNumber}:
                        </span>{' '}
                        {cite.excerpt}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}

          {sending && (
            <div className="flex items-center gap-2 text-sm text-blue-900">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              <span>Searching indexed PDF passages and generating answer...</span>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {error && (
          <div
            role="alert"
            className="mx-5 mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs text-red-800"
          >
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="border-t border-slate-200 p-4 flex items-center gap-3 bg-slate-50/70 rounded-b-2xl"
        >
          <label htmlFor="ask-ai-input" className="sr-only">
            Ask a question about this research paper
          </label>
          <input
            id="ask-ai-input"
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask a question about methodology, algorithms, datasets, or limitations..."
            className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
          <button
            type="submit"
            disabled={!question.trim() || sending}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-800 disabled:opacity-50 whitespace-nowrap shrink-0"
          >
            <Send className="h-4 w-4" aria-hidden="true" />
            <span>Ask</span>
          </button>
        </form>
      </div>
    </div>
  );
}
