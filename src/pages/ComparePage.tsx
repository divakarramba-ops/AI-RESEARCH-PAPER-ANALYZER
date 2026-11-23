import { Check, GitCompare, Loader2, UploadCloud } from 'lucide-react';
import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import {
  compareSelectedPapers,
  listComparisons,
  listPapers,
  uploadAndAnalyzePdf,
} from '../api.ts';
import type { ComparisonRecord, PaperRecord } from '../types.ts';

export function ComparePage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [papers, setPapers] = useState<PaperRecord[]>([]);
  const [comparisons, setComparisons] = useState<ComparisonRecord[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeComparison, setActiveComparison] = useState<ComparisonRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [comparing, setComparing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      try {
        const [paperList, compList] = await Promise.all([listPapers(), listComparisons()]);
        if (!active) return;
        setPapers(paperList);
        setComparisons(compList);
        if (compList.length > 0) {
          setActiveComparison(compList[0]);
        }
        if (paperList.length >= 2) {
          setSelectedIds([paperList[0].id, paperList[1].id]);
        }
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Unable to load comparison data.');
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, []);

  const togglePaper = (id: string) => {
    setError(null);
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      if (prev.length >= 4) {
        setError('You can compare up to 4 papers at a time.');
        return prev;
      }
      return [...prev, id];
    });
  };

  const handleQuickUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const paper = await uploadAndAnalyzePdf(file);
      setPapers((prev) => [paper, ...prev]);
      setSelectedIds((prev) => (prev.length < 4 ? [...prev, paper.id] : prev));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not upload PDF.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCompare = async () => {
    if (selectedIds.length < 2) {
      setError('Please select at least 2 research papers to compare.');
      return;
    }
    setError(null);
    setComparing(true);
    try {
      const created = await compareSelectedPapers(selectedIds);
      setComparisons((prev) => [created, ...prev]);
      setActiveComparison(created);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Comparison failed.');
    } finally {
      setComparing(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-52 rounded-2xl border border-slate-200 bg-white p-6 animate-pulse" />
        <div className="h-72 rounded-2xl border border-slate-200 bg-white p-6 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900">
            Compare Research Papers
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Select two to four analyzed papers to compare methodologies, algorithms, datasets,
            results, and identify research gaps.
          </p>
        </div>

        <div className="shrink-0">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            onChange={(e) => void handleQuickUpload(e)}
            className="hidden"
          />
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-900 transition-colors hover:bg-blue-100 disabled:opacity-50 whitespace-nowrap"
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                <span>Analyzing Uploaded PDF...</span>
              </>
            ) : (
              <>
                <UploadCloud className="h-4 w-4" aria-hidden="true" />
                <span>Add PDF to Compare</span>
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {error}
        </div>
      )}

      {/* Paper Selection Grid */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
          <div>
            <h3 className="font-display text-base font-bold text-slate-900">
              Select 2–4 Papers ({selectedIds.length} selected)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Need more papers? Use the Add PDF to Compare button above to analyze another file.
            </p>
          </div>

          <button
            type="button"
            disabled={selectedIds.length < 2 || comparing}
            onClick={() => void handleCompare()}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-800 disabled:opacity-50 whitespace-nowrap shrink-0"
          >
            {comparing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                <span>Comparing Studies...</span>
              </>
            ) : (
              <>
                <GitCompare className="h-4 w-4" aria-hidden="true" />
                <span>Compare Selected Papers</span>
              </>
            )}
          </button>
        </div>

        {papers.length === 0 ? (
          <div className="py-10 text-center text-sm text-slate-600">
            No analyzed papers in your library yet. Click &ldquo;Add PDF to Compare&rdquo; above to
            upload at least two PDF manuscripts.
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            {papers.map((paper) => {
              const selected = selectedIds.includes(paper.id);
              return (
                <button
                  key={paper.id}
                  type="button"
                  onClick={() => togglePaper(paper.id)}
                  className={`flex items-start gap-3 rounded-xl border p-4 text-left transition-colors ${
                    selected
                      ? 'border-blue-800 bg-blue-50/70'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                      selected
                        ? 'border-blue-900 bg-blue-900 text-white'
                        : 'border-slate-300 bg-white'
                    }`}
                  >
                    {selected && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
                  </span>
                  <div className="min-w-0">
                    <p className="font-display text-sm font-semibold text-slate-900 line-clamp-1">
                      {paper.title}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      <span>{paper.domain}</span>
                      <span aria-hidden="true"> · </span>
                      <span>{paper.publicationYear}</span>
                      <span aria-hidden="true"> · </span>
                      <span className="font-mono tabular-nums">{paper.pageCount} pages</span>
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Active Comparison Results */}
      {activeComparison && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-blue-800">Comparative Synthesis</p>
                <h3 className="mt-1 font-display text-xl font-bold text-slate-900">
                  {activeComparison.result.title}
                </h3>
              </div>

              {comparisons.length > 1 && (
                <select
                  aria-label="Select saved comparison"
                  value={activeComparison.id}
                  onChange={(e) => {
                    const found = comparisons.find((c) => c.id === e.target.value);
                    if (found) setActiveComparison(found);
                  }}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800"
                >
                  {comparisons.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <p className="mt-3 text-sm sm:text-base text-slate-700 leading-relaxed">
              {activeComparison.result.executiveSummary}
            </p>
          </div>

          {/* Comparison Table */}
          {activeComparison.result.comparisonRows.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
              <div className="border-b border-slate-200 px-6 py-4">
                <h4 className="font-display text-base font-bold text-slate-900">
                  Side-by-Side Comparison Matrix
                </h4>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="py-3.5 px-5 text-xs font-bold text-slate-700 w-44">
                        Dimension
                      </th>
                      {activeComparison.result.comparisonRows[0].values.map((col) => (
                        <th
                          key={col.paperId}
                          className="py-3.5 px-5 text-xs font-bold text-blue-950 min-w-[220px]"
                        >
                          {col.paperTitle}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-sm">
                    {activeComparison.result.comparisonRows.map((row) => (
                      <tr key={row.criterion} className="align-top hover:bg-blue-50/20">
                        <td className="py-4 px-5 font-display font-semibold text-slate-900 bg-slate-50/50">
                          {row.criterion}
                        </td>
                        {row.values.map((cell) => (
                          <td key={cell.paperId} className="py-4 px-5 text-slate-700 leading-relaxed">
                            {cell.summary}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Research Gaps & Recommendations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <h4 className="font-display text-base font-bold text-blue-900">
                Identified Research Gaps
              </h4>
              <ul className="mt-3 space-y-2.5 text-sm text-slate-700 leading-relaxed">
                {activeComparison.result.researchGaps.map((gap, idx) => (
                  <li key={idx} className="flex gap-2.5">
                    <span className="font-mono text-xs font-semibold text-blue-800 pt-1 tabular-nums">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <span>{gap}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-blue-50/40 p-6">
              <h4 className="font-display text-base font-bold text-blue-900">
                Recommended Next Directions
              </h4>
              <ul className="mt-3 space-y-2.5 text-sm text-slate-700 leading-relaxed">
                {activeComparison.result.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex gap-2.5">
                    <span className="font-mono text-xs font-semibold text-blue-800 pt-1 tabular-nums">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
