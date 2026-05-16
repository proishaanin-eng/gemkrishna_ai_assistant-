"use client";

import { ImagePlus, X } from "lucide-react";
import type { UploadedProductImage } from "@/types/product";

type ImageUploaderProps = {
  images: UploadedProductImage[];
  onChange: (images: UploadedProductImage[]) => void;
};

export function ImageUploader({ images, onChange }: ImageUploaderProps) {
  async function handleFiles(files: FileList | null) {
    if (!files) return;

    const nextImages = await Promise.all(
      Array.from(files).map(async (file) => ({
        id: crypto.randomUUID(),
        name: file.name,
        type: file.type,
        size: file.size,
        dataUrl: await fileToDataUrl(file)
      }))
    );

    onChange([...images, ...nextImages]);
  }

  return (
    <section className="rounded-2xl border border-dashed border-stone-300 bg-stone/60 p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-ink">Product images</h3>
          <p className="mt-1 text-sm text-stone-600">
            Prefer real gemstone photos for the main product. AI images can be added later for banners, lifestyle scenes, or ads.
          </p>
        </div>
        <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-ink ring-1 ring-stone-200 transition hover:ring-gold">
          <ImagePlus className="h-4 w-4 text-gold" />
          Upload Images
          <input className="sr-only" type="file" accept="image/png,image/jpeg,image/webp" multiple onChange={(event) => handleFiles(event.target.files)} />
        </label>
      </div>

      {images.length ? (
        <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {images.map((image, index) => (
            <div key={image.id} className="group relative overflow-hidden rounded-xl border border-stone-200 bg-white">
              <img src={image.dataUrl} alt={image.altText || `Uploaded product ${index + 1}`} className="h-36 w-full object-cover" />
              <button
                type="button"
                aria-label="Remove image"
                className="absolute right-2 top-2 rounded-full bg-white p-1 text-stone-700 shadow-sm hover:text-red-600"
                onClick={() => onChange(images.filter((item) => item.id !== image.id))}
              >
                <X className="h-4 w-4" />
              </button>
              <div className="p-3 text-xs text-stone-600">
                <span className="line-clamp-1">{image.name}</span>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
