
'use server';
/**
 * @fileOverview Simulated Genkit tools for GitHub interactions.
 *
 * - searchGitHubIssuesTool - Simulates searching for issues in a GitHub repository.
 * - getGitHubRepoFileContentTool - Simulates fetching file content from a GitHub repository.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Schema for GitHub Issue Search
const GitHubIssueSearchInputSchema = z.object({
  repoFullName: z.string().describe('The full name of the repository (e.g., "owner/repo").'),
  query: z.string().describe('The search query for issues (e.g., "bug label:high-priority").'),
});

const GitHubIssueSchema = z.object({
  id: z.number().describe('Unique ID of the issue.'),
  number: z.number().describe('Issue number.'),
  title: z.string().describe('Title of the issue.'),
  state: z.enum(['open', 'closed']).describe('State of the issue.'),
  bodySnippet: z.string().optional().describe('A short snippet of the issue body.'),
  url: z.string().url().describe('URL to the issue on GitHub.'),
  assignee: z.string().optional().describe('Username of the assignee.'),
  commentsCount: z.number().describe('Number of comments on the issue.'),
});

const GitHubIssueSearchOutputSchema = z.object({
  issues: z.array(GitHubIssueSchema).describe('A list of issues found matching the query.'),
  searchPerformed: z.boolean().describe('Indicates if a simulated search was performed.'),
  queryUsed: z.string().describe('The query string used for the search.'),
});

export const searchGitHubIssuesTool = ai.defineTool(
  {
    name: 'searchGitHubIssuesTool',
    description: 'Searches for issues in a specified GitHub repository. This is a simulated tool.',
    inputSchema: GitHubIssueSearchInputSchema,
    outputSchema: GitHubIssueSearchOutputSchema,
  },
  async (input) => {
    console.log(`Simulating GitHub issue search in "${input.repoFullName}" for: ${input.query}`);
    await new Promise(resolve => setTimeout(resolve, 600)); // Simulate API latency

    // Mocked search results
    const mockIssues: z.infer<typeof GitHubIssueSchema>[] = [
      {
        id: 12345,
        number: 101,
        title: `Fix: Critical bug in ${input.query} module`,
        state: 'open',
        bodySnippet: `The ${input.query} module crashes when input is X... (Simulated)`,
        url: `https://github.com/${input.repoFullName}/issues/101`,
        assignee: 'mockUserA',
        commentsCount: 5,
      },
      {
        id: 12346,
        number: 102,
        title: `Feature: Implement ${input.query} functionality`,
        state: 'open',
        bodySnippet: `Add new functionality related to ${input.query} as per specs... (Simulated)`,
        url: `https://github.com/${input.repoFullName}/issues/102`,
        commentsCount: 2,
      },
      {
        id: 12347,
        number: 98,
        title: `Refactor: Old ${input.query} component`,
        state: 'closed',
        bodySnippet: `The legacy component for ${input.query} has been refactored... (Simulated)`,
        url: `https://github.com/${input.repoFullName}/issues/98`,
        assignee: 'mockUserB',
        commentsCount: 10,
      },
    ];

    if (input.query.toLowerCase().includes('no results')) {
      return { issues: [], searchPerformed: true, queryUsed: input.query };
    }
    if (input.query.toLowerCase().includes('one result')) {
      return { issues: [mockIssues[0]], searchPerformed: true, queryUsed: input.query };
    }

    return { issues: mockIssues.filter(issue => issue.title.toLowerCase().includes(input.query.toLowerCase()) || issue.bodySnippet?.toLowerCase().includes(input.query.toLowerCase())), searchPerformed: true, queryUsed: input.query };
  }
);


// Schema for GitHub File Content
const GitHubFileContentInputSchema = z.object({
  repoFullName: z.string().describe('The full name of the repository (e.g., "owner/repo").'),
  filePath: z.string().describe('The path to the file within the repository (e.g., "src/utils/helpers.ts").'),
  branchOrSha: z.string().optional().describe('Optional: Specific branch name or commit SHA (defaults to main/master).'),
});

const GitHubFileContentOutputSchema = z.object({
  content: z.string().optional().describe('The content of the file as a string.'),
  filePath: z.string().describe('The path of the fetched file.'),
  repoFullName: z.string().describe('The full name of the repository.'),
  error: z.string().optional().describe('Error message if the file could not be fetched.'),
});

export const getGitHubRepoFileContentTool = ai.defineTool(
  {
    name: 'getGitHubRepoFileContentTool',
    description: 'Fetches the content of a specific file from a GitHub repository. This is a simulated tool.',
    inputSchema: GitHubFileContentInputSchema,
    outputSchema: GitHubFileContentOutputSchema,
  },
  async (input) => {
    console.log(`Simulating fetching file "${input.filePath}" from "${input.repoFullName}" (Branch: ${input.branchOrSha || 'default'})`);
    await new Promise(resolve => setTimeout(resolve, 700)); // Simulate API latency

    if (input.filePath.toLowerCase().includes('nonexistent')) {
      return { 
        filePath: input.filePath, 
        repoFullName: input.repoFullName, 
        error: 'File not found (Simulated).' 
      };
    }

    const mockContent = `// Simulated content for ${input.filePath} from ${input.repoFullName}\n\n` +
                        `export function mockFunction() {\n` +
                        `  console.log("This is a mock function from ${input.filePath}");\n` +
                        `}\n\n` +
                        `// Last updated: ${new Date().toISOString()}`;
    
    return { 
      content: mockContent, 
      filePath: input.filePath, 
      repoFullName: input.repoFullName 
    };
  }
);
