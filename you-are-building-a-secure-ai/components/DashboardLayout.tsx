import Link from "next/link";
import { Gem, LayoutDashboard, Layers3, PlusCircle } from "lucide-react";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-stone-200 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/dashboard" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/20 text-gold">
              <Gem className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-base font-semibold text-ink">GemKrishna India</span>
              <span className="block text-xs text-stone-500">Shopify Product Automation</span>
            </span>
          </Link>
          <nav className="flex items-center gap-2">
            <Link className="hidden items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100 sm:flex" href="/dashboard">
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Link>
            <Link className="hidden items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100 sm:flex" href="/products/bulk">
              <Layers3 className="h-4 w-4" />
              Bulk Create
            </Link>
            <Link className="inline-flex items-center gap-2 rounded-xl bg-gold px-4 py-2 text-sm font-semibold text-ink hover:bg-[#c99e4f]" href="/products/new">
              <PlusCircle className="h-4 w-4" />
              Create New Product
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
