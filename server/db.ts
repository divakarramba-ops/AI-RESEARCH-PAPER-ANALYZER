import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import type {
  ChatMessageRecord,
  ComparisonRecord,
  ComparisonResult,
  PaperChunk,
  PaperRecord,
  StructuredPaperAnalysis,
} from './types.ts';

const dataDir = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'research_analyzer.db');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    security_question TEXT NOT NULL,
    security_answer_hash TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS papers (
    id TEXT PRIMARY KEY,
    owner_id TEXT NOT NULL,
    title TEXT NOT NULL,
    authors TEXT NOT NULL,
    publication_year TEXT NOT NULL,
    domain TEXT NOT NULL,
    filename TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    page_count INTEGER NOT NULL,
    word_count INTEGER NOT NULL,
    raw_text TEXT NOT NULL,
    analysis_json TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_papers_owner ON papers(owner_id, created_at DESC);

  CREATE TABLE IF NOT EXISTS paper_chunks (
    id TEXT PRIMARY KEY,
    paper_id TEXT NOT NULL,
    chunk_index INTEGER NOT NULL,
    page_number INTEGER NOT NULL,
    content TEXT NOT NULL,
    keywords TEXT NOT NULL,
    FOREIGN KEY (paper_id) REFERENCES papers(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_chunks_paper ON paper_chunks(paper_id, chunk_index);

  CREATE TABLE IF NOT EXISTS chat_messages (
    id TEXT PRIMARY KEY,
    owner_id TEXT NOT NULL,
    paper_id TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    citations_json TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (paper_id) REFERENCES papers(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_chat_owner_paper ON chat_messages(owner_id, paper_id, created_at ASC);

  CREATE TABLE IF NOT EXISTS comparisons (
    id TEXT PRIMARY KEY,
    owner_id TEXT NOT NULL,
    paper_ids_json TEXT NOT NULL,
    title TEXT NOT NULL,
    comparison_json TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_comparisons_owner ON comparisons(owner_id, created_at DESC);

  CREATE TABLE IF NOT EXISTS contact_messages (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
`);

export interface UserRow {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  security_question: string;
  security_answer_hash: string;
  created_at: string;
}

export function findUserByEmail(email: string): UserRow | undefined {
  return db
    .prepare('SELECT * FROM users WHERE lower(email) = lower(?)')
    .get(email.trim()) as UserRow | undefined;
}

export function findUserById(id: string): UserRow | undefined {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id) as UserRow | undefined;
}

export function createUser(user: UserRow): void {
  db.prepare(
    `INSERT INTO users (id, name, email, password_hash, security_question, security_answer_hash, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(
    user.id,
    user.name,
    user.email.toLowerCase(),
    user.password_hash,
    user.security_question,
    user.security_answer_hash,
    user.created_at
  );
}

export function updateUserPassword(userId: string, passwordHash: string): void {
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(passwordHash, userId);
}

export function transferGuestWorkspace(fromOwnerId: string, toOwnerId: string): void {
  if (!fromOwnerId || !toOwnerId || fromOwnerId === toOwnerId) return;
  const tx = db.transaction(() => {
    db.prepare('UPDATE papers SET owner_id = ? WHERE owner_id = ?').run(toOwnerId, fromOwnerId);
    db.prepare('UPDATE chat_messages SET owner_id = ? WHERE owner_id = ?').run(toOwnerId, fromOwnerId);
    db.prepare('UPDATE comparisons SET owner_id = ? WHERE owner_id = ?').run(toOwnerId, fromOwnerId);
  });
  tx();
}

export function savePaperWithChunks(
  paper: PaperRecord,
  rawText: string,
  chunks: PaperChunk[]
): void {
  const tx = db.transaction(() => {
    db.prepare(
      `INSERT INTO papers (
        id, owner_id, title, authors, publication_year, domain,
        filename, file_size, page_count, word_count, raw_text, analysis_json, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      paper.id,
      paper.ownerId,
      paper.title,
      paper.authors,
      paper.publicationYear,
      paper.domain,
      paper.filename,
      paper.fileSize,
      paper.pageCount,
      paper.wordCount,
      rawText,
      JSON.stringify(paper.analysis),
      paper.createdAt
    );

    const insertChunk = db.prepare(
      `INSERT INTO paper_chunks (id, paper_id, chunk_index, page_number, content, keywords)
       VALUES (?, ?, ?, ?, ?, ?)`
    );
    for (const chunk of chunks) {
      insertChunk.run(
        chunk.id,
        chunk.paperId,
        chunk.chunkIndex,
        chunk.pageNumber,
        chunk.content,
        chunk.keywords
      );
    }
  });
  tx();
}

function mapPaperRow(row: Record<string, unknown>): PaperRecord {
  return {
    id: String(row.id),
    ownerId: String(row.owner_id),
    title: String(row.title),
    authors: String(row.authors),
    publicationYear: String(row.publication_year),
    domain: String(row.domain),
    filename: String(row.filename),
    fileSize: Number(row.file_size),
    pageCount: Number(row.page_count),
    wordCount: Number(row.word_count),
    analysis: JSON.parse(String(row.analysis_json)) as StructuredPaperAnalysis,
    createdAt: String(row.created_at),
  };
}

export function listPapersByOwner(ownerId: string): PaperRecord[] {
  const rows = db
    .prepare(
      `SELECT id, owner_id, title, authors, publication_year, domain, filename,
              file_size, page_count, word_count, analysis_json, created_at
       FROM papers
       WHERE owner_id = ?
       ORDER BY created_at DESC`
    )
    .all(ownerId) as Array<Record<string, unknown>>;
  return rows.map(mapPaperRow);
}

export function getPaperByOwnerAndId(ownerId: string, paperId: string): PaperRecord | null {
  const row = db
    .prepare(
      `SELECT id, owner_id, title, authors, publication_year, domain, filename,
              file_size, page_count, word_count, analysis_json, created_at
       FROM papers
       WHERE id = ? AND owner_id = ?`
    )
    .get(paperId, ownerId) as Record<string, unknown> | undefined;
  return row ? mapPaperRow(row) : null;
}

export function deletePaperByOwnerAndId(ownerId: string, paperId: string): boolean {
  const result = db
    .prepare('DELETE FROM papers WHERE id = ? AND owner_id = ?')
    .run(paperId, ownerId);
  return result.changes > 0;
}

export function getPaperChunks(paperId: string): PaperChunk[] {
  const rows = db
    .prepare(
      `SELECT id, paper_id, chunk_index, page_number, content, keywords
       FROM paper_chunks
       WHERE paper_id = ?
       ORDER BY chunk_index ASC`
    )
    .all(paperId) as Array<Record<string, unknown>>;

  return rows.map((row) => ({
    id: String(row.id),
    paperId: String(row.paper_id),
    chunkIndex: Number(row.chunk_index),
    pageNumber: Number(row.page_number),
    content: String(row.content),
    keywords: String(row.keywords),
  }));
}

export function saveChatMessage(message: ChatMessageRecord): void {
  db.prepare(
    `INSERT INTO chat_messages (id, owner_id, paper_id, role, content, citations_json, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(
    message.id,
    message.ownerId,
    message.paperId,
    message.role,
    message.content,
    JSON.stringify(message.citations),
    message.createdAt
  );
}

export function listChatMessages(ownerId: string, paperId: string): ChatMessageRecord[] {
  const rows = db
    .prepare(
      `SELECT id, owner_id, paper_id, role, content, citations_json, created_at
       FROM chat_messages
       WHERE owner_id = ? AND paper_id = ?
       ORDER BY created_at ASC`
    )
    .all(ownerId, paperId) as Array<Record<string, unknown>>;

  return rows.map((row) => ({
    id: String(row.id),
    ownerId: String(row.owner_id),
    paperId: String(row.paper_id),
    role: row.role === 'assistant' ? 'assistant' : 'user',
    content: String(row.content),
    citations: JSON.parse(String(row.citations_json)) as Array<{ pageNumber: number; excerpt: string }>,
    createdAt: String(row.created_at),
  }));
}

export function countChatQuestionsByOwner(ownerId: string): number {
  const row = db
    .prepare(`SELECT COUNT(*) AS count FROM chat_messages WHERE owner_id = ? AND role = 'user'`)
    .get(ownerId) as { count: number };
  return Number(row?.count ?? 0);
}

export function saveComparison(record: ComparisonRecord): void {
  db.prepare(
    `INSERT INTO comparisons (id, owner_id, paper_ids_json, title, comparison_json, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(
    record.id,
    record.ownerId,
    JSON.stringify(record.paperIds),
    record.title,
    JSON.stringify(record.result),
    record.createdAt
  );
}

export function listComparisonsByOwner(ownerId: string): ComparisonRecord[] {
  const rows = db
    .prepare(
      `SELECT id, owner_id, paper_ids_json, title, comparison_json, created_at
       FROM comparisons
       WHERE owner_id = ?
       ORDER BY created_at DESC`
    )
    .all(ownerId) as Array<Record<string, unknown>>;

  return rows.map((row) => ({
    id: String(row.id),
    ownerId: String(row.owner_id),
    paperIds: JSON.parse(String(row.paper_ids_json)) as string[],
    title: String(row.title),
    result: JSON.parse(String(row.comparison_json)) as ComparisonResult,
    createdAt: String(row.created_at),
  }));
}

export function saveContactMessage(input: {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: string;
}): void {
  db.prepare(
    `INSERT INTO contact_messages (id, name, email, subject, message, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(input.id, input.name, input.email, input.subject, input.message, input.createdAt);
}
