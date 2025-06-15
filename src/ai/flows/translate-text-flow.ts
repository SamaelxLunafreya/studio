
'use server';
/**
 * @fileOverview A Genkit flow for translating text into different languages.
 *
 * - translateText - The main flow function.
 * - TranslateTextInput - Input type for the flow.
 * - TranslateTextOutput - Output type for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const TranslateTextInputSchema = z.object({
  text: z.string().describe('The text to be translated.'),
  targetLanguage: z.string().describe('The language to translate the text into (e.g., "Spanish", "French", "Japanese").'),
});
export type TranslateTextInput = z.infer<typeof TranslateTextInputSchema>;

const TranslateTextOutputSchema = z.object({
  translatedText: z.string().describe('The translated text.'),
});
export type TranslateTextOutput = z.infer<typeof TranslateTextOutputSchema>;

export async function translateText(input: TranslateTextInput): Promise<TranslateTextOutput> {
  return translateTextFlow(input);
}

const translateTextPrompt = ai.definePrompt({
  name: 'translateTextPrompt',
  model: 'googleai/gemini-1.5-flash-latest', // Explicitly set model
  input: { schema: TranslateTextInputSchema },
  output: { schema: TranslateTextOutputSchema },
  prompt: `Translate the following text into {{{targetLanguage}}}:

Text:
{{{text}}}

Translated Text:`,
});

const translateTextFlow = ai.defineFlow(
  {
    name: 'translateTextFlow',
    inputSchema: TranslateTextInputSchema,
    outputSchema: TranslateTextOutputSchema,
  },
  async (input: TranslateTextInput) => {
    const { output } = await translateTextPrompt(input);
    if (!output?.translatedText) {
      // Fallback or error handling if the model doesn't return expected output
      throw new Error('Translation failed to produce text. The model might have refused the request due to safety or other reasons.');
    }
    return output;
  }
);
