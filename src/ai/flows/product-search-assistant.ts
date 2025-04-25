'use server';
/**
 * @fileOverview An AI assistant for product search.
 *
 * - productSearchAssistant - A function that handles the product search process.
 * - ProductSearchAssistantInput - The input type for the productSearchAssistant function.
 * - ProductSearchAssistantOutput - The return type for the productSearchAssistant function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const ProductSearchAssistantInputSchema = z.object({
  query: z.string().describe('The search query from the user describing their needs (e.g., honey for sore throat, gift for honey lovers).'),
});
export type ProductSearchAssistantInput = z.infer<typeof ProductSearchAssistantInputSchema>;

const ProductSearchAssistantOutputSchema = z.object({
  products: z.array(
    z.object({
      name: z.string().describe('The name of the product.'),
      description: z.string().describe('A brief description of the product.'),
      price: z.number().describe('The price of the product.'),
      imageUrl: z.string().describe('URL of the product image.'),
    })
  ).describe('A list of products that match the search query.'),
});
export type ProductSearchAssistantOutput = z.infer<typeof ProductSearchAssistantOutputSchema>;

export async function productSearchAssistant(input: ProductSearchAssistantInput): Promise<ProductSearchAssistantOutput> {
  return productSearchAssistantFlow(input);
}

const prompt = ai.definePrompt({
  name: 'productSearchAssistantPrompt',
  input: {
    schema: z.object({
      query: z.string().describe('The search query from the user describing their needs.'),
    }),
  },
  output: {
    schema: z.object({
      products: z.array(
        z.object({
          name: z.string().describe('The name of the product.'),
          description: z.string().describe('A brief description of the product.'),
          price: z.number().describe('The price of the product.'),
          imageUrl: z.string().describe('URL of the product image.'),
        })
      ).describe('A list of products that match the search query.'),
    }),
  },
  prompt: `You are an AI assistant helping customers find products in an online honey store.
  Based on the customer's query, find the most relevant products.
  Return a list of products with name, description, price and image url.
  
  Customer Query: {{{query}}}
  `,
});

const productSearchAssistantFlow = ai.defineFlow<
  typeof ProductSearchAssistantInputSchema,
  typeof ProductSearchAssistantOutputSchema
>(
  {
    name: 'productSearchAssistantFlow',
    inputSchema: ProductSearchAssistantInputSchema,
    outputSchema: ProductSearchAssistantOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
