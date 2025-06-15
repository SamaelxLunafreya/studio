
'use server';

import { collaborativeWorkspace, type CollaborativeWorkspaceInput, type CollaborativeWorkspaceOutput } from '@/ai/flows/collaborative-workspace-flow';

export type { CollaborativeWorkspaceInput, CollaborativeWorkspaceOutput };

export async function handleWorkspaceAction(input: CollaborativeWorkspaceInput): Promise<CollaborativeWorkspaceOutput | { error: string }> {
  try {
    if (!input.mode) {
      return { error: 'Workspace interaction mode is required.' };
    }
    if (!input.text && (input.mode === "CONTINUE" || input.mode === "SUGGEST_EDITS" || (input.mode === "EXPLAIN" && !input.selection))) {
        return { error: 'Text input is required for this mode unless explaining a selection.' };
    }

    const result = await collaborativeWorkspace(input);
    return result;
  } catch (error) {
    console.error('Error in handleWorkspaceAction:', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred during AI interaction.';
    return { error: `AI interaction failed: ${message}` };
  }
}
