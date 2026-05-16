export type UploadedProductImage = {
  id: string;
  name: string;
  type: string;
  size: number;
  dataUrl: string;
  altText?: string;
};

export type ProductFormData = {
  productName: string;
  gemstoneName: string;
  productType: string;
  beadShape: string;
  beadSize: string;
  productSize: string;
  price: string;
  compareAtPrice: string;
  stockQuantity: string;
  sku: string;
  collectionName: string;
  tags: string;
  labCertified: boolean;
  shortProductNotes: string;
  imageStyleNotes: string;
  imageUrls: string;
  images: UploadedProductImage[];
};

export type GeneratedProductDetails = {
  optimizedTitle: string;
  metaTitle: string;
  metaDescription: string;
  handle: string;
  longDescription: string;
  shortSummary: string;
  productTags: string[];
  imageAltText: string[];
  gemstoneMeaning: string;
  beliefBasedBenefits: string[];
  chakraConnection: string;
  howToUse: string;
  careInstructions: string;
  authenticityNote: string;
};

export type ProductPreviewData = {
  form: ProductFormData;
  generated: GeneratedProductDetails;
};

export type BulkProductRow = ProductFormData & {
  rowId: string;
};

export type BulkProductPreview = ProductPreviewData & {
  rowId: string;
  selected: boolean;
  status: "ready" | "creating" | "created" | "failed";
  error?: string;
  shopifyDraft?: ShopifyProductDraft;
};

export type ShopifyProductDraft = {
  id: string;
  title: string;
  handle: string;
  adminUrl: string;
  createdAt: string;
};
