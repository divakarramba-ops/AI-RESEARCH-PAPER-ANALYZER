export type PageRoute =
  | 'home'
  | 'auth'
  | 'dashboard'
  | 'upload'
  | 'analysis'
  | 'ask'
  | 'compare'
  | 'about';

export interface AuthUser {
  id: string;
  kind: 'user' | 'guest';
  name: string;
  email: string | null;
}

export interface StructuredPaperAnalysis {
  title: string;
  authors: string;
  publicationYear: string;
  domain: string;
  paperOverview: string;
  abstractSummary: string;
  researchObjectives: string[];
  problemStatement: string;
  methodology: string;
  algorithmsAndTechnologies: Array<{
    name: string;
    role: string;
  }>;
  datasetDetails: string;
  resultsAndPerformance: string;
  limitations: string[];
  futureScope: string[];
  conclusion: string;
}

export interface PaperRecord {
  id: string;
  ownerId: string;
  title: string;
  authors: string;
  publicationYear: string;
  domain: string;
  filename: string;
  fileSize: number;
  pageCount: number;
  wordCount: number;
  analysis: StructuredPaperAnalysis;
  createdAt: string;
}

export interface ChatMessageRecord {
  id: string;
  ownerId: string;
  paperId: string;
  role: 'user' | 'assistant';
  content: string;
  citations: Array<{ pageNumber: number; excerpt: string }>;
  createdAt: string;
}

export interface ComparisonRow {
  criterion: string;
  values: Array<{
    paperId: string;
    paperTitle: string;
    summary: string;
  }>;
}

export interface ComparisonResult {
  title: string;
  executiveSummary: string;
  comparisonRows: ComparisonRow[];
  researchGaps: string[];
  recommendations: string[];
}

export interface ComparisonRecord {
  id: string;
  ownerId: string;
  paperIds: string[];
  title: string;
  result: ComparisonResult;
  createdAt: string;
}

export interface DashboardPayload {
  stats: {
    totalPapers: number;
    totalPages: number;
    totalWords: number;
    totalQuestions: number;
    totalComparisons: number;
  };
  domainStats: Array<{ domain: string; count: number }>;
  recentPapers: PaperRecord[];
  recentComparisons: ComparisonRecord[];
}
