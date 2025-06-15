
'use server';

import { generateImage, type GenerateImageInput, type GenerateImageOutput } from '@/ai/flows/generate-image-flow';

export async function generateImageAction(input: GenerateImageInput): Promise<GenerateImageOutput | { error: string }> {
  try {
    if (!input.prompt || !input.prompt.trim()) {
      return { error: 'Image prompt cannot be empty.' };
    }
    const result = await generateImage(input);
    if (result.imageDataUri) {
      return result;
    } else {
      return { error: result.feedbackText || 'Failed to generate image. No image data received.' };
    }
  } catch (error) {
    console.error('Error in generateImageAction:', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred during image generation.';
    return { error: `Image generation failed: ${message}` };
  }
}
