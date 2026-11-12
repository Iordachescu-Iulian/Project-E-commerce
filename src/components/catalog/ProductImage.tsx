'use client';

import { useEffect, useRef, useState } from 'react';

interface ProductImageProps {
  src: string | null;
  alt: string;
  fallbackLabel: string;
  className?: string;
  eager?: boolean;
}

/**
 * Local SVG covers are served as plain files. When a file is missing (the seed
 * intentionally has one broken cover) the browser error event swaps in a
 * branded text fallback instead of a broken-image icon.
 */
export function ProductImage({
  src,
  alt,
  fallbackLabel,
  className = '',
  eager = false,
}: ProductImageProps) {
  const [failed, setFailed] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);

  // An image can fail before React hydrates, in which case onError never
  // fires. Re-check the already-loaded image after mount.
  useEffect(() => {
    const image = imageRef.current;
    if (image && image.complete && image.naturalWidth === 0) {
      setFailed(true);
    }
  }, []);

  if (!src || failed) {
    return (
      <div
        role="img"
        aria-label={`${alt} (image unavailable)`}
        className={`flex items-center justify-center bg-gradient-to-br from-secondary/40 via-surface to-base p-4 text-center ${className}`}
      >
        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
          {fallbackLabel}
        </span>
      </div>
    );
  }

  return (
    <img
      ref={imageRef}
      src={src}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
