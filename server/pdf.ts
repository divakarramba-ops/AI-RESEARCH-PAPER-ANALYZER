import crypto from 'crypto';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import PDFDocument from 'pdfkit';
import type { PaperChunk, PaperRecord } from './types.ts';

export interface ExtractedPdfData {
  pageCount: number;
  wordCount: number;
  pages: Array<{ pageNumber: number; text: string }>;
  fullText: string;
}

export function isValidPdfBuffer(buffer: Buffer): boolean {
  if (!buffer || buffer.length < 5) return false;
  const header = buffer.subarray(0, 5).toString('ascii');
  return header === '%PDF-';
}

export async function extractPdfText(buffer: Buffer): Promise<ExtractedPdfData> {
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(buffer),
    useSystemFonts: true,
  });

  const pdfDoc = await loadingTask.promise;
  const pageCount = pdfDoc.numPages;
  const pages: Array<{ pageNumber: number; text: string }> = [];

  for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
    const page = await pdfDoc.getPage(pageNum);
    const textContent = await page.getTextContent();
    const strings = textContent.items
      .map((item) => ('str' in item ? item.str : ''))
      .filter((s) => typeof s === 'string' && s.trim().length > 0);
    const pageText = strings.join(' ').replace(/\s+/g, ' ').trim();
    pages.push({ pageNumber: pageNum, text: pageText });
  }

  const fullText = pages
    .map((p) => `[Page ${p.pageNumber}]\n${p.text}`)
    .join('\n\n')
    .trim();

  const wordCount = fullText
    .split(/\s+/)
    .filter((token) => token.length > 0).length;

  return { pageCount, wordCount, pages, fullText };
}

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'that', 'with', 'this', 'from', 'are', 'was', 'were',
  'have', 'has', 'had', 'not', 'but', 'can', 'will', 'which', 'their', 'into',
  'more', 'than', 'also', 'such', 'these', 'those', 'between', 'using', 'used',
  'paper', 'study', 'research', 'based', 'results', 'approach', 'method',
]);

function extractKeywords(text: string): string {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !STOP_WORDS.has(w));
  const counts = new Map<string, number>();
  for (const word of words) {
    counts.set(word, (counts.get(word) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 24)
    .map(([word]) => word)
    .join(' ');
}

export function buildPaperChunks(
  paperId: string,
  pages: Array<{ pageNumber: number; text: string }>
): PaperChunk[] {
  const chunks: PaperChunk[] = [];
  const maxChunkChars = 1100;
  const overlapChars = 180;
  let chunkIndex = 0;

  for (const page of pages) {
    const clean = page.text.trim();
    if (!clean) continue;

    if (clean.length <= maxChunkChars) {
      chunks.push({
        id: crypto.randomUUID(),
        paperId,
        chunkIndex: chunkIndex++,
        pageNumber: page.pageNumber,
        content: clean,
        keywords: extractKeywords(clean),
      });
      continue;
    }

    let cursor = 0;
    while (cursor < clean.length) {
      const slice = clean.slice(cursor, cursor + maxChunkChars).trim();
      if (slice.length > 0) {
        chunks.push({
          id: crypto.randomUUID(),
          paperId,
          chunkIndex: chunkIndex++,
          pageNumber: page.pageNumber,
          content: slice,
          keywords: extractKeywords(slice),
        });
      }
      if (cursor + maxChunkChars >= clean.length) break;
      cursor += maxChunkChars - overlapChars;
    }
  }

  return chunks;
}

export function retrieveRelevantChunks(
  chunks: PaperChunk[],
  query: string,
  limit = 6
): PaperChunk[] {
  if (chunks.length <= limit) return chunks;

  const queryTerms = query
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 2 && !STOP_WORDS.has(w));

  const scored = chunks.map((chunk) => {
    const lowerContent = chunk.content.toLowerCase();
    const lowerKeywords = chunk.keywords.toLowerCase();
    let score = 0;

    for (const term of queryTerms) {
      const contentMatches = lowerContent.split(term).length - 1;
      const keywordBonus = lowerKeywords.includes(term) ? 3 : 0;
      score += contentMatches * 2 + keywordBonus;
    }

    // Slight boost for early overview pages when query is broad
    if (queryTerms.length <= 2 && chunk.pageNumber <= 2) {
      score += 0.5;
    }

    return { chunk, score };
  });

  scored.sort((a, b) => b.score - a.score || a.chunk.chunkIndex - b.chunk.chunkIndex);
  return scored.slice(0, limit).map((item) => item.chunk);
}

