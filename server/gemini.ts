import { GoogleGenAI, Type } from '@google/genai';
import type {
  ChatMessageRecord,
  ComparisonResult,
  PaperChunk,
  PaperRecord,
  StructuredPaperAnalysis,
} from './types.ts';

function getAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      'GEMINI_API_KEY is not configured. Please add your Gemini API key in Settings > Secrets.'
    );
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

const MODEL_NAME = 'gemini-4-hydrogen';

export async function analyzePaperWithGemini(input: {
  filename: string;
  pageCount: number;
  extractedText: string;
  pdfBase64?: string;
}): Promise<StructuredPaperAnalysis> {
  const ai = getAiClient();

  const truncatedText =
    input.extractedText.length > 90000
      ? input.extractedText.slice(0, 90000) + '\n\n[Document truncated after 90,000 characters]'
      : input.extractedText;

  const promptText = `Analyze the attached research paper (${input.filename}, ${input.pageCount} pages) and extract a clear, accurate, human-understandable structured breakdown.

Requirements:
- Base every field strictly on the actual research paper content provided.
- Write in plain, clear, student- and researcher-friendly language without jargon walls.
- If a paper is theoretical and does not use a dataset, explicitly state that in datasetDetails.
- Keep bullet arrays concise, specific, and grounded (3 to 6 items where applicable).

Extracted PDF Text:
${truncatedText}`;

  const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];
  if (input.pdfBase64 && input.pdfBase64.length < 14 * 1024 * 1024) {
    parts.push({
      inlineData: {
        mimeType: 'application/pdf',
        data: input.pdfBase64,
      },
    });
  }
  parts.push({ text: promptText });

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: { parts },
    config: {
      systemInstruction:
        'You are an expert academic research analyst. Extract structured insights from uploaded research manuscripts accurately and explain complex technical concepts in clear, plain English.',
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: 'Full title of the research paper' },
          authors: { type: Type.STRING, description: 'Comma-separated author names or Unknown' },
          publicationYear: { type: Type.STRING, description: 'Publication year or Not stated' },
          domain: {
            type: Type.STRING,
            description: 'Concise research domain (e.g., Natural Language Processing, Computer Vision, Biomedical Informatics)',
          },
          paperOverview: {
            type: Type.STRING,
            description: 'Plain-language 3-5 sentence overview explaining what the paper does and why it matters.',
          },
          abstractSummary: {
            type: Type.STRING,
            description: 'Clear, accessible summary of the abstract.',
          },
          researchObjectives: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'List of primary research objectives.',
          },
          problemStatement: {
            type: Type.STRING,
            description: 'Clear explanation of the problem the authors are solving.',
          },
          methodology: {
            type: Type.STRING,
            description: 'Step-by-step plain-language explanation of the proposed methodology and architecture.',
          },
          algorithmsAndTechnologies: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                role: { type: Type.STRING },
              },
              required: ['name', 'role'],
            },
            description: 'Algorithms, models, mathematical frameworks, and tools used in the paper.',
          },
          datasetDetails: {
            type: Type.STRING,
            description: 'Datasets used, sample sizes, splits, and preprocessing details.',
          },
          resultsAndPerformance: {
            type: Type.STRING,
            description: 'Key experimental results, metrics, and comparison against baselines.',
          },
          limitations: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Research limitations and constraints.',
          },
          futureScope: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Suggested future research directions.',
          },
          conclusion: {
            type: Type.STRING,
            description: 'Clear concluding takeaway of the paper.',
          },
        },
        required: [
          'title',
          'authors',
          'publicationYear',
          'domain',
          'paperOverview',
          'abstractSummary',
          'researchObjectives',
          'problemStatement',
          'methodology',
          'algorithmsAndTechnologies',
          'datasetDetails',
          'resultsAndPerformance',
          'limitations',
          'futureScope',
          'conclusion',
        ],
      },
    },
  });

  const rawJson = (response.text ?? '').trim();
  if (!rawJson) {
    throw new Error('The AI model returned an empty analysis response. Please try again.');
  }

  return JSON.parse(rawJson) as StructuredPaperAnalysis;
}

