
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
    const dimensionalWarningForUI = "Informacja o pamięci: Występuje techniczne niedopasowanie w systemie pamięci (osadzenia zapytań: 768-wym., indeks pamięci: 1024-wym.). Może to wpływać na dokładność wyszukiwania. Poprawa tego mechanizmu jest planowana na przyszłość.";
    const technicalDimensionalWarning = "Pinecone Embedding Mismatch: Query embedding model (likely 768-dim from ai.embed default) currently MISMATCHES Pinecone index (1024-dim 'multilingual-e5-large'). This WILL lead to Pinecone errors or poor/irrelevant search results. Query embedding strategy requires alignment with the index for this feature to work correctly.";
    
    console.warn(technicalDimensionalWarning); // Keep detailed technical warning in logs

    try {
      // 1. Embed the query text
      console.log(`retrieveFromPineconeMemoryFlow: Embedding query: "${input.queryText}" (topK: ${input.topK})`);
      
      const embeddingResult = await ai.embed({ text: input.queryText });

      if (!embeddingResult || typeof embeddingResult.embedding === 'undefined' || !Array.isArray(embeddingResult.embedding) || embeddingResult.embedding.length === 0) {
        console.error('retrieveFromPineconeMemoryFlow: Failed to generate a valid embedding for the query text. Embedding result:', embeddingResult);
        return { 
          retrievedMemories: [], 
          warning: `Nie udało się wygenerować osadzenia dla zapytania tekstowego. Usługa osadzania może być niedostępna lub zapytanie nie mogło zostać przetworzone. Szczegóły techniczne: ${JSON.stringify(embeddingResult)}. ${dimensionalWarningForUI}` 
        };
      }
      
      const queryEmbedding = embeddingResult.embedding;
      
      console.log('retrieveFromPineconeMemoryFlow: Querying Pinecone with an embedding of dimension:', queryEmbedding.length);
      const matches = await queryByVector(queryEmbedding, input.topK);

      if (!matches || matches.length === 0) {
        console.log('retrieveFromPineconeMemoryFlow: No matches found in Pinecone.');
        return { retrievedMemories: [], warning: `Nie znaleziono pasujących wpisów w pamięci. ${dimensionalWarningForUI}` };
      }

      const retrievedMemories = matches.map(match => ({
        id: match.id,
        score: match.score,
        text: match.metadata?.[PINECONE_TEXT_FIELD] as string | undefined,
      })).filter(memory => memory.text);

      console.log(`retrieveFromPineconeMemoryFlow: Found ${retrievedMemories.length} records.`);
      return { retrievedMemories, warning: retrievedMemories.length > 0 ? dimensionalWarningForUI : `Nie znaleziono relewantnych tekstów w pamięci. ${dimensionalWarningForUI}` };

    } catch (error: any) {
      console.error('retrieveFromPineconeMemoryFlow: Error retrieving memories from Pinecone:', error);
      let userErrorMessage = `Wystąpił błąd podczas pobierania wspomnień z pamięci. ${dimensionalWarningForUI}`;
      if (error.message && error.message.toLowerCase().includes('dimension mismatch')) {
         userErrorMessage = `Błąd techniczny w Pinecone: Niezgodność wymiarów wektorów. ${dimensionalWarningForUI}`;
      } else if (error instanceof TypeError && error.message.toLowerCase().includes('cannot convert undefined or null to object')) {
        userErrorMessage = `Błąd techniczny podczas osadzania lub przetwarzania zapytania. ${dimensionalWarningForUI}`;
      }
      return { 
        retrievedMemories: [], 
        warning: userErrorMessage
      };
    }
  }
);
