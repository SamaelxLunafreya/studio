
'use server';
/**
 * @fileOverview A Genkit flow for collaborative text and code manipulation in a workspace.
 *
 * - collaborativeWorkspaceFlow - The main flow function.
 * - CollaborativeWorkspaceInput - Input type for the flow.
 * - CollaborativeWorkspaceOutput - Output type for the flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CollaborativeWorkspaceInputSchema = z.object({
  text: z.string().describe('The current text content in the workspace.'),
  mode: z.enum(["BRAINSTORM", "CONTINUE", "SUGGEST_EDITS", "EXPLAIN"])
    .describe('The desired AI interaction mode: BRAINSTORM, CONTINUE, SUGGEST_EDITS, EXPLAIN.'),
  selection: z.string().optional().describe('Optional: The currently selected text by the user, relevant for EXPLAIN mode.'),
});
export type CollaborativeWorkspaceInput = z.infer<typeof CollaborativeWorkspaceInputSchema>;

const CollaborativeWorkspaceOutputSchema = z.object({
  resultText: z.string().optional().describe('The text generated or modified by the AI. This could be brainstormed ideas, continued text, or suggested edits.'),
  explanation: z.string().optional().describe('An explanation or additional details from the AI, especially relevant for EXPLAIN mode or to clarify suggestions.'),
});
export type CollaborativeWorkspaceOutput = z.infer<typeof CollaborativeWorkspaceOutputSchema>;

export async function collaborativeWorkspace(input: CollaborativeWorkspaceInput): Promise<CollaborativeWorkspaceOutput> {
  return collaborativeWorkspaceFlow(input);
}

// Internal schema for the prompt, including boolean flags for modes
const WorkspacePromptInternalInputSchema = z.object({
  text: z.string(),
  selection: z.string().optional(),
  mode: z.enum(["BRAINSTORM", "CONTINUE", "SUGGEST_EDITS", "EXPLAIN"]), // Keep original mode for context if needed
  isBrainstormMode: z.boolean(),
  isContinueMode: z.boolean(),
  isSuggestEditsMode: z.boolean(),
  isExplainMode: z.boolean(),
});

const workspacePrompt = ai.definePrompt({
  name: 'collaborativeWorkspacePrompt',
  model: 'googleai/gemini-1.5-flash-latest',
  input: {schema: WorkspacePromptInternalInputSchema}, // Use internal schema
  output: {schema: CollaborativeWorkspaceOutputSchema},
  prompt: `You are an AI assistant designed to collaborate with a user in a text/code workspace.
The user has provided the following text:
<UserText>
{{{text}}}
</UserText>

{{#if selection}}
The user has also selected the following portion of the text:
<UserSelection>
{{{selection}}}
</UserSelection>
{{/if}}

The user wants you to operate in "{{mode}}" mode.

{{#if isBrainstormMode}}
Based on the <UserText> (if any, otherwise general brainstorming), generate a list of relevant ideas, concepts, or next steps.
Provide the brainstormed ideas in the 'resultText' field.
{{else if isContinueMode}}
Continue writing or coding based on the <UserText>. Try to maintain the style and context.
Provide the continued text in the 'resultText' field.
{{else if isSuggestEditsMode}}
Review the <UserText> and suggest improvements, corrections, or alternative phrasings/code structures.
Provide the suggested edited version or a list of suggestions in the 'resultText' field.
You can provide a brief explanation for your major suggestions in the 'explanation' field.
{{else if isExplainMode}}
Explain the provided <UserText>. {{#if selection}}Focus particularly on the <UserSelection>{{else}}Focus on the overall content{{/if}}.
Provide the explanation in the 'explanation' field. You can optionally provide a summarized version or key takeaways in 'resultText'.
{{/if}}

Respond with a JSON object adhering to the output schema.
Ensure 'resultText' or 'explanation' (or both) are populated as appropriate for the mode.
`,
  config: {
    safetySettings: [
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' }, // Could be BLOCK_ONLY_HIGH if code is involved
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    ],
  },
});

const collaborativeWorkspaceFlow = ai.defineFlow(
  {
    name: 'collaborativeWorkspaceFlow',
    inputSchema: CollaborativeWorkspaceInputSchema,
    outputSchema: CollaborativeWorkspaceOutputSchema,
  },
  async (input: CollaborativeWorkspaceInput) => {
    const internalPromptInput = {
      text: input.text,
      selection: input.selection,
      mode: input.mode,
      isBrainstormMode: input.mode === "BRAINSTORM",
      isContinueMode: input.mode === "CONTINUE",
      isSuggestEditsMode: input.mode === "SUGGEST_EDITS",
      isExplainMode: input.mode === "EXPLAIN",
    };

    const {output} = await workspacePrompt(internalPromptInput);
    
    if (!output) {
        return {
            explanation: "The AI could not process the request in the specified mode. Please try rephrasing or a different mode."
        };
    }
    if (!output.resultText && !output.explanation) {
        if (input.mode === "EXPLAIN") {
            output.explanation = "No explanation generated. The content might be too short or ambiguous.";
        } else {
            output.resultText = "No specific output generated for this mode. Please try again or rephrase.";
        }
    }
    return output;
  }
);
