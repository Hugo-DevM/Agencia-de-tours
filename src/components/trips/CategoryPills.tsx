'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';

interface CategoryPillsProps {
  categories: string[];
  current: string;
}

function TagIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2H2v10l9.29 9.29a1 1 0 0 0 1.41 0l7.71-7.71a1 1 0 0 0 0-1.41L12 2Z"/>
      <circle cx="7" cy="7" r="1.5" fill="currentColor" stroke="none"/>
    </svg>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="12" height="12" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      style={{ transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0 }}
    >
      <path d="m6 9 6 6 6-6"/>
    </svg>
  );
}

export function CategoryPills({ categories, current }: CategoryPillsProps) {
  const router       = useRouter();
  const pathname     = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = current || 'Todos';

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  function select(cat: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (cat === 'Todos') params.delete('categoria');
    else params.set('categoria', cat);
    router.push(`${pathname}?${params.toString()}`);
    setOpen(false);
  }

  const isFiltered = selected !== 'Todos';

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="h-[38px] flex items-center gap-2 px-4 bg-white border rounded-xl text-sm cursor-pointer transition-all duration-150"
        style={{
          borderColor: isFiltered ? '#F97316' : open ? '#0F1F4B' : '#d1d5db',
          color: isFiltered ? '#C2410C' : '#374151',
          fontWeight: isFiltered ? 600 : 400,
          boxShadow: open ? '0 0 0 3px rgba(15,31,75,0.08)' : 'none',
          background: isFiltered ? '#FFF7ED' : '#fff',
          minWidth: 160,
        }}
      >
        <span style={{ color: isFiltered ? '#F97316' : '#94a3b8' }}>
          <TagIcon />
        </span>
        <span className="flex-1 text-left">{selected}</span>
        <span style={{ color: '#94a3b8' }}><ChevronIcon open={open} /></span>
      </button>

      {open && (
        <div
          className="absolute right-0 bg-white border border-gray-100 rounded-xl overflow-hidden py-1"
          style={{ top: 'calc(100% + 6px)', zIndex: 50, minWidth: 200, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}
        >
          {categories.map(cat => {
            const isActive = cat === selected;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => select(cat)}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-left text-sm transition-colors duration-100"
                style={{
                  background: isActive ? '#FFF7ED' : 'transparent',
                  color: isActive ? '#C2410C' : '#374151',
                  fontWeight: isActive ? 600 : 400,
                }}
                onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = '#F9FAFB'; }}
                onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
              >
                <span style={{ color: isActive ? '#F97316' : '#CBD5E1', flexShrink: 0 }}><TagIcon /></span>
                {cat}
                {isActive && (
                  <svg style={{ marginLeft: 'auto' }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6 9 17l-5-5"/>
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
