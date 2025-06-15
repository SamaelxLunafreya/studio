
'use server';

import { collaborateWithAi, type CollaborateWithAiInput, type CollaborateWithAiOutput } from '@/ai/flows/collaborate-with-ai';
import { suggestRelevantActions, type SuggestRelevantActionsInput, type SuggestRelevantActionsOutput } from '@/ai/flows/suggest-relevant-actions';
import { getAutonomousUpdate, type GetAutonomousUpdateInput, type AutonomousUpdateOutput } from '@/ai/flows/get-autonomous-update-flow';

export async function handleChatMessageAction(userInput: string, language: 'Polish' | 'English'): Promise<CollaborateWithAiOutput | { error: string }> {
  try {
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
  } catch (error) {
    console.error('Error in handleChatMessageAction:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { error: `Failed to get AI response: ${errorMessage}. Please try again.` };
  }
}

export async function getIntelligentSuggestionsAction(conversationContext: string, userGoals: string): Promise<SuggestRelevantActionsOutput | { error: string }> {
  try {
    const input: SuggestRelevantActionsInput = {
      conversationContext,
      userGoals,
    };
    const result = await suggestRelevantActions(input);
    return result;
  } catch (error) {
    console.error('Error in getIntelligentSuggestionsAction:', error);
    return { error: 'Failed to get suggestions.' };
  }
}

export async function getAutonomousUpdateAction(language: 'Polish' | 'English'): Promise<AutonomousUpdateOutput | { error: string }> {
  try {
    const input: GetAutonomousUpdateInput = { language };
    const result = await getAutonomousUpdate(input);
    return result;
  } catch (error) {
    console.error('Error in getAutonomousUpdateAction:', error);
    return { error: 'Failed to get autonomous update.' };
  }
}
