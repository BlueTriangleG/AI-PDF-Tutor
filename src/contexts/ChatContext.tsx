import React, { createContext, useContext, useState, useEffect } from 'react';
import { Message, ExplanationLevel, SystemPromptTemplate, ChatSession, defaultSystemPrompts } from '../types';
import { generateAIResponse, testConnection, fetchAvailableModels } from '../utils/pdfUtils';
import OpenAI from 'openai';

interface ChatContextType {
  currentSession: ChatSession | null;
  sessions: ChatSession[];
  isLoading: boolean;
  explanationLevel: ExplanationLevel;
  apiKey: string;
  systemPrompt: SystemPromptTemplate;
  selectedModel: string;
  availableModels: OpenAI.Model[];
  availablePrompts: SystemPromptTemplate[];
  addMessage: (content: string, role: 'user' | 'assistant') => Promise<void>;
  clearCurrentSession: () => void;
  setExplanationLevel: (level: ExplanationLevel) => void;
  setApiKey: (key: string) => void;
  setSystemPrompt: (prompt: SystemPromptTemplate) => void;
  setSelectedModel: (model: string) => void;
  addCustomPrompt: (prompt: SystemPromptTemplate) => void;
  updatePrompt: (prompt: SystemPromptTemplate) => void;
  generatePageExplanation: (pageText: string, pageNumber: number) => void;
  createNewSession: (documentId: string, documentName: string) => void;
  switchSession: (sessionId: string) => void;
  testApiConnection: (key: string, model: string) => Promise<boolean>;
  refreshModels: () => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    const savedSessions = localStorage.getItem('chat_sessions');
    return savedSessions ? JSON.parse(savedSessions) : [];
  });
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
    return localStorage.getItem('selected_model') || 'gpt-3.5-turbo';
  });
  const [availableModels, setAvailableModels] = useState<OpenAI.Model[]>([]);
  const [availablePrompts, setAvailablePrompts] = useState<SystemPromptTemplate[]>(() => {
    const savedPrompts = localStorage.getItem('custom_prompts');
    const customPrompts = savedPrompts ? JSON.parse(savedPrompts) : [];
    return [...defaultSystemPrompts, ...customPrompts];
  });

  useEffect(() => {
    localStorage.setItem('chat_sessions', JSON.stringify(sessions));
  }, [sessions]);

  const createNewSession = (documentId: string, documentName: string) => {
    const newSession: ChatSession = {
      id: `session-${Date.now()}`,
      documentId,
      documentName,
      messages: [],
      lastUpdated: new Date()
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSession(newSession);
  };

  const switchSession = (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      setCurrentSession(session);
    }
  };

  const addMessage = async (content: string, role: 'user' | 'assistant') => {
    if (!currentSession) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      role,
      content,
      timestamp: new Date(),
    };

    const updatedSession = {
      ...currentSession,
      messages: [...currentSession.messages, newMessage],
      lastUpdated: new Date()
    };

    setCurrentSession(updatedSession);
    setSessions(prev => prev.map(s => 
      s.id === currentSession.id ? updatedSession : s
    ));

    if (role === 'user') {
      setIsLoading(true);
      try {
        const response = await generateAIResponse(content, explanationLevel, apiKey, systemPrompt.prompt, selectedModel);
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: response,
          timestamp: new Date(),
        };
        
        const sessionWithAIResponse = {
          ...updatedSession,
          messages: [...updatedSession.messages, aiMessage],
          lastUpdated: new Date()
        };

        setCurrentSession(sessionWithAIResponse);
        setSessions(prev => prev.map(s => 
          s.id === currentSession.id ? sessionWithAIResponse : s
        ));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An error occurred';
        const errorResponse: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `Error: ${errorMessage}`,
          timestamp: new Date(),
        };

        const sessionWithError = {
          ...updatedSession,
          messages: [...updatedSession.messages, errorResponse],
          lastUpdated: new Date()
        };

        setCurrentSession(sessionWithError);
        setSessions(prev => prev.map(s => 
          s.id === currentSession.id ? sessionWithError : s
        ));
      } finally {
        setIsLoading(false);
      }
    }
  };

  const clearCurrentSession = () => {
    setCurrentSession(null);
  };

  const generatePageExplanation = async (pageText: string, pageNumber: number) => {
    if (!currentSession) return;
    
    setIsLoading(true);
    
    const initialMessage: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: `I'm now looking at page ${pageNumber}. Let me explain it for you.`,
      timestamp: new Date(),
    };
    
    const updatedSession = {
      ...currentSession,
      messages: [...currentSession.messages, initialMessage],
      lastUpdated: new Date()
    };

    setCurrentSession(updatedSession);
    setSessions(prev => prev.map(s => 
      s.id === currentSession.id ? updatedSession : s
    ));
    
    try {
      const response = await generateAIResponse(pageText, explanationLevel, apiKey, systemPrompt.prompt, selectedModel);
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };

      const sessionWithResponse = {
        ...updatedSession,
        messages: [...updatedSession.messages, aiMessage],
        lastUpdated: new Date()
      };

      setCurrentSession(sessionWithResponse);
      setSessions(prev => prev.map(s => 
        s.id === currentSession.id ? sessionWithResponse : s
      ));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Error explaining page: ${errorMessage}`,
        timestamp: new Date(),
      };

      const sessionWithError = {
        ...updatedSession,
        messages: [...updatedSession.messages, errorResponse],
        lastUpdated: new Date()
      };

      setCurrentSession(sessionWithError);
      setSessions(prev => prev.map(s => 
        s.id === currentSession.id ? sessionWithError : s
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const refreshModels = async () => {
    if (!apiKey) return;
    try {
      const response = await fetchAvailableModels(apiKey);
      if (response && Array.isArray(response.data)) {
        setAvailableModels(response.data);
        
        const modelExists = response.data.some((model) => model.id === selectedModel);
        if (!modelExists) {
          setSelectedModel('gpt-3.5-turbo');
          localStorage.setItem('selected_model', 'gpt-3.5-turbo');
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
        currentSession,
        sessions,
        isLoading,
        explanationLevel,
        apiKey,
        systemPrompt,
        selectedModel,
        availableModels,
        availablePrompts,
        addMessage,
        clearCurrentSession,
        setExplanationLevel,
        setApiKey: handleSetApiKey,
        setSystemPrompt: handleSetSystemPrompt,
        setSelectedModel: handleSetSelectedModel,
        addCustomPrompt,
        updatePrompt,
        generatePageExplanation,
        createNewSession,
        switchSession,
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