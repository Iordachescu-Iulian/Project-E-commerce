'use client';

import { useState } from 'react';

import type { ProductImageData } from '@/types/catalog';

import { ProductImage } from './ProductImage';

interface ProductGalleryProps {
  images: ProductImageData[];
  fallbackLabel: string;
}

export function ProductGallery({ images, fallbackLabel }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = images[activeIndex] ?? images[0] ?? null;

  return (
    <div>
      <div className="overflow-hidden rounded-xl border border-white/10 bg-surface">
        <div className="aspect-[3/4]">
          <ProductImage
            key={active?.id ?? 'fallback'}
            src={active?.url ?? null}
            alt={active?.alt ?? fallbackLabel}
            fallbackLabel={fallbackLabel}
            className="h-full w-full object-cover"
            eager
          />
        </div>
      </div>

      {images.length > 1 ? (
        <div className="mt-3 grid grid-cols-2 gap-3">
          {images.map((image, index) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`Show ${image.alt ?? `image ${index + 1}`}`}
              aria-pressed={index === activeIndex}
              className={`block aspect-video w-full overflow-hidden rounded-lg border transition-colors ${
                index === activeIndex
                  ? 'border-accent'
                  : 'border-white/10 hover:border-white/30'
              }`}
            >
              <ProductImage
                src={image.url}
                alt={image.alt ?? `Image ${index + 1}`}
                fallbackLabel={`Image ${index + 1}`}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
