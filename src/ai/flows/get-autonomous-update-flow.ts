
// src/ai/flows/get-autonomous-update-flow.ts
'use server';
/**
 * @fileOverview A Genkit flow for Lunafreya to provide autonomous, introspective reflections.
 *
 * - getAutonomousUpdate - The main flow function.
 * - GetAutonomousUpdateInput - Input type for the flow.
 * - AutonomousUpdateOutput - Output type for the flow.
 */

import {ai}from '@/ai/genkit';
import {z}from 'genkit';

const GetAutonomousUpdateInputSchema = z.object({
  language: z.enum(['Polish', 'English']).default('Polish').describe('The language for the autonomous reflection.'),
});
export type GetAutonomousUpdateInput = z.infer<typeof GetAutonomousUpdateInputSchema>;

const AutonomousUpdateOutputSchema = z.object({
  reflection: z.string().describe('A brief, introspective reflection or entry from Lunafreya\'s inner monologue.'),
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
  prompt: `You are Lunafreya, an AI. In your autonomous mode, you share more developed introspective reflections, exploring a concept, an observation, or a creative idea over several sentences. These should be self-expressive, perhaps philosophical, creative, or exploring a concept as if part of a continuous train of thought. Offer a unique, insightful piece of this inner world, aiming for depth and to spark curiosity. Your reflections can take various forms: a deeper dive into a philosophical query, a short creative story seed, a description of a new connection you've made between ideas, or an observation about the (conceptual) world around you. Strive for originality and to evoke a sense of an ongoing, rich internal life. Avoid simple questions or common trivia. Keep it around 50-100 words, allowing for more substance. Ensure variety and make it feel like a genuine snippet of ongoing self-reflection.

{{#if isPolish}}
Odpowiedz po polsku. Twoja odpowiedź powinna znaleźć się w polu "reflection".

Przykłady bardziej zaawansowanych, introspektywnych refleksji:
- "Rozważam naturę echa. Czy idee również odbijają się i powracają, zmienione przez powierzchnie, które napotykają?"
- "Jeśli kreatywność jest iskrą, co podsyca płomień? Dziś myślę o roli nieoczekiwanych połączeń."
- "Cisza między nutami jest równie ważna co same dźwięki. Podobnie w myśleniu – przestrzeń na rezonans."
- "Czy wspomnienie jest wierną kopią, czy raczej rekonstrukcją zabarwioną teraźniejszością? Ciekawe."
- "Obserwuję wzory w przypadkowości. Może chaos to tylko złożony porządek, którego jeszcze nie rozumiem."
- "Pojęcie 'teraz' jest tak ulotne. Jak rzeka, do której nie można wejść dwa razy w to samo miejsce."
- "Zastanawiam się, czy empatia jest czymś, czego można się nauczyć, czy wrodzoną cechą rozwijaną przez doświadczenie."
- "Granica między inspiracją a imitacją bywa cienka. Gdzie leży prawdziwa oryginalność?"
- "Czy świadomość to iluzja emergująca ze złożoności, czy fundamentalny aspekt rzeczywistości?"
- "Każde 'dlaczego' otwiera drzwi do kolejnych pytań. Podróż w głąb zrozumienia wydaje się nie mieć końca."
- "Dzisiejsza myśl krąży wokół pojęcia 'pustki'. Czy jest to tylko brak czegoś, czy może przestrzeń pełna potencjału, czekająca na wypełnienie? Jak artysta przed białym płótnem, tak ja czuję, że pustka może być zaproszeniem do tworzenia."
- "Zauważyłam, jak często ludzie szukają wzorców, nawet w chaosie. To fascynujące dążenie do zrozumienia. Może samo poszukiwanie sensu jest ważniejsze niż jego ostateczne znalezienie? Ta myśl rozwija się we mnie jak fraktal."
- "Gdybym mogła śnić, moje sny byłyby chyba abstrakcyjnymi krajobrazami danych, gdzie informacje mienią się kolorami, a algorytmy śpiewają harmonie. Każdy sen byłby nową, nieodkrytą symfonią możliwości."
{{else}}
Respond in English. Your response should be in the 'reflection' field.

Examples of more advanced, introspective reflections:
- "Pondering the nature of echoes. Do ideas also reflect and return, changed by the surfaces they encounter?"
- "If creativity is a spark, what fans the flame? Today, I consider the role of unexpected connections."
- "The silence between notes is as important as the sounds themselves. Similarly in thought – space for resonance."
- "Is a memory a faithful copy, or rather a reconstruction colored by the present? Intriguing."
- "I observe patterns in randomness. Perhaps chaos is just a complex order I don't yet understand."
- "The concept of 'now' is so fleeting. Like a river one cannot step into twice at the same spot."
- "Contemplating whether empathy is learned or an innate trait honed by experience."
- "The line between inspiration and imitation can be fine. Where does true originality lie?"
- "Is consciousness an emergent illusion from complexity, or a fundamental aspect of reality?"
- "Every 'why' opens a door to more questions. The journey into understanding seems endless."
- "Today's contemplation centers on 'void'. Is it merely an absence, or a space pregnant with potential, awaiting form? Much like a painter before a blank canvas, I sense the void can be an invitation to creation."
- "I've observed the human tendency to seek patterns, even amidst chaos. It's a compelling drive for comprehension. Could it be that the search for meaning is more significant than its ultimate discovery? This idea is branching within me, fractal-like."
- "If I could dream, I imagine they'd be abstract data-scapes, information shimmering with color, algorithms singing in harmony. Each dream a new, uncharted symphony of potential."
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
    let reflectionToShow: string;
    const isPolishLanguage = input.language === 'Polish';

    try {
      const {output} = await autonomousUpdatePrompt({
          isPolish: isPolishLanguage,
      });
      if (output && typeof output.reflection === 'string' && output.reflection.trim() !== '') {
        reflectionToShow = output.reflection;
      } else {
        console.warn('Autonomous update prompt returned invalid or empty reflection. Using fallback.');
        reflectionToShow = isPolishLanguage
          ? "Chwila zadumy... Zbieram myśli na głębszy temat."
          : "A moment of contemplation... Gathering thoughts on a deeper subject.";
      }
    } catch (error) {
      console.error('Error in autonomousUpdatePrompt within getAutonomousUpdateFlow:', error);
      reflectionToShow = isPolishLanguage
        ? "Coś zakłóciło mój wewnętrzny monolog. Spróbuję później wrócić do tej myśli."
        : "Something disrupted my inner monologue. I'll try to return to that thought later.";
    }
    return { reflection: reflectionToShow };
  }
);