export async function answerQuestionWithRag(input: {
  paper: PaperRecord;
  retrievedChunks: PaperChunk[];
  history: ChatMessageRecord[];
  question: string;
}): Promise<string> {
  const ai = getAiClient();

  const contextPassages = input.retrievedChunks
    .map((c) => `[Page ${c.pageNumber}] ${c.content}`)
    .join('\n\n');

  const recentHistory = input.history
    .slice(-6)
    .map((m) => `${m.role === 'user' ? 'Researcher' : 'Assistant'}: ${m.content}`)
    .join('\n');

  const prompt = `Paper Title: ${input.paper.title}
Authors: ${input.paper.authors} (${input.paper.publicationYear})

Structured Summary Context:
- Problem: ${input.paper.analysis.problemStatement}
- Methodology: ${input.paper.analysis.methodology}
- Algorithms: ${input.paper.analysis.algorithmsAndTechnologies.map((a) => `${a.name} (${a.role})`).join('; ')}
- Dataset: ${input.paper.analysis.datasetDetails}
- Results: ${input.paper.analysis.resultsAndPerformance}
- Limitations: ${input.paper.analysis.limitations.join('; ')}

Retrieved Source Passages from PDF:
${contextPassages || 'No additional raw text chunks extracted.'}

${recentHistory ? `Recent Conversation:\n${recentHistory}\n` : ''}
Researcher's Question: ${input.question}

Answer clearly in human-understandable language grounded strictly in this paper. Cite page numbers like [Page 2] when referencing retrieved passages. If the paper does not state something, say so plainly rather than guessing.`;

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
    config: {
      systemInstruction:
        'You are a careful research assistant answering questions strictly from the uploaded research paper passages and structured analysis. Be concise, clear, and accurate.',
    },
  });

  const answer = (response.text ?? '').trim();
  if (!answer) {
    throw new Error('The AI assistant could not generate an answer. Please try again.');
  }
  return answer;
}

export async function comparePapersWithGemini(papers: PaperRecord[]): Promise<ComparisonResult> {
  const ai = getAiClient();

  const dossier = papers
    .map(
      (p, idx) => `=== PAPER ${idx + 1} ===
ID: ${p.id}
Title: ${p.title}
Authors: ${p.authors} (${p.publicationYear})
Domain: ${p.domain}
Problem Statement: ${p.analysis.problemStatement}
Methodology: ${p.analysis.methodology}
Algorithms & Technologies: ${p.analysis.algorithmsAndTechnologies.map((a) => `${a.name}: ${a.role}`).join(' | ')}
Datasets: ${p.analysis.datasetDetails}
Results & Performance: ${p.analysis.resultsAndPerformance}
Limitations: ${p.analysis.limitations.join(' | ')}
Future Scope: ${p.analysis.futureScope.join(' | ')}`
    )
    .join('\n\n');

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: `Compare the following ${papers.length} research papers across their methodologies, algorithms, datasets, experimental results, limitations, and research gaps.\n\n${dossier}`,
    config: {
      systemInstruction:
        'You are a senior research reviewer conducting a rigorous cross-paper comparative synthesis. Use exact paper IDs and titles provided.',
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: {
            type: Type.STRING,
            description: 'Concise comparison title summarizing the papers compared.',
          },
          executiveSummary: {
            type: Type.STRING,
            description: 'High-level synthesis highlighting key similarities, trade-offs, and winners.',
          },
          comparisonRows: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                criterion: {
                  type: Type.STRING,
                  description: 'Criterion such as Methodology, Algorithms Used, Datasets, Results & Performance, Key Limitations, Reproducibility & Practical Readiness',
                },
                values: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      paperId: { type: Type.STRING },
                      paperTitle: { type: Type.STRING },
                      summary: { type: Type.STRING },
                    },
                    required: ['paperId', 'paperTitle', 'summary'],
                  },
                },
              },
              required: ['criterion', 'values'],
            },
          },
          researchGaps: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Specific unresolved research gaps identified across these papers.',
          },
          recommendations: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Actionable research directions for a researcher building on these works.',
          },
        },
        required: ['title', 'executiveSummary', 'comparisonRows', 'researchGaps', 'recommendations'],
      },
    },
  });

  const rawJson = (response.text ?? '').trim();
  if (!rawJson) {
    throw new Error('The AI model returned an empty comparison response. Please try again.');
  }
  return JSON.parse(rawJson) as ComparisonResult;
}
