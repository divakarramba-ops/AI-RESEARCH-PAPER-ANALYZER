import { BookOpen, CheckCircle2, Mail, Send } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { submitContactForm } from '../api.ts';

const WORKSPACE_IMG = '/src/assets/images/about_lab_workspace_1795433802840.jpg';
const AVATAR_IMG = '/src/assets/images/researcher_avatar_1795433802735.jpg';

export function AboutContactPage() {
  const [workspaceImgFailed, setWorkspaceImgFailed] = useState(false);
  const [avatarImgFailed, setAvatarImgFailed] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedMsg, setSubmittedMsg] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmittedMsg(null);
    setSubmitting(true);
    try {
      const res = await submitContactForm({ name, email, subject, message });
      setSubmittedMsg(res.message);
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send message.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 space-y-12">
      {/* Project Description + Hero Image */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        <div className="lg:col-span-6 flex flex-col justify-center space-y-4">
          <p className="text-sm font-semibold text-blue-800">About the Project</p>
          <h1
            style={{ textWrap: 'balance' }}
            className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-slate-900"
          >
            Making dense academic literature accessible to every student and researcher
          </h1>
          <p className="text-base text-slate-600 leading-relaxed">
            AI Research Paper Analyzer is a full-stack literature intelligence platform engineered
            to parse multi-page PDF manuscripts, extract structured methodological insights, ground
            conversational Q&A in page-level passages, and synthesize multi-paper comparisons.
          </p>
        </div>

        <div className="lg:col-span-6">
          <div className="h-72 sm:h-80 lg:h-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
            {!workspaceImgFailed ? (
              <img
                src={WORKSPACE_IMG}
                alt="Sunlit university research library study desk with academic journals"
                referrerPolicy="no-referrer"
                onError={() => setWorkspaceImgFailed(true)}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center bg-blue-50 p-6 text-center">
                <BookOpen className="h-10 w-10 text-blue-900 mb-2" aria-hidden="true" />
                <p className="font-display text-base font-semibold text-slate-900">
                  Academic Research Workspace
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Technologies Used & Developer Information */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white p-7">
          <h2 className="font-display text-xl font-bold text-slate-900">
            Technologies & System Architecture
          </h2>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">
            Built with a clean separation between client workspace UI, server-side PDF extraction,
            relational storage, and structured LLM orchestration.
          </p>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
              <p className="font-display font-semibold text-blue-900">Frontend Interface</p>
              <p className="mt-1 text-slate-600">
                React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Motion transitions
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
              <p className="font-display font-semibold text-blue-900">Backend & Persistence</p>
              <p className="mt-1 text-slate-600">
                Express server, SQLite (better-sqlite3) with parameterized queries, scrypt auth
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
              <p className="font-display font-semibold text-blue-900">PDF Parsing & Reporting</p>
              <p className="mt-1 text-slate-600">
                PDF.js page-by-page extraction, overlapping passage chunking, PDFKit report export
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
              <p className="font-display font-semibold text-blue-900">AI & Retrieval Pipeline</p>
              <p className="mt-1 text-slate-600">
                Gemini 4 LLM with structured JSON schemas and page-cited RAG passage retrieval
              </p>
            </div>
          </div>
        </div>

        {/* Developer Information */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-7 flex flex-col justify-between">
          <div>
            <h2 className="font-display text-xl font-bold text-slate-900">
              Project Maintainer
            </h2>
            <div className="mt-5 flex items-center gap-4">
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full border border-slate-200 bg-blue-50">
                {!avatarImgFailed ? (
                  <img
                    src={AVATAR_IMG}
                    alt="Lead research systems developer portrait"
                    referrerPolicy="no-referrer"
                    onError={() => setAvatarImgFailed(true)}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center font-display text-lg font-bold text-blue-900">
                    AR
                  </div>
                )}
              </div>
              <div>
                <p className="font-display text-base font-bold text-slate-900">
                  Research Engineering Team
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Full-Stack Engineering · Applied NLP & RAG Systems
                </p>
              </div>
            </div>

            <p className="mt-5 text-sm text-slate-600 leading-relaxed">
              Designed for final-year academic research projects, graduate literature reviews, and
              laboratory reading groups needing verifiable, page-grounded PDF synthesis.
            </p>
          </div>

          <div className="mt-6 border-t border-slate-200 pt-4 flex items-center gap-2 text-xs font-medium text-slate-600">
            <Mail className="h-4 w-4 text-blue-900" aria-hidden="true" />
            <span>support@researchpaperanalyzer.edu</span>
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section id="contact-form" className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
        <div className="max-w-2xl">
          <h2 className="font-display text-2xl font-bold text-slate-900">Contact Us</h2>
          <p className="mt-1 text-sm text-slate-600">
            Have feedback, academic collaboration inquiries, or technical questions? Send us a
            message below.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          >
            {error}
          </div>
        )}

        {submittedMsg && (
          <div
            role="status"
            className="mt-5 flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
          >
            <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{submittedMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label htmlFor="contact-name" className="block text-sm font-medium text-slate-700">
              Your Name
            </label>
            <input
              id="contact-name"
              type="text"
              required
              minLength={2}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Alex Rivera"
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label htmlFor="contact-email" className="block text-sm font-medium text-slate-700">
              Email Address
            </label>
            <input
              id="contact-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alex@university.edu"
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="contact-subject" className="block text-sm font-medium text-slate-700">
              Subject
            </label>
            <input
              id="contact-subject"
              type="text"
              required
              minLength={3}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Academic collaboration or feature feedback"
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="contact-message" className="block text-sm font-medium text-slate-700">
              Message
            </label>
            <textarea
              id="contact-message"
              required
              minLength={10}
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your inquiry or feedback..."
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="sm:col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-900 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-800 disabled:opacity-60 whitespace-nowrap"
            >
              <Send className="h-4 w-4" aria-hidden="true" />
              <span>{submitting ? 'Sending Message...' : 'Send Message'}</span>
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
