
'use server';
/**
 * @fileOverview A Genkit flow for saving text-based memories to Pinecone.
 *
 * - saveToPineconeMemory - Saves a text snippet with optional metadata to the Pinecone vector database.
 * - SaveToPineconeMemoryInput - The input type for the saveToPineconeMemory function.
 * - SaveToPineconeMemoryOutput - The return type for the saveToPineconeMemory function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { upsertTextRecords, type TextRecordToEmbed } from '@/services/pineconeService';
import { randomUUID } from 'crypto'; // For generating unique IDs

const SaveToPineconeMemoryInputSchema = z.object({
  textToSave: z.string().describe('The text content of the memory to be saved.'),
  source: z.string().optional().describe('An optional source identifier for the memory (e.g., "Chat Input", "Memory Upload Tool").'),
  customId: z.string().optional().describe('An optional custom ID for the memory. If not provided, a UUID will be generated.'),
  metadata: z.record(z.string(), z.any()).optional().describe('Optional additional metadata to store with the memory.'),
});
export type SaveToPineconeMemoryInput = z.infer<typeof SaveToPineconeMemoryInputSchema>;

const SaveToPineconeMemoryOutputSchema = z.object({
  success: z.boolean().describe('Indicates whether the memory was successfully saved.'),
  message: z.string().describe('A message providing feedback on the save operation.'),
  recordId: z.string().optional().describe('The ID of the saved record in Pinecone.'),
});
export type SaveToPineconeMemoryOutput = z.infer<typeof SaveToPineconeMemoryOutputSchema>;

export async function saveToPineconeMemory(input: SaveToPineconeMemoryInput): Promise<SaveToPineconeMemoryOutput> {
  return saveToPineconeMemoryFlow(input);
}

const saveToPineconeMemoryFlow = ai.defineFlow(
  {
    name: 'saveToPineconeMemoryFlow',
    inputSchema: SaveToPineconeMemoryInputSchema,
    outputSchema: SaveToPineconeMemoryOutputSchema,
  },
  async (input) => {
    try {
      const recordId = input.customId || randomUUID();
      const currentTimestamp = new Date().toISOString();

      const metadata: Record<string, any> = {
        ...(input.metadata || {}), // Spread any custom metadata first
        createdAt: currentTimestamp,
        source: input.source || 'Unknown',
      };
      
      // The pineconeService's `upsertTextRecords` expects a `text` field in the TextRecordToEmbed.
      // The service itself handles mapping this to the actual `PINECONE_TEXT_FIELD_MAP` value.
      const recordToUpsert: TextRecordToEmbed = {
        id: recordId,
        text: input.textToSave, // This 'text' field is what pineconeService expects.
        metadata: metadata,
      };

      await upsertTextRecords([recordToUpsert]);

      return {
        success: true,
        message: `Memory saved successfully to Pinecone with ID: ${recordId}.`,
        recordId: recordId,
      };
    } catch (error: any) {
      console.error('Error saving memory to Pinecone:', error);
      return {
        success: false,
        message: `Failed to save memory: ${error.message || 'Unknown error'}`,
      };
    }
  }
);
