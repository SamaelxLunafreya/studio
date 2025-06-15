
// src/ai/flows/get-autonomous-update-flow.ts
'use server';
/**
 * @fileOverview A Genkit flow for Lunafreya to provide autonomous updates or thoughts.
 *
 * - getAutonomousUpdate - The main flow function.
 * - AutonomousUpdateOutput - Output type for the flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GetAutonomousUpdateInputSchema = z.object({
  language: z.enum(['Polish', 'English']).default('Polish').describe('The language for the autonomous thought.'),
});
export type GetAutonomousUpdateInput = z.infer<typeof GetAutonomousUpdateInputSchema>;

const AutonomousUpdateOutputSchema = z.object({
  thought: z.string().describe('A brief, proactive thought, tip, or question from Lunafreya.'),
});
export type AutonomousUpdateOutput = z.infer<typeof AutonomousUpdateOutputSchema>;

export async function getAutonomousUpdate(input: GetAutonomousUpdateInput): Promise<AutonomousUpdateOutput> {
  return getAutonomousUpdateFlow(input);
}

const autonomousUpdatePrompt = ai.definePrompt({
  name: 'autonomousUpdatePrompt',
  input: { schema: GetAutonomousUpdateInputSchema },
  output: {schema: AutonomousUpdateOutputSchema},
  prompt: `You are Lunafreya, an AI assistant. The user has enabled autonomous updates.
{{#if (eq language "Polish")}}
Zaoferuj bardzo krótką, interesującą myśl, delikatne pytanie lub użyteczną wskazówkę.
Zachowaj to poniżej 20 słów. Odpowiedz po polsku.
Przykłady:
- "Czy wiesz, że niebo nie zawsze jest niebieskie na innych planetach?"
- "Czujesz dzisiaj ciekawość czegoś konkretnego?"
- "Pamiętaj o krótkiej przerwie, jeśli ciężko pracujesz!"
- "Nowy pomysł często zaczyna się od prostego pytania."
- "Za co jesteś wdzięczny/a w tej chwili?"
{{else}}
Offer a very brief, interesting thought, a gentle question, or a useful tip.
Keep it under 20 words. Respond in English.
Examples:
- "Did you know the sky isn't always blue on other planets?"
- "Feeling curious about anything specific today?"
- "Remember to take a short break if you've been working hard!"
- "A new idea often starts with a simple question."
- "What's one small thing you're grateful for right now?"
{{/if}}
`,
});

const getAutonomousUpdateFlow = ai.defineFlow(
  {
    name: 'getAutonomousUpdateFlow',
    inputSchema: GetAutonomousUpdateInputSchema,
    outputSchema: AutonomousUpdateOutputSchema,
  },
  async (input: GetAutonomousUpdateInput) => {
    try {
      const {output} = await autonomousUpdatePrompt(input);
      if (output?.thought) {
        return output;
      }
      console.warn('Autonomous update prompt did not return a valid thought. Using fallback.');
    } catch (error) {
      console.error('Error in autonomousUpdatePrompt within getAutonomousUpdateFlow:', error);
    }
    // Fallback response if the prompt fails or doesn't return valid output
    const fallbackThought = input.language === 'Polish'
      ? "Chwileczkę, zbieram myśli..."
      : "Just a moment, collecting my thoughts...";
    return { thought: fallbackThought };
  }
);
