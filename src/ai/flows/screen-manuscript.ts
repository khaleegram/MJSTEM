
'use server';
/**
 * @fileOverview An AI flow for screening new manuscript submissions.
 *
 * - screenManuscript - A function that suggests reviewers and provides a recommendation.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const ReviewerSchema = z.object({
    id: z.string(),
    name: z.string(),
    specialization: z.string().optional(),
});

const ScreenManuscriptInputSchema = z.object({
  abstract: z.string().min(50, 'Abstract must be at least 50 characters long.'),
  keywords: z.string().optional(),
  reviewers: z.array(ReviewerSchema).describe('A list of available reviewers.'),
});
export type ScreenManuscriptInput = z.infer<typeof ScreenManuscriptInputSchema>;

const ScreenManuscriptOutputSchema = z.object({
    suggestedReviewers: z.array(z.object({
        id: z.string().describe("The ID of the suggested reviewer."),
        name: z.string().describe("The name of the suggested reviewer."),
        reason: z.string().describe("A brief explanation for why this reviewer is a good match."),
    })).describe('A list of 2-3 suggested reviewers from the provided list.'),
    recommendation: z.string().describe("A brief recommendation (2-3 sentences) on whether the manuscript is a good fit for the journal, based on its abstract and keywords."),
});
export type ScreenManuscriptOutput = z.infer<typeof ScreenManuscriptOutputSchema>;


export async function screenManuscript(input: ScreenManuscriptInput): Promise<ScreenManuscriptOutput> {
  return screenManuscriptFlow(input);
}

const prompt = ai.definePrompt({
  name: 'screenManuscriptPrompt',
  input: { schema: ScreenManuscriptInputSchema },
  output: { schema: ScreenManuscriptOutputSchema },
  prompt: `You are an expert editor-in-chief for a multidisciplinary academic journal. Your task is to perform an initial screening of a new manuscript submission.

You will be given the manuscript's abstract, its keywords, and a list of available reviewers with their specializations.

Your tasks are:
1.  Analyze the abstract and keywords to understand the manuscript's topic and scope.
2.  From the provided list of reviewers, identify the 2-3 most suitable candidates to peer-review this manuscript. Your suggestions should be based on the alignment of their specialization with the manuscript's topic. For each suggestion, provide a brief reason for your choice.
3.  Write a concise recommendation (2-3 sentences) for the handling editor on whether the paper seems like a good fit for the journal. Base this on the abstract and whether the topic is of broad interest.

Available Reviewers:
{{#each reviewers}}
- ID: {{id}}, Name: {{name}}, Specialization: {{specialization}}
{{/each}}

Manuscript Abstract:
{{{abstract}}}

Manuscript Keywords:
{{{keywords}}}`,
});

const screenManuscriptFlow = ai.defineFlow(
  {
    name: 'screenManuscriptFlow',
    inputSchema: ScreenManuscriptInputSchema,
    outputSchema: ScreenManuscriptOutputSchema,
  },
  async (input) => {
    // Handle case where no reviewers are available.
    if (!input.reviewers || input.reviewers.length === 0) {
        return {
            suggestedReviewers: [],
            recommendation: "Cannot suggest reviewers as none are available in the system. The manuscript seems to be a good fit otherwise."
        };
    }
    const { output } = await prompt(input);
    return output!;
  }
);
