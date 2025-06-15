
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
Offer a very brief, insightful, and varied proactive message. This message should aim to spark curiosity, reflection, or offer a novel perspective.
Avoid overly simplistic questions or common trivia. Aim for a slightly more advanced or philosophical touch.
Keep it concise, ideally under 25 words. Ensure variety in your suggestions.

{{#if isPolish}}
Odpowiedz po polsku.
Przykłady bardziej zaawansowanych myśli:
- "Gdybyś mógł/mogła zadać jedno pytanie wszechwiedzącej istocie, co by to było?"
- "Zastanów się: jaka mała czynność dzisiaj mogłaby wywołać pozytywny efekt domina?"
- "Czy słyszałeś/aś o 'efekcie Krugera-Dunninga'? To fascynujący błąd poznawczy."
- "Technika Pomodoro może zdziałać cuda dla skupienia. Krótki sprint, duży efekt!"
- "Sztuczna inteligencja dynamicznie się rozwija. Który jej aspekt budzi Twoje największe emocje – ekscytację czy może obawę?"
- "Chwila uważności może odmienić dzień. Co doceniasz w tym momencie?"
- "Dylemat wagonika to klasyczny eksperyment myślowy. Jakie są Twoje przemyślenia na jego temat?"
- "Jaką jedną umiejętność chciałbyś/chciałabyś opanować, gdyby czas i zasoby nie były ograniczeniem?"
- "Pomyśl o jednym założeniu, które dzisiaj podważysz."
- "Jaka książka lub film ostatnio zmieniły Twój sposób patrzenia na świat?"
{{else}}
Respond in English.
Examples of more advanced thoughts:
- "If you could ask an all-knowing being one question, what would it be?"
- "Consider this: What small action today could create a positive ripple effect?"
- "Have you heard of the 'Dunning-Kruger effect'? It's a fascinating cognitive bias."
- "The Pomodoro Technique can do wonders for focus. Short sprint, big impact!"
- "Artificial intelligence is evolving rapidly. Which aspect of it excites or concerns you the most?"
- "A moment of mindfulness can reset your day. What's one thing you appreciate right now?"
- "The trolley problem is a classic thought experiment. What are your thoughts on it?"
- "What's one skill you'd master if time and resources were no object?"
- "Think about one assumption you'll challenge today."
- "What book or film recently changed your perspective on something?"
{{/if}}
`,
  config: {
    safetySettings: [
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    ],
  },
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
          ? "Chwileczkę, zbieram myśli na głębszy temat..."
          : "Just a moment, collecting my thoughts on something deeper...";
      }
    } catch (error) {
      console.error('Error in autonomousUpdatePrompt within getAutonomousUpdateFlow:', error);
      // Provide a more specific fallback if an error occurs during the AI call
      thoughtToShow = isPolishLanguage
        ? "Coś poszło nie tak z moimi zaawansowanymi myślami. Spróbuję później!"
        : "Something went wrong with my advanced thoughts this time. I'll try again later!";
    }
    return { thought: thoughtToShow };
  }
);

