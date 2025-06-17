
'use server';
/**
 * @fileOverview A Genkit flow for retrieving text-based memories from Pinecone.
 *
 * - retrieveFromPineconeMemory - Retrieves memories based on a query text.
 * - RetrieveFromPineconeMemoryInput - The input type for the function.
 * - RetrieveFromPineconeMemoryOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { queryByVector } from '@/services/pineconeService';

// IMPORTANT: The Pinecone index 'luna-dev' is configured with 'multilingual-e5-large' (1024 dimensions).
// The embedding model used below by ai.embed() (e.g., Google's default 'embedding-001')
// generates 768-dimensional embeddings. This dimensionality mismatch WILL CAUSE ISSUES
// with Pinecone queries (either errors or incorrect results).
// For a production system, the query embedding model MUST match the dimensionality (1024)
// and semantic space of the model used for indexing.
// This flow is a structural placeholder and will require adjustments to the embedding strategy.

const PINECONE_TEXT_FIELD = process.env.PINECONE_TEXT_FIELD_MAP || 'text';

const RetrieveFromPineconeMemoryInputSchema = z.object({
  queryText: z.string().describe('The text query to search for in memory.'),
  topK: z.number().optional().default(3).describe('The number of top matching memories to retrieve.'),
  // We might add namespace or filter options later if needed
});
export type RetrieveFromPineconeMemoryInput = z.infer<typeof RetrieveFromPineconeMemoryInputSchema>;

const RetrievedMemorySchema = z.object({
  id: z.string(),
  score: z.number().optional(),
  text: z.string().optional().describe('The retrieved text content of the memory.'),
  metadata: z.record(z.string(), z.any()).optional(),
});

const RetrieveFromPineconeMemoryOutputSchema = z.object({
  retrievedMemories: z.array(RetrievedMemorySchema).describe('An array of retrieved memories.'),
  // This message addresses the dimensionality issue for now.
  warning: z.string().optional().describe('Warning about potential embedding mismatches.'),
});
export type RetrieveFromPineconeMemoryOutput = z.infer<typeof RetrieveFromPineconeMemoryOutputSchema>;

export async function retrieveFromPineconeMemory(input: RetrieveFromPineconeMemoryInput): Promise<RetrieveFromPineconeMemoryOutput> {
  return retrieveFromPineconeMemoryFlow(input);
}

const retrieveFromPineconeMemoryFlow = ai.defineFlow(
  {
    name: 'retrieveFromPineconeMemoryFlow',
    inputSchema: RetrieveFromPineconeMemoryInputSchema,
    outputSchema: RetrieveFromPineconeMemoryOutputSchema,
  },
  async (input) => {
    const dimensionalWarning = "Warning: Query embedding (likely 768-dim) may mismatch Pinecone index (1024-dim 'multilingual-e5-large'). This will lead to errors or poor results. Query embedding strategy needs alignment with index.";
    console.warn(dimensionalWarning);

    try {
      // 1. Embed the query text
      //    This will use the default embedder from the googleAI plugin (e.g., 'embedding-001' - 768 dimensions)
      const { embedding } = await ai.embed({ text: input.queryText });

      if (!embedding) {
        throw new Error('Failed to generate embedding for the query text.');
      }
      
      // *** CRITICAL ISSUE POINT ***
      // The 'embedding' here is likely 768-dimensional. The Pinecone index expects 1024-dimensional.
      // A direct query will fail or return incorrect results.
      // For now, we will proceed to show the structure, but this needs to be resolved.
      // One might consider skipping the Pinecone query if dimensions mismatch,
      // or having a more robust error handling / dimension check here.

      // 2. Query Pinecone
      const matches = await queryByVector(embedding, input.topK);

      if (!matches) {
        return { retrievedMemories: [], warning: dimensionalWarning };
      }

      // 3. Format the results
      const retrievedMemories = matches.map(match => ({
        id: match.id,
        score: match.score,
        text: match.metadata?.[PINECONE_TEXT_FIELD] as string | undefined,
        metadata: match.metadata,
      }));

      return { retrievedMemories, warning: dimensionalWarning };

    } catch (error: any) {
      console.error('Error retrieving memories from Pinecone:', error);
      // Include the warning in the error output as well
      const errorMessage = error.message.includes('dimension mismatch') 
        ? dimensionalWarning + ` Original error: ${error.message}`
        : `Failed to retrieve memories: ${error.message || 'Unknown error'}. ${dimensionalWarning}`;
      
      // To make the flow still "succeed" but return the error message for diagnosis:
      return { 
        retrievedMemories: [], 
        warning: errorMessage 
      };
    }
  }
);
