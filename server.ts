import 'dotenv/config';
import crypto from 'crypto';
import express from 'express';
import multer from 'multer';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import {
  hashSecret,
  requireAuth,
  signSessionToken,
  verifySecret,
  verifySessionToken,
  type AuthenticatedRequest,
} from './server/auth.ts';
import {
  countChatQuestionsByOwner,
  createUser,
  deletePaperByOwnerAndId,
  findUserByEmail,
  getPaperByOwnerAndId,
  getPaperChunks,
  listChatMessages,
  listComparisonsByOwner,
  listPapersByOwner,
  saveChatMessage,
  saveComparison,
  saveContactMessage,
  savePaperWithChunks,
  transferGuestWorkspace,
  updateUserPassword,
} from './server/db.ts';
import {
  analyzePaperWithGemini,
  answerQuestionWithRag,
  comparePapersWithGemini,
} from './server/gemini.ts';
import {
  buildPaperChunks,
  extractPdfText,
  generateAnalysisPdfBuffer,
  generateSampleResearchPdfBuffer,
  isValidPdfBuffer,
  retrieveRelevantChunks,
} from './server/pdf.ts';
import type { PaperRecord } from './server/types.ts';

const app = express();
app.use(express.json({ limit: '2mb' }));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
});

function sanitizeFilenameForHeader(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80) || 'research-report';
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// --- Authentication Routes ---

app.post('/api/auth/guest', (_req, res) => {
  const guestId = `guest:${crypto.randomUUID()}`;
  const token = signSessionToken({
    sub: guestId,
    kind: 'guest',
    name: 'Guest Researcher',
    email: null,
  });
  res.json({
    token,
    user: {
      id: guestId,
      kind: 'guest',
      name: 'Guest Researcher',
      email: null,
    },
  });
});

