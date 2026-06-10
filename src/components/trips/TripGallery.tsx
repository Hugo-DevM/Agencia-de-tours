'use client';

import Image from 'next/image';
import { useState } from 'react';

interface TripGalleryProps {
  images: string[];
  title: string;
}

export function TripGallery({ images, title }: TripGalleryProps) {
  const [lightbox, setLightbox] = useState<number | null>(null);

  if (!images.length) return null;

  const all = images.slice(0, 6);

  return (
    <>
      <div className="gallery-grid" style={{ '--cols': Math.min(all.length, 3) } as React.CSSProperties}>
        {all.map((src, i) => (
          <button
            key={i}
            className={`gallery-cell ${i === 0 && all.length >= 3 ? 'gallery-cell--featured' : ''}`}
            onClick={() => setLightbox(i)}
            aria-label={`Ver foto ${i + 1}`}
          >
            <Image src={src} alt={`${title} — foto ${i + 1}`} fill style={{ objectFit: 'cover' }} />
            {i === all.length - 1 && images.length > 6 && (
              <div className="gallery-more">+{images.length - 6} fotos</div>
            )}
          </button>
        ))}
      </div>

      {lightbox !== null && (
        <div className="lightbox" onClick={() => setLightbox(null)}>
          <button className="lightbox-close" onClick={() => setLightbox(null)} aria-label="Cerrar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
          <button
            className="lightbox-prev"
            onClick={e => { e.stopPropagation(); setLightbox(l => l! > 0 ? l! - 1 : all.length - 1); }}
            aria-label="Anterior"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <div className="lightbox-img" onClick={e => e.stopPropagation()}>
            <Image src={all[lightbox]} alt={`${title} — foto ${lightbox + 1}`} fill style={{ objectFit: 'contain' }} />
          </div>
          <button
            className="lightbox-next"
            onClick={e => { e.stopPropagation(); setLightbox(l => l! < all.length - 1 ? l! + 1 : 0); }}
            aria-label="Siguiente"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m9 18 6-6-6-6"/></svg>
          </button>
          <div className="lightbox-counter">{lightbox + 1} / {all.length}</div>
        </div>
      )}
    </>
  );
}
