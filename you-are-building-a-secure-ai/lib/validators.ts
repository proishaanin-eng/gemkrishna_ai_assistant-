import { z } from "zod";

export const uploadedImageSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  size: z.number(),
  dataUrl: z.string(),
  altText: z.string().optional()
});

export const productFormSchema = z.object({
  productName: z.string().min(1, "Product name is required."),
  gemstoneName: z.string().optional().default(""),
  productType: z.string().optional().default(""),
  beadShape: z.string().optional().default(""),
  beadSize: z.string().optional().default(""),
  productSize: z.string().optional().default(""),
  price: z.string().min(1, "Price is required.").refine((value) => !Number.isNaN(Number(value)), "Price must be a number."),
  compareAtPrice: z
    .string()
    .optional()
    .default("")
    .refine((value) => value === "" || !Number.isNaN(Number(value)), "Compare-at price must be a number."),
  stockQuantity: z
    .string()
    .optional()
    .default("0")
    .refine((value) => value === "" || !Number.isNaN(Number(value)), "Stock must be a number."),
  sku: z.string().optional().default(""),
  collectionName: z.string().optional().default(""),
  tags: z.string().optional().default(""),
  labCertified: z.boolean().default(false),
  shortProductNotes: z.string().optional().default(""),
  imageStyleNotes: z.string().optional().default(""),
  imageUrls: z.string().optional().default(""),
  images: z.array(uploadedImageSchema).default([])
});

export const generatedProductSchema = z.object({
  optimizedTitle: z.string(),
  metaTitle: z.string().max(70),
  metaDescription: z.string().max(180),
  handle: z.string(),
  longDescription: z.string(),
  shortSummary: z.string(),
  productTags: z.array(z.string()),
  imageAltText: z.array(z.string()),
  gemstoneMeaning: z.string(),
  beliefBasedBenefits: z.array(z.string()),
  chakraConnection: z.string(),
  howToUse: z.string(),
  careInstructions: z.string(),
  authenticityNote: z.string()
});

export const productPreviewSchema = z.object({
  form: productFormSchema,
  generated: generatedProductSchema
});

export const bulkProductRowSchema = productFormSchema.extend({
  rowId: z.string()
});

export const bulkGenerateSchema = z.object({
  products: z.array(bulkProductRowSchema).min(1, "Add at least one product.").max(50, "Generate up to 50 products at a time for best quality.")
});

export const bulkProductPreviewSchema = productPreviewSchema.extend({
  rowId: z.string(),
  selected: z.boolean(),
  status: z.enum(["ready", "creating", "created", "failed"]),
  error: z.string().optional(),
  shopifyDraft: z
    .object({
      id: z.string(),
      title: z.string(),
      handle: z.string(),
      adminUrl: z.string(),
      createdAt: z.string()
    })
    .optional()
});

export const bulkCreateSchema = z.object({
  products: z.array(bulkProductPreviewSchema).min(1, "Select at least one generated product.")
});

export type ProductFormValidation = z.infer<typeof productFormSchema>;
