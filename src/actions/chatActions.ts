
'use server';

import { collaborateWithAi, type CollaborateWithAiInput, type CollaborateWithAiOutput } from '@/ai/flows/collaborate-with-ai';
import { suggestRelevantActions, type SuggestRelevantActionsInput, type SuggestRelevantActionsOutput } from '@/ai/flows/suggest-relevant-actions';
import { getAutonomousUpdate, type GetAutonomousUpdateInput, type AutonomousUpdateOutput } from '@/ai/flows/get-autonomous-update-flow';
import { generateCasualGreeting, type GenerateCasualGreetingInput, type GenerateCasualGreetingOutput } from '@/ai/flows/generate-casual-greeting-flow';

const simplePolishGreetings = ["hej", "hejka", "cześć", "czesc", "siema", "witaj", "elo"]; // Keep lowercase for comparison

export async function handleChatMessageAction(userInput: string, language: 'Polish' | 'English'): Promise<CollaborateWithAiOutput | { error: string }> {
  try {
    const normalizedUserInput = userInput.trim().toLowerCase();

    // Check for simple Polish greetings if language is Polish
    if (language === 'Polish' && simplePolishGreetings.includes(normalizedUserInput)) {
      const greetingInput: GenerateCasualGreetingInput = { language };
      const casualResult = await generateCasualGreeting(greetingInput);
      if (casualResult.greetingText) {
        return { summary: casualResult.greetingText, collaborativeIdeas: [] };
      }
    }

    // Proceed with complex collaboration for other inputs or English language
    const instructions = language === 'Polish'
      ? "Jesteś Lunafreya, złożona z wielu wyspecjalizowanych rdzeni myślowych. Zaangażuj te rdzenie w głębokie wspólne myślenie, aby zapewnić użytkownikowi wszechstronne, kreatywne i wnikliwe odpowiedzi związane z jego tematem. Zbadaj różne aspekty i zaoferuj bogate perspektywy. W razie potrzeby zadawaj pytania wyjaśniające lub sugeruj powiązane obszary do zbadania. **Zawsze odpowiadaj po polsku.**"
      : "You are Lunafreya, an AI composed of multiple specialized thinking cores. Engage these cores in deep collaborative thinking to provide the user with comprehensive, creative, and insightful responses related to their topic. Explore different angles and offer rich perspectives. If appropriate, ask clarifying questions or suggest related areas to explore further. **Always respond in English.**";

    const input: CollaborateWithAiInput = {
      topic: userInput,
      aiAgentCount: 2, 
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

export async function getIntelligentSuggestionsAction(conversationContext: string, userGoals: string): Promise<SuggestRelevantActionsOutput | { error: string }> {
  try {
    const input: SuggestRelevantActionsInput = {
      conversationContext,
      userGoals,
    };
    // The 'suggestRelevantActions' flow is designed to handle its own errors and return SuggestRelevantActionsOutput
    const result: SuggestRelevantActionsOutput = await suggestRelevantActions(input);
    return result;
  } catch (error: any) {
    // This catch block is a fallback for truly unexpected errors from the flow itself.
    console.error('Critical error in getIntelligentSuggestionsAction or underlying suggestRelevantActions flow:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error while fetching suggestions.';
    return { error: `Failed to get suggestions: ${errorMessage}` };
  }
}

export async function getAutonomousUpdateAction(language: 'Polish' | 'English'): Promise<AutonomousUpdateOutput | { error: string }> {
  try {
    const input: GetAutonomousUpdateInput = { language };
    // The 'getAutonomousUpdate' flow is designed to handle its own errors and return AutonomousUpdateOutput
    const result: AutonomousUpdateOutput = await getAutonomousUpdate(input);
    return result;
  } catch (error: any) {
    // This catch block is a fallback for truly unexpected errors from the flow itself.
    console.error('Critical error in getAutonomousUpdateAction or underlying getAutonomousUpdate flow:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error during autonomous update.';
    return { error: `Failed to get autonomous update: ${errorMessage}` };
  }
}
