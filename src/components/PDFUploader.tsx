import React, { useState } from 'react';
import { Button } from './ui/Button';
import { processPDFFile } from '../utils/pdfUtils';
import { usePDF } from '../contexts/PDFContext';
import { FileText, Upload } from 'lucide-react';

export const PDFUploader: React.FC = () => {
  const { setDocument } = usePDF();
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    
    if (!file) return;
    
    // Validate file type
    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file');
      return;
    }
    
    setIsUploading(true);
    setError(null);
    
    try {
      const processedDocument = await processPDFFile(file);
      setDocument(processedDocument);
    } catch (error) {
      console.error('Error processing PDF:', error);
      setError(error instanceof Error ? error.message : 'Failed to process PDF. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };
  
  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    
    const file = event.dataTransfer.files?.[0];
    
    if (!file) return;
    
    // Validate file type
    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file');
      return;
    }
    
    setIsUploading(true);
    setError(null);
    
    try {
      const processedDocument = await processPDFFile(file);
      setDocument(processedDocument);
    } catch (error) {
      console.error('Error processing PDF:', error);
      setError(error instanceof Error ? error.message : 'Failed to process PDF. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };
  
  return (
    <div className="w-full max-w-lg mx-auto mt-8">
      <div
        className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => document.getElementById('pdf-upload')?.click()}
      >
        <input
          type="file"
          id="pdf-upload"
          className="hidden"
          accept="application/pdf"
          onChange={handleFileChange}
        />
        
        <div className="flex flex-col items-center justify-center">
          {isUploading ? (
            <div className="animate-pulse">
              <div className="h-12 w-12 rounded-full border-4 border-blue-500 border-t-transparent animate-spin mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Processing PDF...</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900 mb-4">
                {error ? (
                  <FileText className="h-6 w-6 text-red-500" />
                ) : (
                  <Upload className="h-6 w-6 text-blue-500 dark:text-blue-400" />
                )}
              </div>
              <p className="text-lg font-medium mb-2">Upload your PDF</p>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Drag and drop your file here, or click to browse
              </p>
              <Button variant="primary" size="sm" type="button">
                Select PDF
              </Button>
              {error && <p className="mt-4 text-sm text-red-500">{error}</p>}
            </>
          )}
        </div>
      </div>
    </div>
  );
};