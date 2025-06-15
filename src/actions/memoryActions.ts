'use server';

import { memoryModuleUpload, type MemoryModuleUploadInput, type MemoryModuleUploadOutput } from '@/ai/flows/memory-module-upload';

export async function uploadToMemoryAction(input: MemoryModuleUploadInput): Promise<MemoryModuleUploadOutput | { error: string }> {
  try {
    // Basic validation
    if (!input.text && !input.pdfDataUri) {
      return { error: 'Either text or a PDF file must be provided.' };
    }
    if (input.pdfDataUri && !input.pdfDataUri.startsWith('data:application/pdf;base64,')) {
        return { error: 'Invalid PDF data URI format. Ensure it is application/pdf and base64 encoded.' };
    }

    const result = await memoryModuleUpload(input);
    return result;
  } catch (error) {
    console.error('Error in uploadToMemoryAction:', error);
    // Check if error is an instance of Error to access message property safely
    const message = error instanceof Error ? error.message : 'An unknown error occurred during memory upload.';
    return { error: `Memory upload failed: ${message}` };
  }
}
