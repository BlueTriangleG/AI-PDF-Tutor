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
  contextWindow?: number;
  trainingCutoff?: string;
  inputPricing?: string;
  outputPricing?: string;
}

export const availableModels: GPTModel[] = [
  {
    id: 'gpt-4-0125-preview',
    name: 'GPT-4 Turbo',
    description: 'Latest GPT-4 model with improved instruction following, JSON mode, and more accurate responses',
    contextWindow: 128000,
    trainingCutoff: 'December 2023',
    inputPricing: '$0.01/1K tokens',
    outputPricing: '$0.03/1K tokens'
  },
  {
    id: 'gpt-4-1106-preview',
    name: 'GPT-4 Turbo (Legacy)',
    description: 'Previous GPT-4 Turbo model with improved JSON mode and system prompts',
    contextWindow: 128000,
    trainingCutoff: 'April 2023',
    inputPricing: '$0.01/1K tokens',
    outputPricing: '$0.03/1K tokens'
  },
  {
    id: 'gpt-4',
    name: 'GPT-4',
    description: 'More capable than GPT-3.5 in complex tasks, particularly in analysis and reasoning',
    contextWindow: 8192,
    trainingCutoff: 'September 2021',
    inputPricing: '$0.03/1K tokens',
    outputPricing: '$0.06/1K tokens'
  },
  {
    id: 'gpt-3.5-turbo-0125',
    name: 'GPT-3.5 Turbo',
    description: 'Latest GPT-3.5 model optimized for chat with improved accuracy',
    contextWindow: 16385,
    trainingCutoff: 'September 2021',
    inputPricing: '$0.0005/1K tokens',
    outputPricing: '$0.0015/1K tokens'
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