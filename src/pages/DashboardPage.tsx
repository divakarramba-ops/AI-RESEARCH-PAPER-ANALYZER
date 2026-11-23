import {
  Download,
  FileSearch,
  MessageSquareText,
  Search,
  Trash2,
  UploadCloud,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { deletePaper, downloadPaperReport, fetchDashboard } from '../api.ts';
import type { DashboardPayload, PageRoute, PaperRecord } from '../types.ts';

interface DashboardPageProps {
  onNavigate: (page: PageRoute) => void;
  onSelectPaper: (paper: PaperRecord, targetPage: 'analysis' | 'ask') => void;
}

export function DashboardPage({ onNavigate, onSelectPaper }: DashboardPageProps) {
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const loadDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = await fetchDashboard();
      setData(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDashboard();
  }, []);

  const handleDelete = async (paperId: string) => {
    try {
      await deletePaper(paperId);
      await loadDashboard();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete paper.');
    }
  };

  const handleDownload = async (paper: PaperRecord) => {
    setDownloadingId(paper.id);
    try {
      await downloadPaperReport(paper.id, paper.title);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not download PDF report.');
    } finally {
      setDownloadingId(null);
    }
  };

  const filteredPapers = (data?.recentPapers ?? []).filter((paper) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      paper.title.toLowerCase().includes(q) ||
      paper.authors.toLowerCase().includes(q) ||
      paper.domain.toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-2xl border border-slate-200 bg-white p-5 animate-pulse">
              <div className="h-4 w-24 rounded bg-slate-200" />
              <div className="mt-4 h-7 w-16 rounded bg-slate-200" />
            </div>
          ))}
        </div>
        <div className="h-64 rounded-2xl border border-slate-200 bg-white p-6 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900">
            Research Workspace Overview
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Track analyzed manuscripts, revisit structured reports, and continue Q&A sessions.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('upload')}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-800 whitespace-nowrap shrink-0 self-start sm:self-auto"
        >
          <UploadCloud className="h-4 w-4" aria-hidden="true" />
          <span>Quick Upload PDF</span>
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {error}
        </div>
      )}

      {/* Key Research Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-medium text-slate-500">Total Papers Analyzed</p>
          <p className="mt-2 font-mono text-3xl font-semibold text-blue-900 tabular-nums">
            {data?.stats.totalPapers ?? 0}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-medium text-slate-500">Pages Indexed</p>
          <p className="mt-2 font-mono text-3xl font-semibold text-slate-900 tabular-nums">
            {data?.stats.totalPages ?? 0}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-medium text-slate-500">Questions Answered</p>
          <p className="mt-2 font-mono text-3xl font-semibold text-slate-900 tabular-nums">
            {data?.stats.totalQuestions ?? 0}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-medium text-slate-500">Comparisons Run</p>
          <p className="mt-2 font-mono text-3xl font-semibold text-slate-900 tabular-nums">
            {data?.stats.totalComparisons ?? 0}
          </p>
        </div>
      </div>

      {/* Main Grid: Recent Papers & Domain Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
            <h3 className="font-display text-lg font-bold text-slate-900">
              Recently Uploaded Papers & Analysis History
            </h3>

            <div className="relative w-full sm:w-60">
              <Search
                className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400"
                aria-hidden="true"
              />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter by title or domain..."
                aria-label="Filter analyzed papers"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-xs text-slate-900 focus:border-blue-700 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {filteredPapers.length === 0 ? (
            <div className="py-12 text-center">
              <p className="font-display text-base font-semibold text-slate-900">
                {data?.stats.totalPapers === 0
                  ? 'No research papers analyzed yet'
                  : 'No papers match your search'}
              </p>
              <p className="mt-1.5 text-sm text-slate-600 max-w-md mx-auto">
                Upload a PDF research manuscript to extract all 11 structured sections, run RAG Q&A,
                and generate downloadable reports.
              </p>
              <button
                type="button"
                onClick={() => onNavigate('upload')}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 whitespace-nowrap"
              >
                <UploadCloud className="h-4 w-4" aria-hidden="true" />
                <span>Upload First Paper</span>
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {filteredPapers.map((paper) => (
                <div
                  key={paper.id}
                  className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <button
                      type="button"
                      onClick={() => onSelectPaper(paper, 'analysis')}
                      className="text-left font-display text-base font-semibold text-slate-900 hover:text-blue-900 transition-colors line-clamp-1"
                    >
                      {paper.title}
                    </button>
                    <p className="mt-1 text-xs text-slate-500">
                      <span>{paper.domain}</span>
                      <span aria-hidden="true"> · </span>
                      <span>{paper.authors}</span>
                      <span aria-hidden="true"> · </span>
                      <span className="font-mono tabular-nums">{paper.pageCount} pages</span>
                      <span aria-hidden="true"> · </span>
                      <span className="font-mono tabular-nums">
                        {new Date(paper.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => onSelectPaper(paper, 'analysis')}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-900 whitespace-nowrap"
                    >
                      <FileSearch className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Analysis</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onSelectPaper(paper, 'ask')}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-900 whitespace-nowrap"
                    >
                      <MessageSquareText className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Ask AI</span>
                    </button>
                    <button
                      type="button"
                      disabled={downloadingId === paper.id}
                      onClick={() => void handleDownload(paper)}
                      title="Download PDF Report"
                      aria-label={`Download PDF report for ${paper.title}`}
                      className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white p-1.5 text-slate-700 hover:bg-blue-50 hover:text-blue-900 disabled:opacity-50"
                    >
                      <Download className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(paper.id)}
                      title="Delete Paper"
                      aria-label={`Delete ${paper.title}`}
                      className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Research Statistics Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h3 className="font-display text-base font-bold text-slate-900">
              Research Domain Distribution
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Breakdown across your analyzed library
            </p>

            {(!data?.domainStats || data.domainStats.length === 0) ? (
              <p className="mt-6 text-sm text-slate-500">
                Domain statistics appear once your first paper is analyzed.
              </p>
            ) : (
              <div className="mt-5 space-y-4">
                {data.domainStats.map((item) => {
                  const pct = Math.round(
                    (item.count / Math.max(1, data.stats.totalPapers)) * 100
                  );
                  return (
                    <div key={item.domain}>
                      <div className="flex items-center justify-between text-xs font-medium">
                        <span className="text-slate-700 truncate pr-2">{item.domain}</span>
                        <span className="font-mono text-slate-900 tabular-nums shrink-0">
                          {item.count} ({pct}%)
                        </span>
                      </div>
                      <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-blue-50">
                        <div
                          className="h-full rounded-full bg-blue-900"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-6 border-t border-slate-200 pt-4 flex items-center justify-between text-xs text-slate-600">
              <span>Total words parsed</span>
              <span className="font-mono font-semibold text-slate-900 tabular-nums">
                {(data?.stats.totalWords ?? 0).toLocaleString()}
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-6">
            <h3 className="font-display text-base font-bold text-blue-950">
              Compare Multiple Studies
            </h3>
            <p className="mt-1.5 text-sm text-slate-700 leading-relaxed">
              Have two or more papers in your library? Generate a structured comparison matrix and
              research gap summary.
            </p>
            <button
              type="button"
              onClick={() => onNavigate('compare')}
              className="mt-4 rounded-xl bg-blue-900 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-800 whitespace-nowrap"
            >
              Open Comparison Tool
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