export async function generateAnalysisPdfBuffer(paper: PaperRecord): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 56, bottom: 56, left: 54, right: 54 },
      info: {
        Title: `${paper.title} - AI Research Analysis Report`,
        Author: 'AI Research Paper Analyzer',
        Subject: 'Structured Research Paper Analysis',
      },
    });

    const buffers: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    const a = paper.analysis;
    const primaryBlue = '#1E3A8A';
    const accentBlue = '#1D4ED8';
    const textDark = '#0F172A';
    const textMuted = '#475569';
    const lineGray = '#CBD5E1';

    // Header Banner
    doc
      .fontSize(10)
      .fillColor(accentBlue)
      .font('Helvetica-Bold')
      .text('AI RESEARCH PAPER ANALYZER  ·  STRUCTURED REPORT', { align: 'left' });

    doc.moveDown(0.5);
    doc
      .fontSize(20)
      .fillColor(primaryBlue)
      .font('Helvetica-Bold')
      .text(paper.title, { lineGap: 3 });

    doc.moveDown(0.4);
    doc
      .fontSize(10)
      .fillColor(textMuted)
      .font('Helvetica')
      .text(
        `${paper.authors}  ·  ${paper.publicationYear}  ·  ${paper.domain}  ·  ${paper.pageCount} pages  ·  ${paper.wordCount.toLocaleString()} words`
      );

    doc
      .fontSize(9)
      .fillColor(textMuted)
      .text(`Source file: ${paper.filename}  ·  Analyzed on ${new Date(paper.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}`);

    doc.moveDown(0.75);
    doc
      .strokeColor(lineGray)
      .lineWidth(1)
      .moveTo(54, doc.y)
      .lineTo(541, doc.y)
      .stroke();
    doc.moveDown(0.9);

    const addSectionHeading = (num: string, title: string) => {
      if (doc.y > 700) doc.addPage();
      doc
        .fontSize(12.5)
        .fillColor(primaryBlue)
        .font('Helvetica-Bold')
        .text(`${num}. ${title}`);
      doc.moveDown(0.25);
    };

    const addParagraph = (body: string) => {
      doc
        .fontSize(10.5)
        .fillColor(textDark)
        .font('Helvetica')
        .text(body || 'Not explicitly specified in the manuscript.', {
          lineGap: 3.5,
          align: 'left',
        });
      doc.moveDown(0.85);
    };

    const addBullets = (items: string[]) => {
      if (!items || items.length === 0) {
        addParagraph('None explicitly identified.');
        return;
      }
      for (const item of items) {
        if (doc.y > 740) doc.addPage();
        doc
          .fontSize(10.5)
          .fillColor(textDark)
          .font('Helvetica')
          .text(`•  ${item}`, { indent: 8, lineGap: 3 });
        doc.moveDown(0.25);
      }
      doc.moveDown(0.6);
    };

    addSectionHeading('01', 'Paper Overview');
    addParagraph(a.paperOverview);

    addSectionHeading('02', 'Abstract Summary');
    addParagraph(a.abstractSummary);

    addSectionHeading('03', 'Research Objectives');
    addBullets(a.researchObjectives);

    addSectionHeading('04', 'Problem Statement');
    addParagraph(a.problemStatement);

    addSectionHeading('05', 'Methodology');
    addParagraph(a.methodology);

    addSectionHeading('06', 'Algorithms and Technologies');
    if (a.algorithmsAndTechnologies.length === 0) {
      addParagraph('No specific algorithms or software frameworks detailed.');
    } else {
      for (const alg of a.algorithmsAndTechnologies) {
        if (doc.y > 740) doc.addPage();
        doc
          .fontSize(10.5)
          .fillColor(textDark)
          .font('Helvetica-Bold')
          .text(`•  ${alg.name}: `, { continued: true, indent: 8 })
          .font('Helvetica')
          .text(alg.role, { lineGap: 3 });
        doc.moveDown(0.25);
      }
      doc.moveDown(0.6);
    }

    addSectionHeading('07', 'Dataset Details');
    addParagraph(a.datasetDetails);

    addSectionHeading('08', 'Results and Performance');
    addParagraph(a.resultsAndPerformance);

    addSectionHeading('09', 'Limitations');
    addBullets(a.limitations);

    addSectionHeading('10', 'Future Scope');
    addBullets(a.futureScope);

    addSectionHeading('11', 'Conclusion');
    addParagraph(a.conclusion);

    doc.end();
  });
}

