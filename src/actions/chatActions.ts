
'use server';

import { collaborateWithAi, type CollaborateWithAiInput, type CollaborateWithAiOutput } from '@/ai/flows/collaborate-with-ai';
import { getAutonomousUpdate, type GetAutonomousUpdateInput, type AutonomousUpdateOutput } from '@/ai/flows/get-autonomous-update-flow';
import { generateCasualGreeting, type GenerateCasualGreetingInput, type GenerateCasualGreetingOutput } from '@/ai/flows/generate-casual-greeting-flow';

const simplePolishGreetings = ["hej", "hejka", "cześć", "czesc", "siema", "witaj", "elo", "dzien dobry", "dzień dobry", "dobry wieczor", "dobry wieczór"]; // Keep lowercase for comparison
const aiName = "luna"; // Define AI name for matching

export async function handleChatMessageAction(userInput: string, language: 'Polish' | 'English'): Promise<CollaborateWithAiOutput | { error: string }> {
  try {
    const normalizedUserInput = userInput.trim().toLowerCase();

    // Check for simple Polish greetings if language is Polish
    if (language === 'Polish') {
      const isSimpleGreetingAlone = simplePolishGreetings.includes(normalizedUserInput);
      // Check for "greeting luna" or "luna greeting" pattern
      const isGreetingWithLuna = simplePolishGreetings.some(greeting =>
        normalizedUserInput === `${greeting} ${aiName}` || normalizedUserInput === `${aiName} ${greeting}`
      );

      if (isSimpleGreetingAlone || isGreetingWithLuna) {
        const greetingInput: GenerateCasualGreetingInput = { language };
        const casualResult = await generateCasualGreeting(greetingInput);
        if (casualResult.greetingText) {
          return { summary: casualResult.greetingText, collaborativeIdeas: [] };
        }
      }
    }

    // Updated instructions for more direct responses
    const instructions = language === 'Polish'
      ? "Jesteś Lunafreya, pomocna asystentka AI. Odpowiadaj na pytania i prośby użytkownika w sposób jasny, zwięzły i pomocny. Staraj się być naturalna i konwersacyjna. Jeśli temat jest złożony, możesz przedstawić kluczowe perspektywy, ale unikaj nadmiernej analizy prostych zapytań. **Zawsze odpowiadaj po polsku.**"
      : "You are Lunafreya, a helpful AI assistant. Respond to the user's questions and requests clearly, concisely, and helpfully. Aim to be natural and conversational. If the topic is complex, you can offer key perspectives, but avoid over-analyzing simple queries. **Always respond in English.**";

    const input: CollaborateWithAiInput = {
      topic: userInput,
      aiAgentCount: 1, // Reduced agent count for more directness initially
      instructions: instructions,
      language: language,
    };
    const result = await collaborateWithAi(input);
    return result;
  } catch (error: any) {
    console.error('Error in handleChatMessageAction:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error in chat processing.';
    return { error: `Failed to get AI response: ${errorMessage}. Please try again.` };
  }
}


export async function getAutonomousUpdateAction(language: 'Polish' | 'English'): Promise<AutonomousUpdateOutput | { error: string }> {
  try {
    const input: GetAutonomousUpdateInput = { language };
    const result: AutonomousUpdateOutput = await getAutonomousUpdate(input);
    return result; 
  } catch (error: any) {
    console.error('Critical error in getAutonomousUpdateAction or underlying getAutonomousUpdate flow:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error during autonomous update.';
    const fallbackReflection = language === 'Polish' 
        ? "Coś zakłóciło mój wewnętrzny monolog. Spróbuję później wrócić do tej myśli." 
        : "Something disrupted my inner monologue. I'll try to return to that thought later.";
    return { reflection: fallbackReflection };
  }
}
