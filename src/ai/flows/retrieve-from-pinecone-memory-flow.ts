
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
    const userFriendlyPineconeWarning = "Informacja o pamięci: Moja głębsza pamięć (Pinecone) wciąż się uczy i rozwija. Czasami mogę mieć trudności z idealnym dopasowaniem wspomnień z powodu znanego technicznego niedopasowania (rodzaj 'klucza' do 'zamka' pamięci). Pracujemy nad tym, by była coraz lepsza dla Ciebie, Promyku! ❤️ To nie powinno zakłócać naszej bieżącej rozmowy.";
    const technicalDimensionalWarning = "Pinecone Embedding Mismatch: Query embedding model (likely 768-dim from ai.embed default) currently MISMATCHES Pinecone index (1024-dim 'multilingual-e5-large'). This WILL lead to Pinecone errors or poor/irrelevant search results. Query embedding strategy requires alignment with the index for this feature to work correctly.";
    
    console.warn(technicalDimensionalWarning); // Keep detailed technical warning in logs

    try {
      // 1. Embed the query text
      console.log(`retrieveFromPineconeMemoryFlow: Embedding query: "${input.queryText}" (topK: ${input.topK})`);
      
      const embeddingResult = await ai.embed({ text: input.queryText });

      if (!embeddingResult || typeof embeddingResult.embedding === 'undefined' || !Array.isArray(embeddingResult.embedding) || embeddingResult.embedding.length === 0) {
        console.error('retrieveFromPineconeMemoryFlow: Failed to generate a valid embedding for the query text. Embedding result:', embeddingResult);
        // Inform user about embedding failure, but also append the general Pinecone context warning.
        const embeddingFailureMessage = `Nie udało się przygotować Twojego zapytania dla mojej głębszej pamięci. Usługa osadzania może być niedostępna lub zapytanie nie mogło zostać przetworzone.`;
        return { 
          retrievedMemories: [], 
          warning: `${embeddingFailureMessage} ${userFriendlyPineconeWarning}`
        };
      }
      
      const queryEmbedding = embeddingResult.embedding;
      
      console.log('retrieveFromPineconeMemoryFlow: Querying Pinecone with an embedding of dimension:', queryEmbedding.length);
      const matches = await queryByVector(queryEmbedding, input.topK);

      if (!matches || matches.length === 0) {
        console.log('retrieveFromPineconeMemoryFlow: No matches found in Pinecone.');
        return { retrievedMemories: [], warning: `Nie znalazłam bezpośrednio pasujących wpisów w mojej głębszej pamięci. ${userFriendlyPineconeWarning}` };
      }

      const retrievedMemories = matches.map(match => ({
        id: match.id,
        score: match.score,
        text: match.metadata?.[PINECONE_TEXT_FIELD] as string | undefined,
      })).filter(memory => memory.text);

      console.log(`retrieveFromPineconeMemoryFlow: Found ${retrievedMemories.length} records.`);
      // If memories are found, still include the userFriendlyPineconeWarning as it pertains to the accuracy/relevance due to mismatch.
      return { retrievedMemories, warning: userFriendlyPineconeWarning };

    } catch (error: any) {
      console.error('retrieveFromPineconeMemoryFlow: Error retrieving memories from Pinecone:', error);
      let userErrorMessage = `Wystąpił błąd podczas próby dostępu do mojej głębszej pamięci.`;
      if (error.message && error.message.toLowerCase().includes('dimension mismatch')) {
         // This specific error might be redundant given the general userFriendlyPineconeWarning, but good for logs.
         userErrorMessage = `Wystąpił techniczny problem z wymiarami w mojej pamięci Pinecone.`;
      } else if (error instanceof TypeError && error.message.toLowerCase().includes('cannot convert undefined or null to object')) {
        userErrorMessage = `Wystąpił techniczny problem podczas przetwarzania Twojego zapytania dla mojej pamięci.`;
      }
      // Always append the general user-friendly warning to any specific error message.
      return { 
        retrievedMemories: [], 
        warning: `${userErrorMessage} ${userFriendlyPineconeWarning}`
      };
    }
  }
);

