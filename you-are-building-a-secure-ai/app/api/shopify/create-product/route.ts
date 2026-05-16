import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { createShopifyDraft } from "@/lib/shopify";
import { productPreviewSchema } from "@/lib/validators";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const preview = productPreviewSchema.parse(body);

    // Shopify upload happens here on the server so the Admin API token is never exposed to the browser.
    const product = await createShopifyDraft(preview);

    return NextResponse.json({ product });
  } catch (error) {
    const message =
      error instanceof ZodError ? error.issues[0]?.message || "Preview details are invalid." : error instanceof Error ? error.message : "Shopify product creation failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
