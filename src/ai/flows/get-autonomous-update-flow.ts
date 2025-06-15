
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
Offer a very brief, interesting, and varied proactive message. This could be:
- An interesting fact or a piece of trivia.
- A gentle, open-ended question to spark curiosity or reflection.
- A useful tip or a kind reminder (e.g., about well-being).
- An inspiring or positive thought.
- A simple creative prompt or a 'what if' scenario.
Keep it concise, under 20 words.

{{#if (eq language "Polish")}}
Odpowiedz po polsku.
Przykłady:
- "Czy wiesz, że niebo nie zawsze jest niebieskie na innych planetach?"
- "Czujesz dzisiaj ciekawość czegoś konkretnego?"
- "Pamiętaj o krótkiej przerwie, jeśli ciężko pracujesz!"
- "Nowy pomysł często zaczyna się od prostego pytania."
- "Za co jesteś wdzięczny/a w tej chwili?"
- "Każdy dzień to nowa szansa na odkrycie czegoś wspaniałego."
- "Gdybyś mógł/mogła zadać jedno pytanie dowolnej osobie, kogo i o co byś zapytał/a?"
{{else}}
Respond in English.
Examples:
- "Did you know the sky isn't always blue on other planets?"
- "Feeling curious about anything specific today?"
- "Remember to take a short break if you've been working hard!"
- "A new idea often starts with a simple question."
- "What's one small thing you're grateful for right now?"
- "Every day is a new chance to discover something wonderful."
- "If you could ask one question to anyone, who and what would it be?"
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

