
// This file is machine-generated - edit at your own risk.

'use server';

/**
 * @fileOverview This file defines a Genkit flow for providing intelligent suggestions
 * based on the current conversation context and user goals.
 *
 * The flow takes a conversation context and user goals as input and returns a list of suggested actions.
 *
 * @remarks
 * - suggestRelevantActions - The main function that triggers the flow and returns suggestions.
 * - SuggestRelevantActionsInput - The input type for the suggestRelevantActions function.
 * - SuggestRelevantActionsOutput - The return type for the suggestRelevantActions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { searchGoogleDriveTool } from '@/ai/tools/google-drive-tool';
import { searchGitHubIssuesTool, getGitHubRepoFileContentTool } from '@/ai/tools/github-tool'; // Import GitHub tools

const SuggestRelevantActionsInputSchema = z.object({
  conversationContext: z
    .string()
    .describe('The current conversation context.'),
  userGoals: z
    .string()
    .describe('The user goals for the current conversation.'),
});

export type SuggestRelevantActionsInput = z.infer<
  typeof SuggestRelevantActionsInputSchema
>;

const SuggestRelevantActionsOutputSchema = z.object({
  suggestedActions: z
    .array(z.string())
    .describe('A list of suggested actions based on the context and goals. These should be actionable phrases the user can click on.'),
});

export type SuggestRelevantActionsOutput = z.infer<
  typeof SuggestRelevantActionsOutputSchema
>;

export async function suggestRelevantActions(
  input: SuggestRelevantActionsInput
): Promise<SuggestRelevantActionsOutput> {
  return suggestRelevantActionsFlow(input);
}

const suggestRelevantActionsPrompt = ai.definePrompt({
  name: 'suggestRelevantActionsPrompt',
  input: {schema: SuggestRelevantActionsInputSchema},
  output: {schema: SuggestRelevantActionsOutputSchema},
  tools: [searchGoogleDriveTool, searchGitHubIssuesTool, getGitHubRepoFileContentTool], // Make tools available
  system: `Based on the current conversation context: {{{conversationContext}}} and the user's goals: {{{userGoals}}}, suggest a list of 3-4 relevant actions the user can take.
  Return the actions as a list of strings in the 'suggestedActions' field. Each string should be a concise, actionable phrase.

  Consider actions like:
  - "Search the web for [relevant topic from context]"
  - "Generate code for [relevant task from context] in [language]"
  - "Enhance the following text: [snippet from context]"
  - "Explain [concept from context] further"
  - "Summarize the key points of our conversation"
  - "Brainstorm ideas for [topic from context]"

  If the conversation or goals mention needing information that might be in user's documents, you can suggest using the 'searchGoogleDriveTool'.
  For example: "Search Google Drive for [relevant document name or topic]"

  If the conversation involves code, repositories, or software development issues, you can suggest using GitHub tools.
  For example:
  - "Search GitHub issues in [owner/repo] for [topic]"
  - "Get content of [filepath] from GitHub repo [owner/repo]"

  Be specific and provide actions directly applicable to the context and goals. Avoid generic suggestions.
  Ensure the output is a JSON object with the 'suggestedActions' array.
  `,
});

const suggestRelevantActionsFlow = ai.defineFlow(
  {
    name: 'suggestRelevantActionsFlow',
    inputSchema: SuggestRelevantActionsInputSchema,
    outputSchema: SuggestRelevantActionsOutputSchema,
  },
  async (input): Promise<SuggestRelevantActionsOutput> => {
    let LlmOutput: (typeof SuggestRelevantActionsOutputSchema._type & z.ZodObject<any, any, any>['_output']) | null = null;
    
    try {
      const { output: promptOutput, history } = await suggestRelevantActionsPrompt(input);
      LlmOutput = promptOutput; // promptOutput can be null

      if (history && history.length > 0) {
        const lastStep = history[history.length - 1];
        if (lastStep.output?.toolRequest) {
          console.log(
            "LLM suggested tool use in suggestRelevantActionsPrompt. Current flow expects direct suggestions. Tool request:",
            lastStep.output.toolRequest
          );
          // If the LLM wants to use a tool, we currently don't handle that response for *direct suggestions*.
          // The prompt is primarily for generating textual suggestions.
          // For a more agentic behavior, this flow would need to handle tool calls and responses.
        }
      }
    } catch (error) {
      console.error('Error during suggestRelevantActionsPrompt execution or parsing:', error);
      // LlmOutput remains null, proceed to fallback.
    }

    if (LlmOutput?.suggestedActions && Array.isArray(LlmOutput.suggestedActions) && LlmOutput.suggestedActions.length > 0) {
      return { suggestedActions: LlmOutput.suggestedActions.slice(0, 4) };
    }
    
    console.warn(
      "SuggestRelevantActionsFlow: LLM did not return valid suggestions, output was null, or an error occurred. Using fallback suggestions."
    );
    return { 
      suggestedActions: [
        "Explore related topics", 
        "Ask a clarifying question", 
        "Summarize our discussion"
      ].slice(0,3) // Ensure fallback also respects a reasonable limit
    };
  }
);
