
// Environment variables for Genkit dev server are expected to be set
// in the environment or via Next.js's .env loading when flows are called from the app.

import '@/ai/flows/collaborate-with-ai.ts';
import '@/ai/flows/enhance-english-text.ts';
import '@/ai/flows/memory-module-upload.ts';
import '@/ai/flows/suggest-relevant-actions.ts';
import '@/ai/flows/initial-prompt-setup.ts';
import '@/ai/flows/generate-code-snippets.ts';
import '@/ai/flows/ai-assisted-web-search.ts';
import '@/ai/flows/collaborative-workspace-flow.ts';
import '@/ai/flows/generate-image-flow.ts';
import '@/ai/flows/translate-text-flow.ts';
import '@/ai/flows/get-autonomous-update-flow.ts'; 
import '@/ai/flows/generate-casual-greeting-flow.ts';
import '@/ai/flows/save-to-pinecone-memory-flow.ts';
import '@/ai/flows/retrieve-from-pinecone-memory-flow.ts'; // Added new flow
import '@/ai/tools/google-drive-tool.ts';
import '@/ai/tools/github-tool.ts';

