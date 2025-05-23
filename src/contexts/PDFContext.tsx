import React, { createContext, useContext, useState, useEffect } from 'react';
import { PDFDocument, PDFHistory } from '../types';

interface PDFContextType {
  document: PDFDocument | null;
  isLoading: boolean;
  currentPage: number;
  history: PDFHistory[];
  setDocument: (doc: PDFDocument | null) => void;
  setCurrentPage: (page: number) => void;
  clearDocument: () => void;
  updateHistory: (messages: any[]) => void;
}

const PDFContext = createContext<PDFContextType | undefined>(undefined);

export const PDFProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [document, setDocumentState] = useState<PDFDocument | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentPage, setCurrentPageState] = useState<number>(1);
  const [history, setHistory] = useState<PDFHistory[]>(() => {
    const savedHistory = localStorage.getItem('pdf_history');
    return savedHistory ? JSON.parse(savedHistory) : [];
  });

  const setDocument = (doc: PDFDocument | null) => {
    if (doc) {
      const now = new Date();
      doc.lastViewed = now;
      setDocumentState(doc);
      setCurrentPageState(1);
    } else {
      setDocumentState(null);
      setCurrentPageState(1);
    }
  };

  const updateHistory = (messages: any[]) => {
    if (document) {
      const historyEntry: PDFHistory = {
        id: document.id,
        name: document.name,
        totalPages: document.totalPages,
        lastViewed: new Date(),
        messages: messages,
        currentPage: currentPage
      };
      
      setHistory(prev => {
        const filtered = prev.filter(item => item.id !== document.id);
        return [historyEntry, ...filtered].slice(0, 10);
      });
    }
  };

  const setCurrentPage = (page: number) => {
    if (!document) return;
    
    const validPage = Math.max(1, Math.min(page, document.totalPages));
    setCurrentPageState(validPage);
    
    if (document) {
      setDocumentState({
        ...document,
        currentPage: validPage,
      });
    }
  };

  const clearDocument = () => {
    setDocumentState(null);
    setCurrentPageState(1);
  };

  useEffect(() => {
    if (document) {
      document.currentPage = currentPage;
    }
  }, [currentPage, document]);

  // Save history to localStorage
  useEffect(() => {
    localStorage.setItem('pdf_history', JSON.stringify(history));
  }, [history]);

  return (
    <PDFContext.Provider
      value={{
        document,
        isLoading,
        currentPage,
        history,
        setDocument,
        setCurrentPage,
        clearDocument,
        updateHistory
      }}
    >
      {children}
    </PDFContext.Provider>
  );
};

export const usePDF = () => {
  const context = useContext(PDFContext);
  if (context === undefined) {
    throw new Error('usePDF must be used within a PDFProvider');
  }
  return context;
};