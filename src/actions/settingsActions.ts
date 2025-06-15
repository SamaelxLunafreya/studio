'use server';

import { initialPromptSetup, type InitialPromptSetupInput, type InitialPromptSetupOutput } from '@/ai/flows/initial-prompt-setup';

export async function savePersonalitySettingsAction(input: InitialPromptSetupInput): Promise<InitialPromptSetupOutput | { error: string }> {
  try {
    if (!input.personalNeeds.trim() && !input.professionalNeeds.trim()) {
      return { error: 'At least one need (personal or professional) must be provided.' };
    }
    const result = await initialPromptSetup(input);
    // In a real app, you might store result.aiPersonaDescription in user preferences (e.g., database or localStorage for client-side caching)
    return result;
  } catch (error) {
    console.error('Error in savePersonalitySettingsAction:', error);
    return { error: 'Failed to save personality settings. Please try again.' };
  }
}
