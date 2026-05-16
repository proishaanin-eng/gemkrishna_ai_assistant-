"use client";

import { useEffect, useMemo, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { CheckCircle2, Copy, ExternalLink, FileSpreadsheet, Plus, Trash2 } from "lucide-react";
import { LoadingButton } from "@/components/LoadingButton";
import type { BulkProductPreview, BulkProductRow, ProductFormData, ShopifyProductDraft } from "@/types/product";

const blankRow = (): BulkProductRow => ({
  rowId: crypto.randomUUID(),
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
});

const csvHeaders = [
  "productName",
  "gemstoneName",
  "productType",
  "beadShape",
  "beadSize",
  "productSize",
  "price",
  "compareAtPrice",
  "stockQuantity",
  "sku",
  "collectionName",
  "tags",
  "labCertified",
  "shortProductNotes",
  "imageUrls"
];

export function BulkProductManager() {
  const [rows, setRows] = useState<BulkProductRow[]>([blankRow()]);
  const [pasteText, setPasteText] = useState("");
  const [previews, setPreviews] = useState<BulkProductPreview[]>([]);
  const [loadingAi, setLoadingAi] = useState(false);
  const [loadingShopify, setLoadingShopify] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const savedRows = localStorage.getItem("gemkrishna-bulk-rows");
    const savedPreviews = localStorage.getItem("gemkrishna-bulk-previews");
    if (savedRows) setRows(JSON.parse(savedRows));
    if (savedPreviews) setPreviews(JSON.parse(savedPreviews));
  }, []);

  useEffect(() => {
    localStorage.setItem("gemkrishna-bulk-rows", JSON.stringify(rows));
  }, [rows]);

  useEffect(() => {
    localStorage.setItem("gemkrishna-bulk-previews", JSON.stringify(previews));
  }, [previews]);

  const selectedCount = useMemo(() => previews.filter((item) => item.selected && item.status !== "created").length, [previews]);

  function updateRow(rowId: string, key: keyof ProductFormData, value: string | boolean) {
    setRows((current) => current.map((row) => (row.rowId === rowId ? { ...row, [key]: value } : row)));
  }

  function importPastedProducts() {
    setError("");
    try {
      const imported = parsePastedProducts(pasteText);
      if (!imported.length) throw new Error("Paste at least one product row.");
      setRows(imported);
      setPasteText("");
      setPreviews([]);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not import the pasted products.");
    }
  }

  async function generateAll() {
    setLoadingAi(true);
    setError("");

    try {
      const response = await fetch("/api/ai/generate-bulk-products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ products: rows })
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Bulk AI generation failed.");
      setPreviews(body.products);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Bulk AI generation failed.");
    } finally {
      setLoadingAi(false);
    }
  }

  async function createSelectedDrafts() {
    setLoadingShopify(true);
    setError("");

    const selected = previews.filter((item) => item.selected && item.status !== "created");
    setPreviews((current) =>
      current.map((item) => (selected.some((selectedItem) => selectedItem.rowId === item.rowId) ? { ...item, status: "creating" as const, error: undefined } : item))
    );

    try {
      const response = await fetch("/api/shopify/create-products-bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ products: selected })
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Bulk Shopify upload failed.");

      const history = JSON.parse(localStorage.getItem("gemkrishna-product-history") || "[]") as ShopifyProductDraft[];
      const createdDrafts: ShopifyProductDraft[] = [];

      setPreviews((current) =>
        current.map((item) => {
          const result = body.results.find((entry: { rowId: string }) => entry.rowId === item.rowId);
          if (!result) return item;
          if (result.ok) {
            createdDrafts.push(result.product);
            return { ...item, status: "created" as const, selected: false, shopifyDraft: result.product };
          }
          return { ...item, status: "failed" as const, error: result.error };
        })
      );

      if (createdDrafts.length) {
        localStorage.setItem("gemkrishna-product-history", JSON.stringify([...createdDrafts, ...history].slice(0, 50)));
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Bulk Shopify upload failed.");
      setPreviews((current) => current.map((item) => (item.status === "creating" ? { ...item, status: "ready" as const } : item)));
    } finally {
      setLoadingShopify(false);
    }
  }

  return (
    <div className="space-y-8">
      <section className="card p-5 sm:p-8">
        <div className="flex flex-col gap-2 border-b border-stone-200 pb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-gold">Bulk product creation</p>
          <h1 className="text-2xl font-semibold text-ink">Create Many Shopify Drafts</h1>
          <p className="max-w-3xl text-sm leading-6 text-stone-600">
            Add products in rows or paste from a spreadsheet. AI content is generated for every product, then you approve the exact drafts to send to Shopify.
          </p>
        </div>

        {error ? <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

        <div className="mt-6 rounded-2xl border border-stone-200 bg-stone/50 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-ink">
            <FileSpreadsheet className="h-4 w-4 text-gold" />
            Paste spreadsheet rows
          </div>
          <p className="mt-2 text-sm text-stone-600">
            Header order: {csvHeaders.join(", ")}
          </p>
          <textarea
            className="field-input min-h-28"
            value={pasteText}
            onChange={(event) => setPasteText(event.target.value)}
            placeholder={`${csvHeaders.join(",")}\nAmethyst Bracelet,Amethyst,Bracelet,Round,8 mm,7 inches,999,1499,12,GK-AM-001,Bracelets,\"amethyst bracelet,natural gemstone\",yes,Natural beads with calm purple tone`}
          />
          <div className="mt-3 flex flex-col gap-3 sm:flex-row">
            <LoadingButton variant="secondary" type="button" onClick={() => navigator.clipboard.writeText(csvHeaders.join(","))}>
              <Copy className="h-4 w-4" />
              Copy Header
            </LoadingButton>
            <LoadingButton type="button" onClick={importPastedProducts}>
              Import Rows
            </LoadingButton>
          </div>
        </div>

        <div className="mt-6 overflow-x-auto rounded-2xl border border-stone-200">
          <table className="min-w-[1180px] w-full divide-y divide-stone-200 text-sm">
            <thead className="bg-stone/70 text-left text-xs uppercase tracking-wide text-stone-500">
              <tr>
                <th className="px-3 py-3">Product</th>
                <th className="px-3 py-3">Gemstone</th>
                <th className="px-3 py-3">Type</th>
                <th className="px-3 py-3">Bead</th>
                <th className="px-3 py-3">Size</th>
                <th className="px-3 py-3">Price</th>
                <th className="px-3 py-3">Stock</th>
                <th className="px-3 py-3">SKU</th>
                <th className="px-3 py-3">Lab</th>
                <th className="px-3 py-3">Notes</th>
                <th className="px-3 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 bg-white">
              {rows.map((row) => (
                <tr key={row.rowId}>
                  <Cell value={row.productName} onChange={(value) => updateRow(row.rowId, "productName", value)} required />
                  <Cell value={row.gemstoneName} onChange={(value) => updateRow(row.rowId, "gemstoneName", value)} />
                  <Cell value={row.productType} onChange={(value) => updateRow(row.rowId, "productType", value)} />
                  <Cell value={row.beadSize || row.beadShape} onChange={(value) => updateRow(row.rowId, "beadSize", value)} />
                  <Cell value={row.productSize} onChange={(value) => updateRow(row.rowId, "productSize", value)} />
                  <Cell value={row.price} onChange={(value) => updateRow(row.rowId, "price", value)} required />
                  <Cell value={row.stockQuantity} onChange={(value) => updateRow(row.rowId, "stockQuantity", value)} />
                  <Cell value={row.sku} onChange={(value) => updateRow(row.rowId, "sku", value)} />
                  <td className="px-3 py-2">
                    <input type="checkbox" checked={row.labCertified} onChange={(event) => updateRow(row.rowId, "labCertified", event.target.checked)} />
                  </td>
                  <Cell value={row.shortProductNotes} onChange={(value) => updateRow(row.rowId, "shortProductNotes", value)} wide />
                  <td className="px-3 py-2">
                    <button
                      className="rounded-lg p-2 text-stone-500 hover:bg-red-50 hover:text-red-600"
                      type="button"
                      onClick={() => setRows((current) => current.filter((item) => item.rowId !== row.rowId))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-5 flex flex-col justify-between gap-3 sm:flex-row">
          <LoadingButton variant="secondary" type="button" onClick={() => setRows([...rows, blankRow()])}>
            <Plus className="h-4 w-4" />
            Add Product Row
          </LoadingButton>
          <LoadingButton loading={loadingAi} type="button" onClick={generateAll}>
            Generate Product Details for All
          </LoadingButton>
        </div>
      </section>

      {previews.length ? (
        <section className="card p-5 sm:p-8">
          <div className="flex flex-col justify-between gap-4 border-b border-stone-200 pb-6 lg:flex-row lg:items-center">
            <div>
              <h2 className="text-xl font-semibold text-ink">Batch Preview</h2>
              <p className="mt-1 text-sm text-stone-600">Open each product, make edits, and select only the drafts you want to create.</p>
            </div>
            <LoadingButton loading={loadingShopify} disabled={!selectedCount} type="button" onClick={createSelectedDrafts}>
              Create {selectedCount} Selected Drafts in Shopify
            </LoadingButton>
          </div>

          <div className="mt-6 space-y-4">
            {previews.map((item, index) => (
              <BulkPreviewCard key={item.rowId} index={index} item={item} setPreviews={setPreviews} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function Cell({ value, onChange, required, wide }: { value: string; onChange: (value: string) => void; required?: boolean; wide?: boolean }) {
  return (
    <td className="px-3 py-2">
      <input
        className={`w-full rounded-lg border border-stone-200 px-3 py-2 outline-none focus:border-gold ${wide ? "min-w-64" : "min-w-28"}`}
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
      />
    </td>
  );
}

function BulkPreviewCard({
  item,
  index,
  setPreviews
}: {
  item: BulkProductPreview;
  index: number;
  setPreviews: Dispatch<SetStateAction<BulkProductPreview[]>>;
}) {
  function updateGenerated(key: keyof BulkProductPreview["generated"], value: string | string[]) {
    setPreviews((current) => current.map((entry) => (entry.rowId === item.rowId ? { ...entry, generated: { ...entry.generated, [key]: value } } : entry)));
  }

  return (
    <details className="rounded-2xl border border-stone-200 bg-white p-4">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={item.selected}
            disabled={item.status === "created" || item.status === "creating"}
            onChange={(event) => setPreviews((current) => current.map((entry) => (entry.rowId === item.rowId ? { ...entry, selected: event.target.checked } : entry)))}
          />
          <div>
            <p className="font-semibold text-ink">{item.generated.optimizedTitle}</p>
            <p className="mt-1 text-xs text-stone-500">SKU: {item.form.sku || "Not added"} | Price: {item.form.price} | Stock: {item.form.stockQuantity}</p>
          </div>
        </div>
        <Status item={item} />
      </summary>

      {item.error ? <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{item.error}</div> : null}

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <Editor label="Product title" value={item.generated.optimizedTitle} onChange={(value) => updateGenerated("optimizedTitle", value)} />
        <Editor label="URL handle" value={item.generated.handle} onChange={(value) => updateGenerated("handle", value)} />
        <Editor label="SEO title" value={item.generated.metaTitle} onChange={(value) => updateGenerated("metaTitle", value)} />
        <Editor label="SEO description" value={item.generated.metaDescription} rows={3} onChange={(value) => updateGenerated("metaDescription", value)} />
        <Editor label="Short summary" value={item.generated.shortSummary} rows={4} onChange={(value) => updateGenerated("shortSummary", value)} />
        <Editor label="Tags" value={item.generated.productTags.join(", ")} rows={4} onChange={(value) => updateGenerated("productTags", value.split(",").map((tag) => tag.trim()).filter(Boolean))} />
        <Editor label="Long description" value={item.generated.longDescription} rows={8} onChange={(value) => updateGenerated("longDescription", value)} />
        <Editor label="Care and authenticity" value={`${item.generated.careInstructions}\n\n${item.generated.authenticityNote}`} rows={8} onChange={(value) => {
          const [careInstructions, ...rest] = value.split("\n\n");
          updateGenerated("careInstructions", careInstructions);
          updateGenerated("authenticityNote", rest.join("\n\n"));
        }} />
      </div>
    </details>
  );
}

function Status({ item }: { item: BulkProductPreview }) {
  if (item.status === "created" && item.shopifyDraft) {
    return (
      <a className="inline-flex items-center gap-2 rounded-xl bg-green-50 px-3 py-2 text-xs font-semibold text-green-700" href={item.shopifyDraft.adminUrl} target="_blank" rel="noreferrer">
        <CheckCircle2 className="h-4 w-4" />
        Created <ExternalLink className="h-3 w-3" />
      </a>
    );
  }

  return <span className="rounded-xl bg-stone/80 px-3 py-2 text-xs font-semibold capitalize text-stone-600">{item.status}</span>;
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

function parsePastedProducts(text: string): BulkProductRow[] {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (!lines.length) return [];

  const firstRow = splitCsvLine(lines[0]);
  const hasHeader = firstRow.some((cell) => csvHeaders.includes(cell.trim()));
  const headers = hasHeader ? firstRow.map((cell) => cell.trim()) : csvHeaders;
  const dataLines = hasHeader ? lines.slice(1) : lines;

  return dataLines.map((line) => {
    const values = splitCsvLine(line);
    const row = blankRow();
    headers.forEach((header, index) => {
      const value = values[index]?.trim() || "";
      if (header === "labCertified") {
        row.labCertified = ["yes", "true", "1"].includes(value.toLowerCase());
      } else if (header in row && header !== "rowId" && header !== "images") {
        (row as unknown as Record<string, string>)[header] = value;
      }
    });
    return row;
  });
}

function splitCsvLine(line: string) {
  const values: string[] = [];
  let current = "";
  let quoted = false;

  for (const char of line) {
    if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      values.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  values.push(current);
  return values;
}
