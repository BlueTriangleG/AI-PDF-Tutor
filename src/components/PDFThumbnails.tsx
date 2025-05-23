import React, { useEffect, useState } from 'react';
import { usePDF } from '../contexts/PDFContext';
import * as pdfjsLib from 'pdfjs-dist';

export const PDFThumbnails: React.FC = () => {
  const { document: pdfDocument, currentPage, setCurrentPage } = usePDF();
  const [thumbnails, setThumbnails] = useState<{ [key: number]: string }>({});
  
  const renderThumbnail = async (pageNum: number) => {
    if (!pdfDocument || typeof window === 'undefined') return;
    
    try {
      // Ensure we're in a browser environment
      if (typeof document === 'undefined') {
        console.warn('Document object not available - skipping thumbnail rendering');
        return;
      }

      // Create a new offscreen canvas for rendering
      const renderCanvas = document.createElement('canvas');
      const arrayBuffer = await fetch(pdfDocument.url).then(res => res.arrayBuffer());
      const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
      const page = await pdf.getPage(pageNum);
      
      const viewport = page.getViewport({ scale: 0.2 }); // Small scale for thumbnails
      renderCanvas.height = viewport.height;
      renderCanvas.width = viewport.width;
      
      const context = renderCanvas.getContext('2d');
      if (!context) {
        console.warn('Could not get canvas context - skipping thumbnail rendering');
        return;
      }
      
      await page.render({
        canvasContext: context,
        viewport: viewport,
      }).promise;

      // Convert the rendered canvas to a data URL
      const thumbnailUrl = renderCanvas.toDataURL();
      setThumbnails(prev => ({
        ...prev,
        [pageNum]: thumbnailUrl
      }));
    } catch (error) {
      console.error('Error rendering thumbnail:', error);
    }
  };
  
  useEffect(() => {
    if (pdfDocument) {
      // Render all thumbnails when document changes
      Array.from({ length: pdfDocument.totalPages }, (_, i) => i + 1).forEach(pageNum => {
        renderThumbnail(pageNum);
      });
    }
  }, [pdfDocument]);
  
  if (!pdfDocument) return null;
  
  return (
    <div className="w-full overflow-x-auto py-2 px-2 flex space-x-2 border-t border-gray-200 dark:border-gray-700">
      {Array.from({ length: pdfDocument.totalPages }, (_, i) => i + 1).map((pageNum) => (
        <button
          key={pageNum}
          onClick={() => setCurrentPage(pageNum)}
          className={`flex-shrink-0 w-16 h-20 flex flex-col items-center justify-center rounded-md border transition-colors ${
            pageNum === currentPage
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 dark:border-blue-400'
              : 'border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800'
          }`}
        >
          {thumbnails[pageNum] ? (
            <img
              src={thumbnails[pageNum]}
              alt={`Page ${pageNum}`}
              className="w-14 h-16 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded mb-1 object-contain"
            />
          ) : (
            <div className="w-14 h-16 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded mb-1 flex items-center justify-center">
              <div className="animate-pulse bg-gray-200 dark:bg-gray-600 w-full h-full rounded"></div>
            </div>
          )}
          <span className="text-xs text-gray-500 dark:text-gray-400">{pageNum}</span>
        </button>
      ))}
    </div>
  );
};