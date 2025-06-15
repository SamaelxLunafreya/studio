
'use server';

import { translateText, type TranslateTextInput, type TranslateTextOutput } from '@/ai/flows/translate-text-flow';

export async function translateTextAction(input: TranslateTextInput): Promise<TranslateTextOutput | { error: string }> {
  try {
    if (!input.text || !input.text.trim()) {
      return { error: 'Text to translate cannot be empty.' };
    }
    if (!input.targetLanguage || !input.targetLanguage.trim()) {
      return { error: 'Target language must be specified.' };
    }

    const result = await translateText(input);
    return result;
  } catch (error) {
    console.error('Error in translateTextAction:', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred during translation.';
    return { error: `Translation failed: ${message}` };
  }
}
