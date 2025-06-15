// The aiAssistedWebSearch flow allows users to search the web for information and receive summarized results.
// It takes a search query and desired language as input and returns a summary of the search results in that language.

'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const WebSearchInputSchema = z.object({
  query: z.string().describe('The search query to use.'),
  language: z.enum(['Polish', 'English']).default('English').describe('The desired language for the summary.'),
});

export type WebSearchInput = z.infer<typeof WebSearchInputSchema>;

const WebSearchOutputSchema = z.object({
  summary: z.string().describe('A summary of the search results in the requested language.'),
});

export type WebSearchOutput = z.infer<typeof WebSearchOutputSchema>;

export async function aiAssistedWebSearch(input: WebSearchInput): Promise<WebSearchOutput> {
  return aiAssistedWebSearchFlow(input);
}

const WebSearchPromptInternalInputSchema = z.object({
  query: z.string(),
  isPolish: z.boolean(),
});

const webSearchPrompt = ai.definePrompt({
  name: 'webSearchPrompt',
  model: 'googleai/gemini-1.5-flash-latest',
  input: {schema: WebSearchPromptInternalInputSchema},
  output: {schema: WebSearchOutputSchema},
  prompt: `{{#if isPolish}}
Jesteś asystentem AI, który podsumowuje wyniki wyszukiwania w internecie.
Zapytanie użytkownika to: "{{{query}}}"
Twoim zadaniem jest wygenerowanie zwięzłego podsumowania wyników wyszukiwania dla tego zapytania. **Podsumowanie musi być w języku polskim.**
Odpowiedz tylko podsumowaniem w polu "summary".
{{else}}
You are an AI assistant that summarizes web search results.
The user's query is: "{{{query}}}"
Your task is to generate a concise summary of the search results for this query. **The summary must be in English.**
Respond with only the summary in the "summary" field.
{{/if}}`,
  config: {
    safetySettings: [
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    ],
  },
});

const aiAssistedWebSearchFlow = ai.defineFlow(
  {
    name: 'aiAssistedWebSearchFlow',
    inputSchema: WebSearchInputSchema,
    outputSchema: WebSearchOutputSchema,
  },
  async input => {
    const {output} = await webSearchPrompt({
      query: input.query,
      isPolish: input.language === 'Polish',
    });
    return output!;
  }
);
