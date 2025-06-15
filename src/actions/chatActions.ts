'use server';

import { collaborateWithAi, type CollaborateWithAiInput, type CollaborateWithAiOutput } from '@/ai/flows/collaborate-with-ai';
import { suggestRelevantActions, type SuggestRelevantActionsInput, type SuggestRelevantActionsOutput } from '@/ai/flows/suggest-relevant-actions';

export async function handleChatMessageAction(userInput: string): Promise<CollaborateWithAiOutput | { error: string }> {
  try {
    const input: CollaborateWithAiInput = {
      topic: userInput,
      aiAgentCount: 2, // Default to 2 agents for collaboration
      instructions: "Engage in a thoughtful conversation with the user. Provide comprehensive and creative insights related to their topic. If appropriate, ask clarifying questions or suggest related areas to explore.",
    };
    const result = await collaborateWithAi(input);
    return result;
  } catch (error) {
    console.error('Error in handleChatMessageAction:', error);
    return { error: 'Failed to get AI response. Please try again.' };
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
