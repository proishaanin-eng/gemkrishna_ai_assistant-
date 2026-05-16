"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, ExternalLink, ShieldCheck } from "lucide-react";
import { LoadingButton } from "@/components/LoadingButton";
import type { ProductPreviewData, ShopifyProductDraft } from "@/types/product";

export function ProductPreview() {
  const [preview, setPreview] = useState<ProductPreviewData | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<ShopifyProductDraft | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("gemkrishna-product-preview");
    if (saved) {
      setPreview(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    if (preview) {
      localStorage.setItem("gemkrishna-product-preview", JSON.stringify(preview));
    }
  }, [preview]);

  const tags = useMemo(() => preview?.generated.productTags.join(", ") || "", [preview]);

  if (!preview) {
    return (
      <div className="card p-8 text-center">
        <h1 className="text-xl font-semibold text-ink">No preview found</h1>
        <p className="mt-2 text-sm text-stone-600">Generate product details first, then return here for final review.</p>
        <Link className="mt-6 inline-flex rounded-xl bg-gold px-5 py-3 text-sm font-semibold text-ink" href="/products/new">
          Create Product
        </Link>
      </div>
    );
  }

  function updateGenerated(key: keyof ProductPreviewData["generated"], value: string | string[]) {
    setPreview((current) => (current ? { ...current, generated: { ...current.generated, [key]: value } } : current));
  }

  async function createDraft() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/shopify/create-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preview)
      });
      const body = await response.json();

      if (!response.ok) {
        throw new Error(body.error || "Shopify upload failed.");
      }

      const draft = body.product as ShopifyProductDraft;
      setSuccess(draft);
      const history = JSON.parse(localStorage.getItem("gemkrishna-product-history") || "[]") as ShopifyProductDraft[];
      localStorage.setItem("gemkrishna-product-history", JSON.stringify([draft, ...history].slice(0, 20)));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Shopify upload failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="card p-5 sm:p-8">
        <div className="flex flex-col gap-2 border-b border-stone-200 pb-6">
          <h1 className="text-2xl font-semibold text-ink">Preview and Edit</h1>
          <p className="text-sm text-stone-600">Review every field before creating a draft product in Shopify.</p>
        </div>

        {error ? <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
        {success ? (
          <div className="mt-6 rounded-xl border border-green-200 bg-green-50 px-4 py-4 text-sm text-green-800">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5" />
              <div>
                <p className="font-semibold">Product draft created successfully in Shopify. Please review it before publishing.</p>
                <a className="mt-2 inline-flex items-center gap-2 font-semibold underline" href={success.adminUrl} target="_blank" rel="noreferrer">
                  Open Shopify product <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        ) : null}

        <div className="mt-6 grid gap-5">
          <Editor label="Product title" value={preview.generated.optimizedTitle} onChange={(value) => updateGenerated("optimizedTitle", value)} />
          <Editor label="SEO title" value={preview.generated.metaTitle} onChange={(value) => updateGenerated("metaTitle", value)} />
          <Editor label="SEO description" value={preview.generated.metaDescription} rows={3} onChange={(value) => updateGenerated("metaDescription", value)} />
          <Editor label="URL handle" value={preview.generated.handle} onChange={(value) => updateGenerated("handle", value)} />
          <Editor label="Short product summary" value={preview.generated.shortSummary} rows={4} onChange={(value) => updateGenerated("shortSummary", value)} />
          <Editor label="Long SEO product description" value={preview.generated.longDescription} rows={9} onChange={(value) => updateGenerated("longDescription", value)} />
          <Editor label="Gemstone meaning" value={preview.generated.gemstoneMeaning} rows={4} onChange={(value) => updateGenerated("gemstoneMeaning", value)} />
          <Editor label="Belief-based benefits" value={preview.generated.beliefBasedBenefits.join("\n")} rows={5} onChange={(value) => updateGenerated("beliefBasedBenefits", value.split("\n").filter(Boolean))} />
          <Editor label="Chakra connection" value={preview.generated.chakraConnection} rows={3} onChange={(value) => updateGenerated("chakraConnection", value)} />
          <Editor label="How to use" value={preview.generated.howToUse} rows={4} onChange={(value) => updateGenerated("howToUse", value)} />
          <Editor label="Care instructions" value={preview.generated.careInstructions} rows={4} onChange={(value) => updateGenerated("careInstructions", value)} />
          <Editor label="Authenticity/lab certification note" value={preview.generated.authenticityNote} rows={4} onChange={(value) => updateGenerated("authenticityNote", value)} />
          <Editor label="Product tags" value={tags} rows={3} onChange={(value) => updateGenerated("productTags", value.split(",").map((item) => item.trim()).filter(Boolean))} />
          <Editor label="Image alt text" value={preview.generated.imageAltText.join("\n")} rows={4} onChange={(value) => updateGenerated("imageAltText", value.split("\n").filter(Boolean))} />
        </div>
      </section>

      <aside className="space-y-6">
        <section className="card p-5">
          <h2 className="text-lg font-semibold text-ink">Shopify Details</h2>
          <dl className="mt-4 grid gap-3 text-sm">
            <Row label="Price" value={preview.form.price} />
            <Row label="Compare-at" value={preview.form.compareAtPrice || "-"} />
            <Row label="SKU" value={preview.form.sku || "Not added"} />
            <Row label="Stock" value={preview.form.stockQuantity || "0"} />
            <Row label="Type" value={preview.form.productType || "-"} />
          </dl>
        </section>

        <section className="card p-5">
          <h2 className="text-lg font-semibold text-ink">Images</h2>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {preview.form.imageUrls
              .split(/\r?\n|,/)
              .map((url) => url.trim())
              .filter(Boolean)
              .map((url, index) => (
                <figure key={url} className="overflow-hidden rounded-xl border border-stone-200 bg-white">
                  <img src={url} alt={preview.generated.imageAltText[index] || preview.generated.optimizedTitle} className="h-36 w-full object-cover" />
                  <figcaption className="p-2 text-xs text-stone-600">{preview.generated.imageAltText[index] || "Public image URL"}</figcaption>
                </figure>
              ))}
            {preview.form.images.length ? (
              preview.form.images.map((image, index) => (
                <figure key={image.id} className="overflow-hidden rounded-xl border border-stone-200 bg-white">
                  <img src={image.dataUrl} alt={preview.generated.imageAltText[index] || image.name} className="h-36 w-full object-cover" />
                  <figcaption className="p-2 text-xs text-stone-600">{preview.generated.imageAltText[index] || "Alt text will be sent if available."}</figcaption>
                </figure>
              ))
            ) : !preview.form.imageUrls.trim() ? (
              <p className="col-span-2 text-sm text-stone-600">No images uploaded yet.</p>
            ) : null}
          </div>
        </section>

        <section className="card p-5">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-1 h-5 w-5 text-gold" />
            <div>
              <h2 className="text-lg font-semibold text-ink">Final Confirmation</h2>
              <p className="mt-2 text-sm text-stone-600">This will create a Shopify product as DRAFT only. It will not be published.</p>
            </div>
          </div>
          <label className="mt-5 flex items-start gap-3 rounded-xl border border-stone-200 bg-stone/60 p-4 text-sm text-stone-700">
            <input className="mt-1" type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />
            I have reviewed the preview and want to create a draft in Shopify.
          </label>
          <LoadingButton loading={loading} disabled={!confirmed || Boolean(success)} onClick={createDraft} className="mt-5 w-full">
            Create Draft in Shopify
          </LoadingButton>
        </section>
      </aside>
    </div>
  );
}

function Editor({ label, value, onChange, rows = 1 }: { label: string; value: string; onChange: (value: string) => void; rows?: number }) {
  return (
    <label>
      <span className="field-label">{label}</span>
      {rows === 1 ? (
        <input className="field-input" value={value} onChange={(event) => onChange(event.target.value)} />
      ) : (
        <textarea className="field-input" rows={rows} value={value} onChange={(event) => onChange(event.target.value)} />
      )}
    </label>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-stone-100 pb-2">
      <dt className="text-stone-500">{label}</dt>
      <dd className="text-right font-medium text-ink">{value}</dd>
    </div>
  );
}
