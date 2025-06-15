
'use server';

import { collaborateWithAi, type CollaborateWithAiInput, type CollaborateWithAiOutput } from '@/ai/flows/collaborate-with-ai';
import { suggestRelevantActions, type SuggestRelevantActionsInput, type SuggestRelevantActionsOutput } from '@/ai/flows/suggest-relevant-actions';
import { getAutonomousUpdate, type AutonomousUpdateOutput } from '@/ai/flows/get-autonomous-update-flow';

export async function handleChatMessageAction(userInput: string): Promise<CollaborateWithAiOutput | { error: string }> {
  try {
    const input: CollaborateWithAiInput = {
      topic: userInput,
      aiAgentCount: 2, // Default to 2 agents for collaboration
      instructions: "You are a team of AI agents. Engage in deep collaborative thinking to provide the user with comprehensive, creative, and insightful responses related to their topic. Explore different angles and offer rich perspectives. If appropriate, ask clarifying questions or suggest related areas to explore further.",
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

export async function getAutonomousUpdateAction(): Promise<AutonomousUpdateOutput | { error: string }> {
  try {
    const result = await getAutonomousUpdate();
    return result;
  } catch (error) {
    console.error('Error in getAutonomousUpdateAction:', error);
    return { error: 'Failed to get autonomous update.' };
  }
}

