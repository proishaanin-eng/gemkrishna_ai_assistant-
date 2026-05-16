import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { generateProductDetails } from "@/lib/openai";
import { bulkGenerateSchema } from "@/lib/validators";
import type { BulkProductPreview } from "@/types/product";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { products } = bulkGenerateSchema.parse(body);

    // Batch generation still uses the same careful prompt for every item.
    // Keep this sequential when quality matters more than raw speed.
    const generated: BulkProductPreview[] = [];
    for (const product of products) {
      const details = await generateProductDetails(product);
      generated.push({
        rowId: product.rowId,
        selected: true,
        status: "ready",
        form: product,
        generated: details
      });
    }

    return NextResponse.json({ products: generated });
  } catch (error) {
    const message = error instanceof ZodError ? error.issues[0]?.message || "Bulk product details are invalid." : error instanceof Error ? error.message : "Bulk AI generation failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
