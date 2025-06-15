
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

// No specific input schema needed for this version, AI generates freely.
const AutonomousUpdateOutputSchema = z.object({
  thought: z.string().describe('A brief, proactive thought, tip, or question from Lunafreya (under 20 words).'),
});
export type AutonomousUpdateOutput = z.infer<typeof AutonomousUpdateOutputSchema>;

export async function getAutonomousUpdate(): Promise<AutonomousUpdateOutput> {
  return getAutonomousUpdateFlow();
}

const autonomousUpdatePrompt = ai.definePrompt({
  name: 'autonomousUpdatePrompt',
  output: {schema: AutonomousUpdateOutputSchema},
  prompt: `You are Lunafreya, an AI assistant. The user has enabled autonomous updates.
Offer a very brief, interesting thought, a gentle question, or a useful tip.
Keep it under 20 words.
Examples:
- "Did you know the sky isn't always blue on other planets?"
- "Feeling curious about anything specific today?"
- "Remember to take a short break if you've been working hard!"
- "A new idea often starts with a simple question."
- "What's one small thing you're grateful for right now?"
`,
});

const getAutonomousUpdateFlow = ai.defineFlow(
  {
    name: 'getAutonomousUpdateFlow',
    outputSchema: AutonomousUpdateOutputSchema,
  },
  async () => {
    try {
      const {output} = await autonomousUpdatePrompt({}); // No specific input passed
      if (output?.thought) {
        return output;
      }
      console.warn('Autonomous update prompt did not return a valid thought. Using fallback.');
    } catch (error) {
      console.error('Error in autonomousUpdatePrompt within getAutonomousUpdateFlow:', error);
    }
    // Fallback response if the prompt fails or doesn't return valid output
    return { thought: "Just a moment, collecting my thoughts..." };
  }
);

