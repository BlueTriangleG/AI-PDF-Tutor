import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../contexts/ChatContext';
import { Message as MessageType, SystemPromptTemplate } from '../types';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Card, CardHeader, CardBody, CardFooter } from './ui/Card';
import { Send, Bot, User, Edit2, Plus, X, Pencil } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

const DifficultyToggle: React.FC = () => {
  const { explanationLevel, setExplanationLevel } = useChat();
  
  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm text-gray-500 dark:text-gray-400">Difficulty:</span>
      <div className="flex rounded-md overflow-hidden border border-gray-300 dark:border-gray-700">
        <button
          className={`px-3 py-1 text-xs font-medium ${
            explanationLevel === 'eli5'
              ? 'bg-blue-500 text-white'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
          onClick={() => setExplanationLevel('eli5')}
        >
          Simple
        </button>
        <button
          className={`px-3 py-1 text-xs font-medium ${
            explanationLevel === 'highlevel'
              ? 'bg-blue-500 text-white'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
          onClick={() => setExplanationLevel('highlevel')}
        >
          High-level
        </button>
        <button
          className={`px-3 py-1 text-xs font-medium ${
            explanationLevel === 'detailed'
              ? 'bg-blue-500 text-white'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
          onClick={() => setExplanationLevel('detailed')}
        >
          Detailed
        </button>
      </div>
    </div>
  );
};

const TutorSelector: React.FC = () => {
  const { systemPrompt, setSystemPrompt, availablePrompts, addCustomPrompt, updatePrompt } = useChat();
  const [isOpen, setIsOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<SystemPromptTemplate | null>(null);
  const [newPromptName, setNewPromptName] = useState('');
  const [newPromptContent, setNewPromptContent] = useState('');
  const [selectedPromptId, setSelectedPromptId] = useState(systemPrompt.id);

  const handleSavePrompt = () => {
    if (!newPromptName.trim() || !newPromptContent.trim()) return;
    
    const promptData: SystemPromptTemplate = {
      id: editingPrompt ? editingPrompt.id : `custom-${Date.now()}`,
      name: newPromptName,
      prompt: newPromptContent
    };

    if (editingPrompt) {
      updatePrompt(promptData);
    } else {
      addCustomPrompt(promptData);
      setSystemPrompt(promptData);
    }

    setNewPromptName('');
    setNewPromptContent('');
    setEditingPrompt(null);
    setIsOpen(false);
  };

  const handleEditPrompt = (prompt: SystemPromptTemplate) => {
    setEditingPrompt(prompt);
    setNewPromptName(prompt.name);
    setNewPromptContent(prompt.prompt);
  };

  const handlePromptSelect = (promptId: string) => {
    const prompt = availablePrompts.find(p => p.id === promptId);
    if (prompt) {
      setSystemPrompt(prompt);
      setSelectedPromptId(promptId);
    }
  };

  const handleCancelEdit = () => {
    setEditingPrompt(null);
    setNewPromptName('');
    setNewPromptContent('');
  };

  return (
    <div className="flex items-center space-x-2">
      <span className="font-medium text-gray-900 dark:text-white">
        {systemPrompt.name}
      </span>
      <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
        <Dialog.Trigger asChild>
          <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
            <Edit2 className="h-4 w-4" />
          </Button>
        </Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <Dialog.Title className="text-lg font-semibold">
                {editingPrompt ? 'Edit Tutor' : 'Select AI Tutor'}
              </Dialog.Title>
              <Dialog.Close asChild>
                <button className="text-gray-400 hover:text-gray-500">
                  <X className="h-4 w-4" />
                </button>
              </Dialog.Close>
            </div>
            
            <div className="space-y-4">
              {!editingPrompt && (
                <div className="space-y-2">
                  {availablePrompts.map((prompt) => (
                    <div
                      key={prompt.id}
                      className={`p-3 rounded-md border relative ${
                        selectedPromptId === prompt.id
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                          : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      <div 
                        className="cursor-pointer pr-8"
                        onClick={() => handlePromptSelect(prompt.id)}
                      >
                        <div className="font-medium mb-1">{prompt.name}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                          {prompt.prompt}
                        </div>
                      </div>
                      <button
                        className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        onClick={() => handleEditPrompt(prompt)}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              {editingPrompt ? (
                <div>
                  <h3 className="text-sm font-medium mb-2">Edit Tutor</h3>
                  <div className="space-y-3">
                    <Input
                      placeholder="Tutor Name"
                      value={newPromptName}
                      onChange={(e) => setNewPromptName(e.target.value)}
                      fullWidth
                    />
                    <textarea
                      className="w-full h-24 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900"
                      placeholder="System prompt content..."
                      value={newPromptContent}
                      onChange={(e) => setNewPromptContent(e.target.value)}
                    />
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        fullWidth
                        onClick={handleCancelEdit}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="primary"
                        fullWidth
                        onClick={handleSavePrompt}
                        disabled={!newPromptName.trim() || !newPromptContent.trim()}
                      >
                        Save Changes
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <h3 className="text-sm font-medium mb-2">Create Custom Tutor</h3>
                  <div className="space-y-3">
                    <Input
                      placeholder="Tutor Name"
                      value={newPromptName}
                      onChange={(e) => setNewPromptName(e.target.value)}
                      fullWidth
                    />
                    <textarea
                      className="w-full h-24 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900"
                      placeholder="System prompt content..."
                      value={newPromptContent}
                      onChange={(e) => setNewPromptContent(e.target.value)}
                    />
                    <Button
                      variant="primary"
                      fullWidth
                      onClick={handleSavePrompt}
                      disabled={!newPromptName.trim() || !newPromptContent.trim()}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Custom Tutor
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
};

const Message: React.FC<{ message: MessageType }> = ({ message }) => {
  return (
    <div
      className={`flex mb-4 ${
        message.role === 'user' ? 'justify-end' : 'justify-start'
      }`}
    >
      <div
        className={`max-w-[80%] rounded-lg px-4 py-2 animate-message ${
          message.role === 'user'
            ? 'bg-blue-500 text-white rounded-tr-none animate-slide-left'
            : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-tl-none animate-slide-right'
        }`}
      >
        <div className="flex items-center mb-1">
          {message.role === 'assistant' ? (
            <Bot className="h-4 w-4 mr-1" />
          ) : (
            <User className="h-4 w-4 mr-1" />
          )}
          <span className="text-xs font-medium">
            {message.role === 'assistant' ? 'AI Tutor' : 'You'}
          </span>
        </div>
        <div className="whitespace-pre-line prose dark:prose-invert max-w-none prose-sm">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]}
            components={{
              code({node, inline, className, children, ...props}) {
                const match = /language-(\w+)/.exec(className || '');
                return !inline && match ? (
                  <SyntaxHighlighter
                    style={oneDark}
                    language={match[1]}
                    PreTag="div"
                    {...props}
                  >
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                ) : (
                  <code className={className} {...props}>
                    {children}
                  </code>
                );
              },
              p: ({children}) => <p className="mb-2 last:mb-0">{children}</p>,
              ul: ({children}) => <ul className="list-disc pl-4 mb-2">{children}</ul>,
              ol: ({children}) => <ol className="list-decimal pl-4 mb-2">{children}</ol>,
              li: ({children}) => <li className="mb-1">{children}</li>,
              h1: ({children}) => <h1 className="text-xl font-bold mb-2">{children}</h1>,
              h2: ({children}) => <h2 className="text-lg font-bold mb-2">{children}</h2>,
              h3: ({children}) => <h3 className="text-md font-bold mb-2">{children}</h3>,
              blockquote: ({children}) => (
                <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic my-2">
                  {children}
                </blockquote>
              ),
              a: ({children, href}) => (
                <a href={href} className="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer">
                  {children}
                </a>
              ),
              table: ({children}) => (
                <div className="overflow-x-auto mb-2">
                  <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-600">
                    {children}
                  </table>
                </div>
              ),
              th: ({children}) => (
                <th className="px-3 py-2 text-left text-sm font-semibold bg-gray-100 dark:bg-gray-800">
                  {children}
                </th>
              ),
              td: ({children}) => (
                <td className="px-3 py-2 text-sm border-t border-gray-200 dark:border-gray-700">
                  {children}
                </td>
              ),
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>
        <div className="text-xs opacity-70 text-right mt-1">
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      </div>
    </div>
  );
};

export const ChatInterface: React.FC = () => {
  const { messages, isLoading, addMessage } = useChat();
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;
    
    const userMessage = inputValue.trim();
    setInputValue('');
    await addMessage(userMessage, 'user');
  };
  
  return (
    <Card className="h-full flex flex-col overflow-hidden">
      <CardHeader className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <TutorSelector />
          <DifficultyToggle />
        </div>
      </CardHeader>
      
      <CardBody className="flex-1 min-h-0 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <Bot className="h-16 w-16 text-blue-500 mb-4" />
            <h3 className="text-lg font-medium mb-2">Your AI Tutor is Ready</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Upload a PDF and select "Explain This Page" to start learning, or ask a question below.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <Message key={message.id} message={message} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </CardBody>
      
      <CardFooter className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
        <form onSubmit={handleSendMessage} className="w-full flex items-center space-x-2">
          <Input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask a question about the document..."
            fullWidth
            disabled={isLoading}
          />
          <Button type="submit" disabled={!inputValue.trim() || isLoading}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
};