'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const STORAGE_KEY = 'admin_notif_last_seen';

type NotifType = 'booking_confirmed' | 'booking_reserved' | 'payment';

interface Notification {
  id:        string;
  type:      NotifType;
  title:     string;
  body:      string;
  amount:    number | null;
  bookingId: string;
  createdAt: string;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'Ahora mismo';
  if (m < 60) return `Hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `Hace ${h}h`;
  const d = Math.floor(h / 24);
  return `Hace ${d}d`;
}

function formatMXN(n: number) {
  return n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 });
}

const TYPE_CONFIG: Record<NotifType, { icon: React.ReactNode; color: string; bg: string }> = {
  booking_confirmed: {
    bg: '#DCFCE7', color: '#16a34a',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <path d="M20 6 9 17l-5-5"/>
      </svg>
    ),
  },
  booking_reserved: {
    bg: '#FFF7ED', color: '#ea580c',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
      </svg>
    ),
  },
  payment: {
    bg: '#EFF6FF', color: '#2563eb',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
      </svg>
    ),
  },
};

export function AdminNotifications() {
  const router                          = useRouter();
  const [open, setOpen]                 = useState(false);
  const [notifs, setNotifs]             = useState<Notification[]>([]);
  const [lastSeen, setLastSeen]         = useState<number>(0);
  const [loading, setLoading]           = useState(false);
  const panelRef                        = useRef<HTMLDivElement>(null);

  const unread = notifs.filter(n => new Date(n.createdAt).getTime() > lastSeen).length;

  const fetchNotifs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/notifications');
      if (res.ok) {
        const data = await res.json() as { notifications: Notification[] };
        setNotifs(data.notifications);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Load last-seen from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    setLastSeen(stored ? parseInt(stored) : 0);
  }, []);

  // Initial fetch
  useEffect(() => { fetchNotifs(); }, [fetchNotifs]);

  // Realtime subscription — refetch on new bookings or payments
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel('admin-notifications')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, fetchNotifs)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, fetchNotifs)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchNotifs]);

  // Close on outside click
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  function handleOpen() {
    setOpen(o => !o);
    if (!open) {
      const now = Date.now();
      setLastSeen(now);
      localStorage.setItem(STORAGE_KEY, String(now));
    }
  }

  return (
    <div ref={panelRef} style={{ position: 'relative' }}>
      {/* Bell button */}
      <button
        onClick={handleOpen}
        title="Notificaciones"
        style={{
          position: 'relative',
          width: 36, height: 36,
          borderRadius: 10,
          border: 'none',
          background: open ? '#F1F5F9' : 'transparent',
          color: '#64748B',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'background 0.15s, color 0.15s',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#F1F5F9'; (e.currentTarget as HTMLElement).style.color = '#0F172A'; }}
        onMouseLeave={e => { if (!open) { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#64748B'; } }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: 4, right: 4,
            width: 16, height: 16, borderRadius: '50%',
            background: '#F97316',
            fontSize: 9, fontWeight: 800, color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid #fff',
            lineHeight: 1,
          }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 10px)',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 340,
          background: '#fff',
          border: '1px solid #E2E8F0',
          borderRadius: 16,
          boxShadow: '0 16px 48px rgba(0,0,0,0.18)',
          zIndex: 1000,
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{ padding: '14px 18px 10px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#0F172A' }}>Notificaciones</p>
              <p style={{ margin: 0, fontSize: 11, color: '#94a3b8' }}>Últimos 7 días</p>
            </div>
            {unread > 0 && (
              <span style={{ fontSize: 11, fontWeight: 700, color: '#F97316', background: '#FFF7ED', padding: '3px 9px', borderRadius: 999 }}>
                {unread} nueva{unread !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* List */}
          <div style={{ maxHeight: 400, overflowY: 'auto' }}>
            {loading && notifs.length === 0 ? (
              <div style={{ padding: '32px 0', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                Cargando…
              </div>
            ) : notifs.length === 0 ? (
              <div style={{ padding: '32px 0', textAlign: 'center' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="1.5" style={{ margin: '0 auto 8px', display: 'block' }}>
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
                <p style={{ margin: 0, fontSize: 13, color: '#94a3b8' }}>Sin actividad reciente</p>
              </div>
            ) : (
              notifs.map((n, i) => {
                const cfg    = TYPE_CONFIG[n.type];
                const isNew  = new Date(n.createdAt).getTime() > lastSeen;
                return (
                  <button
                    key={n.id}
                    onClick={() => { router.push(`/admin/reservaciones/${n.bookingId}`); setOpen(false); }}
                    style={{
                      width: '100%', display: 'flex', gap: 12, alignItems: 'flex-start',
                      padding: '12px 18px',
                      borderBottom: i < notifs.length - 1 ? '1px solid #F8FAFC' : 'none',
                      background: isNew ? '#FAFBFF' : '#fff',
                      border: 'none', cursor: 'pointer', textAlign: 'left',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#F8FAFC'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = isNew ? '#FAFBFF' : '#fff'; }}
                  >
                    {/* Icon */}
                    <div style={{
                      width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                      background: cfg.bg, color: cfg.color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      marginTop: 1,
                    }}>
                      {cfg.icon}
                    </div>

                    {/* Text */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 1 }}>
                        <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#0F172A' }}>{n.title}</p>
                        {isNew && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#F97316', flexShrink: 0 }} />}
                      </div>
                      <p style={{ margin: 0, fontSize: 11, color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {n.body}
                      </p>
                      {n.amount != null && (
                        <p style={{ margin: '2px 0 0', fontSize: 11, fontWeight: 700, color: cfg.color }}>
                          {n.type === 'payment' ? '+' : ''}{formatMXN(n.amount)}
                        </p>
                      )}
                      <p style={{ margin: '3px 0 0', fontSize: 10, color: '#94a3b8' }}>{timeAgo(n.createdAt)}</p>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div style={{ padding: '10px 18px', borderTop: '1px solid #F1F5F9', textAlign: 'center' }}>
            <button
              onClick={() => { router.push('/admin/reservaciones'); setOpen(false); }}
              style={{ fontSize: 12, fontWeight: 600, color: '#F97316', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Ver todas las reservaciones →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
