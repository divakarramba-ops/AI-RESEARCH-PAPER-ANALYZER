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

export interface PaperChunk {
  id: string;
  paperId: string;
  chunkIndex: number;
  pageNumber: number;
  content: string;
  keywords: string;
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

export interface AuthContext {
  ownerId: string;
  kind: 'user' | 'guest';
  userId: string | null;
  email: string | null;
  name: string;
}
