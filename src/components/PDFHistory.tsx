import React from 'react';
import { usePDF } from '../contexts/PDFContext';
import { useChat } from '../contexts/ChatContext';
import { Clock, File, MessageSquare } from 'lucide-react';
import { Card } from './ui/Card';
import { processPDFFile } from '../utils/pdfUtils';

export const PDFHistory: React.FC = () => {
  const { history, setDocument, setCurrentPage } = usePDF();
  const { setMessages } = useChat();

  const handleDocumentClick = async (doc: { id: string; name: string; url: string; messages?: any[] }) => {
    try {
      // Find the document in history
      const historyDoc = history.find(h => h.id === doc.id);
      if (!historyDoc) {
        console.error('Document not found in history');
        return;
      }

      // Create a new blob URL if the old one is invalid
      let url = doc.url;
      if (!url.startsWith('blob:')) {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch document');
        const blob = await response.blob();
        url = URL.createObjectURL(blob);
      }

      const file = new File([await fetch(url).then(r => r.blob())], doc.name, { type: 'application/pdf' });

      // Process the PDF file
      const processedDocument = await processPDFFile(file);
      
      // Update the document with the new URL and history data
      const updatedDocument = {
        ...processedDocument,
        url,
        lastViewed: new Date(),
      };
      
      // Set the document first to ensure proper initialization
      setDocument(updatedDocument);

      // Restore the chat messages if they exist
      if (historyDoc.messages) {
        const restoredMessages = historyDoc.messages.map(msg => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        setMessages(restoredMessages);
      } else {
        // Clear messages if no history exists
        setMessages([]);
      }

      // Restore the current page if it exists
      if (historyDoc.currentPage) {
        setCurrentPage(historyDoc.currentPage);
      }
    } catch (error) {
      console.error('Error restoring document:', error);
    }
  };

  if (history.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        <Clock className="h-5 w-5 mr-2 text-gray-500" />
        Recent Documents
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {history.map((doc) => (
          <Card 
            key={doc.id} 
            className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
            onClick={() => handleDocumentClick(doc)}
          >
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                  <File className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {doc.name}
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {doc.totalPages} pages • Last viewed{' '}
                  {new Date(doc.lastViewed).toLocaleDateString()}
                </p>
                {doc.messages && doc.messages.length > 0 && (
                  <div className="flex items-center mt-2 text-xs text-gray-500 dark:text-gray-400">
                    <MessageSquare className="h-3 w-3 mr-1" />
                    {doc.messages.length} message{doc.messages.length !== 1 ? 's' : ''}
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};