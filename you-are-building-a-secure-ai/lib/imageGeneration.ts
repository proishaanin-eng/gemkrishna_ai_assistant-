import type { ProductFormData } from "@/types/product";

// Future AI image generation can be added here.
// Important: for gemstone products, use real product photos as the main product images.
// AI-generated images should be limited to lifestyle scenes, background cleanup, banners, or creative ads.
export async function generateLifestyleImageIdeas(_product: ProductFormData) {
  return {
    enabled: false,
    note: "AI image generation is intentionally not active yet. Add it here when you are ready."
  };
}
