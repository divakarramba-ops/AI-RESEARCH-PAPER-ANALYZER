import {
  ArrowRight,
  BookOpen,
  Download,
  FileText,
  GitCompare,
  MessageSquare,
  UploadCloud,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import type { PageRoute } from '../types.ts';

interface HomePageProps {
  onNavigate: (page: PageRoute, sectionId?: string) => void;
}

const HERO_IMG = '/src/assets/images/hero_research_synthesis_1795433802928.jpg';

export function HomePage({ onNavigate }: HomePageProps) {
  const [heroImgFailed, setHeroImgFailed] = useState(false);

  return (
    <div className="bg-white text-slate-900">
      {/* Hero Section */}
      <section className="border-b border-slate-200 bg-gradient-to-b from-blue-50/60 via-white to-white">
        <div className="mx-auto max-w-7xl px-6 py-14 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-6 flex flex-col justify-center"
            >
              <p className="text-sm font-semibold text-blue-800 tracking-wide">
                Academic Literature Synthesis Platform
              </p>

              <h1
                style={{ fontSize: 'clamp(2.25rem, 4vw, 3.6rem)', textWrap: 'balance' }}
                className="mt-3 font-display font-bold tracking-tight text-slate-900 leading-[1.1]"
              >
                Understand Research Papers in Seconds
              </h1>

              <p className="mt-5 max-w-xl text-base sm:text-lg text-slate-600 leading-relaxed">
                Upload any PDF manuscript to automatically extract research objectives, methodology,
                algorithms, datasets, experimental results, limitations, and future scope in plain,
                human-understandable language.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={() => onNavigate('dashboard')}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-900 px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-blue-800 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
                >
                  <span>Get Started</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>

                <button
                  type="button"
                  onClick={() => onNavigate('upload')}
                  className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50/70 px-6 py-3.5 text-sm font-semibold text-blue-900 transition-colors hover:bg-blue-100 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
                >
                  <UploadCloud className="h-4 w-4" aria-hidden="true" />
                  <span>Upload Research Paper</span>
                </button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-6 flex"
            >
              <div className="w-full overflow-hidden rounded-2xl border border-slate-200 bg-blue-50/40">
                {!heroImgFailed ? (
                  <img
                    src={HERO_IMG}
                    alt="Layered scientific research analysis diagrams and structured schema sheets"
                    referrerPolicy="no-referrer"
                    onError={() => setHeroImgFailed(true)}
                    className="h-72 sm:h-96 lg:h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-72 sm:h-96 lg:h-full w-full flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-slate-100 p-8 text-center">
                    <BookOpen className="h-12 w-12 text-blue-900 mb-3" aria-hidden="true" />
                    <p className="font-display text-lg font-semibold text-slate-900">
                      Structured Research Synthesis
                    </p>
                    <p className="mt-1 text-sm text-slate-600 max-w-sm">
                      Page-aware PDF parsing, 11-section breakdown, grounded Q&A, and comparison tables.
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Full-width 4-Column Capability Strip below hero split */}
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 border-t border-slate-200 pt-10">
            <div>
              <p className="font-display text-sm font-semibold text-slate-900">11-Section Extraction</p>
              <p className="mt-1 text-sm text-slate-600 leading-relaxed">
                Turns dense PDFs into objectives, methodology, algorithms, datasets, and limitations.
              </p>
            </div>
            <div>
              <p className="font-display text-sm font-semibold text-slate-900">Page-Cited RAG Q&A</p>
              <p className="mt-1 text-sm text-slate-600 leading-relaxed">
                Ask follow-up questions and receive answers anchored to exact pages in your PDF.
              </p>
            </div>
            <div>
              <p className="font-display text-sm font-semibold text-slate-900">Multi-Paper Matrix</p>
              <p className="mt-1 text-sm text-slate-600 leading-relaxed">
                Compare two or more studies side by side to uncover trade-offs and research gaps.
              </p>
            </div>
            <div>
              <p className="font-display text-sm font-semibold text-slate-900">Formatted PDF Reports</p>
              <p className="mt-1 text-sm text-slate-600 leading-relaxed">
                Export any paper breakdown as a clean, printable academic report in one click.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Asymmetric Bento Grid */}
      <section id="features" className="mx-auto max-w-7xl px-6 py-16 lg:py-24">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-blue-800">Core Capabilities</p>
          <h2
            style={{ textWrap: 'balance' }}
            className="mt-2 font-display text-3xl sm:text-4xl font-bold tracking-tight text-slate-900"
          >
            Built for literature reviews, thesis writing, and technical reading
          </h2>
          <p className="mt-3 text-base text-slate-600 leading-relaxed">
            Every workflow operates directly on the text extracted from your uploaded PDF manuscripts.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Marquee Bento Card (2-col span) */}
          <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-blue-50/40 p-7 flex flex-col justify-between">
            <div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-900 text-white">
                <FileText className="h-5 w-5" aria-hidden="true" />
              </div>
              <h3 className="mt-5 font-display text-xl font-bold text-slate-900">
                Complete 11-Section Research Breakdown
              </h3>
              <p className="mt-2.5 max-w-2xl text-sm sm:text-base text-slate-600 leading-relaxed">
                Automatically reads multi-page academic PDFs and distills the paper overview,
                abstract summary, research objectives, problem statement, step-by-step methodology,
                algorithms, dataset specifications, results, limitations, future scope, and conclusion.
              </p>
            </div>

            <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3 border-t border-blue-200/70 pt-5 text-xs font-medium text-slate-700">
              <span>01. Paper Overview</span>
              <span>02. Abstract Summary</span>
              <span>03. Research Objectives</span>
              <span>04. Problem Statement</span>
              <span>05. Methodology</span>
              <span>06. Algorithms & Tools</span>
              <span>07. Dataset Details</span>
              <span>08. Results & Metrics</span>
              <span>09. Limitations & Scope</span>
            </div>
          </div>

          {/* Card 2 */}
          <div className="rounded-2xl border border-slate-200 bg-white p-7 flex flex-col justify-between">
            <div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-900">
                <MessageSquare className="h-5 w-5" aria-hidden="true" />
              </div>
              <h3 className="mt-5 font-display text-xl font-bold text-slate-900">
                Ask AI With Page Citations
              </h3>
              <p className="mt-2.5 text-sm text-slate-600 leading-relaxed">
                Query any uploaded paper in plain English. Our retrieval pipeline finds the most
                relevant passages and cites page numbers directly inside each response.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('ask')}
              className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-900 hover:text-blue-700 whitespace-nowrap"
            >
              <span>Try Ask AI Workspace</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          {/* Card 3 */}
          <div className="rounded-2xl border border-slate-200 bg-white p-7 flex flex-col justify-between">
            <div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-900">
                <GitCompare className="h-5 w-5" aria-hidden="true" />
              </div>
              <h3 className="mt-5 font-display text-xl font-bold text-slate-900">
                Compare Multiple Studies
              </h3>
              <p className="mt-2.5 text-sm text-slate-600 leading-relaxed">
                Select two to four analyzed papers to generate a structured comparison table across
                methods, algorithms, datasets, metrics, and unresolved research gaps.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('compare')}
              className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-900 hover:text-blue-700 whitespace-nowrap"
            >
              <span>Open Paper Comparison</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          {/* Card 4 (2-col span) */}
          <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-slate-50 p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-900 text-white">
                <Download className="h-5 w-5" aria-hidden="true" />
              </div>
              <h3 className="mt-5 font-display text-xl font-bold text-slate-900">
                Downloadable PDF Study Reports & Saved Library
              </h3>
              <p className="mt-2 max-w-xl text-sm sm:text-base text-slate-600 leading-relaxed">
                Create an account to store your analyzed papers, conversation history, and cross-paper
                comparisons, and export clean PDF summary reports for offline review or team sharing.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('upload')}
              className="rounded-xl bg-blue-900 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-800 whitespace-nowrap shrink-0"
            >
              Analyze Your First PDF
            </button>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="border-t border-slate-200 bg-slate-50/70">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:py-20">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-blue-800">How It Works</p>
            <h2
              style={{ textWrap: 'balance' }}
              className="mt-2 font-display text-3xl font-bold tracking-tight text-slate-900"
            >
              From raw PDF manuscript to actionable clarity in four steps
            </h2>
          </div>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                step: '01. Upload PDF Manuscript',
                desc: 'Drag and drop any academic PDF up to 20 MB. Format and readability are validated automatically.',
              },
              {
                step: '02. Text & Passage Indexing',
                desc: 'The server parses every page, counts words, and builds overlapping page-numbered chunks for retrieval.',
              },
              {
                step: '03. Structured AI Synthesis',
                desc: 'Eleven clear sections explain the objectives, methodology, algorithms, datasets, results, and limits.',
              },
              {
                step: '04. Ask, Compare & Export',
                desc: 'Ask follow-up questions, compare up to four studies in a table, or download a formatted PDF report.',
              },
            ].map((item) => (
              <div
                key={item.step}
                className="rounded-2xl border border-slate-200 bg-white p-6"
              >
                <h3 className="font-display text-base font-bold text-blue-900">{item.step}</h3>
                <p className="mt-2.5 text-sm text-slate-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quiet Footer */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-6 py-8 text-sm text-slate-600">
          <div>
            <p className="font-display font-semibold text-slate-900">AI Research Paper Analyzer</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Structured PDF extraction, RAG Q&A, multi-paper comparison, and PDF reporting.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-6 text-xs font-medium">
            <button type="button" onClick={() => onNavigate('dashboard')} className="hover:text-blue-900">
              Dashboard
            </button>
            <button type="button" onClick={() => onNavigate('upload')} className="hover:text-blue-900">
              Upload PDF
            </button>
            <button type="button" onClick={() => onNavigate('compare')} className="hover:text-blue-900">
              Compare Papers
            </button>
            <button type="button" onClick={() => onNavigate('about')} className="hover:text-blue-900">
              About & Contact
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
