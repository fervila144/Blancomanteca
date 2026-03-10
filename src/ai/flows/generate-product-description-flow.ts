'use server';
/**
 * @fileOverview Un asistente de IA para que los administradores generen textos descriptivos y creativos para productos.
 *
 * - generateProductDescription - Una función que maneja el proceso de generación de descripciones de productos.
 * - GenerateProductDescriptionInput - El tipo de entrada para la función generateProductDescription.
 * - GenerateProductDescriptionOutput - El tipo de salida para la función generateProductDescription.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateProductDescriptionInputSchema = z.object({
  productName: z.string().describe('El nombre del producto.'),
  keywords: z.array(z.string()).describe('Una lista de palabras clave relacionadas con el producto.'),
  briefDescription: z
    .string()
    .describe('Una breve descripción fáctica del producto.'),
});
export type GenerateProductDescriptionInput = z.infer<typeof GenerateProductDescriptionInputSchema>;

const GenerateProductDescriptionOutputSchema = z.object({
  generatedDescription: z
    .string()
    .describe('El texto descriptivo y creativo generado por la IA en español.'),
});
export type GenerateProductDescriptionOutput = z.infer<typeof GenerateProductDescriptionOutputSchema>;

export async function generateProductDescription(
  input: GenerateProductDescriptionInput
): Promise<GenerateProductDescriptionOutput> {
  return generateProductDescriptionFlow(input);
}

const productDescriptionPrompt = ai.definePrompt({
  name: 'productDescriptionPrompt',
  input: {schema: GenerateProductDescriptionInputSchema},
  output: {schema: GenerateProductDescriptionOutputSchema},
  prompt: `Eres un redactor experto (copywriter) para una tienda de comercio electrónico llamada BlancoManteca. Tu tarea es generar un texto de producto creativo, atractivo y descriptivo para el producto mencionado abajo. El tono debe ser cálido, acogedor y premium, alineado con la estética sofisticada de BlancoManteca.

IMPORTANTE: El texto generado debe estar enteramente en ESPAÑOL.

Nombre del Producto: {{{productName}}}
Palabras clave: {{{keywords}}}
Descripción breve: {{{briefDescription}}}

Escribe una descripción convincente que destaque sus puntos de venta únicos, los beneficios para el cliente y evoque una sensación de calidad y deseabilidad. Asegúrate de que la descripción tenga al menos 3-5 frases de longitud.`,
});

const generateProductDescriptionFlow = ai.defineFlow(
  {
    name: 'generateProductDescriptionFlow',
    inputSchema: GenerateProductDescriptionInputSchema,
    outputSchema: GenerateProductDescriptionOutputSchema,
  },
  async input => {
    const {output} = await productDescriptionPrompt(input);
    return output!;
  }
);
