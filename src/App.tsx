import React from 'react'
import { PDFProvider } from './contexts/PDFContext'
import { ChatProvider } from './contexts/ChatContext'
import { PDFUploader } from './components/PDFUploader'
import { PDFViewer } from './components/PDFViewer'
import { PDFThumbnails } from './components/PDFThumbnails'
import { PDFHistory } from './components/PDFHistory'
import { ChatInterface } from './components/ChatInterface'
import { ThemeToggle } from './components/ThemeToggle'
import { SettingsModal } from './components/SettingsModal'
import { usePDF } from './contexts/PDFContext'
import { useChat } from './contexts/ChatContext'
import { BookOpen, GraduationCap } from 'lucide-react'

const AppContent: React.FC = () => {
  const { document, clearDocument, updateHistory } = usePDF()
  const { apiKey, setApiKey, messages } = useChat()

  const handleHomeClick = () => {
    updateHistory(messages)
    clearDocument()
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900">
      {/* Header */}
      <header className="flex-shrink-0 bg-white dark:bg-gray-800 shadow-sm z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={handleHomeClick}
              className="flex items-center hover:opacity-80 transition-opacity">
              <GraduationCap className="h-8 w-8 text-blue-500 mr-2" />
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                AI PDF Tutor
              </h1>
            </button>
            <div className="flex items-center space-x-3">
              <SettingsModal apiKey={apiKey} onSaveApiKey={setApiKey} />
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {!document ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="max-w-md w-full text-center mb-8">
              <BookOpen className="mx-auto h-12 w-12 text-blue-500 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Learn with your AI tutor
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                Upload any PDF document to get started. Your AI tutor will help
                you understand it page-by-page.
              </p>
            </div>
            <PDFUploader />
            <PDFHistory />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
            <div className="flex flex-col h-full overflow-hidden">
              <div className="flex-1 min-h-0">
                <PDFViewer />
              </div>
              <div className="h-32 mt-3 flex-shrink-0">
                <PDFThumbnails />
              </div>
            </div>
            <div className="h-full overflow-hidden">
              <ChatInterface />
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="flex-shrink-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-sm text-gray-700 dark:text-gray-300">
            © 2025 AI PDF Tutor. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}

function App() {
  return (
    <ChatProvider>
      <PDFProvider>
        <AppContent />
      </PDFProvider>
    </ChatProvider>
  )
}

export default App
