import { config } from 'dotenv';
config();

import '@/ai/flows/collaborate-with-ai.ts';
import '@/ai/flows/enhance-english-text.ts';
import '@/ai/flows/memory-module-upload.ts';
import '@/ai/flows/suggest-relevant-actions.ts';
import '@/ai/flows/initial-prompt-setup.ts';
import '@/ai/flows/generate-code-snippets.ts';
import '@/ai/flows/ai-assisted-web-search.ts';
import '@/ai/flows/collaborative-workspace-flow.ts';
import '@/ai/tools/google-drive-tool.ts'; // Register the new tool
