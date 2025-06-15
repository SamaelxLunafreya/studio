import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
// OpenAI plugin import removed as the package @genkit-ai/openai is currently unavailable.
// import {openai} from '@genkit-ai/openai';

// Ensure OPENAI_API_KEY is set in your .env file if you plan to re-enable OpenAI models.
if (!process.env.OPENAI_API_KEY) {
  console.warn(
    `
    !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    !! WARNING: OPENAI_API_KEY environment variable is not set.                        !!
    !! OpenAI-based AI capabilities will NOT function without this key.                !!
    !! If you intend to use OpenAI, please add OPENAI_API_KEY=<your_api_key>           !!
    !! to your .env file and restart.                                                !!
    !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    `
  );
}

export const ai = genkit({
  plugins: [
    googleAI(), // Using Google AI plugin
    // openai(), // OpenAI plugin removed due to installation issues with @genkit-ai/openai
  ],
  // Default model changed to gemini-pro due to 'gemini-1.5-flash-latest' not being found.
  // Flows that need a specific model (like image generation) must specify it explicitly.
  model: 'gemini-pro', // Defaulting to a generally available Google AI model
  // logLevel: 'debug', // Uncomment for verbose Genkit logging
});