export async function generateSampleResearchPdfBuffer(): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 56, bottom: 56, left: 54, right: 54 },
      info: {
        Title: 'Retrieval-Augmented Clinical Literature Summarization Using Sparse-Dense Hybrid Indexing',
        Author: 'Dr. Elena Rostova, Marcus Chen, Priya Nair',
      },
    });
    const buffers: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    doc.fontSize(16).font('Helvetica-Bold').text(
      'Retrieval-Augmented Clinical Literature Summarization Using Sparse-Dense Hybrid Indexing'
    );
    doc.moveDown(0.5);
    doc.fontSize(10.5).font('Helvetica').text(
      'Elena Rostova, Marcus Chen, and Priya Nair · Department of Biomedical Informatics · 2025'
    );
    doc.moveDown(1);

    const sections: Array<[string, string]> = [
      [
        'Abstract',
        'Clinicians and biomedical researchers face accelerating publication volume across PubMed and preprint archives. Standard neural abstractive summarizers frequently hallucinate numerical trial endpoints when synthesizing long multi-page clinical manuscripts. In this study, we propose HybridMed-RAG, a two-stage retrieval-augmented summarization framework combining BM25 lexical scoring with dense domain-adapted Transformer embeddings and reciprocal rank fusion. Evaluated across 1,420 peer-reviewed randomized controlled trial (RCT) papers from the BioSum-2024 benchmark, HybridMed-RAG achieves a ROUGE-L score of 46.8 and reduces factual endpoint errors by 41.3% compared with zero-shot long-context baselines.',
      ],
      [
        '1. Introduction and Problem Statement',
        'Systematic literature reviews require weeks of manual extraction across study design, cohort size, intervention dosages, and primary outcomes. Existing large language models either truncate documents exceeding context limits or suffer from attention dilution across middle pages. Our objective is threefold: (1) preserve exact numerical fidelity for sample sizes, p-values, and confidence intervals; (2) attribute every synthesized claim to explicit page-level source passages; and (3) reduce synthesis latency below 4.5 seconds per manuscript.',
      ],
      [
        '2. Methodology and Algorithms',
        'Incoming PDF documents are parsed at layout-block granularity and segmented into 320-token overlapping chunks with 48-token stride. For retrieval, we implement a hybrid pipeline pairing Okapi BM25 (k1=1.5, b=0.75) with PubMedBERT-Large dense embeddings indexed via HNSW (efConstruction=200, M=16). Candidate passages are merged via Reciprocal Rank Fusion (k=60) and re-ranked by a cross-encoder verifier before structured JSON decoding. Parameter-efficient fine-tuning uses LoRA (rank=16, alpha=32) on open-weights instruction models.',
      ],
      [
        '3. Dataset and Experimental Setup',
        'Experiments were conducted on two datasets: (a) BioSum-2024, containing 1,420 open-access clinical trial PDFs averaging 11.4 pages and 6,850 words each, and (b) MedQA-Evidence, a held-out validation set of 380 oncology and cardiology papers annotated by three board-certified physicians. All models were evaluated using ROUGE-1, ROUGE-L, BERTScore-F1, and human-audited Factual Consistency Rate (FCR).',
      ],
      [
        '4. Results and Performance',
        'HybridMed-RAG outperformed standalone BM25 (ROUGE-L 38.2, FCR 74.1%) and standalone dense retrieval (ROUGE-L 42.9, FCR 81.6%), achieving 46.8 ROUGE-L, 88.4 BERTScore-F1, and 93.2% FCR on BioSum-2024. Median inference latency was 3.8 seconds per 12-page PDF. Ablation studies confirmed that removing reciprocal rank fusion decreased numerical recall by 9.4 percentage points.',
      ],
      [
        '5. Limitations, Future Scope, and Conclusion',
        'Key limitations include reduced OCR accuracy on scanned historical manuscripts prior to 1998, inability to interpret embedded multi-panel Kaplan-Meier survival plots without vision encoders, and restriction to English-language trials. Future work will integrate multimodal chart-to-table parsers, multilingual clinical embeddings across Spanish and Mandarin corpora, and live PubMed citation graph verification. Overall, HybridMed-RAG demonstrates that combining lexical exactness with dense semantic retrieval provides reliable, auditable literature synthesis.',
      ],
    ];

    for (const [heading, body] of sections) {
      doc.fontSize(12.5).font('Helvetica-Bold').text(heading);
      doc.moveDown(0.3);
      doc.fontSize(10.5).font('Helvetica').text(body, { lineGap: 3.5 });
      doc.moveDown(0.85);
    }

    doc.end();
  });
}
