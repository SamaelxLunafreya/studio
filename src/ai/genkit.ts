import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
// OpenAI plugin import removed as the package @genkit-ai/openai is currently unavailable.
// import {openai} from '@genkit-ai/openai';

// The explicit check for OPENAI_API_KEY and the console.warn block have been removed
// as the OpenAI plugin is not currently active.

export const ai = genkit({
  plugins: [
    googleAI(), // Using Google AI plugin
    // openai(), // OpenAI plugin removed due to installation issues with @genkit-ai/openai
  ],
  // Removed global model definition to rely on per-prompt model specification.
  // Flows that need a specific model (like image generation) must specify it explicitly.
  // logLevel: 'debug', // Uncomment for verbose Genkit logging
});
