import { useCallback, useEffect, useState } from 'react';
import { ensureWorkspaceToken, setSessionToken } from './api.ts';
import { PublicHeader } from './components/PublicHeader.tsx';
import { WorkspaceLayout } from './components/WorkspaceLayout.tsx';
import { AboutContactPage } from './pages/AboutContactPage.tsx';
import { AnalysisPage } from './pages/AnalysisPage.tsx';
import { AskAiPage } from './pages/AskAiPage.tsx';
import { AuthPage } from './pages/AuthPage.tsx';
import { ComparePage } from './pages/ComparePage.tsx';
import { DashboardPage } from './pages/DashboardPage.tsx';
import { HomePage } from './pages/HomePage.tsx';
import { UploadPage } from './pages/UploadPage.tsx';
import type { AuthUser, PageRoute, PaperRecord } from './types.ts';

const WORKSPACE_PAGES = new Set<PageRoute>([
  'dashboard',
  'upload',
  'analysis',
  'ask',
  'compare',
]);

const BREADCRUMB_TITLES: Record<PageRoute, string> = {
  home: 'Home',
  auth: 'Account',
  dashboard: 'Dashboard',
  upload: 'Upload PDF',
  analysis: 'Research Analysis',
  ask: 'Ask AI',
  compare: 'Compare Research Papers',
  about: 'About & Contact',
};

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageRoute>('home');
  const [user, setUser] = useState<AuthUser | null>(null);
  const [selectedPaper, setSelectedPaper] = useState<PaperRecord | null>(null);

  useEffect(() => {
    void ensureWorkspaceToken()
      .then((res) => setUser(res.user))
      .catch(() => {
        // Handled lazily on protected actions if initial fetch fails
      });
  }, []);

  const handleNavigate = useCallback((page: PageRoute, sectionId?: string) => {
    setCurrentPage(page);
    if (sectionId) {
      window.setTimeout(() => {
        document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
      }, 80);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  const handleSelectPaper = useCallback(
    (paper: PaperRecord, targetPage: 'analysis' | 'ask' = 'analysis') => {
      setSelectedPaper(paper);
      setCurrentPage(targetPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    []
  );

  const handleAnalysisComplete = useCallback((paper: PaperRecord) => {
    setSelectedPaper(paper);
    setCurrentPage('analysis');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleSignOut = useCallback(async () => {
    setSessionToken(null);
    setSelectedPaper(null);
    try {
      const fresh = await ensureWorkspaceToken();
      setUser(fresh.user);
    } catch {
      setUser(null);
    }
    setCurrentPage('home');
  }, []);

  if (WORKSPACE_PAGES.has(currentPage)) {
    return (
      <WorkspaceLayout
        currentPage={currentPage}
        breadcrumbTitle={BREADCRUMB_TITLES[currentPage]}
        user={user}
        onNavigate={(page) => handleNavigate(page)}
        onSignOut={() => void handleSignOut()}
      >
        {currentPage === 'dashboard' && (
          <DashboardPage
            onNavigate={(page) => handleNavigate(page)}
            onSelectPaper={handleSelectPaper}
          />
        )}
        {currentPage === 'upload' && (
          <UploadPage onAnalysisComplete={handleAnalysisComplete} />
        )}
        {currentPage === 'analysis' && (
          <AnalysisPage
            selectedPaper={selectedPaper}
            onSelectPaper={setSelectedPaper}
            onNavigate={(page) => handleNavigate(page)}
          />
        )}
        {currentPage === 'ask' && (
          <AskAiPage
            selectedPaper={selectedPaper}
            onSelectPaper={setSelectedPaper}
            onNavigate={(page) => handleNavigate(page)}
          />
        )}
        {currentPage === 'compare' && <ComparePage />}
      </WorkspaceLayout>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <PublicHeader
        currentPage={currentPage}
        user={user}
        onNavigate={handleNavigate}
      />
      <main className="flex-1">
        {currentPage === 'home' && <HomePage onNavigate={handleNavigate} />}
        {currentPage === 'auth' && (
          <AuthPage
            onAuthSuccess={(authedUser) => setUser(authedUser)}
            onNavigate={(page) => handleNavigate(page)}
          />
        )}
        {currentPage === 'about' && <AboutContactPage />}
      </main>
    </div>
  );
}
