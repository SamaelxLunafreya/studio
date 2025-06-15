'use server';

import { enhanceEnglishText, type EnhanceEnglishTextInput, type EnhanceEnglishTextOutput } from '@/ai/flows/enhance-english-text';

export async function enhanceTextAction(text: string): Promise<EnhanceEnglishTextOutput | { error: string }> {
  try {
    if (!text.trim()) {
      return { error: 'Text to enhance cannot be empty.' };
    }
    const input: EnhanceEnglishTextInput = { text };
    const result = await enhanceEnglishText(input);
    return result;
  } catch (error) {
    console.error('Error in enhanceTextAction:', error);
    return { error: 'Failed to enhance text. Please try again.' };
  }
}
