import { PDFDocument, PDFPage } from '../types'
import * as pdfjsLib from 'pdfjs-dist'
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url'
import OpenAI from 'openai'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker

export const processPDFFile = async (file: File): Promise<PDFDocument> => {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise

    const pages: PDFPage[] = []
    const totalPages = pdf.numPages

    for (let i = 1; i <= totalPages; i++) {
      const page = await pdf.getPage(i)
      const textContent = await page.getTextContent()
      const text = textContent.items
        .map((item: any) => item.str)
        .join(' ')
        .trim()

      pages.push({
        pageNumber: i,
        text,
      })
    }

    const docId = Date.now().toString()

    return {
      id: docId,
      name: file.name,
      totalPages,
      currentPage: 1,
      pages,
      url: URL.createObjectURL(file),
    }
  } catch (error) {
    console.error('Error processing PDF:', error)
    throw new Error(
      error instanceof Error ? error.message : 'Failed to process PDF file'
    )
  }
}

export const generateAIResponse = async (
  text: string,
  level: 'eli5' | 'highlevel' | 'detailed',
  apiKey: string,
  systemPrompt: string,
  model: string,
  messageHistory: { role: 'user' | 'assistant'; content: string }[] = []
): Promise<string> => {
  if (!apiKey) {
    throw new Error('OpenAI API key is required. Please add it in Settings.')
  }

  try {
    const client = new OpenAI({ apiKey, dangerouslyAllowBrowser: true })
    const prompt = getPromptForLevel(level, text)

    const messages = [
      {
        role: 'system',
        content: systemPrompt,
      },
      ...messageHistory,
      {
        role: 'user',
        content: prompt,
      },
    ]

    const response = await client.chat.completions.create({
      model,
      messages: messages as any[],
      temperature: 0.7,
    })

    return response.choices[0].message.content || ''
  } catch (error) {
    console.error('Error generating AI response:', error)
    throw error
  }
}

export const fetchAvailableModels = async (
  apiKey: string
): Promise<OpenAI.ModelsPage> => {
  // Validate API key format first
  if (!apiKey || !apiKey.startsWith('sk-')) {
    throw new Error('Invalid API key format. API key should start with "sk-".')
  }

  const client = new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true,
    defaultHeaders: {
      'OpenAI-Organization': undefined,
    },
  })

  try {
    return await client.models.list()
  } catch (error: any) {
    console.error('Error fetching models:', error)

    // Provide more helpful error messages
    if (error.code === 'invalid_api_key') {
      throw new Error('Invalid API key. Please check your OpenAI API key.')
    } else if (error.code === 'insufficient_quota') {
      throw new Error('Insufficient quota. Please check your OpenAI billing.')
    } else if (
      error.message?.includes('fetch') ||
      error.message?.includes('network')
    ) {
      throw new Error('Network error. Please check your internet connection.')
    }

    throw error
  }
}

export const testConnection = async (
  apiKey: string,
  model: string
): Promise<boolean> => {
  if (!model) {
    console.error('Invalid model ID:', model)
    return false
  }

  // Validate API key format
  if (!apiKey || !apiKey.startsWith('sk-') || apiKey.length < 50) {
    console.error(
      'Invalid API key format. API key should start with "sk-" and be at least 50 characters long.'
    )
    return false
  }

  try {
    const client = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true,
      // Add timeout and error handling
      defaultHeaders: {
        'OpenAI-Organization': undefined, // Remove if not using organization
      },
    })

    // Test with a simple completion request
    const response = await client.chat.completions.create({
      model,
      messages: [{ role: 'user', content: 'Test' }],
      max_tokens: 1,
      temperature: 0.1,
    })

    return !!response.choices.length && !!response.choices[0].message
  } catch (error: any) {
    console.error('Connection test failed:', error)

    // Provide more specific error information
    if (error.code === 'invalid_api_key') {
      console.error('Invalid API key provided.')
    } else if (error.code === 'model_not_found') {
      console.error(`Model "${model}" not found or not accessible.`)
    } else if (error.code === 'insufficient_quota') {
      console.error('Insufficient quota. Please check your OpenAI billing.')
    } else if (error.message?.includes('CORS')) {
      console.error('CORS error. This is expected in browser environments.')
    } else if (error.message?.includes('fetch')) {
      console.error('Network error. Check your internet connection.')
    }

    return false
  }
}

function getPromptForLevel(
  level: 'eli5' | 'highlevel' | 'detailed',
  text: string
): string {
  switch (level) {
    case 'eli5':
      return `Explain this text as if you're explaining to a 5-year-old:\n\n${text}`
    case 'highlevel':
      return `Provide a high-level overview of the main concepts in this text:\n\n${text}`
    case 'detailed':
      return `Give a detailed, technical explanation of this text, including key concepts and their relationships:\n\n${text}`
    default:
      return `Explain this text:\n\n${text}`
  }
}