app.post('/api/auth/register', (req, res) => {
  const { name, email, password, securityQuestion, securityAnswer, guestToken } = req.body ?? {};
  const cleanName = typeof name === 'string' ? name.trim() : '';
  const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  const cleanPassword = typeof password === 'string' ? password : '';
  const cleanQuestion = typeof securityQuestion === 'string' ? securityQuestion.trim() : '';
  const cleanAnswer = typeof securityAnswer === 'string' ? securityAnswer.trim().toLowerCase() : '';

  if (cleanName.length < 2) {
    res.status(400).json({ error: 'Please enter your full name (at least 2 characters).' });
    return;
  }
  if (!validateEmail(cleanEmail)) {
    res.status(400).json({ error: 'Please enter a valid email address.' });
    return;
  }
  if (cleanPassword.length < 8) {
    res.status(400).json({ error: 'Password must be at least 8 characters long.' });
    return;
  }
  if (cleanQuestion.length < 5 || cleanAnswer.length < 2) {
    res.status(400).json({ error: 'Please provide a recovery question and answer for password resets.' });
    return;
  }

  const existing = findUserByEmail(cleanEmail);
  if (existing) {
    res.status(409).json({ error: 'An account with this email already exists. Please sign in.' });
    return;
  }

  const userId = crypto.randomUUID();
  createUser({
    id: userId,
    name: cleanName,
    email: cleanEmail,
    password_hash: hashSecret(cleanPassword),
    security_question: cleanQuestion,
    security_answer_hash: hashSecret(cleanAnswer),
    created_at: new Date().toISOString(),
  });

  if (typeof guestToken === 'string' && guestToken.trim()) {
    const guestPayload = verifySessionToken(guestToken.trim());
    if (guestPayload && guestPayload.kind === 'guest') {
      transferGuestWorkspace(guestPayload.sub, userId);
    }
  }

  const token = signSessionToken({
    sub: userId,
    kind: 'user',
    name: cleanName,
    email: cleanEmail,
  });

  res.status(201).json({
    token,
    user: {
      id: userId,
      kind: 'user',
      name: cleanName,
      email: cleanEmail,
    },
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password, guestToken } = req.body ?? {};
  const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  const cleanPassword = typeof password === 'string' ? password : '';

  if (!validateEmail(cleanEmail) || !cleanPassword) {
    res.status(400).json({ error: 'Email and password are required.' });
    return;
  }

  const user = findUserByEmail(cleanEmail);
  if (!user || !verifySecret(cleanPassword, user.password_hash)) {
    res.status(401).json({ error: 'Invalid email or password.' });
    return;
  }

  if (typeof guestToken === 'string' && guestToken.trim()) {
    const guestPayload = verifySessionToken(guestToken.trim());
    if (guestPayload && guestPayload.kind === 'guest') {
      transferGuestWorkspace(guestPayload.sub, user.id);
    }
  }

  const token = signSessionToken({
    sub: user.id,
    kind: 'user',
    name: user.name,
    email: user.email,
  });

  res.json({
    token,
    user: {
      id: user.id,
      kind: 'user',
      name: user.name,
      email: user.email,
    },
  });
});

app.post('/api/auth/forgot-password/lookup', (req, res) => {
  const { email } = req.body ?? {};
  const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  if (!validateEmail(cleanEmail)) {
    res.status(400).json({ error: 'Please enter a valid email address.' });
    return;
  }

  const user = findUserByEmail(cleanEmail);
  if (!user) {
    res.status(404).json({ error: 'No account was found with that email address.' });
    return;
  }

  res.json({
    email: user.email,
    securityQuestion: user.security_question,
  });
});

app.post('/api/auth/forgot-password/reset', (req, res) => {
  const { email, securityAnswer, newPassword } = req.body ?? {};
  const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  const cleanAnswer = typeof securityAnswer === 'string' ? securityAnswer.trim().toLowerCase() : '';
  const cleanNewPassword = typeof newPassword === 'string' ? newPassword : '';

  if (!validateEmail(cleanEmail) || !cleanAnswer) {
    res.status(400).json({ error: 'Email and recovery answer are required.' });
    return;
  }
  if (cleanNewPassword.length < 8) {
    res.status(400).json({ error: 'New password must be at least 8 characters long.' });
    return;
  }

  const user = findUserByEmail(cleanEmail);
  if (!user || !verifySecret(cleanAnswer, user.security_answer_hash)) {
    res.status(401).json({ error: 'The recovery answer does not match our records.' });
    return;
  }

  updateUserPassword(user.id, hashSecret(cleanNewPassword));
  res.json({ message: 'Your password has been updated. You can now sign in.' });
});

app.get('/api/auth/me', requireAuth, (req: AuthenticatedRequest, res) => {
  res.json({
    user: {
      id: req.auth!.ownerId,
      kind: req.auth!.kind,
      name: req.auth!.name,
      email: req.auth!.email,
    },
  });
});

// --- Dashboard & Analytics ---

app.get('/api/dashboard', requireAuth, (req: AuthenticatedRequest, res) => {
  const ownerId = req.auth!.ownerId;
  const papers = listPapersByOwner(ownerId);
  const comparisons = listComparisonsByOwner(ownerId);
  const totalQuestions = countChatQuestionsByOwner(ownerId);

  const totalPages = papers.reduce((sum, p) => sum + p.pageCount, 0);
  const totalWords = papers.reduce((sum, p) => sum + p.wordCount, 0);

  const domainMap = new Map<string, number>();
  for (const paper of papers) {
    const domain = paper.domain || 'General Science';
    domainMap.set(domain, (domainMap.get(domain) ?? 0) + 1);
  }
  const domainStats = Array.from(domainMap.entries())
    .map(([domain, count]) => ({ domain, count }))
    .sort((a, b) => b.count - a.count);

  res.json({
    stats: {
      totalPapers: papers.length,
      totalPages,
      totalWords,
      totalQuestions,
      totalComparisons: comparisons.length,
    },
    domainStats,
    recentPapers: papers.slice(0, 8),
    recentComparisons: comparisons.slice(0, 5),
  });
});

// --- PDF Upload, Analysis, Library & Report Download ---

app.post(
  '/api/papers/upload',
  requireAuth,
  (req, res, next) => {
    upload.single('file')(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
          res.status(400).json({ error: 'PDF file exceeds the 20 MB maximum upload limit.' });
          return;
        }
        res.status(400).json({ error: err.message || 'File upload failed.' });
        return;
      }
      next();
    });
  },
  async (req: AuthenticatedRequest, res) => {
    try {
      const file = req.file;
      if (!file) {
        res.status(400).json({ error: 'Please select a PDF file to upload.' });
        return;
      }

      const isPdfExt = file.originalname.toLowerCase().endsWith('.pdf');
      if (!isPdfExt && file.mimetype !== 'application/pdf') {
        res.status(400).json({ error: 'Only PDF documents (.pdf) are supported.' });
        return;
      }

      if (!isValidPdfBuffer(file.buffer)) {
        res.status(400).json({ error: 'The uploaded file does not appear to be a valid PDF document.' });
        return;
      }

      const extracted = await extractPdfText(file.buffer);
      if (extracted.pageCount === 0) {
        res.status(400).json({ error: 'The PDF contains no readable pages.' });
        return;
      }

      const pdfBase64 =
        file.buffer.length <= 10 * 1024 * 1024 ? file.buffer.toString('base64') : undefined;

      const analysis = await analyzePaperWithGemini({
        filename: file.originalname,
        pageCount: extracted.pageCount,
        extractedText: extracted.fullText,
        pdfBase64,
      });

      const paperId = crypto.randomUUID();
      const paper: PaperRecord = {
        id: paperId,
        ownerId: req.auth!.ownerId,
        title: analysis.title || file.originalname.replace(/\.pdf$/i, ''),
        authors: analysis.authors || 'Unknown',
        publicationYear: analysis.publicationYear || 'Not stated',
        domain: analysis.domain || 'Research',
        filename: file.originalname,
        fileSize: file.size,
        pageCount: extracted.pageCount,
        wordCount: extracted.wordCount,
        analysis,
        createdAt: new Date().toISOString(),
      };

      const chunks = buildPaperChunks(paperId, extracted.pages);
      savePaperWithChunks(paper, extracted.fullText, chunks);

      res.status(201).json({ paper });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to analyze PDF paper.';
      const status = message.includes('GEMINI_API_KEY') ? 500 : 502;
      res.status(status).json({ error: message });
    }
  }
);

