import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { generateProductDetails } from "@/lib/openai";
import { productFormSchema } from "@/lib/validators";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const product = productFormSchema.parse(body);
    const generated = await generateProductDetails(product);

    return NextResponse.json({ product: generated });
  } catch (error) {
    const message = error instanceof ZodError ? error.issues[0]?.message || "Product details are invalid." : error instanceof Error ? error.message : "AI generation failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
