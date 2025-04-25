// src/ai/flows/product-information-assistant.ts
'use server';
/**
 * @fileOverview An AI assistant that answers customer questions about products.
 *
 * - getProductInformation - A function that handles the product information retrieval process.
 * - ProductInformationInput - The input type for the getProductInformation function.
 * - ProductInformationOutput - The return type for the getProductInformation function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const ProductInformationInputSchema = z.object({
  productName: z.string().describe('The name of the product.'),
  question: z.string().describe('The question about the product.'),
});
export type ProductInformationInput = z.infer<typeof ProductInformationInputSchema>;

const ProductInformationOutputSchema = z.object({
  answer: z.string().describe('The answer to the question about the product.'),
});
export type ProductInformationOutput = z.infer<typeof ProductInformationOutputSchema>;

export async function getProductInformation(input: ProductInformationInput): Promise<ProductInformationOutput> {
  return productInformationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'productInformationPrompt',
  input: {
    schema: z.object({
      productName: z.string().describe('The name of the product.'),
      question: z.string().describe('The question about the product.'),
    }),
  },
  output: {
    schema: z.object({
      answer: z.string().describe('The answer to the question about the product.'),
    }),
  },
  prompt: `You are a helpful AI assistant providing information about products.

  You will answer questions about the product based on the product name and the question.

  Product Name: {{{productName}}}
  Question: {{{question}}}
  Answer: `,
});

const productInformationFlow = ai.defineFlow<
  typeof ProductInformationInputSchema,
  typeof ProductInformationOutputSchema
>({
  name: 'productInformationFlow',
  inputSchema: ProductInformationInputSchema,
  outputSchema: ProductInformationOutputSchema,
}, async input => {
  const {output} = await prompt(input);
  return output!;
});