app.get('/api/papers', requireAuth, (req: AuthenticatedRequest, res) => {
  const papers = listPapersByOwner(req.auth!.ownerId);
  res.json({ papers });
});

app.get('/api/papers/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  const paper = getPaperByOwnerAndId(req.auth!.ownerId, String(req.params.id));
  if (!paper) {
    res.status(404).json({ error: 'Research paper not found.' });
    return;
  }
  res.json({ paper });
});

app.delete('/api/papers/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  const deleted = deletePaperByOwnerAndId(req.auth!.ownerId, String(req.params.id));
  if (!deleted) {
    res.status(404).json({ error: 'Research paper not found.' });
    return;
  }
  res.json({ deleted: true });
});

app.get('/api/papers/:id/report', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const paper = getPaperByOwnerAndId(req.auth!.ownerId, String(req.params.id));
    if (!paper) {
      res.status(404).json({ error: 'Research paper not found.' });
      return;
    }

    const pdfBuffer = await generateAnalysisPdfBuffer(paper);
    const safeName = sanitizeFilenameForHeader(paper.title.replace(/\s+/g, '_'));
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${safeName}_Analysis_Report.pdf"`);
    res.send(pdfBuffer);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to generate PDF report.';
    res.status(500).json({ error: message });
  }
});

// --- Ask AI (RAG Chat) ---

app.get('/api/chat/:paperId', requireAuth, (req: AuthenticatedRequest, res) => {
  const paper = getPaperByOwnerAndId(req.auth!.ownerId, String(req.params.paperId));
  if (!paper) {
    res.status(404).json({ error: 'Research paper not found.' });
    return;
  }
  const messages = listChatMessages(req.auth!.ownerId, paper.id);
  res.json({ messages });
});

