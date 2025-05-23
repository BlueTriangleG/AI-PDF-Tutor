import { PDFDocument, PDFPage } from '../types';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
import OpenAI from 'openai';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export const processPDFFile = async (file: File): Promise<PDFDocument> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
    
    const pages: PDFPage[] = [];
    const totalPages = pdf.numPages;
    
    for (let i = 1; i <= totalPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const text = textContent.items
        .map((item: any) => item.str)
        .join(' ')
        .trim();
      
      pages.push({
        pageNumber: i,
        text,
      });
    }
    
    const docId = Date.now().toString();
    
    return {
      id: docId,
      name: file.name,
      totalPages,
      currentPage: 1,
      pages,
      url: URL.createObjectURL(file),
    };
  } catch (error) {
    console.error('Error processing PDF:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to process PDF file');
  }
};

export const generateAIResponse = async (
  text: string,
  level: 'eli5' | 'highlevel' | 'detailed',
  apiKey: string,
  systemPrompt: string,
  model: string
): Promise<string> => {
  if (!apiKey) {
    throw new Error('OpenAI API key is required. Please add it in Settings.');
  }

  try {
    const prompt = getPromptForLevel(level, text);
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate AI response');
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error generating AI response:', error);
    throw error;
  }
};

export const fetchAvailableModels = async (apiKey: string): Promise<OpenAI.ModelsPage> => {
  const client = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
  try {
    return await client.models.list();
  } catch (error) {
    console.error('Error fetching models:', error);
    throw error;
  }
};

export const testConnection = async (apiKey: string, model: string): Promise<boolean> => {
  if (!model) {
    console.error('Invalid model ID:', model);
    return false;
  }

  try {
    const client = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
    const response = await client.chat.completions.create({
      model,
      messages: [{ role: 'user', content: 'Test connection' }],
      max_tokens: 1,
    });
    return !!response.choices.length;
  } catch (error) {
    console.error('Connection test failed:', error);
    return false;
  }
};

function getPromptForLevel(level: 'eli5' | 'highlevel' | 'detailed', text: string): string {
  switch (level) {
    case 'eli5':
      return `Explain this text as if you're explaining to a 5-year-old:\n\n${text}`;
    case 'highlevel':
      return `Provide a high-level overview of the main concepts in this text:\n\n${text}`;
    case 'detailed':
      return `Give a detailed, technical explanation of this text, including key concepts and their relationships:\n\n${text}`;
    default:
      return `Explain this text:\n\n${text}`;
  }
}