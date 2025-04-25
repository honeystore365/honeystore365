// src/ai/flows/order-assistance-chatbot.ts
'use server';
/**
 * @fileOverview An AI chatbot to assist customers with order-related questions.
 *
 * - orderAssistanceChatbot - A function that processes customer questions about orders.
 * - OrderAssistanceChatbotInput - The input type for the orderAssistanceChatbot function.
 * - OrderAssistanceChatbotOutput - The return type for the orderAssistanceChatbot function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const OrderAssistanceChatbotInputSchema = z.object({
  question: z.string().describe('The customer question about the order.'),
});
export type OrderAssistanceChatbotInput = z.infer<typeof OrderAssistanceChatbotInputSchema>;

const OrderAssistanceChatbotOutputSchema = z.object({
  answer: z.string().describe('The answer to the customer question.'),
});
export type OrderAssistanceChatbotOutput = z.infer<typeof OrderAssistanceChatbotOutputSchema>;

export async function orderAssistanceChatbot(input: OrderAssistanceChatbotInput): Promise<OrderAssistanceChatbotOutput> {
  return orderAssistanceChatbotFlow(input);
}

const orderAssistanceChatbotPrompt = ai.definePrompt({
  name: 'orderAssistanceChatbotPrompt',
  input: {
    schema: z.object({
      question: z.string().describe('The customer question about the order, regarding payment options, shipping costs, or delivery times.'),
    }),
  },
  output: {
    schema: z.object({
      answer: z.string().describe('A helpful and informative answer to the customer question.'),
    }),
  },
  prompt: `You are a customer service chatbot for an online honey store. Your goal is to answer customer questions about the ordering process.

  Consider the following information about the store:
  - We ship to France, Belgium and Luxembourg.
  - Shipping costs 5€ for any order below 60€, and is free above that.
  - Delivery times are usually 2-3 business days. During peak seasons, it may be longer
  - We accept credit card, debit card and Paypal payments.

  Question: {{{question}}}
  Answer: `,
});

const orderAssistanceChatbotFlow = ai.defineFlow<
  typeof OrderAssistanceChatbotInputSchema,
  typeof OrderAssistanceChatbotOutputSchema
>({
  name: 'orderAssistanceChatbotFlow',
  inputSchema: OrderAssistanceChatbotInputSchema,
  outputSchema: OrderAssistanceChatbotOutputSchema,
}, async input => {
  const {output} = await orderAssistanceChatbotPrompt(input);
  return output!;
});
