import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import type { ProductFormData } from "@/types/product";
import { generatedProductSchema } from "@/lib/validators";
import { buildProductPrompt } from "@/lib/productPrompt";

// The OpenAI API key is read only on the server. Never put it in a browser component.
export function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is missing. Add it to .env.local.");
  }

  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export async function generateProductDetails(product: ProductFormData) {
  const openai = getOpenAIClient();

  const response = await openai.responses.parse({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    input: [
      {
        role: "system",
        content:
          "You are a careful e-commerce SEO copywriter for natural gemstone products. Follow every safety and brand rule exactly."
      },
      { role: "user", content: buildProductPrompt(product) }
    ],
    text: {
      format: zodTextFormat(generatedProductSchema, "gemkrishna_product_details")
    }
  });

  const parsed = response.output_parsed;
  if (!parsed) {
    throw new Error("OpenAI did not return product details.");
  }

  return parsed;
}
