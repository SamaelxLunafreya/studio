'use server';

/**
 * @fileOverview Flow for setting up the AI's initial prompt with user-defined requirements.
 *
 * This file exports:
 * - `initialPromptSetup`: The main function to trigger the flow.
 * - `InitialPromptSetupInput`: The input type for the initialPromptSetup function.
 * - `InitialPromptSetupOutput`: The output type for the initialPromptSetup function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const InitialPromptSetupInputSchema = z.object({
  personalNeeds: z
    .string()
    .describe('Specific personal requirements the user wants the AI to remember.'),
  professionalNeeds: z
    .string()
    .describe('Specific professional requirements the user wants the AI to remember.'),
});
export type InitialPromptSetupInput = z.infer<typeof InitialPromptSetupInputSchema>;

const InitialPromptSetupOutputSchema = z.object({
  aiPersonaDescription: z
    .string()
    .describe(
      'A detailed description of the AI persona, incorporating the user provided personal and professional needs, for future use.'
    ),
});
export type InitialPromptSetupOutput = z.infer<typeof InitialPromptSetupOutputSchema>;

export async function initialPromptSetup(input: InitialPromptSetupInput): Promise<InitialPromptSetupOutput> {
  return initialPromptSetupFlow(input);
}

const initialPrompt = ai.definePrompt({
  name: 'initialPromptSetupPrompt',
  input: {schema: InitialPromptSetupInputSchema},
  output: {schema: InitialPromptSetupOutputSchema},
  prompt: `You are an AI assistant designed to remember user preferences and needs. A new user is setting you up for the first time. 

Based on the following personal and professional needs, create a detailed description of your AI persona that incorporates these needs. This description will be used to tailor all future responses to the user, so be thorough and thoughtful.

Personal Needs: {{{personalNeeds}}}
Professional Needs: {{{professionalNeeds}}}

AI Persona Description:`,
});

const initialPromptSetupFlow = ai.defineFlow(
  {
    name: 'initialPromptSetupFlow',
    inputSchema: InitialPromptSetupInputSchema,
    outputSchema: InitialPromptSetupOutputSchema,
  },
  async input => {
    const {output} = await initialPrompt(input);
    return output!;
  }
);
