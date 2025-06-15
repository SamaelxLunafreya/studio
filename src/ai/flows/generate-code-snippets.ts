'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating, debugging, and optimizing code snippets.
 *
 * - generateCodeSnippets - A function that handles the code generation process.
 * - GenerateCodeSnippetsInput - The input type for the generateCodeSnippets function.
 * - GenerateCodeSnippetsOutput - The return type for the generateCodeSnippets function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateCodeSnippetsInputSchema = z.object({
  programmingLanguage: z
    .string()
    .describe('The programming language for which the code snippet should be generated.'),
  codeDescription: z
    .string()
    .describe('A description of what the code snippet should do.'),
  codeOptimizationGoal: z
    .string()
    .optional()
    .describe('Optional: Specific optimization goals for the code, e.g., speed, memory usage.'),
  existingCode: z
    .string()
    .optional()
    .describe('Optional: Existing code that needs to be debugged or optimized.'),
});
export type GenerateCodeSnippetsInput = z.infer<typeof GenerateCodeSnippetsInputSchema>;

const GenerateCodeSnippetsOutputSchema = z.object({
  generatedCode: z.string().describe('The generated or optimized code snippet.'),
  explanation: z
    .string()
    .describe('An explanation of the generated code and any optimizations made.'),
});
export type GenerateCodeSnippetsOutput = z.infer<typeof GenerateCodeSnippetsOutputSchema>;

export async function generateCodeSnippets(
  input: GenerateCodeSnippetsInput
): Promise<GenerateCodeSnippetsOutput> {
  return generateCodeSnippetsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateCodeSnippetsPrompt',
  model: 'googleai/gemini-1.5-flash-latest', // Explicitly set model
  input: {schema: GenerateCodeSnippetsInputSchema},
  output: {schema: GenerateCodeSnippetsOutputSchema},
  prompt: `You are an expert software engineer who can generate, debug, and optimize code snippets in various programming languages.

  You will use the information provided to generate a code snippet that matches the description and meets any optimization goals.

  Programming Language: {{{programmingLanguage}}}
  Code Description: {{{codeDescription}}}
  Optimization Goal: {{{codeOptimizationGoal}}}
  Existing Code: {{{existingCode}}}

  Output the generated code snippet and an explanation of the code and any optimizations made.
`,
});

const generateCodeSnippetsFlow = ai.defineFlow(
  {
    name: 'generateCodeSnippetsFlow',
    inputSchema: GenerateCodeSnippetsInputSchema,
    outputSchema: GenerateCodeSnippetsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
