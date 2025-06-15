import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
// import {openai} from '@genkit-ai/openai'; // Temporarily commented out due to install issues

export const ai = genkit({
  plugins: [
    googleAI(),
    // openai(), // Temporarily commented out
  ],
  // No global model default, models specified per-prompt.
});
