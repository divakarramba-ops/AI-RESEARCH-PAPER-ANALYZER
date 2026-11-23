import { BookOpenText } from 'lucide-react';
import type { AuthUser, PageRoute } from '../types.ts';

interface PublicHeaderProps {
  currentPage: PageRoute;
  user: AuthUser | null;
  onNavigate: (page: PageRoute, sectionId?: string) => void;
}

export function PublicHeader({ currentPage, user, onNavigate }: PublicHeaderProps) {
  const isLoggedInUser = user && user.kind === 'user';

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-8 px-6 py-4">
        {/* Zone 1: Single clean wordmark */}
        <button
          type="button"
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2.5 text-left whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-700 rounded-md"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-900 text-white">
            <BookOpenText className="h-4 w-4" aria-hidden="true" />
          </span>
          <span className="font-display text-lg font-bold tracking-tight text-slate-900">
            AI Research Paper Analyzer
          </span>
        </button>

        {/* Zone 2: 5 concise single-line navigation links */}
        <nav
          aria-label="Primary Navigation"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600"
        >
          <button
            type="button"
            onClick={() => onNavigate('home')}
            className={`whitespace-nowrap shrink-0 transition-colors hover:text-blue-900 hover:underline underline-offset-4 ${
              currentPage === 'home' ? 'text-blue-900 font-semibold' : ''
            }`}
          >
            Home
          </button>
          <button
            type="button"
            onClick={() => onNavigate('home', 'features')}
            className="whitespace-nowrap shrink-0 transition-colors hover:text-blue-900 hover:underline underline-offset-4"
          >
            Features
          </button>
          <button
            type="button"
            onClick={() => onNavigate('about')}
            className={`whitespace-nowrap shrink-0 transition-colors hover:text-blue-900 hover:underline underline-offset-4 ${
              currentPage === 'about' ? 'text-blue-900 font-semibold' : ''
            }`}
          >
            About
          </button>
          <button
            type="button"
            onClick={() => onNavigate('about', 'contact-form')}
            className="whitespace-nowrap shrink-0 transition-colors hover:text-blue-900 hover:underline underline-offset-4"
          >
            Contact
          </button>
          <button
            type="button"
            onClick={() => onNavigate(isLoggedInUser ? 'dashboard' : 'auth')}
            className={`whitespace-nowrap shrink-0 transition-colors hover:text-blue-900 hover:underline underline-offset-4 ${
              currentPage === 'auth' ? 'text-blue-900 font-semibold' : ''
            }`}
          >
            {isLoggedInUser ? 'Dashboard' : 'Login'}
          </button>
        </nav>

        {/* Zone 3: Single primary action */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={() => onNavigate('upload')}
            className="rounded-xl bg-blue-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-800 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
          >
            Upload Paper
          </button>
        </div>
      </div>

      {/* Mobile compact secondary nav row */}
      <div className="flex md:hidden items-center justify-between gap-3 border-t border-slate-100 px-4 py-2 text-xs font-medium text-slate-600 overflow-x-auto">
        <button
          type="button"
          onClick={() => onNavigate('home')}
          className="whitespace-nowrap shrink-0 py-1 px-2 hover:text-blue-900"
        >
          Home
        </button>
        <button
          type="button"
          onClick={() => onNavigate('home', 'features')}
          className="whitespace-nowrap shrink-0 py-1 px-2 hover:text-blue-900"
        >
          Features
        </button>
        <button
          type="button"
          onClick={() => onNavigate('about')}
          className="whitespace-nowrap shrink-0 py-1 px-2 hover:text-blue-900"
        >
          About
        </button>
        <button
          type="button"
          onClick={() => onNavigate('about', 'contact-form')}
          className="whitespace-nowrap shrink-0 py-1 px-2 hover:text-blue-900"
        >
          Contact
        </button>
        <button
          type="button"
          onClick={() => onNavigate(isLoggedInUser ? 'dashboard' : 'auth')}
          className="whitespace-nowrap shrink-0 py-1 px-2 text-blue-900 font-semibold"
        >
          {isLoggedInUser ? 'Dashboard' : 'Login'}
        </button>
      </div>
    </header>
  );
}
