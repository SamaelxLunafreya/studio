
'use server';
/**
 * @fileOverview A Genkit flow for generating images based on text prompts using Google AI (Gemini).
 *
 * - generateImage - The main flow function.
 * - GenerateImageInput - Input type for the flow.
 * - GenerateImageOutput - Output type for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateImageInputSchema = z.object({
  prompt: z.string().describe('The text prompt describing the image to generate.'),
});
export type GenerateImageInput = z.infer<typeof GenerateImageInputSchema>;

const GenerateImageOutputSchema = z.object({
  imageDataUri: z.string().optional().describe('The generated image as a data URI (e.g., data:image/png;base64,...).'),
  feedbackText: z.string().optional().describe('Any textual feedback or error message from the generation process.'),
});
export type GenerateImageOutput = z.infer<typeof GenerateImageOutputSchema>;

export async function generateImage(input: GenerateImageInput): Promise<GenerateImageOutput> {
  return generateImageFlow(input);
}

const generateImageFlow = ai.defineFlow(
  {
    name: 'generateImageFlow',
    inputSchema: GenerateImageInputSchema,
    outputSchema: GenerateImageOutputSchema,
  },
  async (input: GenerateImageInput) => {
    try {
      const { media, text } = await ai.generate({
        model: 'googleai/gemini-1.5-flash-latest', // Using Gemini for image generation
        prompt: input.prompt,
        config: {
          responseModalities: ['TEXT', 'IMAGE'], // Required for Gemini image generation
          safetySettings: [
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          ],
        },
      });

      if (media?.url) {
        return { imageDataUri: media.url, feedbackText: text || 'Image generated successfully.' };
      } else {
        return { feedbackText: text || "Image generation did not produce an image." };
      }
    } catch (error: any) {
      console.error('Error in generateImageFlow (Google AI):', error);
      let errorMessage = 'Unknown error during image generation.';
      if (error.message) {
        errorMessage = error.message;
      }
      // Check for specific Google AI error details if available
      if (error.error?.message) {
         errorMessage = error.error.message;
      } else if (error.details) { // Google AI often returns errors in `details`
        errorMessage = error.details;
      }
      return {
        feedbackText: `Image generation failed: ${errorMessage}`,
      };
    }
  }
);
