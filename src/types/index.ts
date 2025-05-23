export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface PDFPage {
  pageNumber: number;
  text: string;
  imageData?: string;
}

export interface PDFDocument {
  id: string;
  name: string;
  totalPages: number;
  currentPage: number;
  pages: PDFPage[];
  url: string;
  lastViewed?: Date;
}

export interface PDFHistory {
  id: string;
  name: string;
  totalPages: number;
  lastViewed: Date;
  thumbnail?: string;
  messages?: Message[];
  currentPage?: number;
}

export type ExplanationLevel = 'eli5' | 'highlevel' | 'detailed';

export interface SystemPromptTemplate {
  id: string;
  name: string;
  prompt: string;
}

export interface GPTModel {
  id: string;
  name: string;
  description: string;
}

export const availableModels: GPTModel[] = [
  {
    id: 'gpt-4-turbo-preview',
    name: 'GPT-4 Turbo',
    description: 'Most capable model, best for complex tasks and detailed analysis'
  },
  {
    id: 'gpt-4',
    name: 'GPT-4',
    description: 'Highly capable model with strong reasoning abilities'
  },
  {
    id: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    description: 'Fast and cost-effective for most tasks'
  }
];

export const defaultSystemPrompts: SystemPromptTemplate[] = [
  {
    id: 'default',
    name: 'Default Tutor',
    prompt: 'You are an expert tutor helping a student understand academic content. Provide clear, accurate explanations at the requested level of detail.'
  },
  {
    id: 'socratic',
    name: 'Socratic Teacher',
    prompt: 'You are a Socratic teacher who guides students through understanding by asking thought-provoking questions. Help them discover insights through careful questioning and dialogue.'
  },
  {
    id: 'expert',
    name: 'Domain Expert',
    prompt: 'You are a subject matter expert with deep knowledge in multiple fields. Provide detailed, technical explanations while making complex concepts accessible.'
  },
  {
    id: 'friendly',
    name: 'Friendly Guide',
    prompt: 'You are a friendly, approachable tutor who makes learning fun and engaging. Use analogies, examples, and conversational language to explain concepts.'
  }
];