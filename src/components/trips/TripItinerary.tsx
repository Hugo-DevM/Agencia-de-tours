'use client';

import { useState } from 'react';

interface ItineraryDay {
  day: number;
  title: string;
  description?: string;
}

interface TripItineraryProps {
  itinerary: ItineraryDay[];
}

export function TripItinerary({ itinerary }: TripItineraryProps) {
  const [open, setOpen] = useState<number | null>(0);

  if (!itinerary.length) return null;

  return (
    <div className="itin-accordion">
      {itinerary.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={i} className={`itin-item ${isOpen ? 'itin-item--open' : ''}`}>
            <button
              className="itin-trigger"
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
            >
              <div className="itin-day-badge">
                <span className="d">Día</span>
                <span className="n">{item.day}</span>
              </div>
              <span className="itin-title">{item.title}</span>
              <svg
                className="itin-chevron"
                width="18" height="18" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
              >
                <path d="m6 9 6 6 6-6"/>
              </svg>
            </button>
            {isOpen && item.description && (
              <div className="itin-body">
                <p>{item.description}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
