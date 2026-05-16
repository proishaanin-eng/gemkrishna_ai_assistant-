"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { ImageUploader } from "@/components/ImageUploader";
import { LoadingButton } from "@/components/LoadingButton";
import type { ProductFormData, ProductPreviewData } from "@/types/product";

const emptyProduct: ProductFormData = {
  productName: "",
  gemstoneName: "",
  productType: "",
  beadShape: "",
  beadSize: "",
  productSize: "",
  price: "",
  compareAtPrice: "",
  stockQuantity: "0",
  sku: "",
  collectionName: "",
  tags: "",
  labCertified: false,
  shortProductNotes: "",
  imageStyleNotes: "",
  imageUrls: "",
  images: []
};

export function ProductForm() {
  const [form, setForm] = useState<ProductFormData>(emptyProduct);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  function updateField<Key extends keyof ProductFormData>(key: Key, value: ProductFormData[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function generateDetails() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/ai/generate-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const body = await response.json();

      if (!response.ok) {
        throw new Error(body.error || "AI generation failed.");
      }

      const preview: ProductPreviewData = { form, generated: body.product };
      localStorage.setItem("gemkrishna-product-preview", JSON.stringify(preview));
      router.push("/products/preview");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "AI generation failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card p-5 sm:p-8">
      <div className="flex flex-col gap-2 border-b border-stone-200 pb-6">
        <h1 className="text-2xl font-semibold text-ink">Create Product Draft</h1>
        <p className="text-sm text-stone-600">Enter the basic product details. You can edit all AI-generated content before Shopify upload.</p>
      </div>

      {error ? <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

      {/* Store owners can add or remove product input fields in this section. */}
      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <TextField label="Product name" value={form.productName} required onChange={(value) => updateField("productName", value)} />
        <TextField label="Gemstone name" value={form.gemstoneName} onChange={(value) => updateField("gemstoneName", value)} />
        <TextField label="Product type" value={form.productType} placeholder="Bracelet, mala, palm stone" onChange={(value) => updateField("productType", value)} />
        <TextField label="Bead shape" value={form.beadShape} placeholder="Round, oval, chips" onChange={(value) => updateField("beadShape", value)} />
        <TextField label="Bead size" value={form.beadSize} placeholder="8 mm" onChange={(value) => updateField("beadSize", value)} />
        <TextField label="Product size" value={form.productSize} placeholder="7 inches, 108 beads" onChange={(value) => updateField("productSize", value)} />
        <TextField label="Price" value={form.price} required inputMode="decimal" onChange={(value) => updateField("price", value)} />
        <TextField label="Compare-at price" value={form.compareAtPrice} inputMode="decimal" onChange={(value) => updateField("compareAtPrice", value)} />
        <TextField label="Stock quantity" value={form.stockQuantity} inputMode="numeric" onChange={(value) => updateField("stockQuantity", value)} />
        <TextField label="SKU" value={form.sku} placeholder="Optional but recommended" onChange={(value) => updateField("sku", value)} />
        <TextField label="Collection name" value={form.collectionName} onChange={(value) => updateField("collectionName", value)} />
        <TextField label="Tags" value={form.tags} placeholder="Comma separated" onChange={(value) => updateField("tags", value)} />
      </div>

      <div className="mt-5 flex items-center justify-between rounded-xl border border-stone-200 bg-white px-4 py-3">
        <span className="text-sm font-medium text-stone-700">Lab certified</span>
        <label className="relative inline-flex cursor-pointer items-center">
          <input type="checkbox" checked={form.labCertified} className="peer sr-only" onChange={(event) => updateField("labCertified", event.target.checked)} />
          <span className="h-6 w-11 rounded-full bg-stone-200 after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition peer-checked:bg-gold peer-checked:after:translate-x-5" />
        </label>
      </div>

      <div className="mt-5 grid gap-5">
        <TextArea label="Short product notes" value={form.shortProductNotes} onChange={(value) => updateField("shortProductNotes", value)} />
        <TextArea label="Public image URLs" value={form.imageUrls} onChange={(value) => updateField("imageUrls", value)} />
        <TextArea label="Image style notes for AI images later" value={form.imageStyleNotes} onChange={(value) => updateField("imageStyleNotes", value)} />
        <ImageUploader images={form.images} onChange={(images) => updateField("images", images)} />
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end">
        <LoadingButton loading={loading} onClick={generateDetails} className="w-full sm:w-auto">
          <Sparkles className="h-4 w-4" />
          Generate Product Details with AI
        </LoadingButton>
      </div>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  required,
  placeholder,
  inputMode
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
  inputMode?: "decimal" | "numeric";
}) {
  return (
    <label>
      <span className="field-label">
        {label}
        {required ? " *" : ""}
      </span>
      <input className="field-input" value={value} placeholder={placeholder} inputMode={inputMode} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label>
      <span className="field-label">{label}</span>
      <textarea className="field-input min-h-28" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}
