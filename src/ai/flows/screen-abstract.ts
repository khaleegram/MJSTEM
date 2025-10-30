'use server';
/**
 * @fileOverview An AI flow for performing a preliminary screening on a manuscript abstract.
 *
 * - screenAbstract - A function that analyzes an abstract for novelty and potential overlap.
 * - ScreenAbstractInput - The input type for the screenAbstract function.
 * - ScreenAbstractOutput - The return type for the screenAbstract function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ScreenAbstractInputSchema = z.object({
  abstract: z.string().describe('The full abstract of the manuscript to be screened.'),
});
export type ScreenAbstractInput = z.infer<typeof ScreenAbstractInputSchema>;

const ScreenAbstractOutputSchema = z.object({
    originalityScore: z.string().describe("An estimated originality score as a percentage string, e.g., '8% Match'. This simulates a plagiarism check score based on potential overlap with existing literature. Lower is better."),
    noveltySummary: z.string().describe("A very brief, one-sentence summary of the manuscript's potential novelty or contribution, based on the abstract.")
});
export type ScreenAbstractOutput = z.infer<typeof ScreenAbstractOutputSchema>;


export async function screenAbstract(input: ScreenAbstractInput): Promise<ScreenAbstractOutput> {
  return screenAbstractFlow(input);
}

const prompt = ai.definePrompt({
  name: 'screenAbstractPrompt',
  input: { schema: ScreenAbstractInputSchema },
  output: { schema: ScreenAbstractOutputSchema },
  prompt: `You are an expert academic editor. Your task is to perform a preliminary screening of a manuscript's abstract.

Analyze the following abstract to:
1.  Estimate an "originality score." This is a simulated plagiarism or overlap score. Based on the language and concepts, estimate a percentage of potential overlap with existing literature. The score should be low for novel ideas and higher for well-trodden topics. Format it as a string like 'X% Match'.
2.  Provide a one-sentence summary of the manuscript's potential novelty.

Abstract:
{{{abstract}}}
`,
});

const screenAbstractFlow = ai.defineFlow(
  {
    name: 'screenAbstractFlow',
    inputSchema: ScreenAbstractInputSchema,
    outputSchema: ScreenAbstractOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
