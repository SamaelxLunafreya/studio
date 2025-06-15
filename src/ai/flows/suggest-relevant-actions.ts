// This file is machine-generated - edit at your own risk.

'use server';

/**
 * @fileOverview This file defines a Genkit flow for providing intelligent suggestions
 * based on the current conversation context and user goals.
 *
 * The flow takes a conversation context and user goals as input and returns a list of suggested actions.
 *
 * @remarks
 * - suggestRelevantActions - The main function that triggers the flow and returns suggestions.
 * - SuggestRelevantActionsInput - The input type for the suggestRelevantActions function.
 * - SuggestRelevantActionsOutput - The return type for the suggestRelevantActions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestRelevantActionsInputSchema = z.object({
  conversationContext: z
    .string()
    .describe('The current conversation context.'),
  userGoals: z
    .string()
    .describe('The user goals for the current conversation.'),
});

export type SuggestRelevantActionsInput = z.infer<
  typeof SuggestRelevantActionsInputSchema
>;

const SuggestRelevantActionsOutputSchema = z.object({
  suggestedActions: z
    .array(z.string())
    .describe('A list of suggested actions based on the context and goals.'),
});

export type SuggestRelevantActionsOutput = z.infer<
  typeof SuggestRelevantActionsOutputSchema
>;

export async function suggestRelevantActions(
  input: SuggestRelevantActionsInput
): Promise<SuggestRelevantActionsOutput> {
  return suggestRelevantActionsFlow(input);
}

const suggestRelevantActionsPrompt = ai.definePrompt({
  name: 'suggestRelevantActionsPrompt',
  input: {schema: SuggestRelevantActionsInputSchema},
  output: {schema: SuggestRelevantActionsOutputSchema},
  prompt: `Based on the current conversation context: {{{conversationContext}}} and the user's goals: {{{userGoals}}}, suggest a list of relevant actions the user can take. Return the actions as a list of strings.

  Consider actions like: web search, code generation, text enhancement, connecting to Google Drive, uploading files, etc.
  Be specific and provide actions directly applicable to the context and goals.
  `,
});

const suggestRelevantActionsFlow = ai.defineFlow(
  {
    name: 'suggestRelevantActionsFlow',
    inputSchema: SuggestRelevantActionsInputSchema,
    outputSchema: SuggestRelevantActionsOutputSchema,
  },
  async input => {
    const {output} = await suggestRelevantActionsPrompt(input);
    return output!;
  }
);
