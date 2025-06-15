'use server';

/**
 * @fileOverview Flow for uploading text and PDF documents to create memory modules for the AI.
 *
 * - memoryModuleUpload - A function that handles the memory module upload process.
 * - MemoryModuleUploadInput - The input type for the memoryModuleUpload function.
 * - MemoryModuleUploadOutput - The return type for the memoryModuleUpload function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

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
  input: {schema: MemoryModuleUploadInputSchema},
  output: {schema: MemoryModuleUploadOutputSchema},
  prompt: `You are a memory module upload assistant.  You take text snippets and PDF documents, 
and store them into memory modules that the AI can access later.  If the upload is successful, return
success=true and a confirmation message.  If there's an error, return success=false and an error message.

Text: {{{text}}}
PDF Document: {{#if pdfDataUri}}{{media url=pdfDataUri}}{{else}}No PDF document provided.{{/if}}`,
});

const memoryModuleUploadFlow = ai.defineFlow(
  {
    name: 'memoryModuleUploadFlow',
    inputSchema: MemoryModuleUploadInputSchema,
    outputSchema: MemoryModuleUploadOutputSchema,
  },
  async input => {
    try {
      // Simulate a successful upload to memory module (replace with actual implementation later)
      // In a real implementation, you would store the text and PDF content in a database or vector store.

      // For now, just return a success message.
      const {output} = await memoryModuleUploadPrompt(input);
      return output!;
    } catch (error: any) {
      console.error('Error uploading memory module:', error);
      return {
        success: false,
        message: `Memory module upload failed: ${error.message || 'Unknown error'}`,
      };
    }
  }
);
