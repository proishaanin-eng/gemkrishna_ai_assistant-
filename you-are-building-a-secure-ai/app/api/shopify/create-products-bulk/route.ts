import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { createShopifyDraft } from "@/lib/shopify";
import { bulkCreateSchema } from "@/lib/validators";
import type { ShopifyProductDraft } from "@/types/product";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { products } = bulkCreateSchema.parse(body);

    const results: Array<{ rowId: string; ok: true; product: ShopifyProductDraft } | { rowId: string; ok: false; error: string }> = [];
    for (const item of products) {
      try {
        const draft = await createShopifyDraft({ form: item.form, generated: item.generated });
        results.push({ rowId: item.rowId, ok: true, product: draft });
      } catch (error) {
        results.push({
          rowId: item.rowId,
          ok: false,
          error: error instanceof Error ? error.message : "Shopify draft creation failed."
        });
      }
    }

    return NextResponse.json({ results });
  } catch (error) {
    const message = error instanceof ZodError ? error.issues[0]?.message || "Bulk preview details are invalid." : error instanceof Error ? error.message : "Bulk Shopify upload failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
