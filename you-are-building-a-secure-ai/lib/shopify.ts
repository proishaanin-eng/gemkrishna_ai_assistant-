import type { ProductPreviewData, UploadedProductImage } from "@/types/product";

const API_VERSION = process.env.SHOPIFY_API_VERSION || "2026-04";

type GraphQLError = {
  message: string;
};

type ShopifyUserError = {
  field?: string[];
  message: string;
  code?: string;
};

function requireShopifyEnv() {
  const shop = process.env.SHOPIFY_STORE_DOMAIN;
  const token = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;

  if (!shop || !token) {
    throw new Error("Shopify credentials are missing. Add SHOPIFY_STORE_DOMAIN and SHOPIFY_ADMIN_ACCESS_TOKEN to .env.local.");
  }

  return { shop: shop.replace(/^https?:\/\//, ""), token };
}

// This is the only place that sends private Shopify Admin API requests.
export async function shopifyGraphql<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const { shop, token } = requireShopifyEnv();
  const response = await fetch(`https://${shop}/admin/api/${API_VERSION}/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": token
    },
    body: JSON.stringify({ query, variables })
  });

  const body = (await response.json()) as { data?: T; errors?: GraphQLError[] };

  if (!response.ok || body.errors?.length) {
    throw new Error(body.errors?.map((error) => error.message).join("; ") || "Shopify API request failed.");
  }

  if (!body.data) {
    throw new Error("Shopify returned an empty response.");
  }

  return body.data;
}

function throwIfUserErrors(errors: ShopifyUserError[] | undefined, label: string) {
  if (errors?.length) {
    throw new Error(`${label}: ${errors.map((error) => error.message).join("; ")}`);
  }
}

function toHtml(preview: ProductPreviewData) {
  const g = preview.generated;
  const benefits = g.beliefBasedBenefits.map((item) => `<li>${escapeHtml(item)}</li>`).join("");

  return `
    <p>${escapeHtml(g.shortSummary)}</p>
    <h2>Gemstone Meaning</h2>
    <p>${escapeHtml(g.gemstoneMeaning)}</p>
    <h2>Belief-Based Benefits</h2>
    <ul>${benefits}</ul>
    <h2>Chakra Connection</h2>
    <p>${escapeHtml(g.chakraConnection)}</p>
    <h2>How to Use</h2>
    <p>${escapeHtml(g.howToUse)}</p>
    <h2>Care Instructions</h2>
    <p>${escapeHtml(g.careInstructions)}</p>
    <h2>Authenticity</h2>
    <p>${escapeHtml(g.authenticityNote)}</p>
    <hr />
    ${g.longDescription}
  `;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function parseDataUrl(image: UploadedProductImage) {
  const match = image.dataUrl.match(/^data:(.+);base64,(.+)$/);
  if (!match) {
    throw new Error(`Image ${image.name} is not a valid browser upload.`);
  }

  return {
    mimeType: match[1],
    bytes: Buffer.from(match[2], "base64")
  };
}

function parseImageUrls(value: string, altFallback: string) {
  return value
    .split(/\r?\n|,/)
    .map((url) => url.trim())
    .filter(Boolean)
    .map((url, index) => ({
      originalSource: url,
      alt: `${altFallback} - image ${index + 1}`,
      mediaContentType: "IMAGE"
    }));
}

// Real uploaded photos are staged securely with Shopify before being attached as product media.
async function stageUploadedImages(images: UploadedProductImage[]) {
  if (!images.length) return [];

  const staged = await shopifyGraphql<{
    stagedUploadsCreate: {
      stagedTargets: {
        url: string;
        resourceUrl: string;
        parameters: { name: string; value: string }[];
      }[];
      userErrors: ShopifyUserError[];
    };
  }>(
    `mutation StagedUploadsCreate($input: [StagedUploadInput!]!) {
      stagedUploadsCreate(input: $input) {
        stagedTargets {
          url
          resourceUrl
          parameters { name value }
        }
        userErrors { field message }
      }
    }`,
    {
      input: images.map((image) => ({
        filename: image.name,
        mimeType: image.type || "image/jpeg",
        resource: "IMAGE",
        httpMethod: "POST"
      }))
    }
  );

  throwIfUserErrors(staged.stagedUploadsCreate.userErrors, "Shopify image staging failed");

  await Promise.all(
    staged.stagedUploadsCreate.stagedTargets.map(async (target, index) => {
      const parsed = parseDataUrl(images[index]);
      const formData = new FormData();
      target.parameters.forEach((parameter) => formData.append(parameter.name, parameter.value));
      formData.append("file", new Blob([parsed.bytes], { type: parsed.mimeType }), images[index].name);

      const uploadResponse = await fetch(target.url, { method: "POST", body: formData });
      if (!uploadResponse.ok) {
        throw new Error(`Shopify image upload failed for ${images[index].name}.`);
      }
    })
  );

  return staged.stagedUploadsCreate.stagedTargets.map((target, index) => ({
    originalSource: target.resourceUrl,
    alt: images[index].altText || "",
    mediaContentType: "IMAGE"
  }));
}

export async function createShopifyDraft(preview: ProductPreviewData) {
  const imagesWithAltText = preview.form.images.map((image, index) => ({
    ...image,
    altText: preview.generated.imageAltText[index] || image.altText || preview.generated.optimizedTitle
  }));
  const media = [
    ...parseImageUrls(preview.form.imageUrls || "", preview.generated.optimizedTitle),
    ...(await stageUploadedImages(imagesWithAltText))
  ];
  const tags = Array.from(
    new Set([...preview.generated.productTags, preview.form.collectionName, ...preview.form.tags.split(",")].map((tag) => tag.trim()).filter(Boolean))
  );

  const created = await shopifyGraphql<{
    productCreate: {
      product: {
        id: string;
        title: string;
        handle: string;
        variants: {
          nodes: {
            id: string;
            inventoryItem: { id: string };
          }[];
        };
      } | null;
      userErrors: ShopifyUserError[];
    };
  }>(
    `mutation ProductCreate($product: ProductCreateInput!, $media: [CreateMediaInput!]) {
      productCreate(product: $product, media: $media) {
        product {
          id
          title
          handle
          variants(first: 1) {
            nodes {
              id
              inventoryItem { id }
            }
          }
        }
        userErrors { field message }
      }
    }`,
    {
      product: {
        title: preview.generated.optimizedTitle,
        descriptionHtml: toHtml(preview),
        vendor: "GemKrishna India",
        productType: preview.form.productType || "Natural Gemstone Product",
        handle: preview.generated.handle,
        status: "DRAFT",
        tags,
        seo: {
          title: preview.generated.metaTitle,
          description: preview.generated.metaDescription
        }
      },
      media
    }
  );

  throwIfUserErrors(created.productCreate.userErrors, "Shopify product creation failed");

  const product = created.productCreate.product;
  const variant = product?.variants.nodes[0];
  if (!product || !variant) {
    throw new Error("Shopify created no product variant to update.");
  }

  await updateInitialVariant(product.id, variant.id, preview);
  await setInventoryQuantity(variant.inventoryItem.id, Number(preview.form.stockQuantity || 0));

  const { shop } = requireShopifyEnv();
  const numericId = product.id.split("/").pop();

  return {
    id: product.id,
    title: product.title,
    handle: product.handle,
    adminUrl: `https://${shop}/admin/products/${numericId}`,
    createdAt: new Date().toISOString()
  };
}

async function updateInitialVariant(productId: string, variantId: string, preview: ProductPreviewData) {
  const updated = await shopifyGraphql<{
    productVariantsBulkUpdate: {
      userErrors: ShopifyUserError[];
    };
  }>(
    `mutation ProductVariantsBulkUpdate($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
      productVariantsBulkUpdate(productId: $productId, variants: $variants) {
        userErrors { field message code }
      }
    }`,
    {
      productId,
      variants: [
        {
          id: variantId,
          price: preview.form.price,
          compareAtPrice: preview.form.compareAtPrice || null,
          inventoryItem: {
            sku: preview.form.sku || null,
            tracked: true
          }
        }
      ]
    }
  );

  throwIfUserErrors(updated.productVariantsBulkUpdate.userErrors, "Shopify variant update failed");
}

async function getFirstActiveLocationId() {
  const data = await shopifyGraphql<{
    locations: { nodes: { id: string; name: string; isActive: boolean }[] };
  }>(
    `query ActiveLocations {
      locations(first: 1) {
        nodes { id name isActive }
      }
    }`
  );

  const location = data.locations.nodes[0];
  if (!location) {
    throw new Error("No Shopify location found for inventory.");
  }

  return location.id;
}

async function setInventoryQuantity(inventoryItemId: string, quantity: number) {
  const locationId = await getFirstActiveLocationId();

  const data = await shopifyGraphql<{
    inventorySetQuantities: {
      userErrors: ShopifyUserError[];
    };
  }>(
    `mutation InventorySet($input: InventorySetQuantitiesInput!) {
      inventorySetQuantities(input: $input) {
        userErrors { field message code }
      }
    }`,
    {
      input: {
        name: "available",
        reason: "correction",
        referenceDocumentUri: "gemkrishna://product-automation-dashboard",
        quantities: [
          {
            inventoryItemId,
            locationId,
            quantity,
            changeFromQuantity: null
          }
        ]
      }
    }
  );

  throwIfUserErrors(data.inventorySetQuantities.userErrors, "Shopify inventory update failed");
}
