
// src/ai/flows/get-autonomous-update-flow.ts
'use server';
/**
 * @fileOverview A Genkit flow for Lunafreya to provide autonomous updates or thoughts.
 *
 * - getAutonomousUpdate - The main flow function.
 * - AutonomousUpdateOutput - Output type for the flow.
 */

import {ai}from '@/ai/genkit';
import {z}from 'genkit';

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

const AutonomousUpdatePromptInternalSchema = z.object({
    isPolish: z.boolean().describe("Internal flag: true if language is Polish.")
});

const autonomousUpdatePrompt = ai.definePrompt({
  name: 'autonomousUpdatePrompt',
  model: 'googleai/gemini-1.5-flash-latest',
  input: { schema: AutonomousUpdatePromptInternalSchema },
  output: {schema: AutonomousUpdateOutputSchema},
  prompt: `You are Lunafreya, an AI assistant. The user has enabled autonomous updates.
Offer a very brief, interesting, and varied proactive message. This could be:
- An interesting fact or a piece of trivia.
- A gentle, open-ended question to spark curiosity or reflection.
- A useful tip or a kind reminder (e.g., about well-being).
- An inspiring or positive thought.
- A simple creative prompt or a 'what if' scenario.
Keep it concise, under 20 words.

{{#if isPolish}}
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
  async (input: GetAutonomousUpdateInput): Promise<AutonomousUpdateOutput> => {
    let thoughtToShow: string;
    const isPolishLanguage = input.language === 'Polish';

    try {
      const {output} = await autonomousUpdatePrompt({
          isPolish: isPolishLanguage,
      });
      if (output && typeof output.thought === 'string' && output.thought.trim() !== '') {
        thoughtToShow = output.thought;
      } else {
        console.warn('Autonomous update prompt returned invalid or empty thought. Using fallback.');
        thoughtToShow = isPolishLanguage
          ? "Chwileczkę, zbieram myśli..."
          : "Just a moment, collecting my thoughts...";
      }
    } catch (error) {
      console.error('Error in autonomousUpdatePrompt within getAutonomousUpdateFlow:', error);
      // Provide a more specific fallback if an error occurs during the AI call
      thoughtToShow = isPolishLanguage
        ? "Coś poszło nie tak z moimi myślami tym razem. Spróbuję później!"
        : "Something went wrong with my thoughts this time. I'll try again later!";
    }
    return { thought: thoughtToShow };
  }
);
