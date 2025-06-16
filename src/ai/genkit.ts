import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {openai} from '@genkit-ai/openai';

export const ai = genkit({
  plugins: [
    googleAI(),
    openai(),
  ],
  // No global model default, models specified per-prompt.
});
