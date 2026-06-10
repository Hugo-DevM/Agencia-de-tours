'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { formatCurrency } from '@/lib/utils';
import { toggleFavorite } from '@/actions/favorites';

interface TripCardProps {
  tripId: string;
  slug: string;
  title: string;
  destination: string;
  coverImage: string;
  departureDate: Date;
  returnDate: Date;
  pricePerSeat: number | string;
  totalSeats: number;
  takenSeats: number;
  isFavorited?: boolean;
}

export function TripCard({
  tripId,
  slug, title, destination, coverImage,
  departureDate, returnDate, pricePerSeat,
  totalSeats, takenSeats,
  isFavorited = false,
}: TripCardProps) {
  const available = totalSeats - takenSeats;
  const isLow     = available > 0 && available <= 5;
  const isSoldOut = available === 0;

  const [favorited, setFavorited] = useState(isFavorited);
  const [, startTransition] = useTransition();

  const nights = Math.round(
    (new Date(returnDate).getTime() - new Date(departureDate).getTime()) / 86400000
  );

  const depDate = new Date(departureDate);
  const retDate = new Date(returnDate);
  const monthNames = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  const sameMonth = depDate.getMonth() === retDate.getMonth() && depDate.getFullYear() === retDate.getFullYear();
  const dateRange = sameMonth
    ? `${depDate.getDate()} – ${retDate.getDate()} ${monthNames[depDate.getMonth()]} ${depDate.getFullYear()}`
    : `${depDate.getDate()} ${monthNames[depDate.getMonth()]} – ${retDate.getDate()} ${monthNames[retDate.getMonth()]} ${retDate.getFullYear()}`;

  const seatsColor = isSoldOut ? '#ef4444' : isLow ? '#f59e0b' : '#10b981';
  const seatsLabel = isSoldOut ? 'Sin lugares disponibles' : isLow ? `¡Solo ${available} lugares!` : `${available} asientos disponibles`;

  function handleFavorite(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const next = !favorited;
    setFavorited(next); // optimistic
    startTransition(async () => {
      const result = await toggleFavorite(tripId);
      if ('error' in result) {
        setFavorited(!next); // revert on failure
      }
    });
  }

  return (
    <Link
      href={`/viajes/${slug}`}
      style={{ textDecoration: 'none', color: 'inherit' }}
      className="group flex flex-col bg-white rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1.5"
    >
      {/* Image area */}
      <div
        className="relative w-full overflow-hidden"
        style={{
          aspectRatio: '4/3',
          background: 'linear-gradient(135deg, #0F1F4B 0%, #16306E 60%, #1E3A8A 100%)',
          boxShadow: '0 2px 16px 0 rgba(0,0,0,0.10)',
        }}
      >
        {coverImage && (
          <Image
            src={coverImage}
            alt={title}
            fill
            sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        )}

        {/* dark gradient overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.08) 50%, transparent 100%)' }}
        />

        {/* destination badge — top left */}
        <span
          className="absolute top-3 left-3 text-white font-bold uppercase"
          style={{
            background: '#F97316',
            fontSize: 10,
            letterSpacing: '0.08em',
            padding: '4px 12px',
            borderRadius: 999,
          }}
        >
          {destination}
        </span>

        {/* heart button — top right */}
        <button
          type="button"
          onClick={handleFavorite}
          className="absolute top-3 right-3 flex items-center justify-center cursor-pointer transition-transform duration-150 hover:scale-110 active:scale-95"
          style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'rgba(255,255,255,0.92)',
            border: 'none', boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
          }}
          aria-label={favorited ? 'Quitar de favoritos' : 'Guardar en favoritos'}
        >
          <svg
            width="14" height="14"
            viewBox="0 0 24 24"
            fill={favorited ? '#ef4444' : 'none'}
            stroke={favorited ? '#ef4444' : '#64748b'}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ transition: 'fill 0.15s, stroke 0.15s' }}
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </button>

        {/* sold out badge */}
        {isSoldOut && (
          <span
            className="absolute bottom-3 right-3 text-white font-semibold"
            style={{ background: 'rgba(220,38,38,0.9)', fontSize: 11, padding: '3px 10px', borderRadius: 999 }}
          >
            Agotado
          </span>
        )}
      </div>

      {/* Card body */}
      <div
        className="flex flex-col flex-1"
        style={{ padding: '16px 16px 18px', gap: 0, boxShadow: '0 4px 24px 0 rgba(0,0,0,0.08)', borderRadius: '0 0 16px 16px' }}
      >
        {/* Title */}
        <h3 style={{ fontWeight: 700, fontSize: 15, color: '#0F172A', margin: '0 0 8px', lineHeight: 1.35 }}>
          {title}
        </h3>

        {/* Date */}
        <p style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#94a3b8', margin: '0 0 12px' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <rect x="3" y="4" width="18" height="18" rx="2"/>
            <path d="M16 2v4M8 2v4M3 10h18"/>
          </svg>
          {dateRange} · {nights} {nights === 1 ? 'día' : 'días'}
        </p>

        {/* Price */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 8 }}>
          <span style={{ fontSize: 12, color: '#94a3b8' }}>desde</span>
          <strong style={{ fontSize: 24, fontWeight: 800, color: '#F97316', letterSpacing: '-0.02em', lineHeight: 1 }}>
            {formatCurrency(pricePerSeat)}
          </strong>
          <span style={{ fontSize: 12, color: '#94a3b8' }}>MXN</span>
        </div>

        {/* Seats */}
        <p style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 500, color: seatsColor, margin: '0 0 16px' }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: seatsColor, flexShrink: 0, display: 'inline-block' }} />
          {seatsLabel}
        </p>

        {/* CTA */}
        <span
          className="group-hover:opacity-90 transition-opacity"
          style={{
            display: 'block', width: '100%', textAlign: 'center',
            padding: '11px 0', borderRadius: 999,
            background: '#0F1F4B', color: '#fff',
            fontSize: 13, fontWeight: 700,
            marginTop: 'auto',
          }}
        >
          Ver detalles →
        </span>
      </div>
    </Link>
  );
}
