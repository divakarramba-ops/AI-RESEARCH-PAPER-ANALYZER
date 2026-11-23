import { Download, Loader2, MessageSquareText, UploadCloud } from 'lucide-react';
import { useEffect, useState } from 'react';
import { downloadPaperReport, listPapers } from '../api.ts';
import type { PageRoute, PaperRecord } from '../types.ts';

interface AnalysisPageProps {
  selectedPaper: PaperRecord | null;
  onSelectPaper: (paper: PaperRecord) => void;
  onNavigate: (page: PageRoute) => void;
}

export function AnalysisPage({
  selectedPaper,
  onSelectPaper,
  onNavigate,
}: AnalysisPageProps) {
  const [papers, setPapers] = useState<PaperRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      try {
        const list = await listPapers();
        if (!active) return;
        setPapers(list);
        if (!selectedPaper && list.length > 0) {
          onSelectPaper(list[0]);
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Could not load analyzed papers.');
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [selectedPaper, onSelectPaper]);

  const current = selectedPaper ?? papers[0] ?? null;

  const handleDownload = async () => {
    if (!current) return;
    setDownloading(true);
    setError(null);
    try {
      await downloadPaperReport(current.id, current.title);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to generate PDF report.');
    } finally {
      setDownloading(false);
    }
  };

  if (loading && papers.length === 0) {
    return (
      <div className="space-y-4">
        <div className="h-28 rounded-2xl border border-slate-200 bg-white p-6 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-44 rounded-2xl border border-slate-200 bg-white p-6 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!current) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
        <h2 className="font-display text-xl font-bold text-slate-900">
          No Analyzed Paper Selected
        </h2>
        <p className="mt-2 text-sm text-slate-600 max-w-md mx-auto">
          Upload a PDF research paper first to inspect its 11-section breakdown and export a
          formatted PDF report.
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

  const a = current.analysis;

  return (
    <div className="space-y-6">
      {/* Paper Switcher & Header Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-7">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
          <div className="min-w-0 flex-1">
            {papers.length > 1 && (
              <div className="mb-4 max-w-md">
                <label htmlFor="analysis-paper-select" className="block text-xs font-medium text-slate-500 mb-1">
                  Select Analyzed Paper
                </label>
                <select
                  id="analysis-paper-select"
                  value={current.id}
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

            <h2
              style={{ textWrap: 'balance' }}
              className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900"
            >
              {current.title}
            </h2>

            <p className="mt-2.5 text-sm text-slate-600">
              <span>{current.authors}</span>
              <span aria-hidden="true"> · </span>
              <span>{current.publicationYear}</span>
              <span aria-hidden="true"> · </span>
              <span>{current.domain}</span>
              <span aria-hidden="true"> · </span>
              <span className="font-mono tabular-nums">{current.pageCount} pages</span>
              <span aria-hidden="true"> · </span>
              <span className="font-mono tabular-nums">{current.wordCount.toLocaleString()} words</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => onNavigate('ask')}
              className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-900 transition-colors hover:bg-blue-100 whitespace-nowrap"
            >
              <MessageSquareText className="h-4 w-4" aria-hidden="true" />
              <span>Ask AI About Paper</span>
            </button>

            <button
              type="button"
              disabled={downloading}
              onClick={() => void handleDownload()}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-800 disabled:opacity-60 whitespace-nowrap"
            >
              {downloading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  <span>Preparing PDF...</span>
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" aria-hidden="true" />
                  <span>Download Report</span>
                </>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          >
            {error}
          </div>
        )}
      </div>

      {/* 11 Structured Analysis Sections in Clean Separate Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Paper Overview */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="font-display text-base font-bold text-blue-900">01. Paper Overview</h3>
          <p className="mt-3 text-sm sm:text-base text-slate-700 leading-relaxed">
            {a.paperOverview}
          </p>
        </section>

        {/* 2. Abstract Summary */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="font-display text-base font-bold text-blue-900">02. Abstract Summary</h3>
          <p className="mt-3 text-sm sm:text-base text-slate-700 leading-relaxed">
            {a.abstractSummary}
          </p>
        </section>

        {/* 3. Research Objectives */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="font-display text-base font-bold text-blue-900">
            03. Research Objectives
          </h3>
          <ul className="mt-3 space-y-2.5 text-sm sm:text-base text-slate-700 leading-relaxed">
            {a.researchObjectives.map((obj, idx) => (
              <li key={idx} className="flex gap-2.5">
                <span className="font-mono text-xs font-semibold text-blue-800 pt-1 tabular-nums">
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <span>{obj}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* 4. Problem Statement */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="font-display text-base font-bold text-blue-900">04. Problem Statement</h3>
          <p className="mt-3 text-sm sm:text-base text-slate-700 leading-relaxed">
            {a.problemStatement}
          </p>
        </section>

        {/* 5. Methodology */}
        <section className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="font-display text-base font-bold text-blue-900">05. Methodology</h3>
          <p className="mt-3 text-sm sm:text-base text-slate-700 leading-relaxed whitespace-pre-line">
            {a.methodology}
          </p>
        </section>

        {/* 6. Algorithms and Technologies */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="font-display text-base font-bold text-blue-900">
            06. Algorithms and Technologies
          </h3>
          {a.algorithmsAndTechnologies.length === 0 ? (
            <p className="mt-3 text-sm text-slate-600">
              No specific algorithms or software frameworks detailed.
            </p>
          ) : (
            <div className="mt-3 divide-y divide-slate-200">
              {a.algorithmsAndTechnologies.map((item, idx) => (
                <div key={idx} className="py-3 first:pt-0 last:pb-0">
                  <p className="font-display text-sm font-semibold text-slate-900">{item.name}</p>
                  <p className="mt-1 text-sm text-slate-600 leading-relaxed">{item.role}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 7. Dataset Details */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="font-display text-base font-bold text-blue-900">07. Dataset Details</h3>
          <p className="mt-3 text-sm sm:text-base text-slate-700 leading-relaxed">
            {a.datasetDetails}
          </p>
        </section>

        {/* 8. Results and Performance */}
        <section className="lg:col-span-2 rounded-2xl border border-slate-200 bg-blue-50/40 p-6">
          <h3 className="font-display text-base font-bold text-blue-900">
            08. Results and Performance
          </h3>
          <p className="mt-3 text-sm sm:text-base text-slate-800 leading-relaxed whitespace-pre-line">
            {a.resultsAndPerformance}
          </p>
        </section>

        {/* 9. Limitations */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="font-display text-base font-bold text-blue-900">09. Limitations</h3>
          <ul className="mt-3 space-y-2.5 text-sm sm:text-base text-slate-700 leading-relaxed">
            {a.limitations.map((item, idx) => (
              <li key={idx} className="flex gap-2.5">
                <span className="font-mono text-xs font-semibold text-slate-400 pt-1 tabular-nums">
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* 10. Future Scope */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="font-display text-base font-bold text-blue-900">10. Future Scope</h3>
          <ul className="mt-3 space-y-2.5 text-sm sm:text-base text-slate-700 leading-relaxed">
            {a.futureScope.map((item, idx) => (
              <li key={idx} className="flex gap-2.5">
                <span className="font-mono text-xs font-semibold text-blue-800 pt-1 tabular-nums">
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* 11. Conclusion */}
        <section className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="font-display text-base font-bold text-blue-900">11. Conclusion</h3>
          <p className="mt-3 text-sm sm:text-base text-slate-700 leading-relaxed">
            {a.conclusion}
          </p>
        </section>
      </div>
    </div>
  );
}