app.post('/api/chat/:paperId', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const paper = getPaperByOwnerAndId(req.auth!.ownerId, String(req.params.paperId));
    if (!paper) {
      res.status(404).json({ error: 'Research paper not found.' });
      return;
    }

    const question = typeof req.body?.question === 'string' ? req.body.question.trim() : '';
    if (!question) {
      res.status(400).json({ error: 'Please enter a question about the paper.' });
      return;
    }

    const history = listChatMessages(req.auth!.ownerId, paper.id);
    const allChunks = getPaperChunks(paper.id);
    const relevantChunks = retrieveRelevantChunks(allChunks, question, 6);

    const answer = await answerQuestionWithRag({
      paper,
      retrievedChunks: relevantChunks,
      history,
      question,
    });

    const userMsg = {
      id: crypto.randomUUID(),
      ownerId: req.auth!.ownerId,
      paperId: paper.id,
      role: 'user' as const,
      content: question,
      citations: [],
      createdAt: new Date().toISOString(),
    };
    saveChatMessage(userMsg);

    const citations = relevantChunks.slice(0, 3).map((chunk) => ({
      pageNumber: chunk.pageNumber,
      excerpt: chunk.content.slice(0, 160).trim() + (chunk.content.length > 160 ? '...' : ''),
    }));

    const assistantMsg = {
      id: crypto.randomUUID(),
      ownerId: req.auth!.ownerId,
      paperId: paper.id,
      role: 'assistant' as const,
      content: answer,
      citations,
      createdAt: new Date(Date.now() + 1).toISOString(),
    };
    saveChatMessage(assistantMsg);

    res.status(201).json({
      userMessage: userMsg,
      assistantMessage: assistantMsg,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unable to answer question.';
    res.status(502).json({ error: message });
  }
});

// --- Multi-Paper Comparison ---

app.get('/api/compare', requireAuth, (req: AuthenticatedRequest, res) => {
  const comparisons = listComparisonsByOwner(req.auth!.ownerId);
  res.json({ comparisons });
});

app.post('/api/compare', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const paperIds: unknown = req.body?.paperIds;
    if (!Array.isArray(paperIds) || paperIds.length < 2 || paperIds.length > 4) {
      res.status(400).json({ error: 'Please select between 2 and 4 research papers to compare.' });
      return;
    }

    const uniqueIds = Array.from(new Set(paperIds.map(String)));
    if (uniqueIds.length < 2) {
      res.status(400).json({ error: 'Please select at least 2 distinct papers.' });
      return;
    }

    const papers: PaperRecord[] = [];
    for (const id of uniqueIds) {
      const found = getPaperByOwnerAndId(req.auth!.ownerId, id);
      if (!found) {
        res.status(404).json({ error: 'One or more selected papers could not be found in your library.' });
        return;
      }
      papers.push(found);
    }

    const result = await comparePapersWithGemini(papers);
    const record = {
      id: crypto.randomUUID(),
      ownerId: req.auth!.ownerId,
      paperIds: uniqueIds,
      title: result.title || `${papers.length}-Paper Comparative Study`,
      result,
      createdAt: new Date().toISOString(),
    };
    saveComparison(record);

    res.status(201).json({ comparison: record });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unable to compare selected papers.';
    res.status(502).json({ error: message });
  }
});

// --- Sample Academic PDF Endpoint (for instant real upload testing) ---

app.get('/api/sample-paper', async (_req, res) => {
  try {
    const buffer = await generateSampleResearchPdfBuffer();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="HybridMed_RAG_Clinical_Summarization.pdf"');
    res.send(buffer);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not generate sample PDF.';
    res.status(500).json({ error: message });
  }
});

// --- Contact Form ---

app.post('/api/contact', (req, res) => {
  const { name, email, subject, message } = req.body ?? {};
  const cleanName = typeof name === 'string' ? name.trim() : '';
  const cleanEmail = typeof email === 'string' ? email.trim() : '';
  const cleanSubject = typeof subject === 'string' ? subject.trim() : '';
  const cleanMessage = typeof message === 'string' ? message.trim() : '';

  if (cleanName.length < 2) {
    res.status(400).json({ error: 'Please enter your name.' });
    return;
  }
  if (!validateEmail(cleanEmail)) {
    res.status(400).json({ error: 'Please enter a valid email address.' });
    return;
  }
  if (cleanSubject.length < 3) {
    res.status(400).json({ error: 'Please enter a brief subject.' });
    return;
  }
  if (cleanMessage.length < 10) {
    res.status(400).json({ error: 'Please write a message of at least 10 characters.' });
    return;
  }

  saveContactMessage({
    id: crypto.randomUUID(),
    name: cleanName,
    email: cleanEmail,
    subject: cleanSubject,
    message: cleanMessage,
    createdAt: new Date().toISOString(),
  });

  res.status(201).json({
    submitted: true,
    message: 'Thank you. Your inquiry has been recorded and our team will respond shortly.',
  });
});

// --- Vite / Static Frontend Serving ---

async function startServer() {
  const port = Number(process.env.PORT) || 3000;

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`AI Research Paper Analyzer server running on http://localhost:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
