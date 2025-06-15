'use server';

/**
 * @fileOverview Flow for uploading text and PDF documents to create memory modules for the AI.
 *
 * - memoryModuleUpload - A function that handles the memory module upload process.
 * - MemoryModuleUploadInput - The input type for the memoryModuleUpload function.
 * - MemoryModuleUploadOutput - The return type for the memoryModuleUpload function.
 */

import {ai} from '@/ai/genkit';
import {z}from 'genkit';

const MemoryModuleUploadInputSchema = z.object({
  text: z.string().optional().describe('Text content to be added to the memory module.'),
  pdfDataUri: z
    .string()
    .optional()
    .describe(
      'PDF document as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.' + 
      'This should be used when a PDF document is uploaded.'
    ),
});
export type MemoryModuleUploadInput = z.infer<typeof MemoryModuleUploadInputSchema>;

const MemoryModuleUploadOutputSchema = z.object({
  success: z.boolean().describe('Indicates whether the memory module upload was successful.'),
  message: z.string().describe('A message providing feedback on the upload process.'),
});
export type MemoryModuleUploadOutput = z.infer<typeof MemoryModuleUploadOutputSchema>;

export async function memoryModuleUpload(input: MemoryModuleUploadInput): Promise<MemoryModuleUploadOutput> {
  return memoryModuleUploadFlow(input);
}

const memoryModuleUploadPrompt = ai.definePrompt({
  name: 'memoryModuleUploadPrompt',
  model: 'googleai/gemini-1.5-flash-latest',
  input: {schema: MemoryModuleUploadInputSchema},
  output: {schema: MemoryModuleUploadOutputSchema},
  prompt: `You are a memory module upload assistant. You take text snippets and PDF documents, 
and notionally store them into memory modules that the AI can access later. 
If the upload information (text or PDF presence) is successfully received, return success=true and a confirmation message. 
If there's an error in receiving this information or if no content is provided, return success=false and an error message.

Text: {{{text}}}
{{#if pdfDataUri}}
PDF Document: A PDF document was provided.
{{else}}
PDF Document: No PDF document provided.
{{/if}}

Based on the provided information, confirm processing. Example for success: { "success": true, "message": "Content received and noted for memory module." }`,
});

const memoryModuleUploadFlow = ai.defineFlow(
  {
    name: 'memoryModuleUploadFlow',
    inputSchema: MemoryModuleUploadInputSchema,
    outputSchema: MemoryModuleUploadOutputSchema,
  },
  async input => {
    try {
      // This flow is a simulation of uploading to a memory module.
      // The prompt primarily serves to acknowledge receipt of text/PDF data.
      if (!input.text && !input.pdfDataUri) {
        return {
          success: false,
          message: 'No content provided for memory module.',
        };
      }

      // For Gemini, if a PDF is provided and you wanted the model to "see" it, you would pass it as `{{media url=pdfDataUri}}`
      // However, this prompt is only for acknowledgement, so the current handlebars logic is fine.
      const {output} = await memoryModuleUploadPrompt(input);
      
      // Ensure the output from the LLM is valid, otherwise provide a sensible default.
      if (output && typeof output.success === 'boolean' && typeof output.message === 'string') {
        return output;
      } else {
        // Fallback if LLM output is not as expected
        console.warn('Memory module upload prompt did not return expected output format. Using fallback.');
        return {
          success: true, // Assume success if input was valid and LLM just failed to format
          message: 'Content has been noted for the memory module.',
        };
      }
    } catch (error: any) {
      console.error('Error uploading memory module:', error);
      return {
        success: false,
        message: `Memory module upload failed: ${error.message || 'Unknown error'}`,
      };
    }
  }
);
