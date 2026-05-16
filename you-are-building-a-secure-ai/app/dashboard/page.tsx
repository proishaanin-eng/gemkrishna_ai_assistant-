"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Clock3, Layers3, PackagePlus } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import type { ShopifyProductDraft } from "@/types/product";

export default function DashboardPage() {
  const [history, setHistory] = useState<ShopifyProductDraft[]>([]);

  useEffect(() => {
    setHistory(JSON.parse(localStorage.getItem("gemkrishna-product-history") || "[]"));
  }, []);

  return (
    <DashboardLayout>
      <section className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-soft sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gold">Premium gemstone workflow</p>
          <h1 className="mt-4 max-w-3xl text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Create trustworthy gemstone product drafts for Shopify with AI support.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-stone-600">
            Add one product or many products together, generate SEO-friendly content, review every field, then create unpublished Shopify drafts.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link className="inline-flex items-center justify-center gap-2 rounded-xl bg-gold px-5 py-3 text-sm font-semibold text-ink hover:bg-[#c99e4f]" href="/products/bulk">
              <Layers3 className="h-4 w-4" />
              Bulk Create Products
            </Link>
            <Link className="inline-flex items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-5 py-3 text-sm font-semibold text-ink hover:border-gold" href="/products/new">
              <PackagePlus className="h-4 w-4" />
              Single Product
            </Link>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-semibold text-ink">Draft Safety</h2>
          <p className="mt-3 text-sm leading-6 text-stone-600">
            Uploads are created as Shopify drafts first. Review gemstone claims, images, price, SKU, and inventory inside Shopify before publishing.
          </p>
        </div>
      </section>

      <section className="mt-8 card p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-ink">Product Drafts / History</h2>
            <p className="mt-1 text-sm text-stone-600">Saved locally in this browser after a Shopify draft is created.</p>
          </div>
          <Clock3 className="h-5 w-5 text-gold" />
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-stone-200">
          {history.length ? (
            <div className="divide-y divide-stone-200">
              {history.map((item) => (
                <a key={`${item.id}-${item.createdAt}`} href={item.adminUrl} target="_blank" rel="noreferrer" className="flex items-center justify-between gap-4 bg-white p-4 transition hover:bg-stone/60">
                  <div>
                    <p className="font-medium text-ink">{item.title}</p>
                    <p className="mt-1 text-xs text-stone-500">{new Date(item.createdAt).toLocaleString()}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gold" />
                </a>
              ))}
            </div>
          ) : (
            <div className="bg-white p-8 text-center text-sm text-stone-600">No Shopify drafts created from this dashboard yet.</div>
          )}
        </div>
      </section>
    </DashboardLayout>
  );
}
