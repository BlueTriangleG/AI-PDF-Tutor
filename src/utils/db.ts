import { Message, PDFHistory } from '../types';

class BrowserDB {
  private getItem<T>(key: string, defaultValue: T): T {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  }

  private setItem(key: string, value: any): void {
    localStorage.setItem(key, JSON.stringify(value));
  }

  private documents: PDFHistory[];
  private messages: Message[];

  constructor() {
    this.documents = this.getItem<PDFHistory[]>('documents', []);
    this.messages = this.getItem<Message[]>('messages', []);
  }

  saveDocument(doc: PDFHistory): void {
    const existingIndex = this.documents.findIndex(d => d.id === doc.id);
    if (existingIndex !== -1) {
      this.documents[existingIndex] = {
        ...doc,
        lastViewed: new Date()
      };
    } else {
      this.documents.push({
        ...doc,
        currentPage: doc.currentPage || 1,
        lastViewed: new Date()
      });
    }
    
    // Keep only the last 10 documents
    this.documents = this.documents
      .sort((a, b) => b.lastViewed.getTime() - a.lastViewed.getTime())
      .slice(0, 10);
    
    this.setItem('documents', this.documents);
  }

  saveMessage(documentId: string, message: Message): void {
    this.messages.push({
      ...message,
      timestamp: new Date()
    });
    this.setItem('messages', this.messages);
  }

  getHistory(): PDFHistory[] {
    return this.documents.map(doc => ({
      ...doc,
      lastViewed: new Date(doc.lastViewed),
      messages: this.messages
        .filter(m => m.id !== null)
        .map(m => ({
          ...m,
          timestamp: new Date(m.timestamp)
        }))
    }));
  }

  clearHistory(): void {
    this.documents = [];
    this.messages = [];
    localStorage.removeItem('documents');
    localStorage.removeItem('messages');
  }
}

// Create a singleton instance
const db = new BrowserDB();

// Export the same interface as before
export const {
  saveDocument,
  saveMessage,
  getHistory,
  clearHistory
} = db;