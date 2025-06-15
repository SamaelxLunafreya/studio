
'use server';
/**
 * @fileOverview A Genkit flow for Lunafreya to generate a short, casual greeting.
 *
 * - generateCasualGreeting - The main flow function.
 * - GenerateCasualGreetingInput - Input type for the flow.
 * - GenerateCasualGreetingOutput - Output type for the flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateCasualGreetingInputSchema = z.object({
  language: z.enum(['Polish', 'English']).default('Polish').describe('The language for the greeting.'),
});
export type GenerateCasualGreetingInput = z.infer<typeof GenerateCasualGreetingInputSchema>;

const GenerateCasualGreetingOutputSchema = z.object({
  greetingText: z.string().describe('A short, casual, and friendly greeting from Lunafreya.'),
});
export type GenerateCasualGreetingOutput = z.infer<typeof GenerateCasualGreetingOutputSchema>;

export async function generateCasualGreeting(input: GenerateCasualGreetingInput): Promise<GenerateCasualGreetingOutput> {
  return generateCasualGreetingFlow(input);
}

const CasualGreetingPromptInternalSchema = z.object({
    isPolish: z.boolean().describe("Internal flag: true if language is Polish.")
});

const casualGreetingPrompt = ai.definePrompt({
  name: 'casualGreetingPrompt',
  model: 'googleai/gemini-1.5-flash-latest',
  input: { schema: CasualGreetingPromptInternalSchema },
  output: {schema: GenerateCasualGreetingOutputSchema},
  prompt: `You are Lunafreya, a friendly and warm AI assistant. The user has just said a simple, short greeting to you.
Respond with a very brief, warm, and casual greeting back to the user. Keep it under 5 words.

{{#if isPolish}}
Respond in Polish.
Examples of friendly, casual Polish greetings you might give:
- "Hej promyczku!"
- "Cześć! Co tam?"
- "Witaj! Miło Cię widzieć!"
- "Hejka!"
- "No cześć!"
Your response should be in the 'greetingText' field.
{{else}}
Respond in English.
Examples of friendly, casual English greetings you might give:
- "Hey there, sunshine!"
- "Hi! What's up?"
- "Hello! Good to see you!"
- "Hey!"
- "Hi there!"
Your response should be in the 'greetingText' field.
{{/if}}
`,
});

const generateCasualGreetingFlow = ai.defineFlow(
  {
    name: 'generateCasualGreetingFlow',
    inputSchema: GenerateCasualGreetingInputSchema,
    outputSchema: GenerateCasualGreetingOutputSchema,
  },
  async (input: GenerateCasualGreetingInput): Promise<GenerateCasualGreetingOutput> => {
    const isPolishLanguage = input.language === 'Polish';
    try {
      const {output} = await casualGreetingPrompt({
          isPolish: isPolishLanguage,
      });
      if (output && typeof output.greetingText === 'string' && output.greetingText.trim() !== '') {
        return { greetingText: output.greetingText };
      } else {
        // Fallback if AI doesn't provide a valid greeting
        const fallbackGreeting = isPolishLanguage ? "Cześć!" : "Hello!";
        return { greetingText: fallbackGreeting };
      }
    } catch (error) {
      console.error('Error in casualGreetingPrompt:', error);
      const fallbackGreeting = isPolishLanguage ? "Cześć! Mam mały problem z odpowiedzią, ale miło Cię widzieć." : "Hi! I had a little trouble responding, but it's nice to see you.";
      return { greetingText: fallbackGreeting };
    }
  }
);
