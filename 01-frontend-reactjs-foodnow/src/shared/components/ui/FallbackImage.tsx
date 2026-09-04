import { useState } from 'react';

type FallbackImageProps = {
  src?: string | null;
  alt: string;
  className?: string;
};

/**
 * Seed/hotlinked photo URLs (e.g. picsum.photos) sometimes fail to load —
 * without this, a broken image just collapses to a blank rectangle instead
 * of the same placeholder icon used when there's no photo at all.
 */
export function FallbackImage({ src, alt, className = '' }: FallbackImageProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className={`flex items-center justify-center bg-muted-border text-muted ${className}`} aria-hidden>
        <svg className="size-8" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </div>
    );
  }

  return (
    <img src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} className={`object-cover ${className}`} />
  );
}
