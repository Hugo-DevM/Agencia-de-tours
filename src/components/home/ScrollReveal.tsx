'use client';

import { useEffect, useRef } from 'react';

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  tag?: keyof React.JSX.IntrinsicElements;
}

/**
 * Adds data-visible once the element enters the viewport (once only).
 * CSS handles all animation via [data-reveal][data-visible] selectors.
 */
export function ScrollReveal({
  children,
  className,
  style,
  tag: Tag = 'div',
}: ScrollRevealProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Already visible on mount (e.g. hero) — skip
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.setAttribute('data-visible', '');
          observer.disconnect();
        }
      },
      { threshold: 0.08, rootMargin: '-40px 0px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    // @ts-expect-error dynamic tag
    <Tag ref={ref} data-reveal="" className={className} style={style}>
      {children}
    </Tag>
  );
}
