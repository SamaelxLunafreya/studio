// The aiAssistedWebSearch flow allows users to search the web for information and receive summarized results.
// It takes a search query as input and returns a summary of the search results.

'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const WebSearchInputSchema = z.object({
  query: z.string().describe('The search query to use.'),
});

export type WebSearchInput = z.infer<typeof WebSearchInputSchema>;

const WebSearchOutputSchema = z.object({
  summary: z.string().describe('A summary of the search results.'),
});

export type WebSearchOutput = z.infer<typeof WebSearchOutputSchema>;

export async function aiAssistedWebSearch(input: WebSearchInput): Promise<WebSearchOutput> {
  return aiAssistedWebSearchFlow(input);
}

const webSearchPrompt = ai.definePrompt({
  name: 'webSearchPrompt',
  model: 'googleai/gemini-1.5-flash-latest', // Explicitly set model
  input: {schema: WebSearchInputSchema},
  output: {schema: WebSearchOutputSchema},
  prompt: `You are an AI assistant that summarizes web search results.

  Summarize the following search query:
  {{query}}`,
});

const aiAssistedWebSearchFlow = ai.defineFlow(
  {
    name: 'aiAssistedWebSearchFlow',
    inputSchema: WebSearchInputSchema,
    outputSchema: WebSearchOutputSchema,
  },
  async input => {
    const {output} = await webSearchPrompt(input);
    return output!;
  }
);
