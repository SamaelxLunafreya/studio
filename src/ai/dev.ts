
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
import '@/ai/flows/generate-image-flow.ts';
import '@/ai/flows/translate-text-flow.ts';
import '@/ai/flows/get-autonomous-update-flow.ts'; // Register new autonomous update flow
import '@/ai/tools/google-drive-tool.ts';
import '@/ai/tools/github-tool.ts'; // Register new GitHub tool

