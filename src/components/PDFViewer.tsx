import React, { useEffect, useRef, useState } from 'react';
import { usePDF } from '../contexts/PDFContext';
import { useChat } from '../contexts/ChatContext';
import { Button } from './ui/Button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardHeader, CardBody } from './ui/Card';
import * as pdfjsLib from 'pdfjs-dist';

// Cache for storing rendered pages
const pageCache = new Map<string, ImageBitmap>();

export const PDFViewer: React.FC = () => {
  const { document, currentPage, setCurrentPage } = usePDF();
  const { generatePageExplanation } = useChat();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pdfInstance, setPdfInstance] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Load PDF document once
  useEffect(() => {
    if (!document) {
      setPdfInstance(null);
      return;
    }

    const loadPdf = async () => {
      try {
        const arrayBuffer = await fetch(document.url).then(res => res.arrayBuffer());
        const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
        setPdfInstance(pdf);
      } catch (error) {
        console.error('Error loading PDF:', error);
      }
    };

    loadPdf();

    // Cleanup
    return () => {
      pdfInstance?.destroy();
      // Clear cache when document changes
      pageCache.clear();
    };
  }, [document]);

  // Render page when it changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!pdfInstance || !canvas || !document) return;

    const renderPage = async () => {
      setIsLoading(true);
      const context = canvas.getContext('2d');
      if (!context) {
        console.error('Failed to get canvas context');
        return;
      }

      try {
        // Check cache first
        const cacheKey = `${document.id}-${currentPage}`;
        let pageBitmap = pageCache.get(cacheKey);

        if (!pageBitmap) {
          const page = await pdfInstance.getPage(currentPage);
          const viewport = page.getViewport({ scale: 1.5 });
          canvas.height = viewport.height;
          canvas.width = viewport.width;

          // Create an offscreen canvas for rendering
          const offscreen = new OffscreenCanvas(viewport.width, viewport.height);
          const offscreenContext = offscreen.getContext('2d');
          
          if (offscreenContext) {
            await page.render({
              canvasContext: offscreenContext,
              viewport: viewport,
            }).promise;

            // Create and cache the bitmap
            pageBitmap = await createImageBitmap(offscreen);
            pageCache.set(cacheKey, pageBitmap);
          }
        }

        if (pageBitmap) {
          // Clear the canvas and draw the cached bitmap
          context.clearRect(0, 0, canvas.width, canvas.height);
          canvas.width = pageBitmap.width;
          canvas.height = pageBitmap.height;
          context.drawImage(pageBitmap, 0, 0);
        }
      } catch (error) {
        console.error('Error rendering PDF page:', error);
      } finally {
        setIsLoading(false);
      }
    };

    renderPage();
  }, [pdfInstance, currentPage, document]);
  
  if (!document) return null;
  
  const currentPageContent = document.pages.find(p => p.pageNumber === currentPage);
  
  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };
  
  const handleNextPage = () => {
    if (currentPage < document.totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };
  
  const handleExplainPage = () => {
    if (currentPageContent) {
      generatePageExplanation(currentPageContent.text, currentPage);
    }
  };
  
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
          <div className="flex items-center min-w-0">
            <h2 className="text-lg font-semibold truncate max-w-[250px]">
              {document.name}
            </h2>
            <span className="ml-2 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
              Page {currentPage} of {document.totalPages}
            </span>
          </div>
          <div className="flex items-center space-x-2 flex-shrink-0">
            <div className="flex items-center space-x-1">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevPage}
                disabled={currentPage === 1 || isLoading}
                className="px-2"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={currentPage === document.totalPages || isLoading}
                className="px-2"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={handleExplainPage}
              disabled={isLoading}
              className="whitespace-nowrap"
            >
              Explain This Page
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardBody className="flex-grow overflow-auto">
        <div className="flex flex-col items-center min-h-[500px] bg-gray-50 dark:bg-gray-900 rounded-md p-6 border border-gray-200 dark:border-gray-700">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/10 dark:bg-black/20 backdrop-blur-sm rounded-md">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
            </div>
          )}
          <canvas 
            ref={canvasRef}
            className="max-w-full h-auto"
          />
        </div>
      </CardBody>
    </Card>
  );
};