'use server';

/**
 * @fileOverview This file defines a Genkit flow for enhancing English text.
 *
 * - enhanceEnglishText - A function that enhances the given English text for clarity, grammar, and style.
 * - EnhanceEnglishTextInput - The input type for the enhanceEnglishText function.
 * - EnhanceEnglishTextOutput - The output type for the enhanceEnglishText function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EnhanceEnglishTextInputSchema = z.object({
  text: z.string().describe('The English text to enhance.'),
});
export type EnhanceEnglishTextInput = z.infer<typeof EnhanceEnglishTextInputSchema>;

const EnhanceEnglishTextOutputSchema = z.object({
  enhancedText: z.string().describe('The enhanced English text.'),
});
export type EnhanceEnglishTextOutput = z.infer<typeof EnhanceEnglishTextOutputSchema>;

export async function enhanceEnglishText(input: EnhanceEnglishTextInput): Promise<EnhanceEnglishTextOutput> {
  return enhanceEnglishTextFlow(input);
}

const enhanceEnglishTextPrompt = ai.definePrompt({
  name: 'enhanceEnglishTextPrompt',
  model: 'googleai/gemini-1.5-flash-latest',
  input: {schema: EnhanceEnglishTextInputSchema},
  output: {schema: EnhanceEnglishTextOutputSchema},
  prompt: `You are an AI text enhancement expert. Your task is to improve the given English text for clarity, grammar, and style.

Original Text: {{{text}}}

Enhanced Text:`, // crucial trailing newline
  config: {
    safetySettings: [
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    ],
  },
});

const enhanceEnglishTextFlow = ai.defineFlow(
  {
    name: 'enhanceEnglishTextFlow',
    inputSchema: EnhanceEnglishTextInputSchema,
    outputSchema: EnhanceEnglishTextOutputSchema,
  },
  async input => {
    const {output} = await enhanceEnglishTextPrompt(input);
    return output!;
  }
);
