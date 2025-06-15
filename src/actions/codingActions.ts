'use server';

import { generateCodeSnippets, type GenerateCodeSnippetsInput, type GenerateCodeSnippetsOutput } from '@/ai/flows/generate-code-snippets';

export async function generateCodeAction(input: GenerateCodeSnippetsInput): Promise<GenerateCodeSnippetsOutput | { error: string }> {
  try {
    if (!input.programmingLanguage || !input.codeDescription) {
      return { error: 'Programming language and code description are required.' };
    }
    const result = await generateCodeSnippets(input);
    return result;
  } catch (error) {
    console.error('Error in generateCodeAction:', error);
    return { error: 'Failed to generate code. Please try again.' };
  }
}
