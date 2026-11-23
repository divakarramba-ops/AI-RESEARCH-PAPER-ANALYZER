import {
  BookOpenText,
  FileSearch,
  GitCompare,
  Home,
  Info,
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  MessageSquareText,
  UploadCloud,
  X,
} from 'lucide-react';
import { useState, type ReactNode } from 'react';
import type { AuthUser, PageRoute } from '../types.ts';

interface WorkspaceLayoutProps {
  currentPage: PageRoute;
  breadcrumbTitle: string;
  user: AuthUser | null;
  onNavigate: (page: PageRoute) => void;
  onSignOut: () => void;
  children: ReactNode;
}

const NAV_ITEMS: Array<{ id: PageRoute; label: string; icon: typeof LayoutDashboard }> = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'upload', label: 'Upload PDF', icon: UploadCloud },
  { id: 'analysis', label: 'Research Analysis', icon: FileSearch },
  { id: 'ask', label: 'Ask AI', icon: MessageSquareText },
  { id: 'compare', label: 'Compare Papers', icon: GitCompare },
  { id: 'about', label: 'About & Contact', icon: Info },
];

export function WorkspaceLayout({
  currentPage,
  breadcrumbTitle,
  user,
  onNavigate,
  onSignOut,
  children,
}: WorkspaceLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const isRegistered = user && user.kind === 'user';

  const handleSelect = (page: PageRoute) => {
    setMobileOpen(false);
    onNavigate(page);
  };

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between bg-slate-50 border-r border-slate-200 px-4 py-5">
      <div>
        <button
          type="button"
          onClick={() => handleSelect('home')}
          className="flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-left transition-colors hover:bg-blue-50"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-900 text-white">
            <BookOpenText className="h-4 w-4" aria-hidden="true" />
          </span>
          <span className="font-display text-sm font-bold tracking-tight text-slate-900 leading-tight">
            Paper Analyzer
          </span>
        </button>

        <nav aria-label="Workspace Navigation" className="mt-6 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = currentPage === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item.id)}
                className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-blue-900 text-white shadow-xs'
                    : 'text-slate-700 hover:bg-blue-50 hover:text-blue-900'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="mt-6 border-t border-slate-200 pt-4">
          <button
            type="button"
            onClick={() => handleSelect('home')}
            className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-blue-50 hover:text-blue-900 whitespace-nowrap"
          >
            <Home className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Back to Home</span>
          </button>
        </div>
      </div>

      <div className="border-t border-slate-200 pt-4">
        <div className="px-2 pb-3">
          <p className="text-sm font-semibold text-slate-900 truncate">
            {user?.name || 'Guest Researcher'}
          </p>
          <p className="text-xs text-slate-500 truncate mt-0.5">
            {isRegistered ? user.email : 'Temporary workspace session'}
          </p>
        </div>

        {isRegistered ? (
          <button
            type="button"
            onClick={onSignOut}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 whitespace-nowrap"
          >
            <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Sign Out</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => handleSelect('auth')}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-50 border border-blue-200 px-3.5 py-2 text-xs font-semibold text-blue-900 transition-colors hover:bg-blue-100 whitespace-nowrap"
          >
            <LogIn className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Sign In to Save History</span>
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 sticky top-0 h-screen">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/40"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <div className="relative z-10 w-64 max-w-[80vw] h-full bg-slate-50">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label="Close navigation menu"
              className="absolute right-3 top-4 rounded-lg p-1.5 text-slate-500 hover:bg-slate-200"
            >
              <X className="h-5 w-5" />
            </button>
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 sm:px-8 py-3.5">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden rounded-lg border border-slate-200 p-2 text-slate-700 hover:bg-slate-100"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2 text-sm min-w-0">
              <span className="text-slate-400 whitespace-nowrap hidden sm:inline">Workspace</span>
              <span className="text-slate-300 hidden sm:inline" aria-hidden="true">/</span>
              <h1 className="font-display text-base font-semibold text-slate-900 truncate">
                {breadcrumbTitle}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => onNavigate('upload')}
              className="rounded-xl bg-blue-900 px-4 py-2 text-xs sm:text-sm font-semibold text-white transition-colors hover:bg-blue-800 whitespace-nowrap shrink-0"
            >
              Upload Paper
            </button>
          </div>
        </header>

        <main className="flex-1 px-4 sm:px-8 py-6 sm:py-8 max-w-6xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
