'use server';

import { aiAssistedWebSearch, type WebSearchInput, type WebSearchOutput } from '@/ai/flows/ai-assisted-web-search';

export async function searchWebAction(query: string): Promise<WebSearchOutput | { error: string }> {
  try {
    if (!query.trim()) {
      return { error: 'Search query cannot be empty.' };
    }
    const input: WebSearchInput = { query };
    const result = await aiAssistedWebSearch(input);
    return result;
  } catch (error) {
    console.error('Error in searchWebAction:', error);
    return { error: 'Failed to perform web search. Please try again.' };
  }
}
