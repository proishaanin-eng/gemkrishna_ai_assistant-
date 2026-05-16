# GemKrishna India Shopify AI Dashboard

Secure Next.js dashboard for generating gemstone product content with AI, previewing it, and creating Shopify products as drafts only.

## Install

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Environment Setup

Create `.env.local` in the project root:

```bash
SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
SHOPIFY_ADMIN_ACCESS_TOKEN=shpat_your_token_here
OPENAI_API_KEY=sk-your-key-here

# Optional
SHOPIFY_API_VERSION=2026-04
OPENAI_MODEL=gpt-4o-mini
```

API keys are only used inside server-side routes and files under `/lib`.

## Shopify Custom App Setup

1. In Shopify Admin, go to **Settings > Apps and sales channels**.
2. Open **Develop apps** and create a custom app.
3. Configure Admin API scopes.
4. Install the app and copy the Admin API access token into `.env.local`.

Required scopes:

- `write_products` to create product drafts and product media.
- `read_locations` to find a location for inventory.
- `write_inventory` to set stock quantity.

The app always sends `status: DRAFT`. Products are not published from this dashboard.

## Test With One Product

1. Click **Bulk Create Products** for many products, or **Create New Product** for one product.
2. Fill product name and price. Add SKU and stock if available.
3. Upload real product photos, or add public image URLs for bulk rows.
4. Click **Generate Product Details with AI**.
5. Review and edit all generated fields.
6. Tick final confirmation.
7. Click **Create Draft in Shopify**.
8. Open the Shopify admin link and review before publishing.

## Bulk Product Workflow

Use `/products/bulk` when you want to create many gemstone products with the same quality.

1. Prepare rows in a spreadsheet.
2. Copy the header from the bulk page.
3. Paste the rows into the import box. Use `imageUrls` for real product photo links when you already host images online.
4. Generate AI details for all products.
5. Expand each preview and edit content where needed.
6. Select approved products.
7. Create selected products as Shopify drafts.

The bulk flow does not publish products. Each created product is still a Shopify draft.

## Where To Edit

- Product fields: `components/ProductForm.tsx`
- Preview/edit fields: `components/ProductPreview.tsx`
- AI writing style and safety rules: `lib/productPrompt.ts`
- OpenAI server call: `lib/openai.ts`
- Shopify upload logic: `lib/shopify.ts`
- Future AI image generation: `lib/imageGeneration.ts`

## Deploy Later

Deploy to Vercel or another Next.js host. Add the same environment variables in the hosting dashboard. Keep the Shopify token and OpenAI key private server-side variables only.
