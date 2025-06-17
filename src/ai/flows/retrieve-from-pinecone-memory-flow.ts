
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
});
export type RetrieveFromPineconeMemoryInput = z.infer<typeof RetrieveFromPineconeMemoryInputSchema>;

const RetrievedMemorySchema = z.object({
  id: z.string(),
  score: z.number().optional(),
  text: z.string().optional().describe('The retrieved text content of the memory.'),
  // metadata: z.record(z.string(), z.any()).optional(), // We only care about text for now in this context
});
export type RetrievedMemory = z.infer<typeof RetrievedMemorySchema>;

const RetrieveFromPineconeMemoryOutputSchema = z.object({
  retrievedMemories: z.array(RetrievedMemorySchema).describe('An array of retrieved memories.'),
  warning: z.string().optional().describe('Warning about potential embedding mismatches or other issues.'),
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
  async (input): Promise<RetrieveFromPineconeMemoryOutput> => {
    const dimensionalWarning = "Critical Warning: Query embedding model (likely 768-dim from ai.embed default) currently MISMATCHES Pinecone index (1024-dim 'multilingual-e5-large'). This WILL lead to Pinecone errors or poor/irrelevant search results. Query embedding strategy requires alignment with the index for this feature to work correctly. This is a known issue for future improvement.";
    console.warn(dimensionalWarning);

    try {
      // 1. Embed the query text
      // This will use the default embedder from the googleAI plugin (e.g., 'embedding-001' - likely 768 dimensions)
      // NOTE: For production, this model MUST match multilingual-e5-large dimensions (1024) and semantic space.
      console.log(`retrieveFromPineconeMemoryFlow: Embedding query: "${input.queryText}" (topK: ${input.topK})`);
      
      const embeddingResult = await ai.embed({ text: input.queryText });

      if (!embeddingResult || !embeddingResult.embedding || !Array.isArray(embeddingResult.embedding) || embeddingResult.embedding.length === 0) {
        console.error('retrieveFromPineconeMemoryFlow: Failed to generate a valid embedding for the query text. Embedding result:', embeddingResult);
        return { 
          retrievedMemories: [], 
          warning: `Failed to generate embedding for the query text. The embedding service might be unavailable or the query could not be processed. ${dimensionalWarning}` 
        };
      }
      
      const queryEmbedding = embeddingResult.embedding;
      
      // *** CRITICAL ISSUE POINT DUE TO DIMENSION MISMATCH ***
      // The 'queryEmbedding' here is likely 768-dimensional. The Pinecone index expects 1024-dimensional.
      // A direct query will likely fail or return meaningless results.

      // 2. Query Pinecone
      console.log('retrieveFromPineconeMemoryFlow: Querying Pinecone with an embedding of dimension:', queryEmbedding.length);
      const matches = await queryByVector(queryEmbedding, input.topK);

      if (!matches || matches.length === 0) {
        console.log('retrieveFromPineconeMemoryFlow: No matches found in Pinecone.');
        return { retrievedMemories: [], warning: `No matches found. ${dimensionalWarning}` };
      }

      // 3. Format the results
      const retrievedMemories = matches.map(match => ({
        id: match.id,
        score: match.score,
        text: match.metadata?.[PINECONE_TEXT_FIELD] as string | undefined,
        // metadata: match.metadata, // Not sending full metadata for now
      })).filter(memory => memory.text); // Filter out memories without text

      console.log(`retrieveFromPineconeMemoryFlow: Found ${retrievedMemories.length} records.`);
      return { retrievedMemories, warning: retrievedMemories.length > 0 ? dimensionalWarning : `No relevant text found in matches. ${dimensionalWarning}` };

    } catch (error: any) {
      console.error('retrieveFromPineconeMemoryFlow: Error retrieving memories from Pinecone:', error);
      let errorMessage = error.message || 'Unknown error during Pinecone retrieval.';
      if (error.message && error.message.toLowerCase().includes('dimension mismatch')) {
         errorMessage = `Pinecone error: Vector dimension mismatch. Query vector (likely ${ (error as any).queryVectorDim || 'unknown' }D) does not match index dimension (1024D). ${dimensionalWarning}`;
      } else {
         errorMessage = `Failed to retrieve memories: ${errorMessage}. ${dimensionalWarning}`;
      }
      return { 
        retrievedMemories: [], 
        warning: errorMessage
      };
    }
  }
);
