import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
// import {openai} from '@genkit-ai/openai'; // Temporarily commented out

export const ai = genkit({
  plugins: [
    googleAI(),
    // openai(), // Temporarily commented out due to installation issues
  ],
  // No global model default, models specified per-prompt.
  // logLevel: 'debug',
});
