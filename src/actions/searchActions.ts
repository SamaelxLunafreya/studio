'use server';

import { aiAssistedWebSearch, type WebSearchInput, type WebSearchOutput } from '@/ai/flows/ai-assisted-web-search';

export async function searchWebAction(query: string, language: 'Polish' | 'English'): Promise<WebSearchOutput | { error: string }> {
  try {
    if (!query.trim()) {
      return { error: 'Search query cannot be empty.' };
    }
    const input: WebSearchInput = { query, language };
    const result = await aiAssistedWebSearch(input);
    return result;
  } catch (error) {
    console.error('Error in searchWebAction:', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { error: `Failed to perform web search: ${message}. Please try again.` };
  }
}
