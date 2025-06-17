
'use server';

import { memoryModuleUpload, type MemoryModuleUploadInput, type MemoryModuleUploadOutput } from '@/ai/flows/memory-module-upload';
import { saveToPineconeMemory, type SaveToPineconeMemoryInput, type SaveToPineconeMemoryOutput } from '@/ai/flows/save-to-pinecone-memory-flow'; // Added import

// This action uses a simulated flow for general memory upload acknowledgement (especially for PDFs currently)
export async function uploadToMemoryAction(input: MemoryModuleUploadInput): Promise<MemoryModuleUploadOutput | { error: string }> {
  try {
    // Basic validation for the simulated flow
    if (!input.text && !input.pdfDataUri) {
      return { error: 'Either text or a PDF file must be provided for the simulated upload.' };
    }
    if (input.pdfDataUri && !input.pdfDataUri.startsWith('data:application/pdf;base64,')) {
        return { error: 'Invalid PDF data URI format for simulated upload. Ensure it is application/pdf and base64 encoded.' };
    }

    const result = await memoryModuleUpload(input);
    return result;
  } catch (error) {
    console.error('Error in uploadToMemoryAction (simulated):', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred during simulated memory upload.';
    return { error: `Simulated memory upload failed: ${message}` };
  }
}

// New action to save text specifically to Pinecone real memory
export async function saveTextToPineconeAction(input: SaveToPineconeMemoryInput): Promise<SaveToPineconeMemoryOutput | { error: string }> {
  try {
    if (!input.textToSave || !input.textToSave.trim()) {
      return { error: 'Text to save cannot be empty.' };
    }
    const result = await saveToPineconeMemory(input);
    return result;
  } catch (error) {
    console.error('Error in saveTextToPineconeAction:', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred during Pinecone memory save.';
    return { error: `Failed to save to Pinecone: ${message}` };
  }
}
