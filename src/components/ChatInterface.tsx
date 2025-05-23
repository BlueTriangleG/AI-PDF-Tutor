import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../contexts/ChatContext';
import { Message as MessageType, SystemPromptTemplate } from '../types';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Card, CardHeader, CardBody, CardFooter } from './ui/Card';
import { Send, Bot, User, Edit2, Check, X } from 'lucide-react';

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

const PromptSelector: React.FC = () => {
  const { systemPrompt, setSystemPrompt, availablePrompts, addCustomPrompt } = useChat();
  const [isEditing, setIsEditing] = useState(false);
  const [editedPrompt, setEditedPrompt] = useState(systemPrompt.prompt);
  const [selectedPromptId, setSelectedPromptId] = useState(systemPrompt.id);
  
  const handlePromptChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newPrompt = availablePrompts.find(p => p.id === e.target.value);
    if (newPrompt) {
      setSelectedPromptId(newPrompt.id);
      setSystemPrompt(newPrompt);
      setEditedPrompt(newPrompt.prompt);
    }
  };

  const handleSavePrompt = () => {
    const customPrompt: SystemPromptTemplate = {
      id: `custom-${Date.now()}`,
      name: 'Custom Tutor',
      prompt: editedPrompt
    };
    addCustomPrompt(customPrompt);
    setSystemPrompt(customPrompt);
    setIsEditing(false);
  };

  return (
    <div className="flex flex-col space-y-2 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
      <div className="flex items-center justify-between">
        <select
          value={selectedPromptId}
          onChange={handlePromptChange}
          className="text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md px-2 py-1"
          disabled={isEditing}
        >
          {availablePrompts.map(prompt => (
            <option key={prompt.id} value={prompt.id}>
              {prompt.name}
            </option>
          ))}
        </select>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsEditing(!isEditing)}
          className="ml-2"
        >
          {isEditing ? <X className="h-4 w-4" /> : <Edit2 className="h-4 w-4" />}
        </Button>
      </div>
      
      {isEditing && (
        <div className="space-y-2">
          <textarea
            value={editedPrompt}
            onChange={(e) => setEditedPrompt(e.target.value)}
            className="w-full h-24 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md p-2"
            placeholder="Enter custom prompt..."
          />
          <div className="flex justify-end">
            <Button
              variant="primary"
              size="sm"
              onClick={handleSavePrompt}
              disabled={!editedPrompt.trim()}
            >
              <Check className="h-4 w-4 mr-1" />
              Save Custom Prompt
            </Button>
          </div>
        </div>
      )}
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
        className={`max-w-[80%] rounded-lg px-4 py-2 ${
          message.role === 'user'
            ? 'bg-blue-500 text-white rounded-tr-none'
            : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-tl-none'
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
        <div className="whitespace-pre-line">{message.content}</div>
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
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">AI Tutor Chat</h2>
            <DifficultyToggle />
          </div>
          <PromptSelector />
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