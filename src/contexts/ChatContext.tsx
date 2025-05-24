import React, { createContext, useContext, useState, useEffect } from 'react';
import { Message, ExplanationLevel, SystemPromptTemplate, defaultSystemPrompts } from '../types';
import { generateAIResponse, testConnection, fetchAvailableModels } from '../utils/pdfUtils';
import OpenAI from 'openai';

interface ChatContextType {
  messages: Message[];
  isLoading: boolean;
  explanationLevel: ExplanationLevel;
  apiKey: string;
  systemPrompt: SystemPromptTemplate;
  selectedModel: string;
  availableModels: OpenAI.Model[];
  availablePrompts: SystemPromptTemplate[];
  addMessage: (content: string, role: 'user' | 'assistant') => Promise<void>;
  clearMessages: () => void;
  setExplanationLevel: (level: ExplanationLevel) => void;
  setApiKey: (key: string) => void;
  setSystemPrompt: (prompt: SystemPromptTemplate) => void;
  setSelectedModel: (model: string) => void;
  addCustomPrompt: (prompt: SystemPromptTemplate) => void;
  updatePrompt: (prompt: SystemPromptTemplate) => void;
  generatePageExplanation: (pageText: string, pageNumber: number) => void;
  setMessages: (messages: Message[]) => void;
  testApiConnection: (key: string, model: string) => Promise<boolean>;
  refreshModels: () => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [explanationLevel, setExplanationLevel] = useState<ExplanationLevel>('highlevel');
  const [apiKey, setApiKey] = useState<string>(() => {
    return localStorage.getItem('openai_api_key') || '';
  });
  const [systemPrompt, setSystemPrompt] = useState<SystemPromptTemplate>(() => {
    const savedPrompt = localStorage.getItem('system_prompt');
    return savedPrompt ? JSON.parse(savedPrompt) : defaultSystemPrompts[0];
  });
  const [selectedModel, setSelectedModel] = useState<string>(() => {
    const savedModel = localStorage.getItem('selected_model');
    return savedModel || 'gpt-3.5-turbo';
  });
  const [availableModels, setAvailableModels] = useState<OpenAI.Model[]>([]);
  const [availablePrompts, setAvailablePrompts] = useState<SystemPromptTemplate[]>(() => {
    const savedPrompts = localStorage.getItem('custom_prompts');
    const customPrompts = savedPrompts ? JSON.parse(savedPrompts) : [];
    return [...defaultSystemPrompts, ...customPrompts];
  });

  const refreshModels = async () => {
    if (!apiKey) return;
    try {
      const response = await fetchAvailableModels(apiKey);
      if (response && Array.isArray(response.data)) {
        setAvailableModels(response.data);
        
        const modelExists = response.data.some((model) => model.id === selectedModel);
        if (!modelExists) {
          handleSetSelectedModel('gpt-3.5-turbo');
        }
      } else {
        console.error('Invalid models response structure:', response);
        setAvailableModels([]);
      }
    } catch (error) {
      console.error('Failed to fetch models:', error);
      setAvailableModels([]);
    }
  };

  useEffect(() => {
    if (apiKey) {
      refreshModels();
    }
  }, [apiKey]);

  const addMessage = async (content: string, role: 'user' | 'assistant') => {
    const newMessage: Message = {
      id: Date.now().toString(),
      role,
      content,
      timestamp: new Date(),
    };

    setMessages((prevMessages) => [...prevMessages, newMessage]);

    if (role === 'user') {
      setIsLoading(true);
      try {
        // Convert messages to the format expected by the API
        const messageHistory = messages.map(msg => ({
          role: msg.role,
          content: msg.content
        }));

        const response = await generateAIResponse(
          content,
          explanationLevel,
          apiKey,
          systemPrompt.prompt,
          selectedModel,
          messageHistory
        );
        
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: response,
          timestamp: new Date(),
        };
        setMessages((prevMessages) => [...prevMessages, aiMessage]);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An error occurred';
        const errorResponse: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `Error: ${errorMessage}`,
          timestamp: new Date(),
        };
        setMessages((prevMessages) => [...prevMessages, errorResponse]);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const clearMessages = () => {
    setMessages([]);
  };

  const generatePageExplanation = async (pageText: string, pageNumber: number) => {
    setIsLoading(true);
    
    const initialMessage: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: `I'm now looking at page ${pageNumber}. Let me explain it for you.`,
      timestamp: new Date(),
    };
    
    setMessages((prevMessages) => [...prevMessages, initialMessage]);
    
    try {
      // Convert messages to the format expected by the API
      const messageHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const response = await generateAIResponse(
        pageText,
        explanationLevel,
        apiKey,
        systemPrompt.prompt,
        selectedModel,
        messageHistory
      );
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };
      setMessages((prevMessages) => [...prevMessages, aiMessage]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      addMessage(`Error explaining page: ${errorMessage}`, 'assistant');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem('openai_api_key', key);
  };

  const handleSetSystemPrompt = (prompt: SystemPromptTemplate) => {
    setSystemPrompt(prompt);
    localStorage.setItem('system_prompt', JSON.stringify(prompt));
  };

  const handleSetSelectedModel = (model: string) => {
    setSelectedModel(model);
    localStorage.setItem('selected_model', model);
  };

  const addCustomPrompt = (prompt: SystemPromptTemplate) => {
    const newPrompt = {
      ...prompt,
      id: prompt.id || `custom-${Date.now()}`
    };
    
    setAvailablePrompts(prev => {
      const updated = [...prev, newPrompt];
      const customPrompts = updated.filter(p => p.id.startsWith('custom-'));
      localStorage.setItem('custom_prompts', JSON.stringify(customPrompts));
      return updated;
    });
  };

  const updatePrompt = (updatedPrompt: SystemPromptTemplate) => {
    setAvailablePrompts(prev => {
      const updated = prev.map(p => p.id === updatedPrompt.id ? updatedPrompt : p);
      const customPrompts = updated.filter(p => p.id.startsWith('custom-'));
      localStorage.setItem('custom_prompts', JSON.stringify(customPrompts));
      return updated;
    });

    if (systemPrompt.id === updatedPrompt.id) {
      handleSetSystemPrompt(updatedPrompt);
    }
  };

  const testApiConnection = async (key: string, model: string) => {
    try {
      if (!model || !availableModels.some(m => m.id === model)) {
        return false;
      }
      return await testConnection(key, model);
    } catch (error) {
      return false;
    }
  };

  return (
    <ChatContext.Provider
      value={{
        messages,
        isLoading,
        explanationLevel,
        apiKey,
        systemPrompt,
        selectedModel,
        availableModels,
        availablePrompts,
        addMessage,
        clearMessages,
        setExplanationLevel,
        setApiKey: handleSetApiKey,
        setSystemPrompt: handleSetSystemPrompt,
        setSelectedModel: handleSetSelectedModel,
        addCustomPrompt,
        updatePrompt,
        generatePageExplanation,
        setMessages,
        testApiConnection,
        refreshModels,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};