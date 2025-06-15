import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
// import {openai} from '@genkit-ai/openai'; // OpenAI plugin import remains commented

export const ai = genkit({
  plugins: [
    googleAI()
    // If openai() were active, the line above would need a comma, and openai() would follow.
    // e.g.:
    // googleAI(),
    // openai()
  ] // No trailing comma here as 'plugins' is the only active property
  // No global model default, models specified per-prompt.
});
