import Database from 'better-sqlite3';
import { Message, PDFHistory } from '../types';

// Initialize database
const db = new Database('pdf-tutor.db');

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    total_pages INTEGER NOT NULL,
    current_page INTEGER DEFAULT 1,
    url TEXT NOT NULL,
    last_viewed DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
  );
`);

// Prepare statements
const insertDocument = db.prepare(`
  INSERT OR REPLACE INTO documents (id, name, total_pages, current_page, url, last_viewed)
  VALUES (@id, @name, @totalPages, @currentPage, @url, @lastViewed)
`);

const insertMessage = db.prepare(`
  INSERT INTO messages (id, document_id, role, content, timestamp)
  VALUES (@id, @documentId, @role, @content, @timestamp)
`);

const getDocumentHistory = db.prepare(`
  SELECT 
    d.*,
    json_group_array(
      json_object(
        'id', m.id,
        'role', m.role,
        'content', m.content,
        'timestamp', m.timestamp
      )
    ) as messages
  FROM documents d
  LEFT JOIN messages m ON d.id = m.document_id
  GROUP BY d.id
  ORDER BY d.last_viewed DESC
  LIMIT 10
`);

export function saveDocument(doc: PDFHistory): void {
  insertDocument.run({
    id: doc.id,
    name: doc.name,
    totalPages: doc.totalPages,
    currentPage: doc.currentPage || 1,
    url: doc.url,
    lastViewed: new Date().toISOString()
  });
}

export function saveMessage(documentId: string, message: Message): void {
  insertMessage.run({
    id: message.id,
    documentId,
    role: message.role,
    content: message.content,
    timestamp: message.timestamp.toISOString()
  });
}

export function getHistory(): PDFHistory[] {
  const results = getDocumentHistory.all();
  return results.map(row => ({
    id: row.id,
    name: row.name,
    totalPages: row.total_pages,
    currentPage: row.current_page,
    url: row.url,
    lastViewed: new Date(row.last_viewed),
    messages: JSON.parse(row.messages).filter((m: any) => m.id !== null).map((m: any) => ({
      ...m,
      timestamp: new Date(m.timestamp)
    }))
  }));
}

export function clearHistory(): void {
  db.exec('DELETE FROM documents');
}